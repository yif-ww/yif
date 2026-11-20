// lib/mobile-api/services.ts — what each /api/mobile/v1 route returns.
//
// Plain functions that take the signed-in member's ID, so they can be tested
// against the database without a web server. The route files in
// app/api/mobile/v1 only wire these to HTTP. Response shapes are defined in
// docs/mobile-api-contract.md.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { seatsAvailable } from "@/lib/ticket-rules";
import {
  cardTokenExpiry,
  getQrSigner,
  QrSigningNotConfiguredError,
  ticketTokenExpiry,
} from "@/lib/qr-token";
import { SUPPORTED_CURRENCIES, isSupportedCurrency } from "@/lib/currency";
import {
  readingMinutes,
  tiptapToHtml,
  tiptapToText,
} from "@/lib/tiptap-html";
import { ApiError, notFound } from "./http";
import {
  decodeCursor,
  keysetAfter,
  pageQuerySchema,
  toPage,
  type Page,
} from "./pagination";

export type Money = { amount: number; currency: string };

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://www.yifww.org";

// ─── Helpers ────────────────────────────────────────────────────────────────

export function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

const EURO_COUNTRIES = new Set([
  "austria", "belgium", "croatia", "cyprus", "estonia", "finland", "france",
  "germany", "greece", "ireland", "italy", "latvia", "lithuania", "luxembourg",
  "malta", "netherlands", "portugal", "slovakia", "slovenia", "spain",
]);

/** The currency a member is offered first. They can change it. */
export function defaultCurrencyForCountry(country: string | null | undefined): string {
  const c = (country ?? "").trim().toLowerCase();
  if (!c || c === "nigeria") return "NGN";
  if (c === "united kingdom" || c === "uk" || c === "england" || c === "scotland" || c === "wales") {
    return "GBP";
  }
  if (EURO_COUNTRIES.has(c)) return "EUR";
  return "USD";
}

type MembershipStatus = "ACTIVE" | "EXPIRED" | "PENDING" | "SUSPENDED";

/** ACTIVE only counts while the expiry date has not passed. */
export function effectiveStatus(
  member: { status: MembershipStatus; expiresAt: Date | null },
  now: Date,
): MembershipStatus {
  if (member.status === "ACTIVE" && member.expiresAt && member.expiresAt <= now) {
    return "EXPIRED";
  }
  return member.status;
}

function money(amount: unknown, currency: string): Money {
  return { amount: Number(amount), currency };
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

async function loadUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { member: { include: { tier: true } } },
  });
  if (!user) throw notFound("Account");
  return user;
}

type LoadedUser = Awaited<ReturnType<typeof loadUser>>;

function serializeMembership(user: LoadedUser, now: Date) {
  const m = user.member;
  if (!m) return null;
  return {
    status: effectiveStatus(m, now),
    tierId: m.tierId,
    tierName: m.tier.name,
    number: m.membershipNumber,
    joinedAt: m.joinedAt,
    expiresAt: m.expiresAt,
  };
}

async function isOrganizer(user: LoadedUser): Promise<boolean> {
  if (user.role === "admin") return true;
  return (await prisma.eventOrganizer.count({ where: { userId: user.id } })) > 0;
}

function serializePreferences(user: LoadedUser) {
  return {
    eventInvites: user.notifEventInvites,
    newsletter: user.notifNewsletter,
    donationReceipts: user.notifDonationReceipts,
    memberUpdates: user.notifMemberUpdates,
    scholarshipNews: user.notifScholarshipNews,
  };
}

// ─── Account ────────────────────────────────────────────────────────────────

export async function getMe(userId: string, now = new Date()) {
  const user = await loadUser(userId);
  const { firstName, lastName } = splitName(user.name);
  return {
    member: {
      id: user.id,
      firstName,
      lastName,
      email: user.email,
      image: user.image,
      city: user.cityDistrict ?? "",
      country: user.country ?? "",
      currency: defaultCurrencyForCountry(user.country),
      isOrganizer: await isOrganizer(user),
      membership: serializeMembership(user, now),
    },
    preferences: serializePreferences(user),
  };
}

