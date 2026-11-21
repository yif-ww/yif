// Door check-in, against a real (throwaway) database.
//
//   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:51314/template1 \
//     node --import tsx --test tests/integration/organizer.test.mts

import assert from "node:assert/strict";
import { randomUUID, generateKeyPairSync } from "node:crypto";
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
process.env.QR_SIGNING_PRIVATE_KEY = generateKeyPairSync("ed25519")
  .privateKey.export({ type: "pkcs8", format: "pem" })
  .toString();
process.env.QR_SIGNING_KEY_ID = "door-test-key";

const { prisma } = await import("../../lib/prisma");
const organizer = await import("../../lib/mobile-api/organizer");

const stamp = Date.now().toString(36);
let counter = 0;
const uid = (p: string) => `${p}_${stamp}_${counter++}`;
const days = (n: number) => new Date(Date.now() + n * 24 * 3600_000);

async function makeUser(role = "user") {
  const id = uid("user");
  return prisma.user.create({
    data: {
      id,
      name: `Guest ${id}`,
      email: `${id}@example.com`,
      emailVerified: true,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

describe("door check-in", () => {
  let event: { id: string };
  let otherEvent: { id: string };
  let tierId: string;
  let door: { id: string }; // assigned to `event`
  let stranger: { id: string }; // assigned to nothing
  let admin: { id: string };
  let family: { id: string }; // a ticket for 4
  let solo: { id: string }; // a ticket for 1
  let unpaid: { id: string };
  let elsewhere: { id: string };

  const newTicket = (eventId: string, quantity: number, status: "CONFIRMED" | "PENDING", name = "Guest") =>
    prisma.ticket.create({
      data: {
        eventId,
        tierId: null,
        tierName: "GA",
        quantity,
        status,
        reference: uid("TK").slice(0, 20),
        holderName: name,
      },
    });

  before(async () => {
    event = await prisma.event.create({
      data: { title: "Door Night", slug: uid("door"), date: days(1), isPublished: true },
    });
    otherEvent = await prisma.event.create({
      data: { title: "Other Night", slug: uid("other"), date: days(1), isPublished: true },
    });
    const tier = await prisma.eventTicketTier.create({
      data: { eventId: event.id, name: "GA", price: 1000, capacity: 50 },
    });
    tierId = tier.id;
    await prisma.eventTicketTier.create({
      data: { eventId: otherEvent.id, name: "GA", price: 1000, capacity: 50 },
    });
    door = await makeUser();
    stranger = await makeUser();
    admin = await makeUser("admin");
    await prisma.eventOrganizer.create({ data: { eventId: event.id, userId: door.id } });

    family = await newTicket(event.id, 4, "CONFIRMED", "The Adeyemi Family");
    solo = await newTicket(event.id, 1, "CONFIRMED", "Folake");
    unpaid = await newTicket(event.id, 2, "PENDING", "Never Paid");
    elsewhere = await newTicket(otherEvent.id, 1, "CONFIRMED", "Elsewhere");
  });

  after(async () => {
    await prisma.$disconnect();
  });

  const scan = (ticketId: string, count: number, extra: Record<string, unknown> = {}) => ({
    id: randomUUID(),
    ticketId,
    count,
    at: new Date(),
    gate: "Gate A",
    deviceId: "phone-1",
    ...extra,
  });

  it("lists only the events a person runs, and everything for administrators", async () => {
    assert.deepEqual(
      (await organizer.listOrganizerEvents(door.id)).items.map((e) => e.id),
      [event.id],
    );
    assert.deepEqual((await organizer.listOrganizerEvents(stranger.id)).items, []);
    const all = (await organizer.listOrganizerEvents(admin.id)).items.map((e) => e.id);
    assert.ok(all.includes(event.id) && all.includes(otherEvent.id));
  });

  it("gives the guest list: paid tickets only, with the public key to check codes offline", async () => {
    const manifest = await organizer.getManifest(door.id, event.id);
    const ids = manifest.entries.map((e) => e.ticketId);
    assert.ok(ids.includes(family.id) && ids.includes(solo.id));
    assert.ok(!ids.includes(unpaid.id), "an unpaid hold is not on the list");
    assert.ok(!ids.includes(elsewhere.id), "another event's ticket is not on the list");
    assert.equal(manifest.capacity, 50);
    assert.equal(manifest.keys[0].kid, "door-test-key");
    assert.equal(Buffer.from(manifest.keys[0].publicKey, "base64url").length, 32);
    const entry = manifest.entries.find((e) => e.ticketId === family.id)!;
    assert.equal(entry.holderName, "The Adeyemi Family");
    assert.equal(entry.quantity, 4);
    assert.equal(entry.checkedInCount, 0);
  });

  it("another person's event looks like it does not exist", async () => {
    await assert.rejects(
      () => organizer.getManifest(stranger.id, event.id),
      (e: { status?: number }) => e.status === 404,
    );
    await assert.rejects(
      () => organizer.getManifest(door.id, otherEvent.id),
      (e: { status?: number }) => e.status === 404,
    );
  });

  it("admits guests part of a party at a time, and keeps the ticket usable until everyone is in", async () => {
    const first = await organizer.submitCheckIns(door.id, { checkIns: [scan(family.id, 3)] });
    assert.equal(first.results[0].status, "ACCEPTED");
    let ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: family.id } });
    assert.equal(ticket.checkedInCount, 3);
    assert.equal(ticket.status, "CONFIRMED", "one guest still to come");

    await organizer.submitCheckIns(door.id, { checkIns: [scan(family.id, 1)] });
    ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: family.id } });
    assert.equal(ticket.checkedInCount, 4);
    assert.equal(ticket.status, "USED");

    const manifest = await organizer.getManifest(door.id, event.id);
    assert.equal(manifest.entries.find((e) => e.ticketId === family.id)!.checkedInCount, 4);
  });

  it("uploading the same check-in twice never admits anyone twice", async () => {
    const once = scan(solo.id, 1);
    const a = await organizer.submitCheckIns(door.id, { checkIns: [once] });
    const b = await organizer.submitCheckIns(door.id, { checkIns: [once] });
    assert.equal(a.results[0].status, "ACCEPTED");
    assert.equal(b.results[0].status, "DUPLICATE");
    assert.equal((await prisma.ticket.findUniqueOrThrow({ where: { id: solo.id } })).checkedInCount, 1);
    assert.equal(await prisma.checkIn.count({ where: { id: once.id } }), 1);
  });

  it("two phones admitting the same last guest: one is accepted, one is a recorded conflict", async () => {
    // The throwaway test database is a single-connection embedded Postgres, so two
    // truly simultaneous uploads cannot be tried here. In production the ticket row
    // is locked (SELECT ... FOR UPDATE), so overlapping uploads queue up and get the
    // same answers as these two in a row.
    const t = await newTicket(event.id, 1, "CONFIRMED", "Race");
    const x = await organizer.submitCheckIns(door.id, { checkIns: [scan(t.id, 1, { deviceId: "phone-1" })] });
    const y = await organizer.submitCheckIns(door.id, { checkIns: [scan(t.id, 1, { deviceId: "phone-2" })] });
    assert.deepEqual([x.results[0].status, y.results[0].status], ["ACCEPTED", "CONFLICT"]);
    const after = await prisma.ticket.findUniqueOrThrow({ where: { id: t.id } });
    assert.equal(after.checkedInCount, 1, "never more than the ticket allows");
    assert.equal(await prisma.checkIn.count({ where: { ticketId: t.id } }), 2, "both records are kept");
    assert.equal(await prisma.checkIn.count({ where: { ticketId: t.id, isConflict: true } }), 1);
  });

  it("rejects unpaid tickets, tickets for other events, and tickets that do not exist", async () => {
    const result = await organizer.submitCheckIns(door.id, {
      checkIns: [scan(unpaid.id, 1), scan(elsewhere.id, 1), scan("no-such-ticket", 1)],
    });
    assert.deepEqual(
      result.results.map((r) => r.status),
      ["REJECTED", "REJECTED", "REJECTED"],
    );
    assert.equal((await prisma.ticket.findUniqueOrThrow({ where: { id: elsewhere.id } })).checkedInCount, 0);
  });

  it("someone with no event assigned cannot admit anyone", async () => {
    const t = await newTicket(event.id, 2, "CONFIRMED");
    const result = await organizer.submitCheckIns(stranger.id, { checkIns: [scan(t.id, 1)] });
    assert.equal(result.results[0].status, "REJECTED");
    assert.equal((await prisma.ticket.findUniqueOrThrow({ where: { id: t.id } })).checkedInCount, 0);
  });

  it("an administrator can run any door", async () => {
    const t = await newTicket(otherEvent.id, 2, "CONFIRMED");
    const result = await organizer.submitCheckIns(admin.id, { checkIns: [scan(t.id, 2)] });
    assert.equal(result.results[0].status, "ACCEPTED");
  });

  it("answers in the order the phone sent, and reports the event's admitted total", async () => {
    const t = await newTicket(event.id, 3, "CONFIRMED");
    const early = scan(t.id, 1, { at: new Date(Date.now() - 60_000) });
    const late = scan(t.id, 2, { at: new Date() });
    const result = await organizer.submitCheckIns(door.id, { checkIns: [late, early] });
    assert.deepEqual(
      result.results.map((r) => r.id),
      [late.id, early.id],
    );
    assert.deepEqual(
      result.results.map((r) => r.status),
      ["ACCEPTED", "ACCEPTED"],
    );
    const total = await prisma.ticket.aggregate({
      where: { eventId: event.id, status: { in: ["CONFIRMED", "USED"] } },
      _sum: { checkedInCount: true },
    });
    assert.equal(result.admittedCount, total._sum.checkedInCount);
    assert.ok(tierId.length > 0);
  });

  it("refuses a malformed upload", () => {
    for (const body of [
      { checkIns: [] },
      { checkIns: [{ id: "not-a-uuid", ticketId: "x", count: 1, at: new Date().toISOString() }] },
      { checkIns: [{ id: randomUUID(), ticketId: "x", count: 0, at: new Date().toISOString() }] },
    ]) {
      assert.equal(organizer.checkInsSchema.safeParse(body).success, false);
    }
  });
});
