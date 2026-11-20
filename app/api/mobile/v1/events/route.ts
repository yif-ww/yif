// Route for /api/mobile/v1/events. See docs/mobile-api-contract.md.
import { apiRoute, parseOrThrow, queryOf } from "@/lib/mobile-api/http";
import { listEvents, eventsQuerySchema } from "@/lib/mobile-api/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({}, ({ req }) =>
  listEvents(parseOrThrow(eventsQuerySchema, queryOf(req))),
);
