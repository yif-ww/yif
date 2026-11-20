// Route for /api/mobile/v1/news/topics. See docs/mobile-api-contract.md.
import { apiRoute } from "@/lib/mobile-api/http";
import { listTopics } from "@/lib/mobile-api/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({ auth: "none", cache: "public" }, () => listTopics());
