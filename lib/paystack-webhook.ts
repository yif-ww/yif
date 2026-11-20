// lib/paystack-webhook.ts — Paystack webhook helpers, kept out of the route
// file so they can be tested (Next.js route files may only export handlers).

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Checks the `x-paystack-signature` header: an HMAC SHA512 of the raw request
 * body, signed with the account's secret key. Compared in constant time.
 */
export function isValidPaystackSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const given = Buffer.from(signature, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export type PaystackWebhookEvent = {
  event: string;
  data?: { reference?: unknown } & Record<string, unknown>;
};

export function parsePaystackEvent(rawBody: string): PaystackWebhookEvent | null {
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { event?: unknown }).event === "string"
    ) {
      return parsed as PaystackWebhookEvent;
    }
  } catch {
    // fall through
  }
  return null;
}
