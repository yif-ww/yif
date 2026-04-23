import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholarship Program",
  description:
    "The Karo-Ojire Scholarship Programme supports exceptional Yoruba students worldwide. Learn about eligibility, deadlines, and how to apply.",
};

export default function ScholarshipPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold text-[var(--yif-navy)]">
        Karo-Ojire Scholarship Programme
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        Coming soon — Phase 10.
      </p>
    </div>
  );
}
