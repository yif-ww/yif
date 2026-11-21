// lib/mobile-api/organizer.ts — door check-in for event organizers.
//
// Who may run the door: administrators, and people assigned to an event in
// `EventOrganizer`. The phone downloads a guest list (the manifest), scans
// tickets with no connection, and later uploads what it admitted. Every
// check-in carries an ID made on the phone, so uploading twice never admits
// a guest twice. Contract: docs/mobile-api-contract.md, "Door check-in".

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getQrSigner, QrSigningNotConfiguredError } from "@/lib/qr-token";
import { ApiError, notFound } from "./http";
import { eventIsOver, eventStart } from "./services";

const DAY_MS = 24 * 3600_000;

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  return user?.role === "admin";
}

/** Events this person may run the door for. */
async function allowedEventIds(userId: string, onlyIds?: string[]): Promise<Set<string>> {
  if (await isAdmin(userId)) {
    const rows = await prisma.event.findMany({
      where: { isPublished: true, ...(onlyIds ? { id: { in: onlyIds } } : {}) },
      select: { id: true },
    });
    return new Set(rows.map((r) => r.id));
  }
  const rows = await prisma.eventOrganizer.findMany({
    where: { userId, ...(onlyIds ? { eventId: { in: onlyIds } } : {}) },
    select: { eventId: true },
  });
  return new Set(rows.map((r) => r.eventId));
}

async function requireEventAccess(userId: string, eventId: string): Promise<void> {
  if (!(await allowedEventIds(userId, [eventId])).has(eventId)) {
    // Same answer for "no such event" and "not yours".
    throw notFound("That event");
  }
}

const COUNTED = ["CONFIRMED", "USED"] as const;

async function admittedCountFor(eventId: string): Promise<number> {
  const sum = await prisma.ticket.aggregate({
    where: { eventId, status: { in: [...COUNTED] } },
    _sum: { checkedInCount: true },
  });
  return sum._sum.checkedInCount ?? 0;
}

// ─── Events the person can run ──────────────────────────────────────────────

export async function listOrganizerEvents(userId: string, now = new Date()) {
  const ids = [...(await allowedEventIds(userId))];
  if (ids.length === 0) return { items: [] };
  const events = await prisma.event.findMany({
    where: { id: { in: ids } },
    include: { tiers: true },
    orderBy: { date: "asc" },
  });
  const items = await Promise.all(
    events
      // Today's door, upcoming doors, and yesterday's (late uploads). Not the distant past.
      .filter((e) => !eventIsOver(e, new Date(now.getTime() - DAY_MS)))
      .map(async (e) => ({
        id: e.id,
        title: e.title,
        shortTitle: e.title.length > 28 ? `${e.title.slice(0, 27).trimEnd()}…` : e.title,
        startsAt: eventStart(e.date, e.time, e.country),
        capacity: e.tiers.reduce((sum, t) => sum + t.capacity, 0),
        admittedCount: await admittedCountFor(e.id),
      })),
  );
  return { items };
}

// ─── Guest list ─────────────────────────────────────────────────────────────

