import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Admin — Transactions | YIF" };

const PAGE_SIZE = 25;

const STATUS_STYLES: Record<string, string> = {
  SUCCESS: "bg-green-500/15 text-green-400 border-green-500/20",
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  FAILED: "bg-red-500/15 text-red-400 border-red-500/20",
  ABANDONED: "bg-white/10 text-white/60 border-white/15",
  REVERSED: "bg-purple-500/15 text-purple-400 border-purple-500/20",
};

const PURPOSE_LABELS: Record<string, string> = {
  MEMBERSHIP: "Membership",
  TICKET: "Ticket",
  DONATION: "Donation",
  OTHER: "Other",
};

function naira(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `₦${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const params = await searchParams;
  const get = (k: string) =>
    Array.isArray(params[k]) ? params[k]?.[0] : params[k];

  const status = get("status") ?? "";
  const purpose = get("purpose") ?? "";
  const q = (get("q") ?? "").trim();
  const page = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  const where: Prisma.TransactionWhereInput = {
    ...(status
      ? {
          status: status as
            | "PENDING"
            | "SUCCESS"
            | "FAILED"
            | "ABANDONED"
            | "REVERSED",
        }
      : {}),
    ...(purpose
      ? {
          purpose: purpose as "MEMBERSHIP" | "TICKET" | "DONATION" | "OTHER",
        }
      : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, totalCount, sumSuccess, sumFees, statusCounts] =
    await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.aggregate({
        where: { ...where, status: "SUCCESS" },
        _sum: { amount: true, netAmount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, status: "SUCCESS" },
        _sum: { fees: true },
      }),
      prisma.transaction.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const grossTotal = Number(sumSuccess._sum.amount ?? 0);
  const netTotal = Number(sumSuccess._sum.netAmount ?? 0);
  const feesTotal = Number(sumFees._sum.fees ?? 0);

  const counts = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count._all]),
  ) as Record<string, number>;

  // helper for building filter URLs while preserving other params
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (purpose) sp.set("purpose", purpose);
    for (const [k, v] of Object.entries(overrides)) {
      if (v == null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const s = sp.toString();
    return s ? `/admin/transactions?${s}` : "/admin/transactions";
  };

  return (
    <div className="min-h-screen bg-[var(--yif-navy-dark)] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--yif-terracotta)] mb-1">
            Admin Panel
          </p>
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Transactions
          </h1>
          <p className="mt-1 text-white/40 text-sm">
            Every Paystack payment, including charges and gateway response, for
            full transparency.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: "Gross (Successful)", value: naira(grossTotal) },
          { label: "Paystack Fees", value: naira(feesTotal) },
          { label: "Net Received", value: naira(netTotal) },
          { label: "Total Records", value: String(totalCount) },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white/5 border border-white/8 px-5 py-4"
          >
            <p className="text-xs text-white/40 font-medium uppercase tracking-wide mb-1.5">
              {s.label}
            </p>
            <p className="font-display text-2xl font-bold text-white">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form
        className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white/5 border border-white/8 p-4"
        action="/admin/transactions"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Search reference, email or name
          </label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="ref_xxx or jane@…"
            className="w-full rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[var(--yif-terracotta)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Status
          </label>
          <select
            name="status"
            aria-label="Filter by status"
            defaultValue={status}
            className="rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">All</option>
            <option value="SUCCESS">Success ({counts.SUCCESS ?? 0})</option>
            <option value="PENDING">Pending ({counts.PENDING ?? 0})</option>
            <option value="FAILED">Failed ({counts.FAILED ?? 0})</option>
            <option value="ABANDONED">
              Abandoned ({counts.ABANDONED ?? 0})
            </option>
            <option value="REVERSED">Reversed ({counts.REVERSED ?? 0})</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Purpose
          </label>
          <select
            name="purpose"
            aria-label="Filter by purpose"
            defaultValue={purpose}
            className="rounded-lg bg-white/8 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">All</option>
            <option value="MEMBERSHIP">Membership</option>
            <option value="TICKET">Ticket</option>
            <option value="DONATION">Donation</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-[var(--yif-terracotta)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Apply
        </button>
        <Link
          href="/admin/transactions"
          className="text-xs text-white/50 hover:text-white underline px-2 py-2"
        >
          Reset
        </Link>
      </form>

      {/* Table */}
      <div className="rounded-2xl bg-white/5 border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-white/40 border-b border-white/8">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Fees</th>
                <th className="px-4 py-3 font-medium text-right">Net</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-white/40 text-sm"
                  >
                    No transactions match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t.id} className="hover:bg-white/3">
                    <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/60">
                      {t.reference}
                    </td>
                    <td className="px-4 py-3 text-white/80">
                      <div className="font-medium">
                        {t.customerName ?? t.user?.name ?? "—"}
                      </div>
                      <div className="text-xs text-white/40">
                        {t.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {PURPOSE_LABELS[t.purpose] ?? t.purpose}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">
                      {naira(Number(t.amount))}
                    </td>
                    <td className="px-4 py-3 text-right text-white/60">
                      {t.fees != null ? naira(Number(t.fees)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-white/80">
                      {t.netAmount != null ? naira(Number(t.netAmount)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-white/60 capitalize">
                      {t.channel ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          STATUS_STYLES[t.status] ?? STATUS_STYLES.PENDING
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/transactions/${t.id}`}
                        className="text-xs text-[var(--yif-terracotta)] hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="text-white/40">
            Page {page} of {totalPages} · {totalCount} records
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="rounded-lg bg-white/8 border border-white/10 px-3 py-1.5 text-white/70 hover:bg-white/12"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="rounded-lg bg-white/8 border border-white/10 px-3 py-1.5 text-white/70 hover:bg-white/12"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
