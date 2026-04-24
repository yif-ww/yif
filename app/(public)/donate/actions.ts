"use server";

import {
  paystackRequest,
  toKobo,
  type TransactionInitData,
} from "@/lib/paystack";
import { recordTransactionInit } from "@/lib/transactions";
import { redirect } from "next/navigation";

export type DonateState = {
  error?: string;
};

export async function initiateDonation(
  _prev: DonateState,
  formData: FormData,
): Promise<DonateState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const cause = (formData.get("cause") as string | null) ?? "General Fund";
  const frequency = (formData.get("frequency") as string | null) ?? "one-time";
  const rawAmount = (formData.get("amount") as string | null) ?? "";

  const amount = parseInt(rawAmount.replace(/[^0-9]/g, ""), 10);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!name) {
    return { error: "Please enter your full name." };
  }
  if (!amount || amount < 100) {
    return { error: "Minimum donation amount is ₦100." };
  }
  if (amount > 10_000_000) {
    return { error: "Please contact us for donations above ₦10,000,000." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const result = await paystackRequest<TransactionInitData>(
      "/transaction/initialize",
      {
        method: "POST",
        body: JSON.stringify({
          email,
          amount: toKobo(amount).toString(),
          callback_url: `${appUrl}/payment/callback`,
          metadata: {
            cancel_action: `${appUrl}/donate`,
            custom_fields: [
              {
                display_name: "Full Name",
                variable_name: "full_name",
                value: name,
              },
              { display_name: "Cause", variable_name: "cause", value: cause },
              {
                display_name: "Type",
                variable_name: "donation_type",
                value: "donation",
              },
              {
                display_name: "Frequency",
                variable_name: "frequency",
                value: frequency,
              },
            ],
          },
        }),
      },
    );

    await recordTransactionInit({
      reference: result.data.reference,
      purpose: "DONATION",
      amountNaira: amount,
      customerEmail: email,
      customerName: name,
      metadata: { cause, frequency },
    }).catch((err) =>
      console.error("[initiateDonation] tx init record failed:", err),
    );

    redirect(result.data.authorization_url);
  } catch (err: unknown) {
    if (
      err !== null &&
      typeof err === "object" &&
      "message" in err &&
      typeof (err as { message: unknown }).message === "string" &&
      (err as { message: string }).message.startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    const msg =
      err instanceof Error
        ? err.message
        : "Payment initialisation failed. Please try again.";
    return { error: msg };
  }
  // redirect() throws, so this is unreachable — satisfies TypeScript's return-type check
  return {};
}
