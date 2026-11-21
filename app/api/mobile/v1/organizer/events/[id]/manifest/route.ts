// Route for GET /api/mobile/v1/organizer/events/{id}/manifest. See docs/mobile-api-contract.md.
import { apiRoute } from "@/lib/mobile-api/http";
import { getManifest } from "@/lib/mobile-api/organizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>({}, ({ user, params }) => getManifest(user.id, params.id));
