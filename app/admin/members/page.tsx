import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembersTable } from "./_MembersTable";

export const metadata: Metadata = { title: "Admin — Members | YIF" };

export default async function AdminMembersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  const members = await prisma.member.findMany({
    orderBy: { joinedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="min-h-screen bg-[var(--yif-navy-dark)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--yif-terracotta)] mb-1">
            Admin Panel
          </p>
          <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Members
          </h1>
          <p className="mt-1 text-white/40 text-sm">
            {members.length} total members
          </p>
        </div>
        <button className="rounded-xl bg-[var(--yif-gold)] text-[var(--yif-navy-dark)] px-5 py-2.5 text-sm font-semibold hover:bg-[var(--yif-gold-light)] transition-colors">
          + Invite Member
        </button>
      </div>
      <MembersTable members={members} />
    </div>
  );
}
