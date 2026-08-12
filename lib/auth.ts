// Stateless signed session tokens (HMAC-SHA256 over an expiry timestamp),
// used for the "remember me" login cookie. Built on the Web Crypto API
// (globalThis.crypto.subtle) rather than Node's `crypto` module because
// this needs to run in both a normal Node route handler AND Next.js
// middleware, which only supports the Edge runtime in this Next.js
// version -- Web Crypto is available in both.

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/** Creates a signed token of the form "<expiresAtMs>.<hexHmac>". No session
 * state is stored server-side -- verifying just checks the signature and
 * that expiresAt hasn't passed. */
export async function createSessionToken(secret: string, expiresAtMs: number): Promise<string> {
  const key = await importKey(secret);
  const payload = String(expiresAtMs);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${bufferToHex(sig)}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const sigHex = token.slice(dotIndex + 1);
  const expiresAtMs = Number(payload);
  if (!Number.isFinite(expiresAtMs) || Date.now() > expiresAtMs) return false;

  try {
    const key = await importKey(secret);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBuffer(sigHex) as BufferSource,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}

export const SESSION_COOKIE_NAME = "solodm_session";
export const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year
export const SESSION_ONLY_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours
