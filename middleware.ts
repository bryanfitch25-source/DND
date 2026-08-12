import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// This app is deployed on a public URL, so anything that isn't gated could
// be hit by a stranger who finds/guesses it -- and every request that
// reaches app/api/turn spends real Anthropic API credits. A signed session
// cookie (set at /login) gates everything else; if BASIC_AUTH_USER/
// BASIC_AUTH_PASSWORD aren't set (e.g. local dev), the app is left open,
// matching the original local-only design.
export async function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET || pass;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token, secret) : false;

  if (valid) return NextResponse.next();

  // API routes get a clean 401 (the app's own fetch() calls handle JSON,
  // not an HTML redirect); page loads redirect to the login screen.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("returnTo", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except Next's own static/image assets and the PWA
  // manifest/icons (so "Add to Home Screen" metadata is always fetchable).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon-192.png|icon-512.png|apple-touch-icon.png|manifest.webmanifest).*)",
  ],
};
