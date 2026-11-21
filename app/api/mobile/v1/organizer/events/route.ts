// Route for GET /api/mobile/v1/organizer/events. See docs/mobile-api-contract.md.
import { apiRoute } from "@/lib/mobile-api/http";
import { listOrganizerEvents } from "@/lib/mobile-api/organizer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute({}, ({ user }) => listOrganizerEvents(user.id));
