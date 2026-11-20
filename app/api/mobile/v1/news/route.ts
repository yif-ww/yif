// Route for /api/mobile/v1/news. See docs/mobile-api-contract.md.
import { apiRoute, parseOrThrow, queryOf } from "@/lib/mobile-api/http";
import { listNews, newsQuerySchema } from "@/lib/mobile-api/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({ auth: "none", cache: "public" }, ({ req }) =>
  listNews(parseOrThrow(newsQuerySchema, queryOf(req))),
);
