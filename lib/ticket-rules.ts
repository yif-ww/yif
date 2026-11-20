// lib/ticket-rules.ts — ticket capacity and reference rules, with no database
// access so they can be tested on their own. Used by lib/ticketing.ts.

import { randomInt } from "node:crypto";

/** How long seats stay held while someone completes checkout. */
export const SEAT_HOLD_MINUTES = 15;

/** The most tickets one order may contain. */
export const MAX_TICKETS_PER_ORDER = 10;

/**
 * Seats still on sale for a tier.
 *
 * `held` counts seats reserved by checkouts in progress. Seats held by an
 * expired checkout are not counted, so they free up on their own.
 */
export function seatsAvailable(input: {
  capacity: number;
  sold: number;
  held: number;
}): number {
  return Math.max(0, input.capacity - input.sold - input.held);
}

export function holdExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + SEAT_HOLD_MINUTES * 60_000);
}

// No 0, 1, I, L or O, so references are easy to read out over the phone.
const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A short reference such as YIF-TK-8F3K2P. */
export function generateTicketReference(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  }
  return `YIF-TK-${code}`;
}
