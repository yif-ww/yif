// Route for /api/mobile/v1/payments/{reference}. See docs/mobile-api-contract.md.
import { apiRoute } from "@/lib/mobile-api/http";
import { getPayment } from "@/lib/mobile-api/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute<{ reference: string }>({}, ({ user, params }) =>
  getPayment(user.id, params.reference),
);
