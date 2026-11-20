// Generates the Ed25519 key pair that signs membership cards and event tickets.
//
//   pnpm qr:keygen
//
// Put the private key in QR_SIGNING_PRIVATE_KEY on the server (for example in
// the hosting dashboard) and keep a backup somewhere safe. Never commit it and
// never put it in the app. The app only ever receives the public key, from
// GET /api/mobile/v1/keys.
//
// To rotate the key later, generate a new pair, change QR_SIGNING_KEY_ID (for
// example to "k2"), and keep the old public key valid until old tokens expire.

import { generateKeyPairSync } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString().trim();
const rawPublic = (publicKey.export({ format: "jwk" }).x as string) ?? "";

console.log("QR_SIGNING_KEY_ID=k1");
console.log(`QR_SIGNING_PRIVATE_KEY="${privatePem.replace(/\n/g, "\\n")}"`);
console.log("");
console.log(`Public key (safe to share, base64url): ${rawPublic}`);
