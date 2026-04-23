"use client";

import { useActionState, useState } from "react";
import { initiateDonation, type DonateState } from "./actions";

const PRESET_AMOUNTS = [5_000, 10_000, 25_000, 50_000];
const CAUSES = [
  {
    id: "General Fund",
    label: "General Fund",
    desc: "Support all YIF activities",
  },
  {
    id: "Scholarship Fund",
    label: "Scholarship Fund",
    desc: "Educate the next generation",
  },
  {
    id: "Youth Development",
    label: "Youth Development",
    desc: "Empower Yoruba youth globally",
  },
  {
    id: "Cultural Programs",
    label: "Cultural Programs",
    desc: "Preserve Yoruba heritage",
  },
];

const initial: DonateState = {};

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DonateForm() {
  const [state, action, pending] = useActionState(initiateDonation, initial);
  const [frequency, setFrequency] = useState<"one-time" | "recurring">(
    "one-time",
  );
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(
    PRESET_AMOUNTS[1],
  );
  const [customAmount, setCustomAmount] = useState("");
  const [cause, setCause] = useState(CAUSES[0].id);

  const displayAmount =
    selectedAmount === "custom"
      ? parseInt(customAmount.replace(/[^0-9]/g, ""), 10) || 0
      : selectedAmount;

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
        >
          {state.error}
        </div>
      )}

      {/* Frequency toggle */}
      <div>
        <p className="mb-2 text-sm font-medium text-[var(--yif-charcoal)]">
          Donation Type
        </p>
        <div className="inline-flex rounded-lg border border-[var(--yif-cream-dark)] overflow-hidden">
          {(["one-time", "recurring"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={`px-5 py-2 text-sm font-medium transition-colors ${
                frequency === f
                  ? "bg-[var(--yif-navy)] text-white"
                  : "bg-white text-[var(--yif-charcoal)] hover:bg-[var(--yif-cream)]"
              }`}
            >
              {f === "one-time" ? "One-time" : "Monthly"}
            </button>
          ))}
        </div>
        <input type="hidden" name="frequency" value={frequency} />
      </div>

      {/* Amount presets */}
      <div>
        <p className="mb-2 text-sm font-medium text-[var(--yif-charcoal)]">
          Amount
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-2">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setSelectedAmount(amt)}
              className={`rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                selectedAmount === amt
                  ? "border-[var(--yif-gold)] bg-[var(--yif-gold)]/10 text-[var(--yif-navy)]"
                  : "border-[var(--yif-cream-dark)] bg-white text-[var(--yif-charcoal)] hover:border-[var(--yif-gold)]"
              }`}
            >
              {fmt(amt)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSelectedAmount("custom")}
          className={`w-full rounded-lg border py-2.5 text-sm font-medium transition-colors mb-2 ${
            selectedAmount === "custom"
              ? "border-[var(--yif-gold)] bg-[var(--yif-gold)]/10 text-[var(--yif-navy)]"
              : "border-[var(--yif-cream-dark)] bg-white text-[var(--muted)] hover:border-[var(--yif-gold)]"
          }`}
        >
          Enter custom amount
        </button>
        {selectedAmount === "custom" && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--muted)]">
              ₦
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={customAmount}
              onChange={(e) =>
                setCustomAmount(e.target.value.replace(/[^0-9]/g, ""))
              }
              className="w-full rounded-lg border border-[var(--yif-gold)] bg-white py-2.5 pl-7 pr-3 text-sm text-[var(--yif-charcoal)] focus:outline-none"
            />
          </div>
        )}
        <input type="hidden" name="amount" value={displayAmount.toString()} />
      </div>

      {/* Cause */}
      <div>
        <p className="mb-2 text-sm font-medium text-[var(--yif-charcoal)]">
          Designate Your Gift
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CAUSES.map((c) => (
            <label
              key={c.id}
              className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition-colors ${
                cause === c.id
                  ? "border-[var(--yif-gold)] bg-[var(--yif-gold)]/5"
                  : "border-[var(--yif-cream-dark)] bg-white hover:border-[var(--yif-gold)]/50"
              }`}
            >
              <input
                type="radio"
                name="cause"
                value={c.id}
                checked={cause === c.id}
                onChange={() => setCause(c.id)}
                className="mt-0.5 accent-[var(--yif-gold)]"
              />
              <span>
                <span className="block text-xs font-semibold text-[var(--yif-navy)]">
                  {c.label}
                </span>
                <span className="block text-xs text-[var(--muted)]">
                  {c.desc}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label
          htmlFor="donate-name"
          className="mb-1.5 block text-sm font-medium text-[var(--yif-charcoal)]"
        >
          Full Name
        </label>
        <input
          id="donate-name"
          name="name"
          type="text"
          required
          placeholder="Your full name"
          className="w-full rounded-lg border border-[var(--yif-cream-dark)] bg-white px-3 py-2.5 text-sm text-[var(--yif-charcoal)] placeholder-[var(--muted)] focus:border-[var(--yif-gold)] focus:outline-none"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="donate-email"
          className="mb-1.5 block text-sm font-medium text-[var(--yif-charcoal)]"
        >
          Email Address
        </label>
        <input
          id="donate-email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="w-full rounded-lg border border-[var(--yif-cream-dark)] bg-white px-3 py-2.5 text-sm text-[var(--yif-charcoal)] placeholder-[var(--muted)] focus:border-[var(--yif-gold)] focus:outline-none"
        />
      </div>

      {displayAmount > 0 && (
        <div className="rounded-lg bg-[var(--yif-navy)]/5 border border-[var(--yif-navy)]/10 p-3 text-sm text-[var(--yif-navy)]">
          You are donating <strong>{fmt(displayAmount)}</strong>{" "}
          {frequency === "recurring" ? "monthly " : ""}
          to the <strong>{cause}</strong>.
        </div>
      )}

      <button
        type="submit"
        disabled={pending || displayAmount < 100}
        className="w-full rounded-lg bg-[var(--yif-gold)] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--yif-gold-light)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending
          ? "Redirecting to Paystack…"
          : `Donate ${displayAmount >= 100 ? fmt(displayAmount) : ""} →`}
      </button>
      <p className="text-center text-xs text-[var(--muted)]">
        Secured by Paystack · 256-bit SSL · Instant receipt by email
      </p>
    </form>
  );
}
