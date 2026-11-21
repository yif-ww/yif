// Route for POST /api/mobile/v1/organizer/check-ins. See docs/mobile-api-contract.md.
import { apiRoute, jsonBody, parseOrThrow } from "@/lib/mobile-api/http";
import { checkInsSchema, submitCheckIns } from "@/lib/mobile-api/organizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute({}, async ({ req, user }) =>
  submitCheckIns(user.id, parseOrThrow(checkInsSchema, await jsonBody(req))),
);
