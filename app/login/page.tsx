"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Login failed.");
        setLoading(false);
        return;
      }
      // Full navigation (not router.push) so middleware re-evaluates with
      // the new cookie and everything on the target page loads fresh.
      window.location.href = returnTo;
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="h-[100dvh] flex items-center justify-center bg-ink-900 px-4">
      <form onSubmit={submit} className="w-full max-w-sm panel rounded-lg p-6 shadow-glow-gold">
        <h1 className="font-display text-4xl text-gold-bright mb-1 text-center">SoloDM</h1>
        <p className="text-xl text-parchment/50 mb-6 text-center">The Hollow Reach awaits.</p>

        <label className="block text-lg uppercase tracking-widest text-gold/70 mb-1">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          className="w-full mb-4 rounded bg-ink-900/60 border border-gold/20 px-3 py-2.5 text-2xl text-parchment focus:outline-none focus:ring-1 focus:ring-gold"
        />

        <label className="block text-lg uppercase tracking-widest text-gold/70 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full mb-4 rounded bg-ink-900/60 border border-gold/20 px-3 py-2.5 text-2xl text-parchment focus:outline-none focus:ring-1 focus:ring-gold"
        />

        <label className="flex items-center gap-2 mb-5 text-xl text-parchment/70 select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 accent-scarlight"
          />
          Remember me on this device
        </label>

        {error && (
          <div className="mb-4 rounded bg-blood-dark/40 border border-blood-light/40 text-parchment text-xl px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full min-h-[44px] rounded-md bg-blood hover:bg-blood-light disabled:opacity-40 text-parchment text-xl font-medium shadow-glow-blood"
        >
          {loading ? "Entering…" : "Enter"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
