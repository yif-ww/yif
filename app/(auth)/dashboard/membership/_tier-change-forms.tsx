"use client";

import { useActionState, useState } from "react";
import {
  initMembershipUpgrade,
  scheduleMembershipDowngrade,
  cancelPendingDowngrade,
} from "./actions";

type ActionState = { error?: string; success?: boolean };

// ─── Upgrade Button ───────────────────────────────────────────────
// Plain form submit → server action → redirect to Paystack
export function UpgradeButton({
  tierSlug,
  tierName,
  price,
  color,
  label,
}: {
  tierSlug: string;
  tierName: string;
  price: string;
  color: string;
  label?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    initMembershipUpgrade,
    {},
  );

  return (
    <form action={action} className="w-full">
      <input type="hidden" name="tierSlug" value={tierSlug} />
      {state.error && (
        <p className="text-xs text-red-600 mb-2">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
        style={{
          background: color,
          color: "#fff",
        }}
      >
        {pending
          ? "Redirecting…"
          : (label ?? `Upgrade to ${tierName} — ${price}`)}
      </button>
    </form>
  );
}

// ─── Downgrade Button ─────────────────────────────────────────────
// Shows a confirmation panel before scheduling the downgrade.
export function DowngradeButton({
  tierSlug,
  tierName,
  currentTierName,
  expiresAt,
}: {
  tierSlug: string;
  tierName: string;
  currentTierName: string;
  expiresAt: string | null;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    scheduleMembershipDowngrade,
    {},
  );

  if (state.success) {
    return (
      <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 w-full text-center">
        Downgrade to {tierName} scheduled — takes effect on your next renewal.
      </p>
    );
  }

  if (!showConfirm) {
    return (
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold border border-[var(--yif-cream-dark)] text-[var(--muted)] hover:border-red-300 hover:text-red-600 transition-colors"
      >
        Downgrade to {tierName}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3 w-full">
      <p className="text-xs font-semibold text-amber-800">
        Schedule downgrade to {tierName}?
      </p>
      <p className="text-xs text-amber-700">
        Your <strong>{currentTierName}</strong> benefits continue until{" "}
        <strong>{expiresAt ?? "expiry"}</strong>. No refund is issued — the
        lower tier takes effect when you renew.
      </p>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <form action={action} className="flex gap-2">
        <input type="hidden" name="tierSlug" value={tierSlug} />
        <button
          type="button"
          onClick={() => setShowConfirm(false)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-60"
        >
          {pending ? "Saving…" : "Confirm Downgrade"}
        </button>
      </form>
    </div>
  );
}

// ─── Cancel Pending Downgrade ─────────────────────────────────────
export function CancelDowngradeButton({
  pendingTierName,
}: {
  pendingTierName: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    cancelPendingDowngrade,
    {},
  );

  if (state.success) {
    return (
      <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        Pending downgrade cancelled — your tier will remain unchanged.
      </p>
    );
  }

  return (
    <form action={action} className="inline-flex items-center gap-2">
      {state.error && (
        <span className="text-xs text-red-600">{state.error}</span>
      )}
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-amber-700 underline underline-offset-2 hover:text-amber-900 disabled:opacity-60"
      >
        {pending
          ? "Cancelling…"
          : `Cancel scheduled downgrade to ${pendingTierName}`}
      </button>
    </form>
  );
}
