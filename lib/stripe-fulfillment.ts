// lib/stripe-fulfillment.ts — shared idempotent fulfillment for Stripe Checkout
// sessions. Called from both the webhook handler and the success callback page,
// so it must be safe to invoke multiple times for the same session.

import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { fromStripeMinor } from "@/lib/stripe";
import { convertToUsd } from "@/lib/fx";
import {
  fulfilTransaction,
  normalizeStripeMetadata,
} from "@/lib/fulfillment";
import { releaseSeatHoldForTransaction } from "@/lib/ticketing";
import type { Prisma } from "@/generated/prisma/client";
import type {
  TransactionPurpose,
  TransactionStatus,
} from "@/generated/prisma/enums";

function mapPurpose(value: unknown): TransactionPurpose {
  if (
    value === "TICKET" ||
    value === "DONATION" ||
    value === "MEMBERSHIP" ||
    value === "OTHER"
  ) {
    return value;
  }
  return "OTHER";
}

/**
 * Persist a Stripe Checkout Session as a Transaction row and, if it was paid,
 * fulfil it (membership activation, ticket confirmation, emails).
 *
 * Idempotent: the fulfilment itself is guarded by `Transaction.fulfilledAt`
 * (see lib/fulfillment.ts), so the webhook and the return page can both call
 * this at the same time without fulfilling twice.
 */
export async function fulfillStripeCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const meta = session.metadata ?? {};
  const purpose = mapPurpose(meta.purpose);

  const isPaid = session.payment_status === "paid";
  const status: TransactionStatus = isPaid
    ? "SUCCESS"
    : session.payment_status === "unpaid" && session.status === "expired"
      ? "ABANDONED"
      : isPaid
        ? "SUCCESS"
        : "PENDING";

  // Pull payment intent details if available (charge fees, card brand, etc).
  let pi: Stripe.PaymentIntent | null = null;
  if (session.payment_intent && typeof session.payment_intent === "object") {
    pi = session.payment_intent as Stripe.PaymentIntent;
  }
  const charge =
    pi && typeof pi.latest_charge === "object" && pi.latest_charge !== null
      ? (pi.latest_charge as Stripe.Charge)
      : null;

  const amountMinor =
    session.amount_total ?? pi?.amount_received ?? pi?.amount ?? 0;
  const currency = (session.currency ?? pi?.currency ?? "usd").toUpperCase();
  const amount = fromStripeMinor(amountMinor);

  const balanceTxn =
    charge?.balance_transaction &&
    typeof charge.balance_transaction === "object"
      ? (charge.balance_transaction as Stripe.BalanceTransaction)
      : null;
  const feeMinor = balanceTxn?.fee ?? null;
  const netMinor = balanceTxn?.net ?? null;
  const fees = feeMinor != null ? fromStripeMinor(feeMinor) : null;
  const netAmount = netMinor != null ? fromStripeMinor(netMinor) : null;

  // Freeze the USD-equivalent at fulfillment time for consolidated reporting.
  // Rates are cached in-memory, so converting cheaply covers all statuses.
  const fx = amount > 0 ? await convertToUsd(amount, currency).catch(() => null) : null;

  const customerEmail =
    session.customer_details?.email ??
    session.customer_email ??
    (typeof meta.customerEmail === "string" ? meta.customerEmail : "") ??
    "";
  const customerName =
    session.customer_details?.name ??
    (typeof meta.customerName === "string" ? meta.customerName : null);
  const customerPhone =
    session.customer_details?.phone ??
    (typeof meta.customerPhone === "string" ? meta.customerPhone : null);

  const update = {
    providerTxId: typeof pi?.id === "string" ? pi.id : null,
    status,
    amount,
    fees,
    netAmount,
    currency,
    baseAmount: fx?.baseAmount ?? null,
    baseCurrency: "USD",
    fxRate: fx?.fxRate ?? null,
    channel: charge?.payment_method_details?.type ?? "card",
    cardBrand: charge?.payment_method_details?.card?.brand ?? null,
    cardLast4: charge?.payment_method_details?.card?.last4 ?? null,
    cardBank: null as string | null,
    gatewayResponse: charge?.outcome?.seller_message ?? null,
    ipAddress: null as string | null,
    customerEmail,
    customerName: customerName ?? null,
    customerPhone: customerPhone ?? null,
    paidAt: isPaid
      ? new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000)
      : null,
    rawResponse: JSON.parse(JSON.stringify(session)) as Prisma.InputJsonValue,
  };

  // Resolve userId from email so transactions are visible in the user's dashboard.
  const userRecord = customerEmail
    ? await prisma.user.findUnique({ where: { email: customerEmail }, select: { id: true } }).catch(() => null)
    : null;
  const userId = userRecord?.id ?? null;

  // Upsert keyed on session.id (stored as reference).
  const existing = await prisma.transaction.findUnique({
    where: { reference: session.id },
    select: { id: true, status: true, userId: true },
  });

  await prisma.transaction.upsert({
    where: { reference: session.id },
    update: { ...update, userId: existing?.userId ?? userId },
    create: {
      provider: "stripe",
      reference: session.id,
      purpose,
      userId,
      ...update,
    },
  });

  if (!isPaid) return;
  await fulfilTransaction(session.id, normalizeStripeMetadata(session.metadata));
}

/** Mark a transaction FAILED (e.g. on payment_intent.payment_failed). */
export async function markStripeTransactionFailed(
  reference: string,
  reason?: string,
): Promise<void> {
  await prisma.transaction
    .update({
      where: { reference },
      data: {
        status: "FAILED",
        gatewayResponse: reason ?? null,
      },
    })
    .catch(() => {
      // row may not exist (e.g. webhook arrived before init) — ignore
    });
  await releaseSeatHoldForTransaction(reference).catch((err) =>
    console.error("[stripe-fulfillment] could not release seat hold:", err),
  );
}
