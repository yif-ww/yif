// The in-app inbox and phone registration, against a real (throwaway) database.
//
//   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:51314/template1 \
//     node --import tsx --test tests/integration/notifications.test.mts

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Set TEST_DATABASE_URL to a throwaway local database.");
const host = new URL(url.replace(/^postgres(ql)?:/, "http:")).hostname;
if (host !== "localhost" && host !== "127.0.0.1") {
  throw new Error(`Refusing to run integration tests against ${host}.`);
}
process.env.DATABASE_URL = url;
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-123";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "re_test_dummy";

const { prisma } = await import("../../lib/prisma");
const inbox = await import("../../lib/mobile-api/notifications");

const stamp = Date.now().toString(36);
let counter = 0;
const uid = (p: string) => `${p}_${stamp}_${counter++}`;

async function makeUser() {
  const id = uid("user");
  return prisma.user.create({
    data: { id, name: "Member", email: `${id}@example.com`, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
  });
}

describe("notifications inbox", () => {
  let a: { id: string };
  let b: { id: string };

  before(async () => {
    a = await makeUser();
    b = await makeUser();
    for (let i = 0; i < 5; i++) {
      await prisma.notification.create({
        data: {
          userId: a.id,
          kind: "ticket",
          title: `Ticket ${i}`,
          body: "Your ticket is ready.",
          link: `/tickets/${i}`,
          createdAt: new Date(Date.now() - (5 - i) * 60_000),
        },
      });
    }
    await prisma.notification.create({ data: { userId: b.id, kind: "renewal", title: "B only", body: "x" } });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  it("lists newest first, in pages, with the unread total", async () => {
    const first = await inbox.listNotifications(a.id, { limit: 3 });
    assert.deepEqual(first.items.map((n) => n.title), ["Ticket 4", "Ticket 3", "Ticket 2"]);
    assert.equal(first.unreadCount, 5);
    assert.ok(first.nextCursor);
    assert.equal(first.items[0].read, false);
    assert.equal(first.items[0].link, "/tickets/4");

    const second = await inbox.listNotifications(a.id, { limit: 3, cursor: first.nextCursor! });
    assert.deepEqual(second.items.map((n) => n.title), ["Ticket 1", "Ticket 0"]);
    assert.equal(second.nextCursor, null);
  });

  it("never shows another member's notifications", async () => {
    const mine = await inbox.listNotifications(b.id, { limit: 20 });
    assert.deepEqual(mine.items.map((n) => n.title), ["B only"]);
  });

  it("marks chosen notifications as read, and ignores IDs that are not the member's", async () => {
    const page = await inbox.listNotifications(a.id, { limit: 2 });
    const bOwn = (await inbox.listNotifications(b.id, { limit: 1 })).items[0];
    await inbox.markRead(a.id, { ids: [page.items[0].id, bOwn.id] });

    const after = await inbox.listNotifications(a.id, { limit: 20 });
    assert.equal(after.unreadCount, 4);
    assert.equal(after.items.find((n) => n.id === page.items[0].id)!.read, true);
    assert.equal((await inbox.listNotifications(b.id, { limit: 20 })).unreadCount, 1, "B's is untouched");
  });

  it("marks everything as read", async () => {
    await inbox.markRead(a.id, { all: true });
    assert.equal((await inbox.listNotifications(a.id, { limit: 20 })).unreadCount, 0);
    assert.equal((await inbox.listNotifications(b.id, { limit: 20 })).unreadCount, 1);
  });

  it("refuses an empty or malformed read request", () => {
    for (const body of [{}, { ids: [] }, { all: false }, { ids: [1, 2] }]) {
      assert.equal(inbox.markReadSchema.safeParse(body).success, false, JSON.stringify(body));
    }
  });
});

describe("phone registration", () => {
  it("registers a phone, updates it, and moves it to whoever signs in next", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const token = uid("fcm-token-with-enough-length");

    await inbox.registerDevice(a.id, { token, platform: "android", appVersion: "1.0.0" });
    await inbox.registerDevice(a.id, { token, platform: "android", appVersion: "1.0.1" });
    let rows = await prisma.deviceToken.findMany({ where: { token } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].appVersion, "1.0.1");
    assert.equal(rows[0].userId, a.id);

    // The same phone, now signed in as someone else: pushes for A must stop reaching it.
    await inbox.registerDevice(b.id, { token, platform: "android" });
    rows = await prisma.deviceToken.findMany({ where: { token } });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].userId, b.id);
  });

  it("only removes the member's own token", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const token = uid("fcm-token-with-enough-length");
    await inbox.registerDevice(a.id, { token, platform: "ios" });

    await inbox.unregisterDevice(b.id, { token });
    assert.equal(await prisma.deviceToken.count({ where: { token } }), 1);

    await inbox.unregisterDevice(a.id, { token });
    assert.equal(await prisma.deviceToken.count({ where: { token } }), 0);
  });

  it("refuses a short token or an unknown platform", () => {
    assert.equal(inbox.deviceSchema.safeParse({ token: "short", platform: "android" }).success, false);
    assert.equal(inbox.deviceSchema.safeParse({ token: "x".repeat(40), platform: "windows" }).success, false);
  });
});
