// Route for /api/mobile/v1/news/{slug}. See docs/mobile-api-contract.md.
import { apiRoute } from "@/lib/mobile-api/http";
import { getPost } from "@/lib/mobile-api/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute<{ slug: string }>({ auth: "none", cache: "public" }, ({ params }) =>
  getPost(params.slug),
);
