// app/api/paystack/webhook/route.ts — Paystack webhook receiver (fixes gap G1).
//
// Before this existed, a payment was only recorded when the member's browser
// came back to /payment/callback. A member who closed the browser was charged
// but never activated. Paystack now tells us directly.
//
// Register this URL in the Paystack dashboard under Settings → API Keys &
// Webhooks:  https://www.yifww.org/api/paystack/webhook
//
// Unlike the generic advice to "return 200 immediately", this handler finishes
// the work first and answers 500 if it fails. That is deliberate: Paystack
// retries a failed webhook (every few minutes, then hourly, for up to 72 hours
// in live mode), and a retry is what rescues a payment when our database has a
// bad moment. The work takes about a second, well inside Paystack's timeout.
//
// Requests are authenticated by their signature. Paystack's IP addresses are
// not checked, because they would be unreliable behind our host's proxy.

import { NextResponse } from "next/server";
import { fulfillPaystackPayment } from "@/lib/fulfillment";
import {
  paystackRequest,
  type TransactionVerifyData,
} from "@/lib/paystack";
import {
  isValidPaystackSignature,
  parsePaystackEvent,
} from "@/lib/paystack-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error("[paystack webhook] PAYSTACK_SECRET_KEY is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // The signature covers the raw body, so read it as text before parsing.
  const rawBody = await req.text();
  if (!isValidPaystackSignature(rawBody, req.headers.get("x-paystack-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = parsePaystackEvent(rawBody);
  if (!event) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (typeof reference !== "string" || !reference) {
        return NextResponse.json({ error: "Missing reference" }, { status: 400 });
      }
      // Confirm with Paystack directly instead of trusting the payload alone.
      // This also fetches the fees and card details we keep for reporting.
      const verified = await paystackRequest<TransactionVerifyData>(
        `/transaction/verify/${encodeURIComponent(reference)}`,
      );
      await fulfillPaystackPayment(verified.data);
    }
    // Other events (transfers, refunds, disputes) are acknowledged and ignored.
  } catch (err) {
    console.error("[paystack webhook] handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
