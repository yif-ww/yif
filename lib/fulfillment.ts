// lib/fulfillment.ts — what happens after a payment succeeds.
//
// One shared, idempotent path for Paystack and Stripe, called from three
// places: the payment webhooks, the page the member returns to after paying,
// and (through the same function) the mobile app's payment-status check. So a
// member who closes the browser mid-payment is still activated (fixes G1), and
// a repeated webhook or page reload never fulfils twice.
//
// How idempotency works: `Transaction.fulfilledAt` is set in the same database
// transaction that activates the membership or confirms the ticket. The first
// caller to set it does the work; everyone else gets the saved result. If the
// work fails, the whole database transaction rolls back and nothing is marked
// fulfilled, so a retry (Paystack retries failed webhooks) can try again.

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { TransactionPurpose } from "@/generated/prisma/enums";
import type { TransactionVerifyData } from "@/lib/paystack";
import { recordTransactionVerified } from "@/lib/transactions";
import {
  computeNewExpiry,
  formatMembershipNumber,
  isMembershipPaymentType,
  type MembershipPaymentType,
} from "@/lib/membership-rules";
import { generateTicketReference } from "@/lib/ticket-rules";
import {
  lockTierAndCountSeats,
  releaseSeatHoldForTransaction,
  type Tx,
} from "@/lib/ticketing";

export class FulfilmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FulfilmentError";
  }
}

// ─── Metadata ───────────────────────────────────────────────────────────────

/** Checkout details as flat camelCase text, whichever provider they came from. */
export type Meta = Record<string, string>;

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function flatten(value: unknown): Meta {
  const out: Meta = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return out;
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[key] = String(v);
    }
  }
  return out;
}

/** Paystack stores our details as `custom_fields` and as top-level keys. */
export function normalizePaystackMetadata(metadata: unknown): Meta {
  const out: Meta = {};
  if (!metadata || typeof metadata !== "object") return out;
  const m = metadata as Record<string, unknown>;
  for (const [key, v] of Object.entries(flatten(m))) {
    if (key !== "cancel_action") out[key] = v;
  }
  const fields = Array.isArray(m.custom_fields) ? m.custom_fields : [];
  for (const field of fields) {
    if (
      field &&
      typeof field === "object" &&
      typeof (field as { variable_name?: unknown }).variable_name === "string" &&
      (field as { value?: unknown }).value != null
    ) {
      const f = field as { variable_name: string; value: unknown };
      out[snakeToCamel(f.variable_name)] = String(f.value);
    }
  }
  return out;
}

export function normalizeStripeMetadata(
  metadata: Record<string, string> | null | undefined,
): Meta {
  return { ...(metadata ?? {}) };
}

/** What a payment is for, when our own records do not say. */
export function inferPurpose(meta: Meta): TransactionPurpose {
  if (
    meta.purpose === "MEMBERSHIP" ||
    meta.purpose === "TICKET" ||
    meta.purpose === "DONATION"
  ) {
    return meta.purpose;
  }
  if (isMembershipPaymentType(meta.paymentType)) return "MEMBERSHIP";
  if (meta.eventTitle || meta.ticketRef) return "TICKET";
  if (meta.donationType === "donation") return "DONATION";
  return "OTHER";
}

// ─── Result ─────────────────────────────────────────────────────────────────

export type PaymentInfo = {
  reference: string;
  provider: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string | null;
  paidAt: Date | null;
};

export type FulfilmentDetail =
  | {
      kind: "membership";
      paymentType: MembershipPaymentType;
      memberId: string;
      membershipNumber: string | null;
      expiresAt: Date | null;
      tierName: string;
    }
  | {
      kind: "ticket";
      ticketId: string | null;
      ticketReference: string | null;
      quantity: number;
      tierName: string;
      eventTitle: string;
      eventDate: Date | null;
      eventTime: string;
      eventLocation: string;
      /** True when the member paid after seats ran out. YIF should check it. */
      oversold: boolean;
    }
  | { kind: "donation"; cause: string; frequency: string }
  | { kind: "other" };

/** Sends the emails for a fulfilled payment. Tests replace this. */
export type FulfilmentDelivery = (summary: FulfilmentSummary) => Promise<void>;

export type FulfilmentOptions = {
  now?: Date;
  deliver?: FulfilmentDelivery;
};

export type FulfilmentSummary = {
  /** True only for the call that did the work. */
  firstTime: boolean;
  payment: PaymentInfo;
  detail: FulfilmentDetail;
};

// ─── Core ───────────────────────────────────────────────────────────────────

/**
 * Applies a successful payment once. Safe to call any number of times, from
 * any number of places at once. Returns null if the payment is unknown or has
 * not succeeded.
 */
