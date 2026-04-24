import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My Tickets | YIF Member Portal",
};

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-[var(--yif-green)]/20 text-[var(--yif-green)]",
  PENDING: "bg-[var(--yif-gold)]/20 text-[var(--yif-gold)]",
  USED: "bg-white/10 text-white/50",
  CANCELLED: "bg-red-500/10 text-red-400",
};

export default async function TicketsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const upcoming = tickets.filter(
    (t) =>
      (t.status === "CONFIRMED" || t.status === "PENDING") &&
      new Date(t.event.date) >= now,
  );
  const past = tickets.filter(
    (t) =>
      t.status === "USED" ||
      t.status === "CANCELLED" ||
      new Date(t.event.date) < now,
  );

  return (
    <div className="min-h-screen bg-[var(--yif-navy-dark)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--yif-gold)] mb-1">
          Member Portal
        </p>
        <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          My Tickets
        </h1>
        <p className="mt-1 text-white/50 text-sm">
          Your event registrations and ticket history.
        </p>
      </div>

      {/* Upcoming events */}
      <section className="mb-10">
        <h2 className="font-display text-lg font-semibold text-white mb-4">
          Upcoming Events
        </h2>
        <div className="space-y-4">
          {upcoming.length === 0 ? (
            <div className="rounded-xl bg-white/5 border border-white/10 px-5 py-10 text-center text-white/40 text-sm">
              No upcoming tickets.{" "}
              <Link
                href="/events"
                className="text-[var(--yif-gold)] hover:underline"
              >
                Browse events →
              </Link>
            </div>
          ) : (
            upcoming.map((t) => (
              <div
                key={t.id}
                className="rounded-xl bg-white/5 border border-white/10 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                  {/* Gold left stripe */}
                  <div className="w-full sm:w-1.5 h-1.5 sm:h-auto bg-[var(--yif-gold)] shrink-0" />

                  <div className="flex-1 px-5 py-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-base font-semibold text-white leading-snug">
                          {t.event.title}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-white/50">
                          <span>
                            {new Date(t.event.date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                          {t.event.location && (
                            <>
                              <span>·</span>
                              <span>{t.event.location}</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="rounded-full bg-[var(--yif-gold)]/10 text-[var(--yif-gold)] text-xs px-2.5 py-0.5 font-medium border border-[var(--yif-gold)]/20">
                            {t.tierName}
                          </span>
                          <span className="rounded-full bg-white/10 text-white/60 text-xs px-2.5 py-0.5">
                            {t.quantity}{" "}
                            {t.quantity === 1 ? "ticket" : "tickets"}
                          </span>
                          <span
                            className={`rounded-full text-xs px-2.5 py-0.5 font-medium capitalize ${STATUS_STYLES[t.status] ?? "bg-white/10 text-white/50"}`}
                          >
                            {t.status.charAt(0) +
                              t.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <p className="font-display text-xl font-semibold text-[var(--yif-gold)]">
                          ₦{Number(t.amountPaid).toLocaleString("en-NG")}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5 font-mono">
                          {t.reference}
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          Purchased{" "}
                          {new Date(t.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* QR placeholder */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-7 h-7 text-white/40"
                          fill="currentColor"
                        >
                          <rect x="3" y="3" width="7" height="7" rx="1" />
                          <rect x="14" y="3" width="7" height="7" rx="1" />
                          <rect x="3" y="14" width="7" height="7" rx="1" />
                          <rect x="14" y="14" width="3" height="3" rx="0.5" />
                          <rect x="19" y="14" width="2" height="2" rx="0.5" />
                          <rect x="17" y="17" width="4" height="4" rx="0.5" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">
                          Your QR code will be available 48 hours before the
                          event.
                        </p>
                        <p className="text-xs text-white/30 mt-0.5">
                          A confirmation email was sent to your registered
                          address.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Past events */}
      <section>
        <h2 className="font-display text-lg font-semibold text-white mb-4">
          Past Events
        </h2>
        <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">
                  Event
                </th>
                <th className="text-left px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium hidden md:table-cell">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs text-white/40 uppercase tracking-wider font-medium hidden sm:table-cell">
                  Tier
                </th>
                <th className="text-right px-5 py-3 text-xs text-white/40 uppercase tracking-wider font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {past.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-white/40 text-sm"
                  >
                    No past tickets.
                  </td>
                </tr>
              ) : (
                past.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white/70 font-medium leading-snug line-clamp-1">
                        {t.event.title}
                      </p>
                      <p className="text-xs text-white/30 font-mono mt-0.5">
                        {t.reference}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-white/40 hidden md:table-cell">
                      {new Date(t.event.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4 text-white/40 hidden sm:table-cell">
                      {t.tierName} × {t.quantity}
                    </td>
                    <td className="px-5 py-4 text-right text-white/70 font-semibold">
                      ₦{Number(t.amountPaid).toLocaleString("en-NG")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Browse more events CTA */}
      <div className="mt-8 text-center">
        <p className="text-white/40 text-sm mb-3">
          Looking for upcoming events?
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--yif-gold)] px-6 py-2.5 text-sm font-semibold text-[var(--yif-navy-dark)] hover:bg-[var(--yif-gold-light)] transition-colors"
        >
          Browse Events →
        </Link>
      </div>
    </div>
  );
}
