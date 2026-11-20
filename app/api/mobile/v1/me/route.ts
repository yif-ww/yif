// Route for /api/mobile/v1/me. See docs/mobile-api-contract.md.
import { apiRoute, jsonBody, parseOrThrow } from "@/lib/mobile-api/http";
import { getMe, updateMe, updateMeSchema } from "@/lib/mobile-api/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({}, ({ user }) => getMe(user.id));

export const PATCH = apiRoute({}, async ({ req, user }) =>
  updateMe(user.id, parseOrThrow(updateMeSchema, await jsonBody(req))),
);
