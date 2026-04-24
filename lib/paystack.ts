// lib/paystack.ts — server-side only. Never import from client components.

export interface PaystackResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
}

export class PaystackError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "PaystackError";
  }
}

export async function paystackRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<PaystackResponse<T>> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");

  const url = `https://api.paystack.co${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
    // never cache Paystack API responses
    cache: "no-store",
  });

  const data = (await response.json()) as PaystackResponse<T>;

  if (!response.ok) {
    throw new PaystackError(
      data.message ?? `Paystack error ${response.status}`,
      response.status,
      data,
    );
  }

  return data;
}

/** Convert a display amount (NGN) to kobo subunits */
export const toKobo = (naira: number) => Math.round(naira * 100);

/** Convert kobo subunits back to display amount (NGN) */
export const fromKobo = (kobo: number) => kobo / 100;

export interface TransactionInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface TransactionVerifyData {
  id: number;
  status: "success" | "failed" | "abandoned";
  reference: string;
  amount: number; // kobo
  currency: string;
  channel: string;
  paid_at: string | null;
  created_at?: string;
  fees?: number | null; // kobo — Paystack fee
  fees_breakdown?: unknown;
  gateway_response?: string | null;
  ip_address?: string | null;
  authorization?: {
    authorization_code?: string;
    bin?: string;
    last4?: string;
    exp_month?: string;
    exp_year?: string;
    channel?: string;
    card_type?: string;
    bank?: string;
    country_code?: string;
    brand?: string;
  } | null;
  metadata: Record<string, unknown>;
  customer: {
    id: number;
    email: string;
    customer_code: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  };
}
