import { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  REMEMBER_ME_MAX_AGE_SECONDS,
  SESSION_ONLY_MAX_AGE_SECONDS,
} from "@/lib/auth";

export async function POST(req: Request) {
  let body: { username?: string; password?: string; rememberMe?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASSWORD;
  if (!expectedUser || !expectedPass) {
    // Auth isn't configured (e.g. local dev) -- there's nothing to log into.
    return NextResponse.json({ error: "Login is not enabled on this deployment." }, { status: 500 });
  }

  if (body.username !== expectedUser || body.password !== expectedPass) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET || expectedPass;
  const maxAgeSeconds = body.rememberMe ? REMEMBER_ME_MAX_AGE_SECONDS : SESSION_ONLY_MAX_AGE_SECONDS;
  const expiresAtMs = Date.now() + maxAgeSeconds * 1000;
  const token = await createSessionToken(secret, expiresAtMs);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // Setting maxAge even for the "not remembered" case (rather than
    // leaving it a true browser-session cookie) is deliberate: iOS Safari
    // home-screen PWAs can clear session-only cookies unpredictably
    // between launches, so a real (if short) expiry is more reliable than
    // relying on "the browser process stayed alive."
    maxAge: maxAgeSeconds,
  });
  return res;
}
