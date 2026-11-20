// Mobile API tests: real route handlers, real bearer sign-in, real database.
//
//   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:51314/template1 \
//     node --import tsx --test tests/integration/mobile-api.test.mts

import assert from "node:assert/strict";
import { createPublicKey, generateKeyPairSync, verify } from "node:crypto";
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
const signingKey = generateKeyPairSync("ed25519");
process.env.QR_SIGNING_PRIVATE_KEY = signingKey.privateKey
  .export({ type: "pkcs8", format: "pem" })
  .toString();
process.env.QR_SIGNING_KEY_ID = "test-key";

const { auth } = await import("../../lib/auth");
const { prisma } = await import("../../lib/prisma");
const { getQrSigner } = await import("../../lib/qr-token");

const me = await import("../../app/api/mobile/v1/me/route");
const membership = await import("../../app/api/mobile/v1/membership/route");
const card = await import("../../app/api/mobile/v1/membership/card/route");
const tiers = await import("../../app/api/mobile/v1/membership/tiers/route");
const payments = await import("../../app/api/mobile/v1/payments/route");
const payment = await import("../../app/api/mobile/v1/payments/[reference]/route");
const events = await import("../../app/api/mobile/v1/events/route");
const event = await import("../../app/api/mobile/v1/events/[slug]/route");
const tickets = await import("../../app/api/mobile/v1/tickets/route");
const ticket = await import("../../app/api/mobile/v1/tickets/[id]/route");
const news = await import("../../app/api/mobile/v1/news/route");
const post = await import("../../app/api/mobile/v1/news/[slug]/route");
const keys = await import("../../app/api/mobile/v1/keys/route");

const PASSWORD = "correct-horse-battery";
// A new fake address for every sign-in, because the rate limiter remembers
// addresses in the database between runs.
let ipCounter = 0;
const freshIp = () =>
  `198.18.${Math.floor(Math.random() * 250) + 1}.${(Date.now() + ipCounter++) % 250 + 1}`;

const stamp = Date.now().toString(36);
const days = (n: number) => new Date(Date.now() + n * 24 * 3600_000);

type Json = any; // eslint-disable-line @typescript-eslint/no-explicit-any

