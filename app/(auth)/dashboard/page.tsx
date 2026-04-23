import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold text-white">
        Member Dashboard
      </h1>
      <p className="mt-3 text-white/60">Coming soon — Phase 11.</p>
    </div>
  );
}
