// Route for /api/mobile/v1/membership/card. See docs/mobile-api-contract.md.
import { apiRoute } from "@/lib/mobile-api/http";
import { getCardToken } from "@/lib/mobile-api/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({}, ({ user }) => getCardToken(user.id));
