// lib/qr-token.ts — signed QR tokens for membership cards and event tickets.
//
// Format:  YIF1.<kind>.<payload>.<signature>
//   kind       T (ticket) or C (membership card)
//   payload    base64url JSON: { id, ev?, exp, kid }. IDs and an expiry only,
//              never names, emails or phone numbers.
//   signature  base64url Ed25519 signature over "YIF1.<kind>.<payload>"
//
// The server holds the private key. The app and door scanners hold only the
// public key, so they can check a token with no connection. The Flutter app
// parses this format in lib/features/check_in/domain/qr_token.dart.

import {
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";

export const QR_PREFIX = "YIF1";

export type QrKind = "ticket" | "card";

export type QrPayload = {
  /** Ticket ID or member ID. */
  id: string;
  /** Event ID. Tickets only. */
  ev?: string;
  /** Expiry, in Unix seconds. */
  exp: number;
  /** ID of the signing key, so keys can be rotated. */
  kid: string;
};

export class QrSigningNotConfiguredError extends Error {
  constructor() {
    super(
      "QR signing is not configured. Set QR_SIGNING_PRIVATE_KEY (an Ed25519 private key in PEM format).",
    );
    this.name = "QrSigningNotConfiguredError";
  }
}

const KIND_CODE: Record<QrKind, "T" | "C"> = { ticket: "T", card: "C" };

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export type PublicKeyInfo = {
  kid: string;
  /** Raw 32-byte Ed25519 public key, base64url. */
  publicKey: string;
};

export class QrSigner {
  private readonly privateKey: KeyObject;
  private readonly publicKeyObject: KeyObject;
  readonly kid: string;

  constructor(privateKeyPem: string, kid: string) {
    this.privateKey = createPrivateKey(privateKeyPem);
    if (this.privateKey.asymmetricKeyType !== "ed25519") {
      throw new Error("QR_SIGNING_PRIVATE_KEY must be an Ed25519 key.");
    }
    this.publicKeyObject = createPublicKey(this.privateKey);
    this.kid = kid;
  }

  /** The public key in the form the app uses to verify tokens. */
  publicKeyInfo(): PublicKeyInfo {
    const jwk = this.publicKeyObject.export({ format: "jwk" });
    return { kid: this.kid, publicKey: jwk.x as string };
  }

  sign(kind: QrKind, payload: Omit<QrPayload, "kid">): string {
    const body: QrPayload = { ...payload, kid: this.kid };
    if (kind === "ticket" && !body.ev) {
      throw new Error("Ticket tokens need an event ID.");
    }
    const encoded = toBase64Url(JSON.stringify(body));
    const signed = `${QR_PREFIX}.${KIND_CODE[kind]}.${encoded}`;
    const signature = sign(null, Buffer.from(signed), this.privateKey);
    return `${signed}.${toBase64Url(signature)}`;
  }

  /** Verifies a token made by this signer's key. Returns null if invalid or expired. */
  verify(token: string, now: Date = new Date()): VerifiedToken | null {
    return verifyQrToken(token, [this.publicKeyObject], now);
  }
}

export type VerifiedToken = {
  kind: QrKind;
  payload: QrPayload;
};

/** Verifies a token against one or more public keys, and checks its expiry. */
export function verifyQrToken(
  token: string,
  publicKeys: KeyObject[],
  now: Date = new Date(),
): VerifiedToken | null {
  const parts = token.trim().split(".");
  if (parts.length !== 4 || parts[0] !== QR_PREFIX) return null;
  const [, kindCode, encoded, signature] = parts;
  const kind: QrKind | null =
    kindCode === "T" ? "ticket" : kindCode === "C" ? "card" : null;
  if (!kind) return null;

  const signed = `${QR_PREFIX}.${kindCode}.${encoded}`;
  const signatureBytes = Buffer.from(signature, "base64url");
  const valid = publicKeys.some((key) =>
    verify(null, Buffer.from(signed), key, signatureBytes),
  );
  if (!valid) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload !== "object" || payload === null) return null;
  const p = payload as Partial<QrPayload>;
  if (typeof p.id !== "string" || typeof p.exp !== "number") return null;
  if (typeof p.kid !== "string") return null;
  if (kind === "ticket" && typeof p.ev !== "string") return null;
  if (p.exp * 1000 < now.getTime()) return null;

  return { kind, payload: p as QrPayload };
}

let cachedSigner: QrSigner | null | undefined;

/**
 * The signer configured from the environment.
 *
 * QR_SIGNING_PRIVATE_KEY holds the PEM key. Line breaks may be written as the
 * two characters \n, which is how most hosting dashboards store them.
 * QR_SIGNING_KEY_ID names the key (default "k1").
 */
export function getQrSigner(): QrSigner {
  if (cachedSigner === undefined) {
    const pem = process.env.QR_SIGNING_PRIVATE_KEY;
    cachedSigner = pem
      ? new QrSigner(pem.replace(/\\n/g, "\n"), process.env.QR_SIGNING_KEY_ID ?? "k1")
      : null;
  }
  if (!cachedSigner) throw new QrSigningNotConfiguredError();
  return cachedSigner;
}

/** Tests use this to reset the cached signer after changing the environment. */
export function resetQrSignerForTests(): void {
  cachedSigner = undefined;
}

/** How long a card token stays valid. The app refreshes it automatically. */
export const CARD_TOKEN_DAYS = 30;

/** Ticket tokens expire one day after the event ends. */
export function ticketTokenExpiry(eventEnd: Date): number {
  return Math.floor((eventEnd.getTime() + 24 * 3600_000) / 1000);
}

export function cardTokenExpiry(now: Date): number {
  return Math.floor((now.getTime() + CARD_TOKEN_DAYS * 24 * 3600_000) / 1000);
}
