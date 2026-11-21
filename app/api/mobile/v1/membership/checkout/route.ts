// Route for POST /api/mobile/v1/membership/checkout. See docs/mobile-api-contract.md.
import { apiRoute, jsonBody, parseOrThrow } from "@/lib/mobile-api/http";
import { membershipCheckoutSchema, startMembershipCheckout } from "@/lib/mobile-api/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute({}, async ({ req, user }) =>
  startMembershipCheckout(user.id, parseOrThrow(membershipCheckoutSchema, await jsonBody(req))),
);
