// Route for POST /api/mobile/v1/events/{slug}/checkout. See docs/mobile-api-contract.md.
import { apiRoute, jsonBody, parseOrThrow } from "@/lib/mobile-api/http";
import { eventCheckoutSchema, startEventCheckout } from "@/lib/mobile-api/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute<{ slug: string }>({}, async ({ req, user, params }) =>
  startEventCheckout(user.id, params.slug, parseOrThrow(eventCheckoutSchema, await jsonBody(req))),
);
