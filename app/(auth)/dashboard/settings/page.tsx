import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./_SettingsForm";

export const metadata: Metadata = {
  title: "Settings | YIF Member Portal",
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      gender: true,
      continent: true,
      country: true,
      stateProvince: true,
      cityDistrict: true,
      bio: true,
      notifEventInvites: true,
      notifNewsletter: true,
      notifDonationReceipts: true,
      notifMemberUpdates: true,
      notifScholarshipNews: true,
    },
  });

  return (
    <div className="min-h-screen bg-[var(--yif-navy-dark)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--yif-gold)] mb-1">
          Member Portal
        </p>
        <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1 text-white/50 text-sm">
          Manage your profile, notifications, and account security.
        </p>
      </div>
      <SettingsForm user={user} />
    </div>
  );
}
