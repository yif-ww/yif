import assert from "node:assert/strict";
import { createPublicKey, generateKeyPairSync } from "node:crypto";
import { describe, it } from "node:test";
import {
  addYears,
  computeNewExpiry,
  formatMembershipNumber,
} from "../../lib/membership-rules";
import {
  generateTicketReference,
  holdExpiryFrom,
  SEAT_HOLD_MINUTES,
  seatsAvailable,
} from "../../lib/ticket-rules";
import { QrSigner, verifyQrToken } from "../../lib/qr-token";

const NOW = new Date("2026-11-18T09:00:00.000Z");

describe("computeNewExpiry", () => {
  it("renewing early adds a year to the current expiry (fixes G3)", () => {
    const expiry = new Date("2026-12-09T09:00:00.000Z");
    const next = computeNewExpiry({
      paymentType: "membership_renewal",
      currentExpiry: expiry,
      now: NOW,
    });
    assert.equal(next.toISOString(), "2027-12-09T09:00:00.000Z");
  });

  it("renewing after expiry starts from today", () => {
    const next = computeNewExpiry({
      paymentType: "membership_renewal",
      currentExpiry: new Date("2026-01-01T00:00:00.000Z"),
      now: NOW,
    });
    assert.equal(next.toISOString(), "2027-11-18T09:00:00.000Z");
  });

  it("first activation and upgrades start from today", () => {
    for (const paymentType of ["membership", "membership_upgrade"] as const) {
      const next = computeNewExpiry({
        paymentType,
        currentExpiry: new Date("2027-06-01T00:00:00.000Z"),
        now: NOW,
      });
      assert.equal(next.toISOString(), "2027-11-18T09:00:00.000Z", paymentType);
    }
  });

  it("handles a missing expiry", () => {
    const next = computeNewExpiry({
      paymentType: "membership_renewal",
      currentExpiry: null,
      now: NOW,
    });
    assert.equal(next.toISOString(), "2027-11-18T09:00:00.000Z");
  });
});

describe("addYears", () => {
  it("moves 29 February to 28 February in a non-leap year", () => {
    const next = addYears(new Date("2028-02-29T10:00:00.000Z"), 1);
    assert.equal(next.toISOString(), "2029-02-28T10:00:00.000Z");
  });

  it("keeps 29 February across leap years", () => {
    const next = addYears(new Date("2028-02-29T10:00:00.000Z"), 4);
    assert.equal(next.toISOString(), "2032-02-29T10:00:00.000Z");
  });
});

describe("formatMembershipNumber", () => {
  it("pads the sequence to four digits", () => {
    assert.equal(formatMembershipNumber(2026, 7), "YIF-2026-0007");
    assert.equal(formatMembershipNumber(2026, 143), "YIF-2026-0143");
  });

  it("does not truncate larger numbers", () => {
    assert.equal(formatMembershipNumber(2026, 12345), "YIF-2026-12345");
  });

  it("rejects invalid sequence values", () => {
    assert.throws(() => formatMembershipNumber(2026, 0), RangeError);
    assert.throws(() => formatMembershipNumber(2026, 1.5), RangeError);
  });
});

describe("seatsAvailable", () => {
  it("subtracts sold and held seats", () => {
    assert.equal(seatsAvailable({ capacity: 300, sold: 120, held: 6 }), 174);
  });

  it("never goes below zero", () => {
    assert.equal(seatsAvailable({ capacity: 10, sold: 10, held: 4 }), 0);
  });
});

describe("ticket references and holds", () => {
  it("makes readable, unique-looking references", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const ref = generateTicketReference();
      assert.match(ref, /^YIF-TK-[2-9A-HJKMNP-Z]{6}$/);
      seen.add(ref);
    }
    assert.ok(seen.size > 195);
  });

  it("holds seats for the configured time", () => {
    const expiry = holdExpiryFrom(NOW);
    assert.equal(expiry.getTime() - NOW.getTime(), SEAT_HOLD_MINUTES * 60_000);
  });
});

describe("QR tokens", () => {
  const { privateKey } = generateKeyPairSync("ed25519");
  const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const signer = new QrSigner(pem, "k1");
  const exp = Math.floor(NOW.getTime() / 1000) + 3600;

  it("signs and verifies a ticket token", () => {
    const token = signer.sign("ticket", { id: "tk1", ev: "ev1", exp });
    assert.match(token, /^YIF1\.T\.[\w-]+\.[\w-]+$/);
    const result = signer.verify(token, NOW);
    assert.equal(result?.kind, "ticket");
    assert.equal(result?.payload.id, "tk1");
    assert.equal(result?.payload.ev, "ev1");
    assert.equal(result?.payload.kid, "k1");
  });

  it("signs and verifies a card token", () => {
    const token = signer.sign("card", { id: "m1", exp });
    assert.match(token, /^YIF1\.C\./);
    assert.equal(signer.verify(token, NOW)?.kind, "card");
  });

  it("holds no personal details", () => {
    const token = signer.sign("ticket", { id: "tk1", ev: "ev1", exp });
    const payload = Buffer.from(token.split(".")[2], "base64url").toString();
    assert.deepEqual(Object.keys(JSON.parse(payload)).sort(), [
      "ev",
      "exp",
      "id",
      "kid",
    ]);
  });

  it("rejects a tampered payload", () => {
    const token = signer.sign("ticket", { id: "tk1", ev: "ev1", exp });
    const parts = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ id: "tk2", ev: "ev1", exp, kid: "k1" }),
    ).toString("base64url");
    assert.equal(signer.verify([parts[0], parts[1], forged, parts[3]].join("."), NOW), null);
  });

  it("rejects a token signed by another key", () => {
    const other = new QrSigner(
      generateKeyPairSync("ed25519")
        .privateKey.export({ type: "pkcs8", format: "pem" })
        .toString(),
      "k2",
    );
    const token = other.sign("ticket", { id: "tk1", ev: "ev1", exp });
    assert.equal(signer.verify(token, NOW), null);
  });

  it("rejects an expired token", () => {
    const token = signer.sign("ticket", { id: "tk1", ev: "ev1", exp: exp - 7200 });
    assert.equal(signer.verify(token, NOW), null);
  });

  it("rejects malformed input", () => {
    for (const raw of ["", "x", "YIF1.T.abc", "YIF2.T.a.b", "YIF1.X.a.b"]) {
      assert.equal(signer.verify(raw, NOW), null, raw);
    }
  });

  it("refuses to sign a ticket without an event", () => {
    assert.throws(() => signer.sign("ticket", { id: "tk1", exp }));
  });

  it("works with key rotation: any listed public key can verify", () => {
    const token = signer.sign("card", { id: "m1", exp });
    const otherKey = generateKeyPairSync("ed25519").publicKey;
    // The first key does not match, the second does.
    const right = createPublicKey(pem);
    assert.ok(verifyQrToken(token, [otherKey, right], NOW));
    assert.equal(verifyQrToken(token, [otherKey], NOW), null);
  });

  it("exposes the raw public key for the app", () => {
    const info = signer.publicKeyInfo();
    assert.equal(info.kid, "k1");
    assert.equal(Buffer.from(info.publicKey, "base64url").length, 32);
  });
});
