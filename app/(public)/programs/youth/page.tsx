import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Youth Initiative",
  description:
    "YIF Youth Initiative empowers the next generation of Yoruba leaders through mentorship, training, and cultural engagement.",
};

export default function YouthPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold text-[var(--yif-navy)]">
        Youth Initiative
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">Coming soon — Phase 4.</p>
    </div>
  );
}
