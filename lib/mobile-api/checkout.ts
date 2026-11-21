// lib/mobile-api/checkout.ts — starting a payment from the mobile app.
//
// The app sends only a tier and a currency. The price, the payment provider
// and everything the webhook later needs are decided here on the server, so a
// modified app cannot pay a different amount. Fulfilment (extending the
// membership, sending the receipt) is the same code the website uses:
// lib/fulfillment.ts, triggered by the provider's webhook.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { paystackRequest, toKobo } from "@/lib/paystack";
import { assertStripeConfigured, stripe, toStripeMinor } from "@/lib/stripe";
import { recordTransactionInit } from "@/lib/transactions";
import {
  InvalidQuantityError,
  releaseSeatHold,
  reserveSeats,
  SoldOutError,
  type SeatHold,
} from "@/lib/ticketing";
import { ApiError } from "./http";
import { eventIsOver } from "./services";

export const membershipCheckoutSchema = z.object({
  tierId: z.string().min(1).max(64),
  currency: z.enum(["NGN", "USD", "GBP", "EUR"]),
});

export type CheckoutResult = {
  reference: string;
  provider: "paystack" | "stripe";
  checkoutUrl: string;
};

type PaystackInit = { authorization_url: string; access_code: string; reference: string };

/** The outside calls, replaceable in tests. */
export type CheckoutDeps = {
  paystackInitialize: (body: Record<string, unknown>) => Promise<PaystackInit>;
  stripeCreateSession: (
    params: Record<string, unknown>,
  ) => Promise<{ id: string; url: string | null }>;
};

const realDeps: CheckoutDeps = {
  paystackInitialize: async (body) =>
    (
      await paystackRequest<PaystackInit>("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify(body),
      })
    ).data,
  stripeCreateSession: async (params) => {
    assertStripeConfigured();
    return stripe.checkout.sessions.create(
      params as unknown as Parameters<typeof stripe.checkout.sessions.create>[0],
    );
  },
};

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://www.yifww.org";

function notAvailable(message: string) {
  return new ApiError(422, "TIER_NOT_AVAILABLE", message);
}

export const eventCheckoutSchema = z.object({
  tierId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(20),
  // Event tickets are priced in naira only for now.
  currency: z.literal("NGN").optional(),
});

export type EventCheckoutResult = CheckoutResult & { holdExpiresAt: Date };

/**
 * Holds seats for 15 minutes and starts a Paystack payment for them.
 *
 * The seats are held before any money is asked for, so the last ticket cannot
 * be sold twice. If the payment cannot be started, the hold is released at once.
 * The ticket and the payment share one reference.
 */
export async function startEventCheckout(
  userId: string,
  slug: string,
  input: z.infer<typeof eventCheckoutSchema>,
  deps: CheckoutDeps = realDeps,
  now = new Date(),
): Promise<EventCheckoutResult> {
  const [user, event] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, name: true } }),
    prisma.event.findFirst({ where: { slug, isPublished: true }, include: { tiers: true } }),
  ]);
  if (!event) throw new ApiError(404, "NOT_FOUND", "That event was not found.");
  if (eventIsOver(event, now)) {
    throw new ApiError(409, "SALES_CLOSED", "Ticket sales for this event have closed.");
  }
  const tier = event.tiers.find((t) => t.id === input.tierId);
  if (!tier) throw new ApiError(422, "TIER_NOT_AVAILABLE", "That ticket option is not available.");
  const unitPrice = Number(tier.price);
  if (unitPrice <= 0) {
    throw new ApiError(422, "TIER_NOT_AVAILABLE", "Free tickets are claimed on the website.");
  }

  const total = unitPrice * input.quantity;
  const name = user.name ?? "Member";
  let hold: SeatHold;
  try {
    hold = await reserveSeats({
      eventId: event.id,
      tierId: tier.id,
      tierName: tier.name,
      quantity: input.quantity,
      holderName: name,
      holderEmail: user.email,
      userId,
      now,
    });
  } catch (err) {
    if (err instanceof SoldOutError) throw new ApiError(409, "SOLD_OUT", err.message);
    if (err instanceof InvalidQuantityError) {
      throw new ApiError(400, "VALIDATION_FAILED", err.message, { quantity: err.message });
    }
    throw err;
  }

  try {
    const init = await deps.paystackInitialize({
      email: user.email,
      amount: toKobo(total).toString(),
      reference: hold.reference,
      callback_url: `${appUrl()}/payment/callback`,
      metadata: {
        ticketRef: hold.reference,
        cancel_action: `${appUrl()}/events/${event.slug}`,
        custom_fields: [
          { display_name: "Full Name", variable_name: "full_name", value: name },
          { display_name: "Event", variable_name: "event_title", value: event.title },
          { display_name: "Ticket Tier", variable_name: "tier_name", value: tier.name },
          { display_name: "Quantity", variable_name: "quantity", value: String(input.quantity) },
        ],
      },
    });
    await recordTransactionInit({
      reference: init.reference,
      purpose: "TICKET",
      amountNaira: total,
      customerEmail: user.email,
      customerName: name,
      userId,
      metadata: {
        eventId: event.id,
        eventSlug: event.slug,
        eventTitle: event.title,
        tierId: tier.id,
        tierName: tier.name,
        quantity: input.quantity,
        ticketRef: hold.reference,
        source: "mobile",
      },
    });
    return {
      reference: init.reference,
      provider: "paystack",
      checkoutUrl: init.authorization_url,
      holdExpiresAt: hold.holdExpiresAt,
    };
  } catch (err) {
    // The payment never started, so give the seats back.
    await releaseSeatHold(hold.reference).catch(() => undefined);
    throw err;
  }
}

