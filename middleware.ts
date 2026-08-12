import { NextResponse, type NextRequest } from "next/server";

// This app is deployed on a public URL, so anything that isn't gated could
// be hit by a stranger who finds/guesses it -- and every request that
// reaches app/api/turn spends real Anthropic API credits. HTTP Basic Auth
// is a deliberately simple gate for a single-player personal app: if
// BASIC_AUTH_USER/BASIC_AUTH_PASSWORD aren't set (e.g. local dev), the app
// is left open, matching the original local-only design.
export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const suppliedUser = decoded.slice(0, separatorIndex);
    const suppliedPass = decoded.slice(separatorIndex + 1);
    if (suppliedUser === user && suppliedPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="SoloDM"' },
  });
}

export const config = {
  // Everything except Next's own static/image assets -- API routes need to
  // be gated too, not just pages.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
