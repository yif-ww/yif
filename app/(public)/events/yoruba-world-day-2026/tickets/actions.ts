"use server";

import { redirect } from "next/navigation";
import {
  paystackRequest,
  toKobo,
  type TransactionInitData,
} from "@/lib/paystack";
import { recordTransactionInit } from "@/lib/transactions";
import { prisma } from "@/lib/prisma";
import { YWD_SLUG, YWD_EVENT } from "@/lib/yoruba-world-day-2026";
import { stripe, assertStripeConfigured, toStripeMinor } from "@/lib/stripe";
import { usdToNgn } from "@/lib/currency";
import {
  InvalidQuantityError,
  releaseSeatHold,
  reserveSeats,
  SoldOutError,
  type SeatHold,
} from "@/lib/ticketing";

const MAX_DELEGATE_PASSES = 20;

export type TicketCheckoutState = { error?: string };

export async function buyDelegatePass(
  _prev: TicketCheckoutState,
  formData: FormData,
): Promise<TicketCheckoutState> {
  const paystackKey = process.env.PAYSTACK_SECRET_KEY ?? "";
  const paystackIsLive = paystackKey.startsWith("sk_live_");

  // If Paystack is in test mode, always route through Stripe regardless of what the form sent
  const rawCurrency = (formData.get("currency") as string | null) ?? "NGN";
  const currency = !paystackIsLive && rawCurrency === "NGN" ? "USD" : rawCurrency;

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const country = (formData.get("country") as string | null)?.trim() ?? "";
  const qty = parseInt((formData.get("qty") as string | null) ?? "1", 10);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!name) return { error: "Please enter your full name." };
  if (qty < 1 || qty > 20)
    return { error: "Quantity must be between 1 and 20." };

  const event = await prisma.event.findUnique({
    where: { slug: YWD_SLUG },
    include: { tiers: { take: 1 } },
  });
  if (!event || event.tiers.length === 0) {
    return {
      error:
        "The event is not yet seeded in the database. Please run `pnpm events:reset`.",
    };
  }

  const tier = event.tiers[0];
  const totalNaira = Number(tier.price) * qty;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.yifww.org";

  // Hold the passes before taking payment, so the event can't be oversold.
  let hold: SeatHold;
  try {
    hold = await reserveSeats({
      eventId: event.id,
      tierId: tier.id,
      tierName: tier.name,
      quantity: qty,
      holderName: name,
      holderEmail: email,
      maxPerOrder: MAX_DELEGATE_PASSES,
    });
  } catch (err) {
    if (err instanceof SoldOutError || err instanceof InvalidQuantityError) {
      return { error: err.message };
    }
    throw err;
  }

  // ── USD via Stripe ──────────────────────────────────────────────────────
  if (currency !== "NGN") {
    try {
      assertStripeConfigured();
    } catch (err) {
      console.error("[buyDelegatePass] Stripe not configured:", err);
      return {
        error:
          "USD payments are temporarily unavailable. Please choose NGN, or contact us.",
      };
    }

    const totalUsd = YWD_EVENT.ticketPriceUsd * qty;
    let stripeUrl: string | null = null;
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: toStripeMinor(totalUsd),
              product_data: {
                name: `${YWD_EVENT.title} — ${tier.name}`,
                description: `${qty} delegate pass${qty > 1 ? "es" : ""}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/payment/stripe-callback?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/events/${YWD_SLUG}/tickets`,
        metadata: {
          purpose: "TICKET",
          ticketRef: hold.reference,
          eventSlug: YWD_SLUG,
          eventTitle: YWD_EVENT.title,
          tierId: tier.id,
          tierName: tier.name,
          quantity: String(qty),
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          country,
          fullName: name,
        },
      });

      await recordTransactionInit({
        provider: "stripe",
        reference: session.id,
        purpose: "TICKET",
        amountNaira: usdToNgn(totalUsd),
        currency: "USD",
        customerEmail: email,
        customerName: name,
        customerPhone: phone || null,
        metadata: {
          eventId: event.id,
          eventSlug: YWD_SLUG,
          eventTitle: YWD_EVENT.title,
          tierId: tier.id,
          tierName: tier.name,
          quantity: qty,
          ticketRef: hold.reference,
          country,
          totalUsd,
        },
      });

      stripeUrl = session.url;
    } catch (err) {
      console.error("[buyDelegatePass] Stripe init failed:", err);
      await releaseSeatHold(hold.reference).catch(() => undefined);
      return {
        error:
          "We couldn't start the Stripe checkout. Please try again, or contact us if the problem persists.",
      };
    }

    if (!stripeUrl) {
      await releaseSeatHold(hold.reference).catch(() => undefined);
      return { error: "Stripe did not return a checkout URL. Please retry." };
    }
    redirect(stripeUrl);
  }

  // ── NGN via Paystack ────────────────────────────────────────────────────
  let authorizationUrl: string | null = null;
  try {
    const result = await paystackRequest<TransactionInitData>(
      "/transaction/initialize",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          amount: toKobo(totalNaira).toString(),
          // Our own reference, so the ticket and the payment share one.
          reference: hold.reference,
          callback_url: `${appUrl}/payment/callback`,
          metadata: {
            ticketRef: hold.reference,
            cancel_action: `${appUrl}/events/${YWD_SLUG}/tickets`,
            custom_fields: [
              {
                display_name: "Full Name",
                variable_name: "full_name",
                value: name,
              },
              { display_name: "Phone", variable_name: "phone", value: phone },
              {
                display_name: "Country",
                variable_name: "country",
                value: country,
              },
              {
                display_name: "Event",
                variable_name: "event",
                value: YWD_EVENT.title,
              },
              { display_name: "Tier", variable_name: "tier", value: tier.name },
              {
                display_name: "Quantity",
                variable_name: "quantity",
                value: String(qty),
              },
            ],
          },
        }),
      },
    );

    await recordTransactionInit({
      reference: result.data.reference,
      purpose: "TICKET",
      amountNaira: totalNaira,
      customerEmail: email,
      customerName: name,
      customerPhone: phone || null,
      metadata: {
        eventId: event.id,
        eventSlug: YWD_SLUG,
        eventTitle: YWD_EVENT.title,
        tierId: tier.id,
        tierName: tier.name,
        quantity: qty,
        ticketRef: hold.reference,
        country,
      },
    });

    authorizationUrl = result.data.authorization_url;
  } catch (err) {
    console.error("[buyDelegatePass] Paystack init failed:", err);
    await releaseSeatHold(hold.reference).catch(() => undefined);
    return {
      error:
        "We couldn't start the payment. Please try again, or contact us if the problem persists.",
    };
  }

  redirect(authorizationUrl!);
}