export async function getManifest(userId: string, eventId: string, now = new Date()) {
  await requireEventAccess(userId, eventId);
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { tiers: true },
  });

  let keys: { kid: string; publicKey: string }[];
  try {
    keys = [getQrSigner().publicKeyInfo()];
  } catch (err) {
    if (err instanceof QrSigningNotConfiguredError) {
      throw new ApiError(503, "QR_SIGNING_UNAVAILABLE", "Check-in can't start right now.");
    }
    throw err;
  }

  const tickets = await prisma.ticket.findMany({
    where: { eventId, status: { in: [...COUNTED] } },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const last = await prisma.checkIn.groupBy({
    by: ["ticketId"],
    where: { eventId },
    _max: { scannedAt: true },
  });
  const lastGate = new Map<string, string | null>();
  for (const row of last) {
    const latest = await prisma.checkIn.findFirst({
      where: { ticketId: row.ticketId, scannedAt: row._max.scannedAt ?? undefined },
      select: { gate: true },
    });
    lastGate.set(row.ticketId, latest?.gate ?? null);
  }
  const lastAt = new Map(last.map((r) => [r.ticketId, r._max.scannedAt]));

  return {
    eventId: event.id,
    generatedAt: now,
    capacity: event.tiers.reduce((sum, t) => sum + t.capacity, 0),
    keys,
    entries: tickets.map((t) => ({
      ticketId: t.id,
      holderName: t.holderName ?? t.user?.name ?? "Guest",
      tierName: t.tierName,
      quantity: t.quantity,
      checkedInCount: t.checkedInCount,
      lastCheckInAt: lastAt.get(t.id) ?? null,
      lastGate: lastGate.get(t.id) ?? null,
    })),
  };
}

// ─── Uploading check-ins ────────────────────────────────────────────────────

export const checkInsSchema = z.object({
  eventId: z.string().min(1).max(64).optional(),
  checkIns: z
    .array(
      z.object({
        id: z.string().uuid(),
        ticketId: z.string().min(1).max(64),
        count: z.number().int().min(1).max(500),
        at: z.coerce.date(),
        gate: z.string().max(40).optional(),
        deviceId: z.string().max(80).optional(),
      }),
    )
    .min(1)
    .max(200),
});

export type CheckInStatus = "ACCEPTED" | "DUPLICATE" | "CONFLICT" | "REJECTED";

type Row = z.infer<typeof checkInsSchema>["checkIns"][number];

async function applyOne(userId: string, row: Row, allowed: Set<string>): Promise<{ status: CheckInStatus; eventId?: string }> {
  const already = await prisma.checkIn.findUnique({ where: { id: row.id }, select: { eventId: true } });
  if (already) return { status: "DUPLICATE", eventId: already.eventId };

  return prisma.$transaction(async (tx) => {
    // Lock the ticket, so two phones scanning the same ticket queue up here.
    const locked = await tx.$queryRaw<
      { id: string; eventId: string; quantity: number; checkedInCount: number; status: string }[]
    >`SELECT "id", "eventId", "quantity", "checkedInCount", "status"::text AS "status" FROM "ticket" WHERE "id" = ${row.ticketId} FOR UPDATE`;
    const ticket = locked[0];
    if (!ticket || !allowed.has(ticket.eventId) || !(COUNTED as readonly string[]).includes(ticket.status)) {
      return { status: "REJECTED" as const };
    }

    const wanted = ticket.checkedInCount + row.count;
    const conflict = wanted > ticket.quantity;
    const total = Math.min(wanted, ticket.quantity);

    await tx.checkIn.create({
      data: {
        id: row.id,
        ticketId: ticket.id,
        eventId: ticket.eventId,
        count: row.count,
        gate: row.gate ?? null,
        deviceId: row.deviceId ?? null,
        scannedById: userId,
        scannedAt: row.at,
        isConflict: conflict,
      },
    });
    await tx.ticket.update({
      where: { id: ticket.id },
      data: { checkedInCount: total, status: total >= ticket.quantity ? "USED" : "CONFIRMED" },
    });
    return { status: conflict ? ("CONFLICT" as const) : ("ACCEPTED" as const), eventId: ticket.eventId };
  });
}

export async function submitCheckIns(userId: string, input: z.infer<typeof checkInsSchema>) {
  const allowed = await allowedEventIds(userId);
  const ordered = [...input.checkIns].sort((a, b) => a.at.getTime() - b.at.getTime());

  const results = new Map<string, CheckInStatus>();
  let eventId = input.eventId;
  for (const row of ordered) {
    const outcome = await applyOne(userId, row, allowed);
    results.set(row.id, outcome.status);
    if (!eventId && outcome.eventId) eventId = outcome.eventId;
  }
  if (eventId && !allowed.has(eventId)) eventId = undefined;

  return {
    // In the order the phone sent them.
    results: input.checkIns.map((c) => ({ id: c.id, status: results.get(c.id)! })),
    admittedCount: eventId ? await admittedCountFor(eventId) : 0,
  };
}
