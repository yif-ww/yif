// lib/mobile-api/account-deletion.ts — a member deleting their own account.
//
// App stores require this to be possible from inside the app. The account is
// anonymised rather than removed, so payment records stay for accounting but
// no longer point at a person:
//   - name, email, phone, address, bio and photo are wiped
//   - sign-ins, phones registered for push and the inbox are deleted
//   - scholarship applications (full of personal detail) are deleted
//   - payment records keep their amounts and references, without name or email
// The account is then locked so it can never sign in again.

import { verifyPassword } from "better-auth/crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError } from "./http";

export const deleteAccountSchema = z.object({ password: z.string().min(1).max(256) });

export async function deleteAccount(
  userId: string,
  input: z.infer<typeof deleteAccountSchema>,
  now = new Date(),
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { accounts: { where: { providerId: "credential" } } },
  });

  if (user.role === "admin") {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Administrator accounts must be removed by another administrator.",
    );
  }
  const hash = user.accounts[0]?.password;
  if (!hash) {
    throw new ApiError(403, "FORBIDDEN", "This account has no password. Please contact us to delete it.");
  }
  const passwordOk = await verifyPassword({ hash, password: input.password });
  if (!passwordOk) {
    throw new ApiError(403, "INVALID_PASSWORD", "That password is not correct.");
  }

  // Paid tickets are not cancelled silently: the member should sort out any
  // refund with YIF first.
  const upcoming = await prisma.ticket.count({
    where: {
      userId,
      status: "CONFIRMED",
      event: { date: { gte: new Date(now.getTime() - 24 * 3600_000) } },
    },
  });
  if (upcoming > 0) {
    throw new ApiError(
      409,
      "UPCOMING_TICKETS",
      "You have tickets for upcoming events. Please contact us to cancel them first, then delete your account.",
    );
  }

  const memberId = (await prisma.member.findUnique({ where: { userId }, select: { id: true } }))?.id;
  const gone = `deleted-${user.id}@deleted.invalid`;
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.deviceToken.deleteMany({ where: { userId } }),
    prisma.notification.deleteMany({ where: { userId } }),
    prisma.eventOrganizer.deleteMany({ where: { userId } }),
    prisma.scholarshipApplication.deleteMany({ where: { userId } }),
    prisma.ticket.updateMany({ where: { userId }, data: { holderName: null, holderEmail: null } }),
    prisma.transaction.updateMany({
      where: { OR: [{ userId }, ...(memberId ? [{ memberId }] : [])] },
      data: { customerEmail: gone, customerName: null, customerPhone: null },
    }),
    prisma.member.updateMany({
      where: { userId },
      data: { status: "EXPIRED", expiresAt: now, pendingTierId: null },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        name: "Deleted member",
        email: gone,
        emailVerified: false,
        image: null,
        phone: null,
        gender: null,
        continent: null,
        country: null,
        stateProvince: null,
        cityDistrict: null,
        bio: null,
        banned: true,
        banReason: "Account deleted by the member",
        notifEventInvites: false,
        notifNewsletter: false,
        notifDonationReceipts: false,
        notifMemberUpdates: false,
        notifScholarshipNews: false,
        updatedAt: now,
      },
    }),
  ]);
}
