// A small local server for trying the mobile app (or its tests) against the
// REAL route handlers and a REAL database, without starting the whole website.
//
// It fills an empty throwaway database with a demo member, events, tickets,
// payments and news, then serves /api/mobile/v1 and /api/auth on one port.
//
//   1. node scripts/start-test-db.mjs                       (leave it running)
//   2. DATABASE_URL=<address> pnpm prisma migrate deploy
//   3. TEST_DATABASE_URL=<address> node --import tsx scripts/demo-mobile-api.mts
//
// Then point the app (or `yif-mobile`'s live test) at http://localhost:3100.
// Demo sign-ins:  member@example.com / demo-password-123  (active Gold member)
//                 expired@example.com / demo-password-123 (lapsed membership)
//                 door@example.com / demo-password-123    (runs the door at the Annual Awards)
//
// Like the integration tests, it refuses to touch anything but a local database.

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { generateKeyPairSync } from "node:crypto";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Set TEST_DATABASE_URL to a throwaway local database.");
const host = new URL(url.replace(/^postgres(ql)?:/, "http:")).hostname;
if (host !== "localhost" && host !== "127.0.0.1") {
  throw new Error(`Refusing to run against ${host}. This server is for local throwaway databases only.`);
}

const PORT = Number(process.env.PORT ?? 3100);
process.env.DATABASE_URL = url;
process.env.BETTER_AUTH_SECRET ??= "demo-secret-demo-secret-demo-secret-123";
process.env.BETTER_AUTH_URL = `http://localhost:${PORT}`;
process.env.NEXT_PUBLIC_APP_URL ??= "https://www.yifww.org";
process.env.RESEND_API_KEY ??= "re_test_dummy"; // no email is sent by these routes
if (!process.env.QR_SIGNING_PRIVATE_KEY) {
  process.env.QR_SIGNING_PRIVATE_KEY = generateKeyPairSync("ed25519")
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString();
  process.env.QR_SIGNING_KEY_ID = "demo-key";
}

const { auth } = await import("../lib/auth");
const { prisma } = await import("../lib/prisma");

const PASSWORD = "demo-password-123";
const days = (n: number) => new Date(Date.now() + n * 24 * 3600_000);

// ---------- demo data ----------

async function seed() {
  if (await prisma.user.findUnique({ where: { email: "member@example.com" } })) {
    console.log("Demo data already there.");
    return;
  }

  async function makeUser(email: string, name: string) {
    await auth.api.signUpEmail({ body: { email, password: PASSWORD, name } });
    return prisma.user.update({ where: { email }, data: { country: "Nigeria", cityDistrict: "Lagos" } });
  }
  const member = await makeUser("member@example.com", "Adebola Balogun");
  const lapsed = await makeUser("expired@example.com", "Folake Adeyemi");
  const door = await makeUser("door@example.com", "Door Volunteer");

  const silver = await prisma.membershipTier.create({ data: { slug: "silver", name: "Silver", sortOrder: 0 } });
  const gold = await prisma.membershipTier.create({ data: { slug: "gold", name: "Gold", sortOrder: 1 } });
  const platinum = await prisma.membershipTier.create({ data: { slug: "platinum", name: "Platinum", sortOrder: 3 } });
  for (const [tier, ngn, usd] of [
    [silver, 5000, 12],
    [gold, 10000, 25],
    [platinum, 20000, 45],
  ] as const) {
    await prisma.membershipPlanPrice.create({ data: { tierId: tier.id, currency: "NGN", amount: ngn } });
    await prisma.membershipPlanPrice.create({ data: { tierId: tier.id, currency: "USD", amount: usd } });
  }

  const memberRow = await prisma.member.create({
    data: {
      userId: member.id, tierId: gold.id, status: "ACTIVE",
      membershipNumber: "YIF-2025-0142", expiresAt: days(200),
    },
  });
  await prisma.member.create({
    data: { userId: lapsed.id, tierId: silver.id, status: "ACTIVE", membershipNumber: "YIF-2024-0087", expiresAt: days(-12) },
  });

  const awards = await prisma.event.create({
    data: {
      title: "Annual Awards and Order of Odua Ceremony", slug: "annual-awards-2026", date: days(24), time: "5:00 PM",
      location: "Surulere, Lagos", address: "33A Bode Thomas Street, Surulere, Lagos", country: "Nigeria",
      tagline: "Honouring Yoruba leaders", isPublished: true,
    },
  });
  const ga = await prisma.eventTicketTier.create({
    data: { eventId: awards.id, name: "General Admission", description: "Ceremony and reception", price: 25000, capacity: 300, sold: 120 },
  });
  await prisma.event.create({
    data: { title: "Yoruba World Day 2025", slug: "ywd-2025", date: days(-90), location: "New York", country: "USA", isPublished: true },
  });
  await prisma.ticket.create({
    data: {
      eventId: awards.id, tierId: ga.id, tierName: "General Admission", quantity: 2, status: "CONFIRMED",
      reference: "YIF-TK-8F3K2P", userId: member.id, holderName: "Adebola Balogun",
    },
  });

  await prisma.eventOrganizer.create({ data: { eventId: awards.id, userId: door.id } });
  for (const [kind, title, body, link, ago] of [
    ["ticket", "Your ticket is ready", "Annual Awards: 2 tickets, saved on your phone.", "/events?tab=tickets", 6],
    ["renewal", "Membership renewed", "Thank you. Your Gold membership now runs to June 2027.", "/card", 165],
  ] as const) {
    await prisma.notification.create({
      data: { userId: member.id, kind, title, body, link, createdAt: days(-ago) },
    });
  }

  await prisma.transaction.create({
    data: {
      reference: "YIF-RN-7K2M9Q", purpose: "MEMBERSHIP", status: "SUCCESS", amount: 10000,
      customerEmail: member.email, userId: member.id, memberId: memberRow.id, fulfilledAt: new Date(),
      metadata: { tierName: "Gold" }, createdAt: days(-165),
    },
  });
  await prisma.transaction.create({
    data: {
      reference: "YIF-TK-PAY1", purpose: "TICKET", status: "SUCCESS", amount: 50000,
      customerEmail: member.email, userId: member.id, createdAt: days(-6),
    },
  });

  const topic = await prisma.blogTopic.create({ data: { name: "Culture", slug: "culture" } });
  await prisma.blogPost.create({
    data: {
      title: "The Strength of Yoruba Heritage", slug: "strength-of-yoruba-heritage",
      excerpt: "For centuries, Yoruba communities have carried their heritage across oceans.",
      authorName: "Dr. Aderibole Olumide", authorRole: "National President/CEO, YIF",
      isPublished: true, publishedAt: days(-5), topicId: topic.id,
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Roots and branches" }] },
          { type: "paragraph", content: [
            { type: "text", text: "Ẹ kú àbọ̀. Our story is told in " },
            { type: "text", text: "proverbs", marks: [{ type: "bold" }] },
            { type: "text", text: ", songs and festivals. Read " },
            { type: "text", text: "more about us", marks: [{ type: "link", attrs: { href: "https://www.yifww.org/about" } }] },
            { type: "text", text: "." },
          ] },
        ],
      },
    },
  });
  console.log("Demo data created.");
}