export const updateMeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60).optional(),
    lastName: z.string().trim().max(80).optional(),
    city: z.string().trim().max(80).optional(),
    country: z.string().trim().max(80).optional(),
    preferences: z
      .object({
        eventInvites: z.boolean().optional(),
        newsletter: z.boolean().optional(),
        donationReceipts: z.boolean().optional(),
        memberUpdates: z.boolean().optional(),
        scholarshipNews: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export async function updateMe(userId: string, input: UpdateMeInput, now = new Date()) {
  const current = await loadUser(userId);
  const split = splitName(current.name);
  const prefs = input.preferences ?? {};

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.firstName !== undefined || input.lastName !== undefined
        ? {
            name: `${input.firstName ?? split.firstName} ${input.lastName ?? split.lastName}`.trim(),
          }
        : {}),
      ...(input.city !== undefined ? { cityDistrict: input.city } : {}),
      ...(input.country !== undefined ? { country: input.country } : {}),
      ...(prefs.eventInvites !== undefined ? { notifEventInvites: prefs.eventInvites } : {}),
      ...(prefs.newsletter !== undefined ? { notifNewsletter: prefs.newsletter } : {}),
      ...(prefs.donationReceipts !== undefined ? { notifDonationReceipts: prefs.donationReceipts } : {}),
      ...(prefs.memberUpdates !== undefined ? { notifMemberUpdates: prefs.memberUpdates } : {}),
      ...(prefs.scholarshipNews !== undefined ? { notifScholarshipNews: prefs.scholarshipNews } : {}),
    },
  });
  return getMe(userId, now);
}

// ─── Membership ─────────────────────────────────────────────────────────────

export async function getMembership(userId: string, now = new Date()) {
  const membership = serializeMembership(await loadUser(userId), now);
  if (!membership) throw notFound("A membership");
  return membership;
}

const CARD_INACTIVE_MESSAGE: Record<string, string> = {
  EXPIRED: "Your membership has expired. Renew to use your card again.",
  PENDING: "Your membership is being confirmed. Your card will work once it is active.",
  SUSPENDED: "Your membership is suspended. Contact YIF support to restore it.",
};

/** Maps a missing signing key to a clear 503 for the app. */
function signingUnavailable(err: unknown): never {
  if (err instanceof QrSigningNotConfiguredError) {
    console.error("[mobile api]", err.message);
    throw new ApiError(503, "QR_SIGNING_UNAVAILABLE", "Cards and tickets can't be shown right now.");
  }
  throw err;
}

/** A fresh signed QR token for the member's card. Never outlives the membership. */
export async function getCardToken(userId: string, now = new Date()) {
  const user = await loadUser(userId);
  const member = user.member;
  if (!member) throw notFound("A membership");

  const status = effectiveStatus(member, now);
  if (status !== "ACTIVE" || !member.expiresAt) {
    throw new ApiError(
      403,
      "CARD_INACTIVE",
      CARD_INACTIVE_MESSAGE[status] ?? "Your card is not active.",
    );
  }

  const expSeconds = Math.min(
    cardTokenExpiry(now),
    Math.floor(member.expiresAt.getTime() / 1000),
  );
  try {
    const qrToken = getQrSigner().sign("card", { id: member.id, exp: expSeconds });
    return {
      qrToken,
      expiresAt: new Date(expSeconds * 1000),
      membershipNumber: member.membershipNumber,
    };
  } catch (err) {
    return signingUnavailable(err);
  }
}

export const tiersQuerySchema = z.object({ currency: z.string().optional() });