/**
 * Renews the member's tier, or upgrades to a higher one.
 *
 * Allowed for active members and for members whose membership has lapsed.
 * Moving to a lower tier stays on the website (it is scheduled, not paid).
 */
export async function startMembershipCheckout(
  userId: string,
  input: z.infer<typeof membershipCheckoutSchema>,
  deps: CheckoutDeps = realDeps,
): Promise<CheckoutResult> {
  const member = await prisma.member.findUnique({
    where: { userId },
    include: { user: { select: { email: true, name: true } }, tier: true },
  });
  if (!member) {
    throw new ApiError(403, "FORBIDDEN", "Please finish joining on the website first.");
  }
  if (member.status !== "ACTIVE" && member.status !== "EXPIRED") {
    throw new ApiError(
      403,
      "FORBIDDEN",
      member.status === "SUSPENDED"
        ? "Your membership is suspended. Please contact us."
        : "Please finish joining on the website first.",
    );
  }

  const tier = await prisma.membershipTier.findFirst({
    where: { id: input.tierId, isActive: true },
    include: { prices: { where: { isActive: true, currency: input.currency } } },
  });
  if (!tier) throw notAvailable("That membership level is not available.");
  if (tier.sortOrder < member.tier.sortOrder) {
    throw notAvailable("Moving to a lower level is done on the website.");
  }
  const price = tier.prices[0] ? Number(tier.prices[0].amount) : 0;
  if (price <= 0) {
    throw notAvailable(`${tier.name} is not available in ${input.currency}.`);
  }

  const isRenewal = tier.id === member.tierId;
  const paymentType = isRenewal ? "membership_renewal" : "membership_upgrade";
  const email = member.user.email;
  const name = member.user.name ?? "Member";
  const metadata = {
    paymentType,
    tierId: tier.id,
    tierName: tier.name,
    fromTierId: member.tierId,
    source: "mobile",
  };

  if (input.currency === "NGN") {
    const init = await deps.paystackInitialize({
      email,
      amount: toKobo(price),
      callback_url: `${appUrl()}/payment/callback`,
      metadata: {
        custom_fields: [
          { display_name: "Payment Type", variable_name: "payment_type", value: paymentType },
          { display_name: "Member ID", variable_name: "member_id", value: member.id },
          { display_name: "From Tier ID", variable_name: "from_tier_id", value: member.tierId },
          { display_name: "To Tier ID", variable_name: "to_tier_id", value: tier.id },
          { display_name: "Membership Tier", variable_name: "membership_tier", value: tier.name },
          { display_name: "Full Name", variable_name: "full_name", value: name },
        ],
      },
    });
    // Awaited, unlike on the website: the app asks about this payment straight away.
    await recordTransactionInit({
      reference: init.reference,
      purpose: "MEMBERSHIP",
      amountNaira: price,
      currency: "NGN",
      provider: "paystack",
      customerEmail: email,
      customerName: name,
      userId,
      memberId: member.id,
      metadata,
    });
    return { reference: init.reference, provider: "paystack", checkoutUrl: init.authorization_url };
  }

  const currency = input.currency.toLowerCase();
  const session = await deps.stripeCreateSession({
    mode: "payment",
    currency,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: toStripeMinor(price),
          product_data: {
            name: `YIF ${tier.name} Membership`,
            description: isRenewal ? `Annual renewal — ${tier.name}` : `Upgrade to ${tier.name}`,
          },
        },
      },
    ],
    customer_email: email,
    success_url: `${appUrl()}/payment/stripe-callback?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/dashboard/membership`,
    metadata: {
      purpose: "MEMBERSHIP",
      paymentType,
      tierId: tier.id,
      toTierId: tier.id,
      fromTierId: member.tierId,
      membershipTier: tier.name,
      memberId: member.id,
      userId,
      customerEmail: email,
      customerName: name,
    },
  });
  if (!session.url) {
    throw new ApiError(502, "PAYMENT_SETUP_FAILED", "Could not start the payment. Please try again.");
  }
  await recordTransactionInit({
    reference: session.id,
    purpose: "MEMBERSHIP",
    amountNaira: price,
    currency: input.currency,
    provider: "stripe",
    customerEmail: email,
    customerName: name,
    userId,
    memberId: member.id,
    metadata,
  });
  return { reference: session.id, provider: "stripe", checkoutUrl: session.url };
}
