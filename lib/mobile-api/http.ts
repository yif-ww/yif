// lib/mobile-api/http.ts — shared request handling for /api/mobile/v1.
//
// Every route is wrapped in `apiRoute`, which gives all of them the same
// behaviour: one error shape, input validation errors as 400, a signed-in
// check, and no stack traces or internals in responses.
// The full contract is in docs/mobile-api-contract.md.

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { auth } from "@/lib/auth";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const notFound = (what = "That") =>
  new ApiError(404, "NOT_FOUND", `${what} was not found.`);

export function errorResponse(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): Response {
  return NextResponse.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function fromZod(error: ZodError): ApiError {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return new ApiError(400, "VALIDATION_FAILED", "Some details are not valid.", fields);
}

/** Parses and validates with Zod, turning failures into a 400 for the app. */
export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw fromZod(result.error);
  return result.data;
}

export function queryOf(req: Request): Record<string, string> {
  return Object.fromEntries(new URL(req.url).searchParams.entries());
}

export async function jsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "VALIDATION_FAILED", "The request body must be valid JSON.");
  }
}

export type SignedInUser = { id: string; email: string; name: string };

/**
 * The member making the request, from the `Authorization: Bearer` header
 * (or the web session cookie). Throws 401 if there is none.
 */
export async function requireUser(req: Request): Promise<SignedInUser> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    throw new ApiError(401, "UNAUTHENTICATED", "Please sign in again.");
  }
  if (session.user.banned) {
    throw new ApiError(403, "FORBIDDEN", "This account has been suspended.");
  }
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

type Cache = "private" | "public";

type RouteOptions = {
  /** "required" (default) needs a signed-in member. "none" is open to anyone. */
  auth?: "required" | "none";
  /** Public data may be cached briefly by the host's CDN. */
  cache?: Cache;
};

type Handler<P> = (ctx: {
  req: Request;
  user: SignedInUser;
  params: P;
}) => Promise<unknown>;

/** Wraps a route handler with authentication, error handling and JSON output. */
export function apiRoute<P = Record<string, never>>(
  options: RouteOptions,
  handler: Handler<P>,
) {
  return async (
    req: Request,
    context: { params?: Promise<P> } = {},
  ): Promise<Response> => {
    try {
      const user =
        (options.auth ?? "required") === "required"
          ? await requireUser(req)
          : ({ id: "", email: "", name: "" } satisfies SignedInUser);
      const params = (await context.params) ?? ({} as P);
      const result = await handler({ req, user, params });
      if (result instanceof Response) return result;
      if (result === undefined) return new Response(null, { status: 204 });

      const cacheControl =
        options.cache === "public"
          ? "public, s-maxage=60, stale-while-revalidate=300"
          : "private, no-store";
      return NextResponse.json(result, { headers: { "Cache-Control": cacheControl } });
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.status, err.code, err.message, err.fields);
      }
      if (err instanceof ZodError) {
        const e = fromZod(err);
        return errorResponse(e.status, e.code, e.message, e.fields);
      }
      console.error("[mobile api] unexpected error:", err);
      return errorResponse(500, "INTERNAL", "Something went wrong. Please try again.");
    }
  };
}
