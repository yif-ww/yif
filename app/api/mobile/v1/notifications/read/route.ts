// Route for POST /api/mobile/v1/notifications/read. See docs/mobile-api-contract.md.
import { apiRoute, jsonBody, parseOrThrow } from "@/lib/mobile-api/http";
import { markRead, markReadSchema } from "@/lib/mobile-api/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute({}, async ({ req, user }) => {
  await markRead(user.id, parseOrThrow(markReadSchema, await jsonBody(req)));
});
