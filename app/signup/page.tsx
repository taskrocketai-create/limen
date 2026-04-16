"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { createClient } from "@/utils/supabase/client";
import { PREVIEW_MODE } from "@/utils/preview-data";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (PREVIEW_MODE) {
      router.push("/dashboard");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setConfirmed(true);
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <Wordmark size={40} variant="primary" />
          <div className="bg-midnight border border-stone/20 p-8 space-y-4">
            <h1 className="font-display text-3xl text-parchment">Check your email</h1>
            <p className="font-sans text-sm text-stone leading-relaxed">
              We sent a confirmation link to <span className="text-parchment">{email}</span>.
              Click it to activate your account.
            </p>
            <Link
              href="/login"
              className="block font-sans text-xs text-gilt hover:opacity-80 transition-opacity mt-4"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-4">
          <Wordmark size={40} variant="primary" />
        </div>

        <div className="bg-midnight border border-stone/20 p-8 space-y-6">
          <h1 className="font-display text-3xl text-parchment">Create account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-sans text-xs text-stone uppercase tracking-wider" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-ink border border-stone/30 text-parchment font-sans text-sm px-4 py-3 focus:outline-none focus:border-gilt placeholder:text-stone/50"
                placeholder="Jane Smith"
              />
            </div>

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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ink border border-stone/30 text-parchment font-sans text-sm px-4 py-3 focus:outline-none focus:border-gilt placeholder:text-stone/50"
                placeholder="8+ characters"
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="font-sans text-xs text-stone text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-gilt hover:opacity-80 transition-opacity">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
