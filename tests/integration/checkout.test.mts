// Starting a membership payment from the app, against a real (throwaway)
// database. The payment providers are replaced by fakes, so nothing is charged.
//
//   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:51314/template1 \
//     node --import tsx --test tests/integration/checkout.test.mts

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
process.env.NEXT_PUBLIC_APP_URL = "https://www.yifww.org";
process.env.RESEND_API_KEY = "re_test_dummy";

const { prisma } = await import("../../lib/prisma");
const { auth } = await import("../../lib/auth");
const deletion = await import("../../lib/mobile-api/account-deletion");
const checkoutModule = await import("../../lib/mobile-api/checkout");
const { startMembershipCheckout } = checkoutModule;
const eventRoute = await import("../../app/api/mobile/v1/events/[slug]/checkout/route");
const route = await import("../../app/api/mobile/v1/membership/checkout/route");
type Deps = import("../../lib/mobile-api/checkout").CheckoutDeps;

const stamp = Date.now().toString(36);
let counter = 0;
const uid = (p: string) => `${p}_${stamp}_${counter++}`;
const days = (n: number) => new Date(Date.now() + n * 24 * 3600_000);

function fakeProviders() {
  const calls = { paystack: [] as Record<string, unknown>[], stripe: [] as Record<string, unknown>[] };
  const deps: Deps = {
    paystackInitialize: async (body) => {
      calls.paystack.push(body);
      // Paystack uses the reference we send, or makes one up when we send none.
      const reference = typeof body.reference === "string" ? body.reference : uid("PSREF");
      return { reference, access_code: "ac", authorization_url: `https://checkout.paystack.test/${reference}` };
    },
    stripeCreateSession: async (params) => {
      calls.stripe.push(params);
      const id = uid("cs_test");
      return { id, url: `https://checkout.stripe.test/${id}` };
    },
  };
  return { calls, deps };
}

