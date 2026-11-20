// Route for /api/mobile/v1/tickets. See docs/mobile-api-contract.md.
import { apiRoute, parseOrThrow, queryOf } from "@/lib/mobile-api/http";
import { listTickets } from "@/lib/mobile-api/services";
import { pageQuerySchema } from "@/lib/mobile-api/pagination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({}, ({ req, user }) =>
  listTickets(user.id, parseOrThrow(pageQuerySchema, queryOf(req))),
);
