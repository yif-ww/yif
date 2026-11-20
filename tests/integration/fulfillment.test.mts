// Payment fulfilment tests against a real (throwaway) Postgres database.
//
//   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:51314/template1 \
//     node --import tsx --test tests/integration/fulfillment.test.mts
//
// The database must already have the migrations applied. These tests refuse to
// run against anything but localhost, because they insert and change rows.

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Set TEST_DATABASE_URL to a throwaway local database.");
const host = new URL(url.replace(/^postgres(ql)?:/, "http:")).hostname;
if (host !== "localhost" && host !== "127.0.0.1") {
  throw new Error(`Refusing to run integration tests against ${host}.`);
}
process.env.DATABASE_URL = url;

const { prisma } = await import("../../lib/prisma");
const fulfil = await import("../../lib/fulfillment");
const ticketing = await import("../../lib/ticketing");
type Summary = import("../../lib/fulfillment").FulfilmentSummary;
type VerifyData = import("../../lib/paystack").TransactionVerifyData;

const NOW = new Date("2026-11-18T09:00:00.000Z");
const minutes = (m: number) => new Date(NOW.getTime() + m * 60_000);

let counter = 0;
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${counter++}`;
// Membership numbers must be unique, and these tests can be run again on the same database.
const existingNumber = () => `YIF-2025-T${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function recorder() {
  const sent: Summary[] = [];
  return { sent, deliver: async (s: Summary) => void sent.push(s) };
}

async function makeUser(name = "Test User") {
  const id = uid("user");
  return prisma.user.create({
    data: {
      id,
      name,
      email: `${id}@example.com`,
      emailVerified: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });
}

async function makeTier(name = "Gold") {
  return prisma.membershipTier.create({ data: { slug: uid("tier"), name } });
}

async function makeMember(
  tierId: string,
  extra: { expiresAt?: Date | null; status?: "ACTIVE" | "EXPIRED" | "PENDING"; membershipNumber?: string } = {},
) {
  const user = await makeUser();
  const member = await prisma.member.create({
    data: {
      userId: user.id,
      tierId,
      status: extra.status ?? "PENDING",
      expiresAt: extra.expiresAt ?? null,
      membershipNumber: extra.membershipNumber ?? null,
    },
  });
  return { user, member };
}

async function makeEvent(capacity: number) {
  const event = await prisma.event.create({
    data: {
      title: "Test Event",
      slug: uid("event"),
      date: minutes(60 * 24 * 30),
      time: "5:00 PM",
      location: "Lagos",
      address: "1 Test Street",
      isPublished: true,
    },
  });
  const tier = await prisma.eventTicketTier.create({
    data: { eventId: event.id, name: "General", price: 25000, capacity },
  });
  return { event, tier };
}

async function makeTransaction(input: {
  purpose: "MEMBERSHIP" | "TICKET" | "DONATION";
  email: string;
  amount?: number;
  memberId?: string;
  userId?: string;
  metadata?: Record<string, string | number>;
  status?: "SUCCESS" | "PENDING";
}) {
  return prisma.transaction.create({
    data: {
      reference: uid("ref"),
      purpose: input.purpose,
      status: input.status ?? "SUCCESS",
      amount: input.amount ?? 10000,
      customerEmail: input.email,
      customerName: "Test Buyer",
      memberId: input.memberId,
      userId: input.userId,
      metadata: input.metadata,
      paidAt: NOW,
    },
  });
}

describe("payment fulfilment", () => {
  before(async () => {
    // Continue after the highest number already issued, as the migration does,
    // so these tests can be run again on a database that still holds earlier rows.
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        'membership_number_seq',
        COALESCE((SELECT MAX(CAST(SPLIT_PART("membershipNumber", '-', 3) AS INTEGER))
                  FROM "member" WHERE "membershipNumber" ~ '^YIF-[0-9]{4}-[0-9]+$'), 0) + 1,
        false)`);
  });
  after(async () => {
    await prisma.$disconnect();
  });

  describe("memberships", () => {
    it("activates a new member with a sequence number, one year, and one email", async () => {
      const tier = await makeTier("Gold");
      const { user, member } = await makeMember(tier.id);
      const tx = await makeTransaction({
        purpose: "MEMBERSHIP",
        email: user.email,
        memberId: member.id,
        metadata: { paymentType: "membership", tierId: tier.id },
      });
      const mail = recorder();

      const summary = await fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, ...mail });

      assert.equal(summary?.firstTime, true);
      assert.equal(summary?.detail.kind, "membership");
      const after = await prisma.member.findUniqueOrThrow({ where: { id: member.id } });
      assert.equal(after.status, "ACTIVE");
      assert.match(after.membershipNumber ?? "", /^YIF-2026-\d{4}$/);
      assert.equal(after.expiresAt?.toISOString(), "2027-11-18T09:00:00.000Z");
      assert.equal(mail.sent.length, 1);

      const inbox = await prisma.notification.findMany({ where: { userId: user.id } });
      assert.equal(inbox.length, 1);
      assert.equal(inbox[0].link, "/card");
    });

    it("is idempotent when called many times at once (fixes G1 double-fulfilment)", async () => {
      const tier = await makeTier();
      const { user, member } = await makeMember(tier.id);
      const tx = await makeTransaction({
        purpose: "MEMBERSHIP",
        email: user.email,
        memberId: member.id,
        metadata: { paymentType: "membership", tierId: tier.id },
      });
      const mail = recorder();

      const results = await Promise.all(
        Array.from({ length: 6 }, () =>
          fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, ...mail }),
        ),
      );

      assert.equal(results.filter((r) => r?.firstTime).length, 1);
      assert.equal(mail.sent.length, 1, "exactly one email");
      // Everyone, including the late callers, sees the same membership number.
      const numbers = new Set(
        results.map((r) => (r?.detail.kind === "membership" ? r.detail.membershipNumber : null)),
      );
      assert.equal(numbers.size, 1);
      assert.ok([...numbers][0]);

      // A later reload changes nothing.
      const before = await prisma.member.findUniqueOrThrow({ where: { id: member.id } });
      await fulfil.fulfilTransaction(tx.reference, {}, { now: minutes(600), ...mail });
      const after = await prisma.member.findUniqueOrThrow({ where: { id: member.id } });
      assert.equal(after.expiresAt?.toISOString(), before.expiresAt?.toISOString());
      assert.equal(after.membershipNumber, before.membershipNumber);
      assert.equal(mail.sent.length, 1);
    });

    it("gives every member a different number, even after others expire (fixes G2)", async () => {
      const tier = await makeTier();
      const numbers: string[] = [];
      for (let i = 0; i < 5; i++) {
        const { user, member } = await makeMember(tier.id);
        const tx = await makeTransaction({
          purpose: "MEMBERSHIP",
          email: user.email,
          memberId: member.id,
          metadata: { paymentType: "membership", tierId: tier.id },
        });
        await fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, deliver: async () => {} });
        // Expire the member straight away. The old count-based numbering would
        // now hand the next member the same number.
        await prisma.member.update({ where: { id: member.id }, data: { status: "EXPIRED" } });
        numbers.push(
          (await prisma.member.findUniqueOrThrow({ where: { id: member.id } })).membershipNumber!,
        );
      }
      assert.equal(new Set(numbers).size, 5);
    });

    it("keeps an existing member's number when they renew", async () => {
      const tier = await makeTier();
      const number = existingNumber();
      const { user, member } = await makeMember(tier.id, {
        status: "ACTIVE",
        expiresAt: new Date("2026-12-09T09:00:00.000Z"),
        membershipNumber: number,
      });
      const tx = await makeTransaction({
        purpose: "MEMBERSHIP",
        email: user.email,
        memberId: member.id,
        metadata: { paymentType: "membership_renewal", tierId: tier.id, toTierId: tier.id },
      });
      await fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, deliver: async () => {} });
      const after = await prisma.member.findUniqueOrThrow({ where: { id: member.id } });
      assert.equal(after.membershipNumber, number);
    });

    it("renewing early keeps the remaining days (fixes G3)", async () => {
      const tier = await makeTier();
      const { user, member } = await makeMember(tier.id, {
        status: "ACTIVE",
        expiresAt: new Date("2026-12-09T09:00:00.000Z"),
        membershipNumber: existingNumber(),
      });
      const tx = await makeTransaction({
        purpose: "MEMBERSHIP",
        email: user.email,
        memberId: member.id,
        metadata: { paymentType: "membership_renewal", tierId: tier.id, toTierId: tier.id },
      });
      const mail = recorder();
      await fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, ...mail });
      const after = await prisma.member.findUniqueOrThrow({ where: { id: member.id } });
      assert.equal(after.expiresAt?.toISOString(), "2027-12-09T09:00:00.000Z");
      const detail = mail.sent[0].detail;
      assert.equal(detail.kind === "membership" && detail.paymentType, "membership_renewal");
    });

    it("an upgrade moves the tier and clears a scheduled downgrade", async () => {
      const gold = await makeTier("Gold");
      const platinum = await makeTier("Platinum");
      const { user, member } = await makeMember(gold.id, {
        status: "ACTIVE",
        expiresAt: new Date("2027-06-01T00:00:00.000Z"),
        membershipNumber: existingNumber(),
      });
      await prisma.member.update({ where: { id: member.id }, data: { pendingTierId: gold.id } });
      const tx = await makeTransaction({
        purpose: "MEMBERSHIP",
        email: user.email,
        memberId: member.id,
        metadata: { paymentType: "membership_upgrade", tierId: platinum.id, toTierId: platinum.id },
      });
      await fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, deliver: async () => {} });
      const after = await prisma.member.findUniqueOrThrow({ where: { id: member.id } });
      assert.equal(after.tierId, platinum.id);
      assert.equal(after.pendingTierId, null);
    });

    it("rolls back and can be retried when the details are incomplete", async () => {
      const user = await makeUser();
      const tx = await makeTransaction({
        purpose: "MEMBERSHIP",
        email: user.email,
        metadata: { paymentType: "membership" },
      });
      await assert.rejects(
        fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, deliver: async () => {} }),
        fulfil.FulfilmentError,
      );
      const row = await prisma.transaction.findUniqueOrThrow({ where: { reference: tx.reference } });
      assert.equal(row.fulfilledAt, null, "a failed attempt must not mark the payment fulfilled");
    });

    it("does nothing for a payment that has not succeeded", async () => {
      const tier = await makeTier();
      const { user, member } = await makeMember(tier.id);
      const tx = await makeTransaction({
        purpose: "MEMBERSHIP",
        email: user.email,
        memberId: member.id,
        status: "PENDING",
        metadata: { paymentType: "membership", tierId: tier.id },
      });
      const result = await fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, deliver: async () => {} });
      assert.equal(result, null);
      const after = await prisma.member.findUniqueOrThrow({ where: { id: member.id } });
      assert.equal(after.status, "PENDING");
    });

    it("reads Paystack's custom fields when our own record lacks them", async () => {
      const gold = await makeTier("Gold");
      const { user, member } = await makeMember(gold.id, {
        status: "ACTIVE",
        expiresAt: new Date("2026-12-09T09:00:00.000Z"),
        membershipNumber: existingNumber(),
      });
      const reference = uid("psk");
      const data: VerifyData = {
        id: 4099260516,
        status: "success",
        reference,
        amount: 1_000_000,
        currency: "NGN",
        channel: "card",
        paid_at: NOW.toISOString(),
        fees: 15_000,
        metadata: {
          custom_fields: [
            { display_name: "Payment Type", variable_name: "payment_type", value: "membership_renewal" },
            { display_name: "Member ID", variable_name: "member_id", value: member.id },
            { display_name: "To Tier ID", variable_name: "to_tier_id", value: gold.id },
          ],
        },
        customer: { id: 1, email: user.email, customer_code: "CUS_test" },
      };
      const mail = recorder();

      const outcome = await fulfil.fulfillPaystackPayment(data, { now: NOW, ...mail });

      assert.equal(outcome.status, "success");
      const after = await prisma.member.findUniqueOrThrow({ where: { id: member.id } });
      assert.equal(after.expiresAt?.toISOString(), "2027-12-09T09:00:00.000Z");
      const row = await prisma.transaction.findUniqueOrThrow({ where: { reference } });
      assert.equal(row.status, "SUCCESS");
      assert.equal(row.purpose, "MEMBERSHIP");
      assert.equal(Number(row.amount), 10000);
      assert.equal(Number(row.fees), 150);
      assert.equal(mail.sent.length, 1);

      // The webhook and the return page both call this. The second changes nothing.
      await fulfil.fulfillPaystackPayment(data, { now: minutes(5), ...mail });
      assert.equal(mail.sent.length, 1);
    });
  });

  describe("tickets", () => {
    it("holds seats, then confirms the ticket once paid", async () => {
      const { event, tier } = await makeEvent(10);
      const user = await makeUser();
      const hold = await ticketing.reserveSeats({
        eventId: event.id,
        tierId: tier.id,
        tierName: tier.name,
        quantity: 2,
        holderName: "Test Buyer",
        holderEmail: user.email,
        now: NOW,
      });
      assert.match(hold.reference, /^YIF-TK-[2-9A-HJKMNP-Z]{6}$/);
      const pending = await prisma.ticket.findUniqueOrThrow({ where: { reference: hold.reference } });
      assert.equal(pending.status, "PENDING");

      const tx = await makeTransaction({
        purpose: "TICKET",
        email: user.email,
        amount: 50000,
        metadata: { eventId: event.id, tierId: tier.id, quantity: 2, ticketRef: hold.reference },
      });
      const mail = recorder();
      const summary = await fulfil.fulfilTransaction(tx.reference, {}, { now: minutes(2), ...mail });

      const ticket = await prisma.ticket.findUniqueOrThrow({ where: { reference: hold.reference } });
      assert.equal(ticket.status, "CONFIRMED");
      assert.equal(ticket.holdExpiresAt, null);
      assert.equal(ticket.userId, user.id, "linked to the account with the same email");
      assert.equal(Number(ticket.amountPaid), 50000);
      assert.equal((await prisma.eventTicketTier.findUniqueOrThrow({ where: { id: tier.id } })).sold, 2);
      assert.equal(
        (await prisma.transaction.findUniqueOrThrow({ where: { id: tx.id } })).ticketId,
        ticket.id,
      );
      assert.equal(summary?.detail.kind === "ticket" && summary.detail.oversold, false);
      assert.equal(mail.sent.length, 1);
      const inbox = await prisma.notification.findMany({ where: { userId: user.id } });
      assert.equal(inbox[0]?.link, `/tickets/${ticket.id}`);

      // Repeating the payment event does not count the seats twice (fixes G5 drift).
      await fulfil.fulfilTransaction(tx.reference, {}, { now: minutes(3), ...mail });
      assert.equal((await prisma.eventTicketTier.findUniqueOrThrow({ where: { id: tier.id } })).sold, 2);
      assert.equal(mail.sent.length, 1);
    });

    it("never sells the last seats twice when buyers arrive together (fixes G5)", async () => {
      const { event, tier } = await makeEvent(5);
      const attempt = () =>
        ticketing.reserveSeats({
          eventId: event.id,
          tierId: tier.id,
          tierName: tier.name,
          quantity: 3,
          holderName: "Buyer",
          holderEmail: "buyer@example.com",
          now: NOW,
        });
      const results = await Promise.allSettled([attempt(), attempt(), attempt()]);
      assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
      const rejected = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      assert.equal(rejected.length, 2);
      for (const r of rejected) {
        assert.ok(r.reason instanceof ticketing.SoldOutError);
        assert.equal(r.reason.available, 2);
      }
    });

    it("frees seats when a checkout hold expires", async () => {
      const { event, tier } = await makeEvent(3);
      const reserve = (now: Date, quantity: number) =>
        ticketing.reserveSeats({
          eventId: event.id,
          tierId: tier.id,
          tierName: tier.name,
          quantity,
          holderName: "Buyer",
          holderEmail: "buyer@example.com",
          now,
        });
      await reserve(NOW, 3);
      await assert.rejects(reserve(minutes(10), 1), ticketing.SoldOutError);
      const later = await reserve(minutes(16), 1);
      assert.ok(later.reference);
    });

    it("gives seats back when a payment fails", async () => {
      const { event, tier } = await makeEvent(3);
      const user = await makeUser();
      const hold = await ticketing.reserveSeats({
        eventId: event.id,
        tierId: tier.id,
        tierName: tier.name,
        quantity: 3,
        holderName: "Buyer",
        holderEmail: user.email,
        now: new Date(),
      });
      await makeTransaction({
        purpose: "TICKET",
        email: user.email,
        status: "PENDING",
        metadata: { ticketRef: hold.reference },
      }).then(async (tx) => {
        await prisma.transaction.update({ where: { id: tx.id }, data: { reference: hold.reference } });
      });
      const data: VerifyData = {
        id: 1,
        status: "failed",
        reference: hold.reference,
        amount: 7_500_000,
        currency: "NGN",
        channel: "card",
        paid_at: null,
        metadata: { ticketRef: hold.reference },
        customer: { id: 1, email: user.email, customer_code: "CUS_x" },
      };
      await fulfil.fulfillPaystackPayment(data, { deliver: async () => {} });
      const ticket = await prisma.ticket.findUniqueOrThrow({ where: { reference: hold.reference } });
      assert.equal(ticket.status, "CANCELLED");
      // The seats can be bought again straight away.
      await ticketing.reserveSeats({
        eventId: event.id,
        tierId: tier.id,
        tierName: tier.name,
        quantity: 3,
        holderName: "Buyer",
        holderEmail: "other@example.com",
      });
    });

    it("honours a late payment after the hold ended, and flags it for review", async () => {
      const { event, tier } = await makeEvent(2);
      const slow = await makeUser();
      const quick = await makeUser();
      const reserve = (email: string, now: Date) =>
        ticketing.reserveSeats({
          eventId: event.id,
          tierId: tier.id,
          tierName: tier.name,
          quantity: 2,
          holderName: "Buyer",
          holderEmail: email,
          now,
        });

      const slowHold = await reserve(slow.email, NOW); // hold ends at +15 min
      const quickHold = await reserve(quick.email, minutes(16)); // takes the seats
      const meta = (ref: string) => ({ eventId: event.id, tierId: tier.id, quantity: 2, ticketRef: ref });
      const quickTx = await makeTransaction({ purpose: "TICKET", email: quick.email, metadata: meta(quickHold.reference) });
      const slowTx = await makeTransaction({ purpose: "TICKET", email: slow.email, metadata: meta(slowHold.reference) });

      const quickResult = await fulfil.fulfilTransaction(quickTx.reference, {}, { now: minutes(17), deliver: async () => {} });
      const slowResult = await fulfil.fulfilTransaction(slowTx.reference, {}, { now: minutes(20), deliver: async () => {} });

      assert.equal(quickResult?.detail.kind === "ticket" && quickResult.detail.oversold, false);
      assert.equal(slowResult?.detail.kind === "ticket" && slowResult.detail.oversold, true);
      const slowTicket = await prisma.ticket.findUniqueOrThrow({ where: { reference: slowHold.reference } });
      assert.equal(slowTicket.status, "CONFIRMED", "a paid ticket is never dropped");
      const row = await prisma.transaction.findUniqueOrThrow({ where: { id: slowTx.id } });
      assert.match(row.notes ?? "", /OVERSOLD/);
    });

    it("creates the ticket for a payment that began before holds existed", async () => {
      const { event, tier } = await makeEvent(10);
      const user = await makeUser();
      const tx = await makeTransaction({
        purpose: "TICKET",
        email: user.email,
        metadata: { eventId: event.id, tierId: tier.id, tierName: tier.name, quantity: 3 },
      });
      const summary = await fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, deliver: async () => {} });
      assert.equal(summary?.detail.kind, "ticket");
      const ticket = await prisma.ticket.findFirstOrThrow({ where: { eventId: event.id } });
      assert.equal(ticket.status, "CONFIRMED");
      assert.equal(ticket.quantity, 3);
      assert.equal((await prisma.eventTicketTier.findUniqueOrThrow({ where: { id: tier.id } })).sold, 3);
    });

    it("rejects a quantity outside the allowed range", async () => {
      const { event, tier } = await makeEvent(10);
      for (const quantity of [0, -1, 1.5, 11]) {
        await assert.rejects(
          ticketing.reserveSeats({
            eventId: event.id,
            tierId: tier.id,
            tierName: tier.name,
            quantity,
            holderName: "Buyer",
            holderEmail: "buyer@example.com",
          }),
          ticketing.InvalidQuantityError,
          String(quantity),
        );
      }
    });
  });

  describe("other payments", () => {
    it("sends a donation thank-you once", async () => {
      const user = await makeUser();
      const tx = await makeTransaction({
        purpose: "DONATION",
        email: user.email,
        metadata: { cause: "Scholarship Fund", frequency: "one-time" },
      });
      const mail = recorder();
      await fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, ...mail });
      await fulfil.fulfilTransaction(tx.reference, {}, { now: NOW, ...mail });
      assert.equal(mail.sent.length, 1);
      const detail = mail.sent[0].detail;
      assert.equal(detail.kind === "donation" && detail.cause, "Scholarship Fund");
    });
  });
});