async function makeUser() {
  const id = uid("user");
  return prisma.user.create({
    data: {
      id,
      name: "Folake Adeyemi",
      email: `${id}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

describe("starting a membership payment from the app", () => {
  let silver: { id: string };
  let gold: { id: string };
  let platinum: { id: string };
  let unpriced: { id: string };
  let inactive: { id: string };

  before(async () => {
    silver = await prisma.membershipTier.create({ data: { slug: uid("silver"), name: "Silver", sortOrder: 0 } });
    gold = await prisma.membershipTier.create({ data: { slug: uid("gold"), name: "Gold", sortOrder: 1 } });
    platinum = await prisma.membershipTier.create({ data: { slug: uid("platinum"), name: "Platinum", sortOrder: 2 } });
    unpriced = await prisma.membershipTier.create({ data: { slug: uid("nopriced"), name: "NoUSD", sortOrder: 3 } });
    inactive = await prisma.membershipTier.create({
      data: { slug: uid("old"), name: "Retired", sortOrder: 4, isActive: false },
    });
    for (const [tier, ngn, usd] of [
      [silver, 5000, 12],
      [gold, 10000, 25],
      [platinum, 20000, 45],
    ] as const) {
      await prisma.membershipPlanPrice.create({ data: { tierId: tier.id, currency: "NGN", amount: ngn } });
      await prisma.membershipPlanPrice.create({ data: { tierId: tier.id, currency: "USD", amount: usd } });
    }
    await prisma.membershipPlanPrice.create({ data: { tierId: unpriced.id, currency: "NGN", amount: 99000 } });
    await prisma.membershipPlanPrice.create({ data: { tierId: inactive.id, currency: "NGN", amount: 1000 } });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  async function memberOn(
    tierId: string,
    status: "ACTIVE" | "EXPIRED" | "PENDING" | "SUSPENDED" = "ACTIVE",
  ) {
    const user = await makeUser();
    const member = await prisma.member.create({
      data: { userId: user.id, tierId, status, expiresAt: status === "EXPIRED" ? days(-30) : days(20) },
    });
    return { user, member };
  }

  it("renewing in naira starts a Paystack payment priced by the server", async () => {
    const { user, member } = await memberOn(gold.id);
    const { calls, deps } = fakeProviders();

    const result = await startMembershipCheckout(user.id, { tierId: gold.id, currency: "NGN" }, deps);

    assert.equal(result.provider, "paystack");
    assert.match(result.checkoutUrl, /^https:\/\/checkout\.paystack\.test\//);
    assert.equal(calls.paystack.length, 1);
    assert.equal(calls.paystack[0].amount, 10000 * 100, "the price comes from the database, in kobo");
    assert.equal(calls.paystack[0].email, user.email);
    assert.equal(calls.paystack[0].callback_url, "https://www.yifww.org/payment/callback");

    // The payment is on record straight away, so the app can ask about it at once.
    const row = await prisma.transaction.findUniqueOrThrow({ where: { reference: result.reference } });
    assert.equal(row.status, "PENDING");
    assert.equal(row.purpose, "MEMBERSHIP");
    assert.equal(Number(row.amount), 10000);
    assert.equal(row.memberId, member.id);
    assert.equal(row.userId, user.id);
    assert.equal((row.metadata as Record<string, unknown>).paymentType, "membership_renewal");
  });

  it("the custom fields the webhook reads are all there", async () => {
    const { user, member } = await memberOn(gold.id);
    const { calls, deps } = fakeProviders();
    await startMembershipCheckout(user.id, { tierId: platinum.id, currency: "NGN" }, deps);

    const fields = Object.fromEntries(
      ((calls.paystack[0].metadata as { custom_fields: { variable_name: string; value: string }[] }).custom_fields).map(
        (f) => [f.variable_name, f.value],
      ),
    );
    assert.equal(fields.payment_type, "membership_upgrade");
    assert.equal(fields.member_id, member.id);
    assert.equal(fields.from_tier_id, gold.id);
    assert.equal(fields.to_tier_id, platinum.id);
    assert.equal(fields.membership_tier, "Platinum");
  });

  it("paying in dollars starts a Stripe checkout with the same rules", async () => {
    const { user, member } = await memberOn(silver.id);
    const { calls, deps } = fakeProviders();

    const result = await startMembershipCheckout(user.id, { tierId: gold.id, currency: "USD" }, deps);

    assert.equal(result.provider, "stripe");
    const params = calls.stripe[0] as {
      currency: string;
      line_items: { price_data: { unit_amount: number } }[];
      metadata: Record<string, string>;
      success_url: string;
    };
    assert.equal(params.currency, "usd");
    assert.equal(params.line_items[0].price_data.unit_amount, 25 * 100);
    assert.equal(params.metadata.paymentType, "membership_upgrade");
    assert.equal(params.metadata.memberId, member.id);
    assert.equal(params.metadata.toTierId, gold.id);
    assert.match(params.success_url, /\/payment\/stripe-callback\?session_id=\{CHECKOUT_SESSION_ID\}$/);

    const row = await prisma.transaction.findUniqueOrThrow({ where: { reference: result.reference } });
    assert.equal(row.provider, "stripe");
    assert.equal(row.currency, "USD");
    assert.equal(Number(row.amount), 25);
  });

  it("a lapsed member can renew", async () => {
    const { user } = await memberOn(gold.id, "EXPIRED");
    const { deps } = fakeProviders();
    const result = await startMembershipCheckout(user.id, { tierId: gold.id, currency: "NGN" }, deps);
    assert.equal(result.provider, "paystack");
  });

  it("refuses a lower tier, an unknown tier, a retired tier and a missing price (422)", async () => {
    const { user } = await memberOn(gold.id);
    const { calls, deps } = fakeProviders();
    const attempts = [
      { tierId: silver.id, currency: "NGN" as const }, // downgrade
      { tierId: "does-not-exist", currency: "NGN" as const },
      { tierId: inactive.id, currency: "NGN" as const },
      { tierId: unpriced.id, currency: "USD" as const }, // no dollar price
    ];
    for (const input of attempts) {
      await assert.rejects(
        () => startMembershipCheckout(user.id, input, deps),
        (e: { status?: number; code?: string }) => e.status === 422 && e.code === "TIER_NOT_AVAILABLE",
        JSON.stringify(input),
      );
    }
    assert.equal(calls.paystack.length + calls.stripe.length, 0, "no provider was called");
  });

  it("refuses accounts with no membership, a pending one, or a suspended one (403)", async () => {
    const { deps } = fakeProviders();
    const noMember = await makeUser();
    const pending = await memberOn(gold.id, "PENDING");
    const suspended = await memberOn(gold.id, "SUSPENDED");
    for (const userId of [noMember.id, pending.user.id, suspended.user.id]) {
      await assert.rejects(
        () => startMembershipCheckout(userId, { tierId: gold.id, currency: "NGN" }, deps),
        (e: { status?: number; code?: string }) => e.status === 403 && e.code === "FORBIDDEN",
      );
    }
  });

  it("the route needs a signed-in member and a valid body", async () => {
    const send = (body: unknown, headers: Record<string, string> = {}) =>
      route.POST(
        new Request("http://localhost:3000/api/mobile/v1/membership/checkout", {
          method: "POST",
          headers: { "content-type": "application/json", ...headers },
          body: JSON.stringify(body),
        }),
      );
    const anonymous = await send({ tierId: "x", currency: "NGN" });
    assert.equal(anonymous.status, 401);
    assert.equal((await anonymous.json()).error.code, "UNAUTHENTICATED");
  });
});

describe("buying event tickets from the app", () => {
  const { startEventCheckout } = checkoutModule;

  async function eventWithTier(options: { price?: number; capacity?: number; sold?: number; daysAhead?: number } = {}) {
    const event = await prisma.event.create({
      data: {
        title: "Odua Night",
        slug: uid("odua"),
        date: days(options.daysAhead ?? 20),
        isPublished: true,
        country: "Nigeria",
      },
    });
    const tier = await prisma.eventTicketTier.create({
      data: {
        eventId: event.id,
        name: "General",
        price: options.price ?? 15000,
        capacity: options.capacity ?? 10,
        sold: options.sold ?? 0,
      },
    });
    return { event, tier };
  }

  it("holds the seats, starts a Paystack payment and links the ticket to it", async () => {
    const user = await makeUser();
    const { event, tier } = await eventWithTier();
    const { calls, deps } = fakeProviders();

    const result = await startEventCheckout(user.id, event.slug, { tierId: tier.id, quantity: 2 }, deps);

    assert.equal(result.provider, "paystack");
    assert.ok(result.holdExpiresAt.getTime() > Date.now());
    assert.equal(calls.paystack[0].amount, "3000000", "2 x 15,000 naira, in kobo, worked out on the server");
    assert.equal(calls.paystack[0].reference, result.reference);

    const ticket = await prisma.ticket.findUniqueOrThrow({ where: { reference: result.reference } });
    assert.equal(ticket.status, "PENDING");
    assert.equal(ticket.quantity, 2);
    assert.equal(ticket.userId, user.id);

    const row = await prisma.transaction.findUniqueOrThrow({ where: { reference: result.reference } });
    assert.equal(row.purpose, "TICKET");
    assert.equal(Number(row.amount), 30000);
    assert.equal(row.userId, user.id);
    assert.equal((row.metadata as Record<string, unknown>).ticketRef, result.reference);
  });

  it("refuses more seats than are left (409 SOLD_OUT) and takes none", async () => {
    const user = await makeUser();
    const { event, tier } = await eventWithTier({ capacity: 5, sold: 4 });
    const { calls, deps } = fakeProviders();

    await assert.rejects(
      () => startEventCheckout(user.id, event.slug, { tierId: tier.id, quantity: 2 }, deps),
      (e: { status?: number; code?: string; message?: string }) =>
        e.status === 409 && e.code === "SOLD_OUT" && /Only 1 ticket left/.test(e.message ?? ""),
    );
    assert.equal(calls.paystack.length, 0);
    assert.equal(await prisma.ticket.count({ where: { eventId: event.id } }), 0);
  });

  it("gives the seats back when the payment cannot be started", async () => {
    const user = await makeUser();
    const { event, tier } = await eventWithTier();
    const failing: Deps = {
      ...fakeProviders().deps,
      paystackInitialize: async () => {
        throw new Error("Paystack is down");
      },
    };

    await assert.rejects(() => startEventCheckout(user.id, event.slug, { tierId: tier.id, quantity: 3 }, failing));

    const tickets = await prisma.ticket.findMany({ where: { eventId: event.id } });
    assert.equal(tickets.length, 1);
    assert.equal(tickets[0].status, "CANCELLED", "the hold is released");
    // ...and those seats can be bought straight away.
    const { deps } = fakeProviders();
    const retry = await startEventCheckout(user.id, event.slug, { tierId: tier.id, quantity: 10 }, deps);
    assert.equal(retry.provider, "paystack");
  });

  it("refuses an unknown event, an event that is over, another event's tier, and free tiers", async () => {
    const user = await makeUser();
    const { deps } = fakeProviders();
    const live = await eventWithTier();
    const over = await eventWithTier({ daysAhead: -5 });
    const free = await eventWithTier({ price: 0 });
    const other = await eventWithTier();

    const cases: [string, { tierId: string; quantity: number }, number, string][] = [
      ["no-such-event", { tierId: live.tier.id, quantity: 1 }, 404, "NOT_FOUND"],
      [over.event.slug, { tierId: over.tier.id, quantity: 1 }, 409, "SALES_CLOSED"],
      [live.event.slug, { tierId: other.tier.id, quantity: 1 }, 422, "TIER_NOT_AVAILABLE"],
      [free.event.slug, { tierId: free.tier.id, quantity: 1 }, 422, "TIER_NOT_AVAILABLE"],
    ];
    for (const [slug, input, status, code] of cases) {
      await assert.rejects(
        () => startEventCheckout(user.id, slug, input, deps),
        (e: { status?: number; code?: string }) => e.status === status && e.code === code,
        `${slug} -> ${code}`,
      );
    }
  });

  it("the route rejects a bad quantity before touching anything", async () => {
    const res = await eventRoute.POST(
      new Request("http://localhost:3000/api/mobile/v1/events/x/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tierId: "t", quantity: 0 }),
      }),
      { params: Promise.resolve({ slug: "x" }) },
    );
    assert.equal(res.status, 401, "signing in is checked first");
  });
});

describe("deleting an account from the app", () => {
  const { deleteAccount } = deletion;

  async function memberWithPassword(password = "correct-horse-battery") {
    const email = `del_${stamp}_${counter++}@example.com`;
    await auth.api.signUpEmail({ body: { email, password, name: "Folake Adeyemi" } });
    const user = await prisma.user.update({
      where: { email },
      data: { phone: "+2348000000000", bio: "Hello", country: "Nigeria", cityDistrict: "Lagos" },
    });
    const tier = await prisma.membershipTier.create({ data: { slug: uid("del"), name: "Gold" } });
    const member = await prisma.member.create({
      data: { userId: user.id, tierId: tier.id, status: "ACTIVE", expiresAt: days(100) },
    });
    return { user, member, email, password };
  }

  it("wipes personal details, keeps payment records without a name, and locks the account", async () => {
    const { user, member, email, password } = await memberWithPassword();
    const reference = uid("PAY");
    await prisma.transaction.create({
      data: {
        reference, purpose: "MEMBERSHIP", status: "SUCCESS", amount: 10000, customerEmail: email,
        customerName: "Folake Adeyemi", userId: user.id, memberId: member.id,
      },
    });
    await prisma.deviceToken.create({
      data: { userId: user.id, token: uid("tok"), platform: "android" },
    });

    await deleteAccount(user.id, { password });

    const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.equal(after.name, "Deleted member");
    assert.ok(after.email.endsWith("@deleted.invalid"));
    assert.equal(after.phone, null);
    assert.equal(after.bio, null);
    assert.equal(after.country, null);
    assert.equal(after.banned, true);
    assert.equal(await prisma.session.count({ where: { userId: user.id } }), 0);
    assert.equal(await prisma.account.count({ where: { userId: user.id } }), 0);
    assert.equal(await prisma.deviceToken.count({ where: { userId: user.id } }), 0);

    const tx = await prisma.transaction.findUniqueOrThrow({ where: { reference } });
    assert.equal(Number(tx.amount), 10000, "the payment record stays");
    assert.equal(tx.customerName, null);
    assert.ok(tx.customerEmail.endsWith("@deleted.invalid"));
    assert.equal((await prisma.member.findUniqueOrThrow({ where: { id: member.id } })).status, "EXPIRED");

    // The old email and password no longer work.
    await assert.rejects(() => auth.api.signInEmail({ body: { email, password } }));
  });

  it("refuses a wrong password, and changes nothing", async () => {
    const { user } = await memberWithPassword();
    await assert.rejects(
      () => deleteAccount(user.id, { password: "not-it" }),
      (e: { status?: number; code?: string }) => e.status === 403 && e.code === "INVALID_PASSWORD",
    );
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).name, "Folake Adeyemi");
  });

  it("asks the member to sort out paid tickets for upcoming events first", async () => {
    const { user, password } = await memberWithPassword();
    const event = await prisma.event.create({
      data: { title: "Soon", slug: uid("soon"), date: days(10), isPublished: true },
    });
    const tier = await prisma.eventTicketTier.create({
      data: { eventId: event.id, name: "GA", price: 5000, capacity: 10 },
    });
    await prisma.ticket.create({
      data: {
        eventId: event.id, tierId: tier.id, tierName: "GA", quantity: 1, status: "CONFIRMED",
        reference: uid("TKT").slice(0, 20), userId: user.id,
      },
    });
    await assert.rejects(
      () => deleteAccount(user.id, { password }),
      (e: { status?: number; code?: string }) => e.status === 409 && e.code === "UPCOMING_TICKETS",
    );
    assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).banned, false);
  });

  it("administrators cannot delete themselves this way", async () => {
    const { user, password } = await memberWithPassword();
    await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
    await assert.rejects(
      () => deleteAccount(user.id, { password }),
      (e: { status?: number }) => e.status === 403,
    );
  });
});
