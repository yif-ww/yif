// lib/membership-rules.ts — membership rules with no database or network, so
// they can be tested on their own. Used by payment fulfilment (lib/fulfillment.ts).

/** What a membership payment is for. Matches the values stored with each checkout. */
export type MembershipPaymentType =
  | "membership" // first activation, or reactivation after expiry
  | "membership_renewal" // same tier, another year
  | "membership_upgrade"; // moving up a tier

export function isMembershipPaymentType(
  value: unknown,
): value is MembershipPaymentType {
  return (
    value === "membership" ||
    value === "membership_renewal" ||
    value === "membership_upgrade"
  );
}

/** Adds whole calendar years, keeping 29 February valid (it becomes 28 February). */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCFullYear(result.getUTCFullYear() + years);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

/**
 * The new expiry date after a successful membership payment.
 *
 * - Renewal: one year is added to the later of today and the current expiry, so
 *   members who renew early keep their remaining days (fixes gap G3).
 * - First activation and upgrades: one year from today, as before.
 */
export function computeNewExpiry(input: {
  paymentType: MembershipPaymentType;
  currentExpiry: Date | null;
  now: Date;
}): Date {
  const { paymentType, currentExpiry, now } = input;
  if (
    paymentType === "membership_renewal" &&
    currentExpiry &&
    currentExpiry.getTime() > now.getTime()
  ) {
    return addYears(currentExpiry, 1);
  }
  return addYears(now, 1);
}

/** A membership number such as YIF-2026-0143 from the database sequence value. */
export function formatMembershipNumber(year: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new RangeError(`Invalid membership sequence: ${sequence}`);
  }
  return `YIF-${year}-${String(sequence).padStart(4, "0")}`;
}
