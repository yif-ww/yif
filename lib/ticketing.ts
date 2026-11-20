// lib/ticketing.ts — seat holds for ticket checkouts (fixes gap G5).
//
// A checkout creates a PENDING ticket that holds its seats until
// `holdExpiresAt`. Confirmed seats are counted in EventTicketTier.sold. Seats
// held by an expired checkout stop counting by themselves, so nothing needs to
// sweep them. The tier row is locked while seats are counted, so two buyers
// can never take the last seat at the same time.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import {
  generateTicketReference,
  holdExpiryFrom,
  MAX_TICKETS_PER_ORDER,
  seatsAvailable,
} from "@/lib/ticket-rules";

export type Tx = Prisma.TransactionClient;

export class SoldOutError extends Error {
  constructor(public readonly available: number) {
    super(
      available > 0
        ? `Only ${available} ticket${available === 1 ? "" : "s"} left for this option.`
        : "This ticket option is sold out.",
    );
    this.name = "SoldOutError";
  }
}

export class InvalidQuantityError extends Error {
  constructor(max: number = MAX_TICKETS_PER_ORDER) {
    super(`Choose between 1 and ${max} tickets.`);
    this.name = "InvalidQuantityError";
  }
}

/**
 * Locks the tier row and counts the seats still on sale.
 * Must run inside a database transaction.
 */
export async function lockTierAndCountSeats(
  tx: Tx,
  tierId: string,
  now: Date,
): Promise<{ capacity: number; sold: number; held: number; available: number }> {
  const rows = await tx.$queryRaw<
    { capacity: number; sold: number }[]
  >`SELECT "capacity", "sold" FROM "event_ticket_tier" WHERE "id" = ${tierId} FOR UPDATE`;
  const tier = rows[0];
  if (!tier) throw new Error(`Ticket tier ${tierId} not found.`);

  const held = await tx.ticket.aggregate({
    _sum: { quantity: true },
    where: { tierId, status: "PENDING", holdExpiresAt: { gt: now } },
  });
  const heldSeats = held._sum.quantity ?? 0;
  return {
    capacity: tier.capacity,
    sold: tier.sold,
    held: heldSeats,
    available: seatsAvailable({
      capacity: tier.capacity,
      sold: tier.sold,
      held: heldSeats,
    }),
  };
}

export type SeatHold = {
  id: string;
  reference: string;
  holdExpiresAt: Date;
};

/**
 * Holds seats for a checkout in progress. Throws SoldOutError when fewer seats
 * remain than requested.
 */
export async function reserveSeats(input: {
  eventId: string;
  tierId: string;
  tierName: string;
  quantity: number;
  holderName: string;
  holderEmail: string;
  userId?: string | null;
  /** Most tickets one order may hold. Defaults to MAX_TICKETS_PER_ORDER. */
  maxPerOrder?: number;
  now?: Date;
}): Promise<SeatHold> {
  const maxPerOrder = input.maxPerOrder ?? MAX_TICKETS_PER_ORDER;
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > maxPerOrder
  ) {
    throw new InvalidQuantityError(maxPerOrder);
  }
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const seats = await lockTierAndCountSeats(tx, input.tierId, now);
    if (input.quantity > seats.available) {
      throw new SoldOutError(seats.available);
    }

    let reference = generateTicketReference();
    for (let i = 0; i < 5; i++) {
      const taken = await tx.ticket.findUnique({
        where: { reference },
        select: { id: true },
      });
      if (!taken) break;
      reference = generateTicketReference();
    }

    const holdExpiresAt = holdExpiryFrom(now);
    const ticket = await tx.ticket.create({
      data: {
        eventId: input.eventId,
        tierId: input.tierId,
        tierName: input.tierName,
        quantity: input.quantity,
        status: "PENDING",
        reference,
        holderName: input.holderName,
        holderEmail: input.holderEmail,
        userId: input.userId ?? null,
        holdExpiresAt,
      },
      select: { id: true },
    });
    return { id: ticket.id, reference, holdExpiresAt };
  });
}

/** Gives the seats back, for a checkout that could not start or failed. */
export async function releaseSeatHold(ticketReference: string): Promise<void> {
  await prisma.ticket.updateMany({
    where: { reference: ticketReference, status: "PENDING" },
    data: { status: "CANCELLED", holdExpiresAt: null },
  });
}

/** Releases the hold linked to a payment, when that payment fails or expires. */
export async function releaseSeatHoldForTransaction(
  transactionReference: string,
): Promise<void> {
  const row = await prisma.transaction.findUnique({
    where: { reference: transactionReference },
    select: { metadata: true },
  });
  const meta = row?.metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const ref = (meta as Record<string, unknown>).ticketRef;
    if (typeof ref === "string" && ref) await releaseSeatHold(ref);
  }
}
