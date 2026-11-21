// Route for GET /api/mobile/v1/notifications. See docs/mobile-api-contract.md.
import { apiRoute, parseOrThrow, queryOf } from "@/lib/mobile-api/http";
import { listNotifications } from "@/lib/mobile-api/notifications";
import { pageQuerySchema } from "@/lib/mobile-api/pagination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({}, ({ req, user }) =>
  listNotifications(user.id, parseOrThrow(pageQuerySchema, queryOf(req))),
);
