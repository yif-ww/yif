// Route for /api/mobile/v1/payments. See docs/mobile-api-contract.md.
import { apiRoute, parseOrThrow, queryOf } from "@/lib/mobile-api/http";
import { listPayments } from "@/lib/mobile-api/services";
import { pageQuerySchema } from "@/lib/mobile-api/pagination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({}, ({ req, user }) =>
  listPayments(user.id, parseOrThrow(pageQuerySchema, queryOf(req))),
);