async function call(
  handler: (req: Request, ctx: { params: Promise<never> }) => Promise<Response>,
  path: string,
  options: { token?: string; method?: string; body?: unknown; params?: Record<string, string> } = {},
): Promise<{ status: number; json: Json; headers: Headers }> {
  const headers = new Headers({ "content-type": "application/json" });
  if (options.token) headers.set("authorization", `Bearer ${options.token}`);
  const res = await handler(
    new Request(`http://localhost:3000/api/mobile/v1${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }),
    { params: Promise.resolve((options.params ?? {}) as never) },
  );
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null, headers: res.headers };
}

async function signUpAndIn(name: string, ip: string, country = "Nigeria") {
  const email = `api_${stamp}_${Math.random().toString(36).slice(2, 7)}@example.com`;
  await auth.api.signUpEmail({ body: { email, password: PASSWORD, name } });
  const user = await prisma.user.update({ where: { email }, data: { country, cityDistrict: "Lagos" } });
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ email, password: PASSWORD }),
    }),
  );
  assert.equal(res.status, 200);
  return { user, token: res.headers.get("set-auth-token")! };
}

describe("mobile API", () => {
  let a: Awaited<ReturnType<typeof signUpAndIn>>;
  let b: Awaited<ReturnType<typeof signUpAndIn>>;
  let gold: { id: string };
  // Earlier runs leave their own tiers in the database, so tier checks look only at this run's.
  let ownTierIds: Set<string>;
  let memberA: { id: string };
  let upcoming: { id: string; slug: string };
  let past: { slug: string };
  let tierId: string;
  let ticketA: { id: string };
  let ticketB: { id: string };

  before(async () => {
    a = await signUpAndIn("Adebola Balogun", freshIp());
    b = await signUpAndIn("Folake Adeyemi", freshIp());

    const silver = await prisma.membershipTier.create({
      data: { slug: `silver-${stamp}`, name: "Silver", sortOrder: 0 },
    });
    gold = await prisma.membershipTier.create({
      data: { slug: `gold-${stamp}`, name: "Gold", sortOrder: 1 },
    });
    const platinum = await prisma.membershipTier.create({
      data: { slug: `platinum-${stamp}`, name: "Platinum", sortOrder: 3 },
    });
    ownTierIds = new Set([silver.id, gold.id, platinum.id]);
    for (const [tier, ngn, usd] of [
      [silver, 5000, 12],
      [gold, 10000, 25],
      [platinum, 20000, null],
    ] as const) {
      await prisma.membershipPlanPrice.create({ data: { tierId: tier.id, currency: "NGN", amount: ngn } });
      if (usd) await prisma.membershipPlanPrice.create({ data: { tierId: tier.id, currency: "USD", amount: usd } });
    }

    memberA = await prisma.member.create({
      data: {
        userId: a.user.id,
        tierId: gold.id,
        status: "ACTIVE",
        membershipNumber: `YIF-2025-T${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        expiresAt: days(20),
      },
    });
    await prisma.member.create({
      data: { userId: b.user.id, tierId: gold.id, status: "ACTIVE", expiresAt: days(200) },
    });

    // Events: one upcoming with seats sold and held, one over.
    const up = await prisma.event.create({
      data: {
        title: "Annual Awards", slug: `awards-${stamp}`, date: days(24), time: "5:00 PM",
        location: "Surulere, Lagos", address: "33A Bode Thomas Street", country: "Nigeria",
        tagline: "Honouring Yoruba leaders", isPublished: true,
      },
    });
    upcoming = up;
    const tier = await prisma.eventTicketTier.create({
      data: { eventId: up.id, name: "General Admission", price: 25000, capacity: 100, sold: 10 },
    });
    tierId = tier.id;
    // Five seats held by a checkout in progress, and one hold that has expired.
    await prisma.ticket.create({
      data: { eventId: up.id, tierId, tierName: "General Admission", quantity: 5, status: "PENDING",
        reference: `YIF-TK-HOLD${stamp}`.slice(0, 20), holdExpiresAt: new Date(Date.now() + 600_000) },
    });
    await prisma.ticket.create({
      data: { eventId: up.id, tierId, tierName: "General Admission", quantity: 7, status: "PENDING",
        reference: `YIF-TK-OLD${stamp}`.slice(0, 20), holdExpiresAt: new Date(Date.now() - 600_000) },
    });
    past = await prisma.event.create({
      data: { title: "Yoruba World Day 2026", slug: `ywd-${stamp}`, date: days(-60), location: "New York", country: "USA", isPublished: true },
    });
    await prisma.event.create({
      data: { title: "Unpublished", slug: `draft-${stamp}`, date: days(10), isPublished: false },
    });

    ticketA = await prisma.ticket.create({
      data: { eventId: up.id, tierId, tierName: "General Admission", quantity: 1, status: "CONFIRMED",
        reference: `YIF-TK-A${stamp}`.slice(0, 20), userId: a.user.id, holderName: "Adebola Balogun" },
    });
    ticketB = await prisma.ticket.create({
      data: { eventId: up.id, tierId, tierName: "General Admission", quantity: 2, status: "CONFIRMED",
        reference: `YIF-TK-B${stamp}`.slice(0, 20), userId: b.user.id },
    });
    await prisma.ticket.create({
      data: { eventId: up.id, tierId, tierName: "General Admission", quantity: 1, status: "CANCELLED",
        reference: `YIF-TK-C${stamp}`.slice(0, 20), userId: a.user.id },
    });

    // Payments: two for A, one for B.
    for (let i = 0; i < 2; i++) {
      await prisma.transaction.create({
        data: { reference: `A-PAY-${stamp}-${i}`, purpose: "MEMBERSHIP", status: "SUCCESS", amount: 10000,
          customerEmail: a.user.email, userId: a.user.id, memberId: memberA.id, fulfilledAt: new Date(),
          metadata: { tierName: "Gold" }, createdAt: new Date(Date.now() - i * 60_000) },
      });
    }
    await prisma.transaction.create({
      data: { reference: `B-PAY-${stamp}`, purpose: "TICKET", status: "SUCCESS", amount: 50000,
        customerEmail: b.user.email, userId: b.user.id },
    });

    // News, including content that tries to inject markup.
    const topic = await prisma.blogTopic.create({ data: { name: `Culture ${stamp}`, slug: `culture-${stamp}` } });
    await prisma.blogPost.create({
      data: {
        title: "The Strength of Yoruba Heritage", slug: `heritage-${stamp}`, excerpt: "For centuries...",
        authorName: "Dr. Aderibole Olumide", authorRole: "National President/CEO, YIF",
        isPublished: true, publishedAt: days(-5), topicId: topic.id,
        content: {
          type: "doc",
          content: [
            { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Roots <b>& branches</b>" }] },
            { type: "paragraph", content: [
              { type: "text", text: "Read " },
              { type: "text", text: "more", marks: [{ type: "link", attrs: { href: "https://www.yifww.org/about" } }] },
              { type: "text", text: " or " },
              { type: "text", text: "click", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
              { type: "text", text: "<script>alert(1)</script>", marks: [{ type: "bold" }] },
            ] },
            { type: "image", attrs: { src: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", alt: "bad" } },
            { type: "image", attrs: { src: "https://res.cloudinary.com/yif/a.jpg", alt: 'Say "hi"' } },
          ],
        },
      },
    });
    await prisma.blogPost.create({
      data: { title: "Hidden draft", slug: `draft-post-${stamp}`, excerpt: "x", authorName: "x", authorRole: "x",
        isPublished: false, content: { type: "doc", content: [] } },
    });
  });

  after(async () => {
    await prisma.$disconnect();
  });

  describe("signing in", () => {
    it("refuses requests with no or a bad token, in the standard error shape", async () => {
      for (const token of [undefined, "garbage", a.token.slice(0, -3) + "xyz"]) {
        const res = await call(me.GET, "/me", { token });
        assert.equal(res.status, 401);
        assert.equal(res.json.error.code, "UNAUTHENTICATED");
        assert.equal(typeof res.json.error.message, "string");
        assert.equal(res.headers.get("cache-control"), "no-store");
      }
    });

    it("refuses a suspended account", async () => {
      const banned = await signUpAndIn("Banned Person", freshIp());
      await prisma.user.update({ where: { id: banned.user.id }, data: { banned: true } });
      const res = await call(me.GET, "/me", { token: banned.token });
      assert.equal(res.status, 403);
      assert.equal(res.json.error.code, "FORBIDDEN");
    });
  });

  describe("account", () => {
    it("returns the member, their membership and preferences", async () => {
      const res = await call(me.GET, "/me", { token: a.token });
      assert.equal(res.status, 200);
      const m = res.json.member;
      assert.equal(m.firstName, "Adebola");
      assert.equal(m.lastName, "Balogun");
      assert.equal(m.currency, "NGN");
      assert.equal(m.isOrganizer, false);
      assert.equal(m.membership.status, "ACTIVE");
      assert.equal(m.membership.tierName, "Gold");
      assert.equal(res.json.preferences.eventInvites, true);
    });

    it("picks a currency from the member's country", async () => {
      const uk = await signUpAndIn("Tunde Bakare", freshIp(), "United Kingdom");
      assert.equal((await call(me.GET, "/me", { token: uk.token })).json.member.currency, "GBP");
      const us = await signUpAndIn("Kemi Ade", freshIp(), "United States");
      assert.equal((await call(me.GET, "/me", { token: us.token })).json.member.currency, "USD");
    });

    it("lets a member turn notifications off and edit their name", async () => {
      const res = await call(me.PATCH, "/me", {
        token: a.token,
        method: "PATCH",
        body: { lastName: "Balogun-Ade", preferences: { scholarshipNews: false } },
      });
      assert.equal(res.status, 200);
      assert.equal(res.json.member.lastName, "Balogun-Ade");
      assert.equal(res.json.preferences.scholarshipNews, false);
      assert.equal(res.json.preferences.newsletter, true, "other settings are untouched");
    });

    it("rejects invalid or unknown fields with a 400", async () => {
      const bad = await call(me.PATCH, "/me", {
        token: a.token,
        method: "PATCH",
        body: { firstName: "", role: "admin" },
      });
      assert.equal(bad.status, 400);
      assert.equal(bad.json.error.code, "VALIDATION_FAILED");
      assert.ok(bad.json.error.fields);
      const notJson = await me.PATCH(
        new Request("http://localhost:3000/api/mobile/v1/me", {
          method: "PATCH",
          headers: { authorization: `Bearer ${a.token}` },
          body: "{not json",
        }),
        { params: Promise.resolve({}) },
      );
      assert.equal(notJson.status, 400);
    });
  });

  describe("membership", () => {
    it("returns the membership", async () => {
      const res = await call(membership.GET, "/membership", { token: a.token });
      assert.equal(res.json.status, "ACTIVE");
      assert.match(res.json.number, /^YIF-2025-/);
    });

    it("gives an active member a signed card that never outlives the membership", async () => {
      const res = await call(card.GET, "/membership/card", { token: a.token });
      assert.equal(res.status, 200);
      const verified = getQrSigner().verify(res.json.qrToken);
      assert.equal(verified?.kind, "card");
      assert.equal(verified?.payload.id, memberA.id);
      assert.ok(verified!.payload.exp * 1000 <= days(20).getTime() + 1000);
      assert.ok(new Date(res.json.expiresAt).getTime() <= days(20).getTime() + 1000);
    });

    it("refuses a card once the membership has expired", async () => {
      await prisma.member.update({ where: { id: memberA.id }, data: { expiresAt: days(-1) } });
      const res = await call(card.GET, "/membership/card", { token: a.token });
      assert.equal(res.status, 403);
      assert.equal(res.json.error.code, "CARD_INACTIVE");
      // The database still says ACTIVE, but the member is shown as expired.
      assert.equal((await call(membership.GET, "/membership", { token: a.token })).json.status, "EXPIRED");
      await prisma.member.update({ where: { id: memberA.id }, data: { expiresAt: days(20) } });
    });

    it("lists the member's own tier and upgrades, never lower tiers", async () => {
      const ngn = await call(tiers.GET, "/membership/tiers", { token: a.token });
      assert.equal(ngn.json.currency, "NGN");
      const own = (res: { json: Json }) => res.json.tiers.filter((t: Json) => ownTierIds.has(t.id));
      assert.deepEqual(
        own(ngn).map((t: Json) => [t.name, t.isCurrent, t.price.amount]),
        [["Gold", true, 10000], ["Platinum", false, 20000]],
      );
      const usd = await call(tiers.GET, "/membership/tiers?currency=usd", { token: a.token });
      assert.deepEqual(own(usd).map((t: Json) => t.name), ["Gold"], "Platinum has no USD price");
      assert.ok(ngn.json.currencies.includes("USD"));

      const bad = await call(tiers.GET, "/membership/tiers?currency=XXX", { token: a.token });
      assert.equal(bad.status, 400);
    });
  });

  describe("payments", () => {
    it("lists only the member's own, newest first, in pages", async () => {
      const first = await call(payments.GET, "/payments?limit=1", { token: a.token });
      assert.equal(first.json.items.length, 1);
      assert.equal(first.json.items[0].reference, `A-PAY-${stamp}-0`);
      assert.equal(first.json.items[0].description, "Gold membership");
      assert.ok(first.json.nextCursor);

      const second = await call(payments.GET, `/payments?limit=1&cursor=${first.json.nextCursor}`, { token: a.token });
      assert.equal(second.json.items[0].reference, `A-PAY-${stamp}-1`);
      assert.equal(second.json.nextCursor, null);

      const all = await call(payments.GET, "/payments", { token: a.token });
      assert.ok(all.json.items.every((p: Json) => p.reference.startsWith("A-PAY-")));
    });

    it("rejects a malformed page marker", async () => {
      const res = await call(payments.GET, "/payments?cursor=not-a-cursor", { token: a.token });
      assert.equal(res.status, 400);
    });

    it("shows one payment, but never someone else's", async () => {
      const mine = await call(payment.GET, `/payments/A-PAY-${stamp}-0`, {
        token: a.token, params: { reference: `A-PAY-${stamp}-0` },
      });
      assert.equal(mine.status, 200);
      assert.equal(mine.json.fulfilled, true);
      assert.ok(mine.json.membershipExpiresAt);

      const theirs = await call(payment.GET, `/payments/B-PAY-${stamp}`, {
        token: a.token, params: { reference: `B-PAY-${stamp}` },
      });
      assert.equal(theirs.status, 404);
    });
  });

  describe("events", () => {
    it("lists upcoming published events with the seats really left", async () => {
      const res = await call(events.GET, "/events?when=upcoming", { token: a.token });
      assert.equal(res.status, 200);
      const found = res.json.items.find((e: Json) => e.slug === upcoming.slug);
      assert.ok(found);
      assert.ok(!res.json.items.some((e: Json) => e.title === "Unpublished"));
      assert.ok(!res.json.items.some((e: Json) => e.slug === past.slug));
      // 100 capacity - 10 sold - 5 held now. The expired hold of 7 does not count,
      // and neither do confirmed tickets that are already in "sold".
      assert.equal(found.tiers[0].remaining, 85);
      assert.equal(found.tiers[0].price.currency, "NGN");
      assert.equal(found.venue, "33A Bode Thomas Street, Surulere, Lagos");
      assert.equal(found.salesOpen, true);
      assert.equal(found.sponsor, null);
    });

    it("reads a time like 5:00 PM as Nigerian time", async () => {
      const res = await call(event.GET, `/events/${upcoming.slug}`, { token: a.token, params: { slug: upcoming.slug } });
      const startsAt = new Date(res.json.startsAt);
      assert.equal(startsAt.getUTCHours(), 16, "5 PM in Lagos is 16:00 UTC");
      assert.equal(res.json.timeLabel, "5:00 PM");
    });

    it("lists past events separately, with sales closed", async () => {
      const res = await call(events.GET, "/events?when=past", { token: a.token });
      const found = res.json.items.find((e: Json) => e.slug === past.slug);
      assert.ok(found);
      assert.equal(found.salesOpen, false);
      assert.ok(!res.json.items.some((e: Json) => e.slug === upcoming.slug));
    });

    it("returns 404 for an unknown or unpublished event, and 400 for a bad filter", async () => {
      for (const slug of ["nope", `draft-${stamp}`]) {
        const res = await call(event.GET, `/events/${slug}`, { token: a.token, params: { slug } });
        assert.equal(res.status, 404, slug);
      }
      assert.equal((await call(events.GET, "/events?when=never", { token: a.token })).status, 400);
    });
  });

  describe("tickets", () => {
    it("lists only the member's paid tickets, each with a signed QR token", async () => {
      const res = await call(tickets.GET, "/tickets", { token: a.token });
      assert.equal(res.status, 200);
      assert.equal(res.json.items.length, 1, "no cancelled, pending or other people's tickets");
      const t = res.json.items[0];
      assert.equal(t.id, ticketA.id);
      assert.equal(t.holderName, "Adebola Balogun");

      const verified = getQrSigner().verify(t.qrToken);
      assert.equal(verified?.kind, "ticket");
      assert.equal(verified?.payload.id, ticketA.id);
      assert.equal(verified?.payload.ev, upcoming.id);
      // Valid until a day after the event.
      assert.ok(verified!.payload.exp * 1000 > days(24).getTime());
    });

    it("shows a ticket to its owner only", async () => {
      const mine = await call(ticket.GET, `/tickets/${ticketA.id}`, { token: a.token, params: { id: ticketA.id } });
      assert.equal(mine.status, 200);
      assert.equal(mine.json.event.slug, upcoming.slug);
      const theirs = await call(ticket.GET, `/tickets/${ticketB.id}`, { token: a.token, params: { id: ticketB.id } });
      assert.equal(theirs.status, 404);
    });
  });

  describe("news", () => {
    it("is open to everyone and lists published posts only", async () => {
      const res = await call(news.GET, "/news");
      assert.equal(res.status, 200);
      const found = res.json.items.find((p: Json) => p.slug === `heritage-${stamp}`);
      assert.ok(found);
      assert.equal(found.topic, `Culture ${stamp}`);
      assert.equal(found.webUrl, `https://www.yifww.org/blog/heritage-${stamp}`);
      assert.ok(found.readMinutes >= 1);
      assert.ok(!res.json.items.some((p: Json) => p.slug.startsWith("draft-post")));
      assert.match(res.headers.get("cache-control") ?? "", /public/);
    });

    it("filters by topic", async () => {
      const hit = await call(news.GET, `/news?topic=culture-${stamp}`);
      assert.ok(hit.json.items.length >= 1);
      const miss = await call(news.GET, "/news?topic=nothing-here");
      assert.equal(miss.json.items.length, 0);
    });

    it("returns article HTML that cannot inject markup", async () => {
      const slug = `heritage-${stamp}`;
      const res = await call(post.GET, `/news/${slug}`, { params: { slug } });
      assert.equal(res.status, 200);
      const html: string = res.json.html;
      assert.ok(html.includes("<h2>Roots &lt;b&gt;&amp; branches&lt;/b&gt;</h2>"), html);
      assert.ok(html.includes('<a href="https://www.yifww.org/about">more</a>'));
      assert.ok(!/<script/i.test(html), "no script tag");
      assert.ok(!/javascript:/i.test(html), "no javascript: link");
      assert.ok(!html.includes("data:image"), "no data: image");
      assert.ok(html.includes('<img src="https://res.cloudinary.com/yif/a.jpg" alt="Say &quot;hi&quot;">'));
    });

    it("does not show an unpublished post", async () => {
      const slug = `draft-post-${stamp}`;
      assert.equal((await call(post.GET, `/news/${slug}`, { params: { slug } })).status, 404);
    });
  });

  describe("signing keys", () => {
    it("publishes a public key the app can check a card with", async () => {
      const res = await call(keys.GET, "/keys");
      assert.equal(res.status, 200);
      const key = res.json.keys[0];
      assert.equal(key.kid, "test-key");

      // What the app does: rebuild the key from its 32 raw bytes and verify offline.
      const cardRes = await call(card.GET, "/membership/card", { token: a.token });
      const [prefix, kind, payload, signature] = cardRes.json.qrToken.split(".");
      const publicKey = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: key.publicKey }, format: "jwk" });
      assert.ok(verify(null, Buffer.from(`${prefix}.${kind}.${payload}`), publicKey, Buffer.from(signature, "base64url")));
    });
  });
});
