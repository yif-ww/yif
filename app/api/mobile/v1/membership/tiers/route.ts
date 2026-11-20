// Route for /api/mobile/v1/membership/tiers. See docs/mobile-api-contract.md.
import { apiRoute, parseOrThrow, queryOf } from "@/lib/mobile-api/http";
import { getTiers, tiersQuerySchema } from "@/lib/mobile-api/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({}, ({ req, user }) =>
  getTiers(user.id, parseOrThrow(tiersQuerySchema, queryOf(req))),
);
