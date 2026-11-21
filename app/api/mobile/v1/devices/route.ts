// Route for POST and DELETE /api/mobile/v1/devices. See docs/mobile-api-contract.md.
import { apiRoute, jsonBody, parseOrThrow } from "@/lib/mobile-api/http";
import {
  deviceRemoveSchema,
  deviceSchema,
  registerDevice,
  unregisterDevice,
} from "@/lib/mobile-api/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute({}, async ({ req, user }) => {
  await registerDevice(user.id, parseOrThrow(deviceSchema, await jsonBody(req)));
});

export const DELETE = apiRoute({}, async ({ req, user }) => {
  await unregisterDevice(user.id, parseOrThrow(deviceRemoveSchema, await jsonBody(req)));
});
