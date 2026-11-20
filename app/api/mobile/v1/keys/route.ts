// Route for /api/mobile/v1/keys. See docs/mobile-api-contract.md.
//
// The public half of the QR signing key. The app and door scanners use it to
// check a code without a connection. Public by design: it can only verify.
import { apiRoute, ApiError } from "@/lib/mobile-api/http";
import { getQrSigner, QrSigningNotConfiguredError } from "@/lib/qr-token";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({ auth: "none", cache: "public" }, async () => {
  try {
    return { keys: [getQrSigner().publicKeyInfo()] };
  } catch (err) {
    if (err instanceof QrSigningNotConfiguredError) {
      throw new ApiError(503, "QR_SIGNING_UNAVAILABLE", "Cards and tickets can't be shown right now.");
    }
    throw err;
  }
});
