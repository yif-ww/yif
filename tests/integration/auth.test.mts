// Mobile sign-in tests: bearer tokens and sign-in rate limiting, against a
// real (throwaway) Postgres database.
//
//   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:51314/template1 \
//     node --import tsx --test tests/integration/auth.test.mts

import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Set TEST_DATABASE_URL to a throwaway local database.");
const host = new URL(url.replace(/^postgres(ql)?:/, "http:")).hostname;
if (host !== "localhost" && host !== "127.0.0.1") {
  throw new Error(`Refusing to run integration tests against ${host}.`);
}
process.env.DATABASE_URL = url;
process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-123";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "re_test_dummy"; // never used: no email is sent here

const { auth } = await import("../../lib/auth");
const { prisma } = await import("../../lib/prisma");

const PASSWORD = "correct-horse-battery";
// A new fake address for every sign-in, because the rate limiter remembers
// addresses in the database between runs.
let ipCounter = 0;
const freshIp = () =>
  `198.18.${Math.floor(Math.random() * 250) + 1}.${(Date.now() + ipCounter++) % 250 + 1}`;


function signIn(email: string, password: string, ip: string) {
  // Like the mobile app: JSON, no cookies, and no Origin header.
  return auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ email, password }),
    }),
  );
}

async function makeAccount(): Promise<string> {
  const email = `mobile_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}@example.com`;
  await auth.api.signUpEmail({ body: { email, password: PASSWORD, name: "Mobile Tester" } });
  return email;
}

describe("mobile sign-in", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("returns a bearer token that identifies the member", async () => {
    const email = await makeAccount();
    const response = await signIn(email, PASSWORD, freshIp());
    assert.equal(response.status, 200);

    const token = response.headers.get("set-auth-token");
    assert.ok(token, "sign-in must return a set-auth-token header");

    const session = await auth.api.getSession({
      headers: new Headers({ authorization: `Bearer ${token}` }),
    });
    assert.equal(session?.user.email, email);
  });

  it("rejects missing, malformed and tampered tokens", async () => {
    const email = await makeAccount();
    const token = (await signIn(email, PASSWORD, freshIp())).headers.get("set-auth-token")!;

    const attempts = [
      "Bearer ",
      "Bearer not-a-real-token",
      `Bearer ${token.slice(0, -4)}AAAA`,
      `Basic ${token}`,
    ];
    for (const authorization of attempts) {
      const session = await auth.api.getSession({ headers: new Headers({ authorization }) });
      assert.equal(session, null, authorization);
    }
    assert.equal(await auth.api.getSession({ headers: new Headers() }), null);
  });

  it("a signed-out token stops working", async () => {
    const email = await makeAccount();
    const token = (await signIn(email, PASSWORD, freshIp())).headers.get("set-auth-token")!;
    const headers = new Headers({ authorization: `Bearer ${token}` });
    assert.ok(await auth.api.getSession({ headers }));
    await auth.api.signOut({ headers });
    assert.equal(await auth.api.getSession({ headers }), null);
  });

  it("slows down password guessing from one address, but not others", async () => {
    const email = await makeAccount();
    const attacker = freshIp();

    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await signIn(email, "wrong-password-" + i, attacker)).status);
    }
    assert.ok(statuses.slice(0, 5).every((s) => s === 401), `first five are plain failures: ${statuses}`);
    assert.ok(statuses.slice(5).every((s) => s === 429), `then it is throttled: ${statuses}`);

    // Even the right password is refused while throttled.
    assert.equal((await signIn(email, PASSWORD, attacker)).status, 429);
    // Someone else on another address is unaffected.
    assert.equal((await signIn(email, PASSWORD, freshIp())).status, 200);
  });
});
