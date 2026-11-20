// Route for /api/mobile/v1/tickets/{id}. See docs/mobile-api-contract.md.
import { apiRoute } from "@/lib/mobile-api/http";
import { getTicket } from "@/lib/mobile-api/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute<{ id: string }>({}, ({ user, params }) =>
  getTicket(user.id, params.id),
);
