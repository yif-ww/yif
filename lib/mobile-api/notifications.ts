// lib/mobile-api/notifications.ts — the in-app inbox and phone registration.
//
// The server already writes inbox rows when a payment is confirmed
// (lib/fulfillment.ts). The app reads them here. Registering a phone's push
// token is stored too, so that sending push messages later needs no app change.

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  decodeCursor,
  keysetAfter,
  pageQuerySchema,
  toPage,
  type Page,
} from "./pagination";

type Row = Awaited<ReturnType<typeof prisma.notification.findFirstOrThrow>>;

function serialize(row: Row) {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    link: row.link,
    read: row.readAt !== null,
    createdAt: row.createdAt,
  };
}

export async function listNotifications(
  userId: string,
  query: z.infer<typeof pageQuerySchema>,
): Promise<Page<ReturnType<typeof serialize>> & { unreadCount: number }> {
  const cursor = decodeCursor(query.cursor);
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { AND: [{ userId }, keysetAfter("createdAt", cursor, "desc")] },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    ...toPage(rows, query.limit, (r) => ({ at: r.createdAt, id: r.id }), serialize),
    unreadCount,
  };
}

export const markReadSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.string().min(1).max(64)).min(1).max(200) }),
]);

/** Marks some or all of the member's own notifications as read. Others' IDs are ignored. */
export async function markRead(userId: string, input: z.infer<typeof markReadSchema>): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null, ...("all" in input ? {} : { id: { in: input.ids } }) },
    data: { readAt: new Date() },
  });
}

export const deviceSchema = z.object({
  token: z.string().min(10).max(4096),
  platform: z.enum(["ios", "android"]),
  appVersion: z.string().max(40).optional(),
});

/** Saves this phone's push token for the signed-in member. A token belongs to one member at a time. */
export async function registerDevice(userId: string, input: z.infer<typeof deviceSchema>): Promise<void> {
  await prisma.deviceToken.upsert({
    where: { token: input.token },
    // Someone else signed in on this phone before: the token moves to the new member.
    update: { userId, platform: input.platform, appVersion: input.appVersion ?? null, lastSeenAt: new Date() },
    create: { userId, token: input.token, platform: input.platform, appVersion: input.appVersion ?? null },
  });
}

export const deviceRemoveSchema = z.object({ token: z.string().min(10).max(4096) });

export async function unregisterDevice(userId: string, input: z.infer<typeof deviceRemoveSchema>): Promise<void> {
  await prisma.deviceToken.deleteMany({ where: { userId, token: input.token } });
}
