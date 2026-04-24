"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const scholarshipSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(200),
  phone: z.string().min(1).max(30),
  dateOfBirth: z.string().min(1).max(20),
  stateOfOrigin: z.string().min(1).max(50),
  lga: z.string().min(1).max(100),
  address: z.string().min(1).max(300),
  school: z.string().min(1).max(200),
  degree: z.string().min(1).max(50),
  field: z.string().min(1).max(100),
  year: z.string().min(1).max(30),
  gpa: z.string().max(10),
  sponsorName: z.string().max(100),
  sponsorRelation: z.string().max(50),
  essay1: z.string().min(10, "Essay 1 is required").max(5000),
  essay2: z.string().min(10, "Essay 2 is required").max(5000),
});

export async function submitScholarship(
  data: z.infer<typeof scholarshipSchema>,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Not authenticated" };

  const parsed = scholarshipSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid form data";
    return { success: false, error: first };
  }

  const cycle = String(new Date().getFullYear());

  try {
    await prisma.scholarshipApplication.upsert({
      where: {
        // use userId + cycle as natural key
        userId_cycle: {
          userId: session.user.id,
          cycle,
        },
      },
      update: {
        formData: parsed.data,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        cycle,
        formData: parsed.data,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Failed to submit application. Please try again.",
    };
  }
}
