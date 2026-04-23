import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scholarship Application",
  description:
    "Apply for the Karo-Ojire Scholarship Programme. Complete the multi-step application form.",
};

export default function ScholarshipApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold text-[var(--yif-navy)]">
        Scholarship Application
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        Coming soon — Phase 10.
      </p>
    </div>
  );
}
