import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/cart", "/checkout", "/orders"];
const COOKIE_NAME = "session";

// The web equivalent of the mobile app's RootNavigator switching stacks on
// session presence (ARCHITECTURE_PLAN.md §1) — redirects unauthenticated
// requests off protected routes before they render.
//
// This only checks that the session cookie is present, not that it's a
// valid, unexpired JWT: middleware runs on the Edge runtime by default,
// and jsonwebtoken's verify() needs Node's crypto module, which isn't
// available there. Real verification happens in requireUser() inside each
// Route Handler / Server Component the request actually reaches — this is
// a fast, presence-only gate, not the source of truth.
export function middleware(req: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cart/:path*", "/checkout/:path*", "/orders/:path*"],
};