export async function fulfilTransaction(
  reference: string,
  providerMeta: Meta = {},
  options: FulfilmentOptions = {},
): Promise<FulfilmentSummary | null> {
  const now = options.now ?? new Date();

  const outcome = await prisma.$transaction(
    async (tx) => {
      const claim = await tx.transaction.updateMany({
        where: { reference, status: "SUCCESS", fulfilledAt: null },
        data: { fulfilledAt: now },
      });
      const row = await tx.transaction.findUnique({ where: { reference } });
      if (!row || row.status !== "SUCCESS") return null;

      const meta: Meta = { ...flatten(row.metadata), ...providerMeta };
      const firstTime = claim.count > 0;
      const detail = firstTime
        ? await applyPayment(tx, row, meta, now)
        : await describePayment(tx, row, meta);
      return { row, firstTime, detail };
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
  if (!outcome) return null;

  const { row } = outcome;
  const summary: FulfilmentSummary = {
    firstTime: outcome.firstTime,
    detail: outcome.detail,
    payment: {
      reference: row.reference,
      provider: row.provider,
      amount: Number(row.amount),
      currency: row.currency,
      customerEmail: row.customerEmail,
      customerName: row.customerName,
      paidAt: row.paidAt,
    },
  };

  // Emails go out after the database work has committed, and only once.
  if (summary.firstTime) {
    await (options.deliver ?? sendFulfilmentEmails)(summary);
  }
  return summary;
}

type TransactionRow = NonNullable<
  Awaited<ReturnType<Tx["transaction"]["findUnique"]>>
>;

async function applyPayment(
  tx: Tx,
  row: TransactionRow,
  meta: Meta,
  now: Date,
): Promise<FulfilmentDetail> {
  switch (row.purpose) {
    case "MEMBERSHIP":
      return applyMembershipPayment(tx, row, meta, now);
    case "TICKET":
      return applyTicketPayment(tx, row, meta, now);
    case "DONATION":
      return donationDetail(meta);
    default:
      return { kind: "other" };
  }
}

async function describePayment(
  tx: Tx,
  row: TransactionRow,
  meta: Meta,
): Promise<FulfilmentDetail> {
  switch (row.purpose) {
    case "MEMBERSHIP": {
      const memberId = row.memberId ?? meta.memberId;
      const member = memberId
        ? await tx.member.findUnique({
            where: { id: memberId },
            include: { tier: true },
          })
        : null;
      return {
        kind: "membership",
        paymentType: isMembershipPaymentType(meta.paymentType)
          ? meta.paymentType
          : "membership",
        memberId: memberId ?? "",
        membershipNumber: member?.membershipNumber ?? null,
        expiresAt: member?.expiresAt ?? null,
        tierName: member?.tier.name ?? meta.membershipTier ?? "",
      };
    }
    case "TICKET": {
      const ticket = await findTicketForPayment(tx, row, meta);
      return ticketDetail(ticket, meta, false);
    }
    case "DONATION":
      return donationDetail(meta);
    default:
      return { kind: "other" };
  }
}

function donationDetail(meta: Meta): FulfilmentDetail {
  return {
    kind: "donation",
    cause: meta.cause || "General Fund",
    frequency: meta.frequency || "one-time",
  };
}

// ─── Memberships ────────────────────────────────────────────────────────────

async function applyMembershipPayment(
  tx: Tx,
  row: TransactionRow,
  meta: Meta,
  now: Date,
): Promise<FulfilmentDetail> {
  const paymentType: MembershipPaymentType = isMembershipPaymentType(
    meta.paymentType,
  )
    ? meta.paymentType
    : "membership";
  const memberId = row.memberId ?? meta.memberId;
  const tierId =
    paymentType === "membership" ? meta.tierId : (meta.toTierId ?? meta.tierId);
  if (!memberId || !tierId) {
    throw new FulfilmentError(
      `Membership payment ${row.reference} has no member or tier details.`,
    );
  }

  // Serialise payments for the same member, so two at once cannot both read
  // the old expiry date.
  await tx.$queryRaw`SELECT "id" FROM "member" WHERE "id" = ${memberId} FOR UPDATE`;
  const member = await tx.member.findUnique({ where: { id: memberId } });
  const tier = await tx.membershipTier.findUnique({ where: { id: tierId } });
  if (!member || !tier) {
    throw new FulfilmentError(
      `Membership payment ${row.reference} points to a member or tier that does not exist.`,
    );
  }

  // Numbers come from a database sequence, so two members can never get the
  // same one (fixes G2). Existing members keep the number they already have.
  let membershipNumber = member.membershipNumber;
  if (!membershipNumber) {
    const [next] = await tx.$queryRaw<
      { seq: bigint }[]
    >`SELECT nextval('membership_number_seq') AS "seq"`;
    membershipNumber = formatMembershipNumber(now.getUTCFullYear(), Number(next.seq));
  }

  const expiresAt = computeNewExpiry({
    paymentType,
    currentExpiry: member.expiresAt,
    now,
  });

  await tx.member.update({
    where: { id: memberId },
    data: {
      tierId,
      status: "ACTIVE",
      expiresAt,
      membershipNumber,
      paystackRef: row.reference,
      ...(paymentType === "membership" ? {} : { pendingTierId: null }),
    },
  });
  if (!row.memberId) {
    await tx.transaction.update({ where: { id: row.id }, data: { memberId } });
  }

  await notify(tx, member.userId, {
    kind: "renewal",
    title: paymentType === "membership" ? "Welcome to YIF" : "Membership renewed",
    body: `Your ${tier.name} card is valid through ${formatLongDate(expiresAt)}.`,
    link: "/card",
  });

  return {
    kind: "membership",
    paymentType,
    memberId,
    membershipNumber,
    expiresAt,
    tierName: tier.name,
  };
}

// ─── Tickets ────────────────────────────────────────────────────────────────

type TicketWithEvent = Prisma.TicketGetPayload<{ include: { event: true } }>;

async function findTicketForPayment(
  tx: Tx,
  row: TransactionRow,
  meta: Meta,
): Promise<TicketWithEvent | null> {
  if (meta.ticketRef) {
    const byRef = await tx.ticket.findUnique({
      where: { reference: meta.ticketRef },
      include: { event: true },
    });
    if (byRef) return byRef;
  }
  if (row.ticketId) {
    return tx.ticket.findUnique({
      where: { id: row.ticketId },
      include: { event: true },
    });
  }
  return null;
}

function ticketDetail(
  ticket: TicketWithEvent | null,
  meta: Meta,
  oversold: boolean,
): FulfilmentDetail {
  return {
    kind: "ticket",
    ticketId: ticket?.id ?? null,
    ticketReference: ticket?.reference ?? null,
    quantity: ticket?.quantity ?? (Number(meta.quantity) || 1),
    tierName: ticket?.tierName ?? meta.tierName ?? meta.tier ?? "",
    eventTitle: ticket?.event.title ?? meta.eventTitle ?? meta.event ?? "",
    eventDate: ticket?.event.date ?? null,
    eventTime: ticket?.event.time ?? "",
    eventLocation: ticket?.event
      ? [ticket.event.address, ticket.event.location].filter(Boolean).join(", ")
      : "",
    oversold,
  };
}

async function applyTicketPayment(
  tx: Tx,
  row: TransactionRow,
  meta: Meta,
  now: Date,
): Promise<FulfilmentDetail> {
  let ticket = await findTicketForPayment(tx, row, meta);

  // A payment started before seat holds existed has no ticket yet. Create it
  // from what we recorded when the checkout began.
  if (!ticket) {
    if (!meta.eventId || !meta.tierId) {
      throw new FulfilmentError(
        `Ticket payment ${row.reference} has no event or ticket details.`,
      );
    }
    const tier = await tx.eventTicketTier.findUnique({ where: { id: meta.tierId } });
    if (!tier) {
      throw new FulfilmentError(`Ticket payment ${row.reference} has an unknown ticket tier.`);
    }
    ticket = await tx.ticket.create({
      data: {
        eventId: meta.eventId,
        tierId: tier.id,
        tierName: tier.name,
        quantity: Math.max(1, Number(meta.quantity) || 1),
        status: "PENDING",
        reference: await freshTicketReference(tx),
        holderName: row.customerName,
        holderEmail: row.customerEmail,
      },
      include: { event: true },
    });
  }

  // Count seats with the tier locked. This payment is already made, so it is
  // honoured even if seats ran out; it is flagged for YIF to look at.
  let oversold = false;
  if (ticket.tierId) {
    const seats = await lockTierAndCountSeats(tx, ticket.tierId, now);
    const ownHold =
      ticket.status === "PENDING" &&
      ticket.holdExpiresAt &&
      ticket.holdExpiresAt > now
        ? ticket.quantity
        : 0;
    oversold = ticket.quantity > seats.available + ownHold;
  }

  if (ticket.status !== "CONFIRMED" && ticket.status !== "USED") {
    const linkedUser =
      ticket.userId ??
      row.userId ??
      (
        await tx.user.findUnique({
          where: { email: row.customerEmail },
          select: { id: true },
        })
      )?.id ??
      null;

    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "CONFIRMED",
        amountPaid: row.amount,
        holdExpiresAt: null,
        userId: linkedUser,
        holderName: ticket.holderName ?? row.customerName,
        holderEmail: ticket.holderEmail ?? row.customerEmail,
      },
    });
    if (ticket.tierId) {
      await tx.eventTicketTier.update({
        where: { id: ticket.tierId },
        data: { sold: { increment: ticket.quantity } },
      });
    }
    ticket = { ...ticket, userId: linkedUser, status: "CONFIRMED" };
    await notify(tx, linkedUser, {
      kind: "ticket",
      title: "Ticket confirmed",
      body: `${ticket.event.title}, ${ticket.tierName}.`,
      link: `/tickets/${ticket.id}`,
    });
  }

  await tx.transaction.update({
    where: { id: row.id },
    data: {
      ticketId: ticket.id,
      ...(oversold
        ? {
            notes: [
              row.notes,
              "OVERSOLD: paid after the seat hold ended and no seats were left. Contact the buyer or refund.",
            ]
              .filter(Boolean)
              .join(" "),
          }
        : {}),
    },
  });

  return ticketDetail(ticket, meta, oversold);
}

