"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { createClient } from "@/utils/supabase/client";
import { PREVIEW_MODE } from "@/utils/preview-data";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (PREVIEW_MODE) {
      router.push(redirectTo);
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      router.push(redirectTo);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <Wordmark size={40} variant="primary" />
        </div>

        <div className="bg-midnight border border-stone/20 p-8 space-y-6">
          <h1 className="font-display text-3xl text-parchment">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-sans text-xs text-stone uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ink border border-stone/30 text-parchment font-sans text-sm px-4 py-3 focus:outline-none focus:border-gilt placeholder:text-stone/50"
                placeholder="you@brokerage.com"
              />
            </div>

            <div className="space-y-1">
              <label className="font-sans text-xs text-stone uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink border border-stone/30 text-parchment font-sans text-sm px-4 py-3 focus:outline-none focus:border-gilt placeholder:text-stone/50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="font-sans text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gilt text-ink font-sans text-sm py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="font-sans text-xs text-stone text-center">
            No account?{" "}
            <Link href="/signup" className="text-gilt hover:opacity-80 transition-opacity">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
