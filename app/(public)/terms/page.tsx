import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold text-[var(--yif-navy)]">
        Terms of Use
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">Coming soon.</p>
    </div>
  );
}