export async function getTiers(
  userId: string,
  query: z.infer<typeof tiersQuerySchema>,
) {
  const user = await loadUser(userId);
  const requested = query.currency?.toUpperCase();
  if (requested && !isSupportedCurrency(requested)) {
    throw new ApiError(400, "VALIDATION_FAILED", "That currency is not supported.", {
      currency: "Use one of " + SUPPORTED_CURRENCIES.join(", "),
    });
  }
  const currency = requested ?? defaultCurrencyForCountry(user.country);

  const tiers = await prisma.membershipTier.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { prices: { where: { isActive: true } } },
  });
  const currencies = [...new Set(tiers.flatMap((t) => t.prices.map((p) => p.currency)))].sort();

  // Members can renew their own tier or move up. Moving down stays on the website.
  const floor = user.member?.tier.sortOrder ?? Number.NEGATIVE_INFINITY;
  return {
    currency,
    currencies,
    tiers: tiers
      .filter((t) => t.sortOrder >= floor)
      .flatMap((t) => {
        const price = t.prices.find((p) => p.currency === currency);
        return price
          ? [
              {
                id: t.id,
                name: t.name,
                rank: t.sortOrder,
                isCurrent: t.id === user.member?.tierId,
                price: money(price.amount, currency),
              },
            ]
          : [];
      }),
  };
}

// ─── Payments ───────────────────────────────────────────────────────────────

type TxRow = Awaited<ReturnType<typeof prisma.transaction.findFirstOrThrow>>;

function metaOf(row: { metadata: unknown }): Record<string, unknown> {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

function describePayment(row: TxRow): string {
  const meta = metaOf(row);
  const str = (key: string) => (typeof meta[key] === "string" ? (meta[key] as string) : "");
  if (row.purpose === "MEMBERSHIP") {
    return str("tierName") ? `${str("tierName")} membership` : "Membership";
  }
  if (row.purpose === "TICKET") {
    return [str("eventTitle"), str("tierName")].filter(Boolean).join(" · ") || "Event ticket";
  }
  if (row.purpose === "DONATION") {
    return str("cause") ? `Donation · ${str("cause")}` : "Donation";
  }
  return "Payment";
}

function serializePayment(row: TxRow) {
  return {
    reference: row.reference,
    purpose: row.purpose,
    description: describePayment(row),
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    createdAt: row.createdAt,
  };
}

/** A member's payments: the ones linked to their account or their membership. */
function paymentsOwnedBy(user: LoadedUser) {
  return {
    OR: [
      { userId: user.id },
      ...(user.member ? [{ memberId: user.member.id }] : []),
    ],
  };
}

export async function listPayments(
  userId: string,
  query: z.infer<typeof pageQuerySchema>,
): Promise<Page<ReturnType<typeof serializePayment>>> {
  const user = await loadUser(userId);
  const cursor = decodeCursor(query.cursor);
  const rows = await prisma.transaction.findMany({
    where: { AND: [paymentsOwnedBy(user), keysetAfter("createdAt", cursor, "desc")] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
  });
  return toPage(rows, query.limit, (r) => ({ at: r.createdAt, id: r.id }), serializePayment);
}

export async function getPayment(userId: string, reference: string) {
  const user = await loadUser(userId);
  const row = await prisma.transaction.findFirst({
    where: { AND: [{ reference }, paymentsOwnedBy(user)] },
  });
  if (!row) throw notFound("That payment");

  const member = user.member;
  return {
    payment: serializePayment(row),
    // Set once the payment is confirmed and has been applied.
    fulfilled: row.fulfilledAt !== null,
    membershipExpiresAt:
      row.purpose === "MEMBERSHIP" && row.fulfilledAt ? (member?.expiresAt ?? null) : null,
    ticketId: row.purpose === "TICKET" ? row.ticketId : null,
    receiptEmail: row.customerEmail,
  };
}

// ─── Events ─────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 3600_000;

/** "5:00 PM" or "17:00" as hours and minutes, or null. */
export function parseTimeOfDay(time: string | null | undefined) {
  const match = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*$/i.exec(time ?? "");
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return hours < 24 && minutes < 60 ? { hours, minutes } : null;
}

/**
 * The event's start. Events store a date and a separate time of day, with no
 * time zone. Times are read as Nigerian time (UTC+1) for events in Nigeria or
 * with no country. For events elsewhere only the date is reliable, so the time
 * is left to `timeLabel`.
 */
export function eventStart(
  date: Date,
  time: string | null,
  country: string | null,
): Date {
  const parsed = parseTimeOfDay(time);
  const isNigerian = !country || country.trim().toLowerCase() === "nigeria";
  if (!parsed || !isNigerian) return date;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), parsed.hours - 1, parsed.minutes),
  );
}

