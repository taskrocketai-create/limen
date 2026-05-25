"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { createClient } from "@/utils/supabase/client";
import { PREVIEW_MODE } from "@/utils/preview-data";

function SignupForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (PREVIEW_MODE) { router.push("/dashboard"); return; }
    if (!licenseNumber.trim()) {
      setError("Real estate license number is required.");
      return;
    }
    if (!/^\d{6}$/.test(licenseNumber.trim())) {
      setError("NC real estate license numbers are 6 digits (e.g. 123456). Please check your number.");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          license_number: licenseNumber,
          brokerage,
          phone,
          school_code: schoolCode || null,
        },
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("profiles")
        .update({
          license_number: licenseNumber,
          brokerage,
          phone,
        })
        .eq("id", authData.user.id);
    }

    setLoading(false);
    setConfirmed(true);
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
              Click it to activate your account, then sign in to start your 14-day free trial.
            </p>
            <Link href="/login" className="block font-sans text-xs text-gilt hover:opacity-80 transition-opacity mt-4">
              Back to sign in →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Wordmark size={40} variant="primary" />
        </div>

        <div className="bg-midnight border border-stone/20 p-8 space-y-5">
          <h1 className="font-display text-3xl text-parchment">Create account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="font-sans text-xs text-stone tracking-widest uppercase">Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-ink border border-stone/30 px-3 py-2.5 font-sans text-sm text-parchment focus:outline-none focus:border-gilt rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-sans text-xs text-stone tracking-widest uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-ink border border-stone/30 px-3 py-2.5 font-sans text-sm text-parchment focus:outline-none focus:border-gilt rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-sans text-xs text-stone tracking-widest uppercase">
                NC Real estate license number <span className="text-gilt">*</span>
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={e => setLicenseNumber(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                placeholder="6-digit license number"
                maxLength={6}
                className="w-full bg-ink border border-stone/30 px-3 py-2.5 font-sans text-sm text-parchment focus:outline-none focus:border-gilt rounded"
              />
              <p className="font-sans text-xs text-stone/50">NC licenses are 6 digits — numbers only</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-sans text-xs text-stone tracking-widest uppercase">Brokerage</label>
                <input
                  type="text"
                  value={brokerage}
                  onChange={e => setBrokerage(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-ink border border-stone/30 px-3 py-2.5 font-sans text-sm text-parchment focus:outline-none focus:border-gilt rounded"
                />
              </div>
              <div className="space-y-1">
                <label className="font-sans text-xs text-stone tracking-widest uppercase">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-ink border border-stone/30 px-3 py-2.5 font-sans text-sm text-parchment focus:outline-none focus:border-gilt rounded"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-sans text-xs text-stone tracking-widest uppercase">
                School code <span className="normal-case tracking-normal text-stone/50">(optional — for real estate students)</span>
              </label>
              <input
                type="text"
                value={schoolCode}
                onChange={e => setSchoolCode(e.target.value)}
                placeholder="Enter your school's referral code"
                className="w-full bg-ink border border-stone/30 px-3 py-2.5 font-sans text-sm text-parchment focus:outline-none focus:border-gilt rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-sans text-xs text-stone tracking-widest uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-ink border border-stone/30 px-3 py-2.5 font-sans text-sm text-parchment focus:outline-none focus:border-gilt rounded"
              />
              <p className="font-sans text-xs text-stone/50">Minimum 8 characters</p>
            </div>

            {error && (
              <p className="font-sans text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gilt text-ink py-3 font-sans text-sm font-medium tracking-widest uppercase hover:bg-parchment transition-colors disabled:opacity-50 rounded"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="font-sans text-xs text-stone text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-gilt hover:opacity-80 transition-opacity">Sign in</Link>
          </p>

          <p className="font-sans text-xs text-stone/40 text-center leading-relaxed">
            By creating an account you agree to our{" "}
            <Link href="/privacy-policy" className="hover:text-stone">Privacy Policy</Link>
            {" "}and{" "}
            <Link href="/disclaimer" className="hover:text-stone">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
