import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Join the Yoruba Indigenes' Foundation as a member and be part of a global community committed to Yoruba unity and progress.",
};

export default function MembershipPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold text-[var(--yif-navy)]">
        Become a Member
      </h1>
      <p className="mt-4 text-lg text-[var(--muted)]">
        Coming soon — Phase 11.
      </p>
    </div>
  );
}
