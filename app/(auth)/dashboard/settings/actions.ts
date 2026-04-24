"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().max(20).optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional(),
  continent: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  stateProvince: z.string().max(100).optional(),
  cityDistrict: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});

const notifSchema = z.object({
  notifEventInvites: z.boolean(),
  notifNewsletter: z.boolean(),
  notifDonationReceipts: z.boolean(),
  notifMemberUpdates: z.boolean(),
  notifScholarshipNews: z.boolean(),
});

export async function updateProfile(data: {
  name: string;
  phone: string;
  gender: string;
  continent: string;
  country: string;
  stateProvince: string;
  cityDistrict: string;
  bio: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid data",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      gender: parsed.data.gender ?? null,
      continent: parsed.data.continent ?? null,
      country: parsed.data.country ?? null,
      stateProvince: parsed.data.stateProvince ?? null,
      cityDistrict: parsed.data.cityDistrict ?? null,
      bio: parsed.data.bio ?? null,
    },
  });

  return { success: true };
}

export async function updateNotifications(data: {
  notifEventInvites: boolean;
  notifNewsletter: boolean;
  notifDonationReceipts: boolean;
  notifMemberUpdates: boolean;
  notifScholarshipNews: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = notifSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
  });

  return { success: true };
}
