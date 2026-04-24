"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paystackRequest, toKobo } from "@/lib/paystack";
import { recordTransactionInit } from "@/lib/transactions";
import { sendMembershipInitialization } from "@/lib/send-email";
import { COUNTRY_CONTINENT } from "@/lib/countries";

const TIER_PRICES: Record<string, number> = {
  SILVER: 5000,
  GOLD: 10000,
  DIAMOND: 15000,
  PLATINUM: 20000,
};

const TIER_SLUGS: Record<string, string> = {
  silver: "SILVER",
  gold: "GOLD",
  diamond: "DIAMOND",
  platinum: "PLATINUM",
};

const baseSchema = z.object({
  tierSlug: z.enum(["silver", "gold", "diamond", "platinum"]),
  phone: z.string().min(7, "Enter a valid phone number"),
  country: z.string().min(2, "Enter your country"),
  stateProvince: z.string().optional(),
  cityDistrict: z.string().min(2, "Enter your city or district"),
});

const registrationSchema = baseSchema.extend({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ApplyState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function startMembershipApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const reqHeaders = await headers();
  const existingSession = await auth.api.getSession({ headers: reqHeaders });

  const raw = {
    tierSlug: formData.get("tierSlug"),
    phone: formData.get("phone"),
    country: formData.get("country"),
    stateProvince: formData.get("stateProvince") || undefined,
    cityDistrict: formData.get("cityDistrict"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const schema = existingSession ? baseSchema : registrationSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { tierSlug, phone, country, stateProvince, cityDistrict } = parsed.data;
  const continent = COUNTRY_CONTINENT[country] ?? null;
  const dbTier = TIER_SLUGS[tierSlug];
  const priceNaira = TIER_PRICES[dbTier];

  if (!priceNaira) {
    return { error: "Invalid membership tier selected." };
  }

  // Resolve user — either from existing session or by registering a new account
  let userId: string;
  let userEmail: string;
  let userName: string;

  if (existingSession) {
    userId = existingSession.user.id;
    userEmail = existingSession.user.email;
    userName = existingSession.user.name ?? "Member";
  } else {
    const { fullName, email, password } = parsed.data as z.infer<
      typeof registrationSchema
    >;

    // Reject if account already exists — direct them to log in
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return {
        fieldErrors: {
          email: [
            "An account with this email already exists. Please log in first.",
          ],
        },
      };
    }

    try {
      const signUpResult = await auth.api.signUpEmail({
        body: { name: fullName, email, password },
        headers: reqHeaders,
      });
      userId = signUpResult.user.id;
      userEmail = signUpResult.user.email;
      userName = signUpResult.user.name;
    } catch (err) {
      const message =
        err instanceof APIError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not create your account.";
      return { error: message };
    }
  }

  // Update user profile with contact details
  await prisma.user.update({
    where: { id: userId },
    data: {
      phone,
      country,
      stateProvince: stateProvince ?? null,
      cityDistrict,
      continent,
    },
  });

  // Create or update member record in PENDING state
  const member = await prisma.member.upsert({
    where: { userId },
    update: {
      tier: dbTier as "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM",
      status: "PENDING",
    },
    create: {
      userId,
      tier: dbTier as "SILVER" | "GOLD" | "DIAMOND" | "PLATINUM",
      status: "PENDING",
    },
  });

  // Initiate Paystack payment
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  type PaystackInitResponse = {
    authorization_url: string;
    access_code: string;
    reference: string;
  };

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
                value: "membership",
              },
              {
                display_name: "Member ID",
                variable_name: "member_id",
                value: member.id,
              },
              {
                display_name: "Membership Tier",
                variable_name: "membership_tier",
                value: dbTier,
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
    const msg = err instanceof Error ? err.message : "Payment setup failed.";
    return { error: msg };
  }

  // Store reference on the member record
  await prisma.member.update({
    where: { id: member.id },
    data: { paystackRef: paystackData.reference },
  });

  // Record the pending transaction for admin transparency
  await recordTransactionInit({
    reference: paystackData.reference,
    purpose: "MEMBERSHIP",
    amountNaira: priceNaira,
    customerEmail: userEmail,
    customerName: userName,
    customerPhone: phone,
    userId,
    memberId: member.id,
    metadata: {
      tier: dbTier,
      country,
      stateProvince: stateProvince ?? null,
      cityDistrict,
    },
  }).catch((err) =>
    console.error("[startMembershipApplication] tx init record failed:", err),
  );

  // Send membership initialization email (fire-and-forget — don't block redirect)
  const tierDisplayName = dbTier.charAt(0) + dbTier.slice(1).toLowerCase();
  sendMembershipInitialization({
    recipientName: userName,
    tierName: tierDisplayName,
    amountNaira: `₦${priceNaira.toLocaleString("en-NG")}`,
    reference: paystackData.reference,
    paymentUrl: paystackData.authorization_url,
    recipientEmail: userEmail,
  }).catch((err) =>
    console.error("[startMembershipApplication] init email failed:", err),
  );

  redirect(paystackData.authorization_url);
}
