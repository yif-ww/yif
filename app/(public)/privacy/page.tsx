import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold text-[var(--yif-navy)]">
        Privacy Policy
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">Coming soon.</p>
    </div>
  );
}
