"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackRequest, toKobo } from "@/lib/paystack";
import { recordTransactionInit } from "@/lib/transactions";

const TIER_ORDER: Record<string, number> = {
  BRONZE: 0,
  SILVER: 1,
  GOLD: 2,
  DIAMOND: 3,
  PLATINUM: 4,
};

const TIER_PRICES: Record<string, number> = {
  SILVER: 5000,
  GOLD: 10000,
  DIAMOND: 15000,
  PLATINUM: 20000,
};

type ActionState = {
  error?: string;
  success?: boolean;
};

type PaystackInitResponse = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

// ────────────────────────────────────────────────
// UPGRADE: initiates a Paystack payment to move
// the member to a higher tier immediately.
// ────────────────────────────────────────────────
export async function initMembershipUpgrade(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return { error: "You must be signed in." };

  const toTierRaw = (formData.get("tierSlug") as string | null)?.toUpperCase();
  if (!toTierRaw || !(toTierRaw in TIER_ORDER)) {
    return { error: "Invalid tier selected." };
  }

  const member = await prisma.member.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!member) return { error: "No membership record found." };
  if (member.status !== "ACTIVE") {
    return { error: "Your membership is not active. Please apply first." };
  }

  const currentOrder = TIER_ORDER[member.tier] ?? 0;
  const targetOrder = TIER_ORDER[toTierRaw] ?? 0;

  if (targetOrder < currentOrder) {
    return {
      error: "Use the downgrade option to move to a lower tier.",
    };
  }

  const priceNaira = TIER_PRICES[toTierRaw];
  if (!priceNaira) return { error: "Tier pricing not found." };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const userName = member.user.name ?? "Member";
  const userEmail = member.user.email;

  let paystackData: PaystackInitResponse;
  try {
    const result = await paystackRequest<PaystackInitResponse>(
      "/transaction/initialize",
      {
        method: "POST",
        body: JSON.stringify({
          email: userEmail,
          amount: toKobo(priceNaira),
          callback_url: `${appUrl}/payment/callback`,
          metadata: {
            custom_fields: [
              {
                display_name: "Payment Type",
                variable_name: "payment_type",
                value:
                  targetOrder > currentOrder
                    ? "membership_upgrade"
                    : "membership_renewal",
              },
              {
                display_name: "Member ID",
                variable_name: "member_id",
                value: member.id,
              },
              {
                display_name: "From Tier",
                variable_name: "from_tier",
                value: member.tier,
              },
              {
                display_name: "To Tier",
                variable_name: "to_tier",
                value: toTierRaw,
              },
              {
                display_name: "Full Name",
                variable_name: "full_name",
                value: userName,
              },
            ],
          },
        }),
      },
    );
    paystackData = result.data;
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Payment setup failed.",
    };
  }

  // Record pending transaction (non-blocking)
  recordTransactionInit({
    reference: paystackData.reference,
    purpose: "MEMBERSHIP",
    amountNaira: priceNaira,
    customerEmail: userEmail,
    customerName: userName,
    userId: session.user.id,
    memberId: member.id,
  }).catch((e: unknown) => {
    console.error("[upgrade] tx init record failed:", e);
  });

  redirect(paystackData.authorization_url);
}

// ────────────────────────────────────────────────
// DOWNGRADE: schedules a tier change with no
// payment — takes effect at next renewal.
// ────────────────────────────────────────────────
export async function scheduleMembershipDowngrade(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return { error: "You must be signed in." };

  const toTierRaw = (formData.get("tierSlug") as string | null)?.toUpperCase();
  if (!toTierRaw || !(toTierRaw in TIER_ORDER)) {
    return { error: "Invalid tier selected." };
  }

  const member = await prisma.member.findUnique({
    where: { userId: session.user.id },
  });

  if (!member) return { error: "No membership record found." };
  if (member.status !== "ACTIVE") {
    return { error: "Your membership is not currently active." };
  }

  const currentOrder = TIER_ORDER[member.tier] ?? 0;
  const targetOrder = TIER_ORDER[toTierRaw] ?? 0;

  if (targetOrder >= currentOrder) {
    return {
      error: "Use the upgrade option to move to a higher tier.",
    };
  }

  await prisma.member.update({
    where: { id: member.id },
    data: {
      pendingTier: toTierRaw as
        | "SILVER"
        | "GOLD"
        | "DIAMOND"
        | "PLATINUM"
        | "BRONZE",
    },
  });

  return { success: true };
}

// ────────────────────────────────────────────────
// CANCEL DOWNGRADE: clears any pending tier change.
// ────────────────────────────────────────────────
export async function cancelPendingDowngrade(
  _prev: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) return { error: "You must be signed in." };

  const member = await prisma.member.findUnique({
    where: { userId: session.user.id },
  });

  if (!member) return { error: "No membership record found." };

  await prisma.member.update({
    where: { id: member.id },
    data: { pendingTier: null },
  });

  return { success: true };
}