// ---------- routes ----------

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;
type RouteModule = Record<string, Handler | undefined>;

const base = "../app/api/mobile/v1";
const table: Array<[RegExp, string[], () => Promise<RouteModule>]> = [
  [/^\/me$/, [], () => import(`${base}/me/route`)],
  [/^\/membership\/checkout$/, [], () => import(`${base}/membership/checkout/route`)],
  [/^\/events\/([^/]+)\/checkout$/, ["slug"], () => import(`${base}/events/[slug]/checkout/route`)],
  [/^\/notifications$/, [], () => import(`${base}/notifications/route`)],
  [/^\/notifications\/read$/, [], () => import(`${base}/notifications/read/route`)],
  [/^\/devices$/, [], () => import(`${base}/devices/route`)],
  [/^\/organizer\/events$/, [], () => import(`${base}/organizer/events/route`)],
  [/^\/organizer\/events\/([^/]+)\/manifest$/, ["id"], () => import(`${base}/organizer/events/[id]/manifest/route`)],
  [/^\/organizer\/check-ins$/, [], () => import(`${base}/organizer/check-ins/route`)],
  [/^\/membership$/, [], () => import(`${base}/membership/route`)],
  [/^\/membership\/card$/, [], () => import(`${base}/membership/card/route`)],
  [/^\/membership\/tiers$/, [], () => import(`${base}/membership/tiers/route`)],
  [/^\/payments$/, [], () => import(`${base}/payments/route`)],
  [/^\/payments\/([^/]+)$/, ["reference"], () => import(`${base}/payments/[reference]/route`)],
  [/^\/events$/, [], () => import(`${base}/events/route`)],
  [/^\/events\/([^/]+)$/, ["slug"], () => import(`${base}/events/[slug]/route`)],
  [/^\/tickets$/, [], () => import(`${base}/tickets/route`)],
  [/^\/tickets\/([^/]+)$/, ["id"], () => import(`${base}/tickets/[id]/route`)],
  [/^\/news$/, [], () => import(`${base}/news/route`)],
  [/^\/news\/topics$/, [], () => import(`${base}/news/topics/route`)],
  [/^\/news\/([^/]+)$/, ["slug"], () => import(`${base}/news/[slug]/route`)],
  [/^\/keys$/, [], () => import(`${base}/keys/route`)],
];

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }
  const hasBody = req.method !== "GET" && req.method !== "HEAD" && body.length > 0;
  return new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers,
    body: hasBody ? body : undefined,
  });
}

async function respond(res: ServerResponse, response: Response) {
  const headers: Record<string, string | string[]> = {};
  response.headers.forEach((value, key) => {
    if (key !== "set-cookie") headers[key] = value;
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length) headers["set-cookie"] = cookies;
  res.writeHead(response.status, headers);
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  try {
    if (pathname.startsWith("/api/auth")) {
      return respond(res, await auth.handler(await toRequest(req)));
    }
    if (pathname.startsWith("/api/mobile/v1")) {
      const path = pathname.slice("/api/mobile/v1".length) || "/";
      for (const [pattern, names, load] of table) {
        const match = pattern.exec(path);
        if (!match) continue;
        const handler = (await load())[req.method ?? "GET"];
        if (!handler) break;
        const params = Object.fromEntries(names.map((n, i) => [n, decodeURIComponent(match[i + 1])]));
        return respond(res, await handler(await toRequest(req), { params: Promise.resolve(params) }));
      }
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { code: "NOT_FOUND", message: "Not found." } }));
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { code: "INTERNAL", message: "Something went wrong." } }));
  }
}

await seed();
const server = createServer((req, res) => void handle(req, res));
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Demo mobile API ready at http://localhost:${PORT}`);
  console.log(`Sign in with member@example.com / ${PASSWORD}`);
});
const stop = () => server.close(() => void prisma.$disconnect().then(() => process.exit(0)));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