type EventRow = Awaited<ReturnType<typeof loadEvents>>[number];

async function loadEvents(where: object, orderBy: object[], take?: number) {
  return prisma.event.findMany({
    where: { isPublished: true, ...where },
    include: { tiers: { orderBy: { price: "asc" } } },
    orderBy,
    take,
  });
}

async function heldSeatsByTier(tierIds: string[], now: Date): Promise<Map<string, number>> {
  if (tierIds.length === 0) return new Map();
  const groups = await prisma.ticket.groupBy({
    by: ["tierId"],
    where: { tierId: { in: tierIds }, status: "PENDING", holdExpiresAt: { gt: now } },
    _sum: { quantity: true },
  });
  return new Map(groups.map((g) => [g.tierId ?? "", g._sum.quantity ?? 0]));
}

function eventIsOver(event: { date: Date; endDate: Date | null }, now: Date): boolean {
  return (event.endDate ?? event.date).getTime() + DAY_MS <= now.getTime();
}

function serializeEvent(event: EventRow, held: Map<string, number>, now: Date) {
  const over = eventIsOver(event, now);
  const venue = [event.address, event.location].filter(Boolean).join(", ");
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    summary: event.tagline ?? truncate(event.description ?? "", 160),
    description: event.description ?? "",
    startsAt: eventStart(event.date, event.time, event.country),
    endsAt: event.endDate,
    timeLabel: event.time,
    venue,
    shortLocation: event.location ?? event.country ?? "",
    isOnline: (event.location ?? "").trim().toLowerCase() === "online",
    imageUrl: event.imageUrl,
    imageAlt: event.title,
    salesOpen: !over && event.tiers.length > 0,
    capacity: event.tiers.reduce((sum, t) => sum + t.capacity, 0),
    tiers: event.tiers.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      price: money(t.price, "NGN"),
      remaining: seatsAvailable({
        capacity: t.capacity,
        sold: t.sold,
        held: held.get(t.id) ?? 0,
      }),
    })),
    sponsor: null as null, // Sponsor placements arrive in milestone M8.
  };
}

export const eventsQuerySchema = pageQuerySchema.extend({
  when: z.enum(["upcoming", "past"]).default("upcoming"),
});

export async function listEvents(
  query: z.infer<typeof eventsQuerySchema>,
  now = new Date(),
) {
  const cutoff = new Date(now.getTime() - DAY_MS);
  const over = { OR: [{ endDate: { lte: cutoff } }, { endDate: null, date: { lte: cutoff } }] };
  const ongoing = { OR: [{ endDate: { gt: cutoff } }, { endDate: null, date: { gt: cutoff } }] };
  const direction = query.when === "upcoming" ? "asc" : "desc";
  const cursor = decodeCursor(query.cursor);

  const rows = await loadEvents(
    { AND: [query.when === "upcoming" ? ongoing : over, keysetAfter("date", cursor, direction)] },
    [{ date: direction }, { id: direction }],
    query.limit + 1,
  );
  const held = await heldSeatsByTier(rows.flatMap((e) => e.tiers.map((t) => t.id)), now);
  return toPage(rows, query.limit, (e) => ({ at: e.date, id: e.id }), (e) => serializeEvent(e, held, now));
}

export async function getEvent(slug: string, now = new Date()) {
  const [event] = await loadEvents({ slug }, [{ date: "asc" }], 1);
  if (!event) throw notFound("That event");
  const held = await heldSeatsByTier(event.tiers.map((t) => t.id), now);
  return serializeEvent(event, held, now);
}

// ─── Tickets ────────────────────────────────────────────────────────────────

type TicketRow = Awaited<ReturnType<typeof loadTickets>>[number];

async function loadTickets(where: object, take: number, orderBy: object[]) {
  return prisma.ticket.findMany({
    where,
    include: { event: true },
    orderBy,
    take,
  });
}

