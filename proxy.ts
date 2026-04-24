import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 proxy (replaces deprecated middleware.ts).
 * Runs on Node.js runtime — but we keep it lightweight by checking the
 * Better Auth session cookie instead of hitting the database on every request.
 * Full session validation (with DB) happens inside each protected page/layout.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Better Auth sets this cookie on sign-in.
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin role check cannot be done here without a DB call.
  // Each admin page server component handles it with auth.api.getSession().
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