async function freshTicketReference(tx: Tx): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const reference = generateTicketReference();
    const taken = await tx.ticket.findUnique({
      where: { reference },
      select: { id: true },
    });
    if (!taken) return reference;
  }
  throw new FulfilmentError("Could not generate a unique ticket reference.");
}

// ─── Inbox and email ────────────────────────────────────────────────────────

async function notify(
  tx: Tx,
  userId: string | null | undefined,
  n: { kind: string; title: string; body: string; link: string },
): Promise<void> {
  if (!userId) return;
  await tx.notification.create({ data: { userId, ...n } });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function sendFulfilmentEmails(summary: FulfilmentSummary): Promise<void> {
  const { payment, detail } = summary;
  if (!payment.customerEmail) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.yifww.org";
  const recipientName = payment.customerName || payment.customerEmail;
  const amountPaid = `${payment.currency} ${payment.amount.toLocaleString()}`;

  try {
    // Loaded here so that importing this module never needs email credentials.
    const {
      sendDonationThankYou,
      sendMembershipRenewal,
      sendMembershipWelcome,
      sendTicketConfirmation,
    } = await import("@/lib/send-email");

    if (detail.kind === "ticket") {
      await sendTicketConfirmation({
        recipientName,
        eventTitle: detail.eventTitle || "YIF Event",
        tierName: detail.tierName,
        quantity: detail.quantity,
        amountPaid,
        eventDate: detail.eventDate ? formatLongDate(detail.eventDate) : "",
        eventTime: detail.eventTime,
        eventLocation: detail.eventLocation,
        reference: detail.ticketReference ?? payment.reference,
        recipientEmail: payment.customerEmail,
        eventsUrl: `${appUrl}/events`,
      });
    } else if (detail.kind === "donation") {
      await sendDonationThankYou({
        recipientName,
        cause: detail.cause,
        amountDonated: amountPaid,
        frequency: detail.frequency,
        reference: payment.reference,
        recipientEmail: payment.customerEmail,
        donateUrl: `${appUrl}/donate`,
      });
    } else if (
      detail.kind === "membership" &&
      detail.membershipNumber &&
      detail.expiresAt
    ) {
      const common = {
        recipientName,
        tierName: detail.tierName,
        membershipNumber: detail.membershipNumber,
        amountPaid,
        expiresAt: formatLongDate(detail.expiresAt),
        reference: payment.reference,
        recipientEmail: payment.customerEmail,
        dashboardUrl: `${appUrl}/dashboard`,
      };
      if (detail.paymentType === "membership") {
        await sendMembershipWelcome(common);
      } else {
        await sendMembershipRenewal({
          ...common,
          change: detail.paymentType === "membership_upgrade" ? "upgraded" : "renewed",
        });
      }
    }
  } catch (err) {
    // A failed email must never undo or hide a successful payment.
    console.error("[fulfillment] email failed:", err);
  }
}

// ─── Paystack entry point ───────────────────────────────────────────────────

export type PaystackOutcome = {
  status: TransactionVerifyData["status"];
  /** Set only when the payment succeeded. */
  summary: FulfilmentSummary | null;
};

/**
 * Records a verified Paystack payment and, if it succeeded, fulfils it.
 * Used by the webhook and by the page the member returns to.
 */
export async function fulfillPaystackPayment(
  data: TransactionVerifyData,
  options: FulfilmentOptions = {},
): Promise<PaystackOutcome> {
  const providerMeta = normalizePaystackMetadata(data.metadata);
  const linkedUser = await prisma.user
    .findUnique({ where: { email: data.customer.email }, select: { id: true } })
    .catch(() => null);

  await recordTransactionVerified(data, {
    purpose: inferPurpose(providerMeta),
    userId: linkedUser?.id ?? null,
  });

  if (data.status === "failed") {
    await releaseSeatHoldForTransaction(data.reference).catch((err) =>
      console.error("[fulfillment] could not release seat hold:", err),
    );
  }
  if (data.status !== "success") return { status: data.status, summary: null };

  const summary = await fulfilTransaction(data.reference, providerMeta, options);
  return { status: data.status, summary };
}