function serializeTicket(ticket: TicketRow, now: Date) {
  const e = ticket.event;
  let qrToken: string;
  try {
    qrToken = getQrSigner().sign("ticket", {
      id: ticket.id,
      ev: e.id,
      exp: ticketTokenExpiry(e.endDate ?? e.date),
    });
  } catch (err) {
    return signingUnavailable(err);
  }
  return {
    id: ticket.id,
    reference: ticket.reference,
    status: ticket.status,
    tierName: ticket.tierName,
    quantity: ticket.quantity,
    checkedInCount: ticket.checkedInCount,
    holderName: ticket.holderName ?? "",
    qrToken,
    event: {
      id: e.id,
      slug: e.slug,
      title: e.title,
      startsAt: eventStart(e.date, e.time, e.country),
      endsAt: e.endDate,
      timeLabel: e.time,
      venue: [e.address, e.location].filter(Boolean).join(", "),
      shortLocation: e.location ?? e.country ?? "",
      isOver: eventIsOver(e, now),
    },
  };
}

/** Tickets that can be shown: paid, not cancelled, and not still being bought. */
const SHOWN_STATUSES = ["CONFIRMED", "USED"] as const;

export async function listTickets(
  userId: string,
  query: z.infer<typeof pageQuerySchema>,
  now = new Date(),
) {
  const cursor = decodeCursor(query.cursor);
  const rows = await loadTickets(
    {
      AND: [
        { userId, status: { in: [...SHOWN_STATUSES] } },
        keysetAfter("createdAt", cursor, "desc"),
      ],
    },
    query.limit + 1,
    [{ createdAt: "desc" }, { id: "desc" }],
  );
  return toPage(rows, query.limit, (t) => ({ at: t.createdAt, id: t.id }), (t) => serializeTicket(t, now));
}

export async function getTicket(userId: string, id: string, now = new Date()) {
  const [ticket] = await loadTickets(
    { id, userId, status: { in: [...SHOWN_STATUSES] } },
    1,
    [{ createdAt: "desc" }],
  );
  if (!ticket) throw notFound("That ticket");
  return serializeTicket(ticket, now);
}

// ─── News ───────────────────────────────────────────────────────────────────

type PostRow = Awaited<ReturnType<typeof loadPosts>>[number];

async function loadPosts(where: object, take: number) {
  return prisma.blogPost.findMany({
    where: { isPublished: true, publishedAt: { not: null }, ...where },
    include: { topic: true },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take,
  });
}

function serializePostSummary(post: PostRow) {
  return {
    slug: post.slug,
    title: post.title,
    topic: post.topic?.name ?? "",
    excerpt: post.excerpt,
    author: post.authorName,
    authorRole: post.authorRole,
    publishedAt: post.publishedAt,
    readMinutes: post.readTime ?? readingMinutes(tiptapToText(post.content)),
    imageUrl: post.imageUrl,
    webUrl: `${APP_URL()}/blog/${post.slug}`,
  };
}

export const newsQuerySchema = pageQuerySchema.extend({
  topic: z.string().max(80).optional(),
});

export async function listNews(query: z.infer<typeof newsQuerySchema>) {
  const cursor = decodeCursor(query.cursor);
  const rows = await loadPosts(
    {
      AND: [
        ...(query.topic ? [{ topic: { slug: query.topic } }] : []),
        keysetAfter("publishedAt", cursor, "desc"),
      ],
    },
    query.limit + 1,
  );
  return toPage(rows, query.limit, (p) => ({ at: p.publishedAt as Date, id: p.id }), serializePostSummary);
}

export async function getPost(slug: string) {
  const [post] = await loadPosts({ slug }, 1);
  if (!post) throw notFound("That post");
  return { ...serializePostSummary(post), html: tiptapToHtml(post.content) };
}

/** Topics for the News filter chips. */
export async function listTopics() {
  const topics = await prisma.blogTopic.findMany({
    where: { posts: { some: { isPublished: true } } },
    orderBy: { name: "asc" },
  });
  return { topics: topics.map((t) => ({ slug: t.slug, name: t.name })) };
}
