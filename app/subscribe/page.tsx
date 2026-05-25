"use client";

import { useState } from "react";
import Link from "next/link";

const FEATURES = [
  "20 approved listing packages per month",
  "Drafts and edits always included",
  "AI vision analysis from listing photos",
  "Homeowner intake form — their story, your copy",
  "10-platform formatted content (MLS, Zillow, social + more)",
  "Open House Package with visual cards and QR code",
  "Fair Housing language review built in",
  "Style selection — Warm, Luxury, Modern, and more",
  "Agency billing with volume pricing",
  "Additional packages $5 each after 20",
];

const TIERS = [
  { agents: "1 agent", price: "$49", per: "/mo" },
  { agents: "2–5 agents", price: "$44", per: "/agent/mo" },
  { agents: "6–10 agents", price: "$39", per: "/agent/mo" },
  { agents: "11–20 agents", price: "$34", per: "/agent/mo" },
  { agents: "21+ agents", price: "$29", per: "/agent/mo" },
];

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SOLO;

      if (!priceId) {
        setError("Stripe is not configured. Please contact support.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: priceId }),
      });

      // Not logged in — redirect to login first
      if (res.status === 401) {
        window.location.href = "/login?redirectTo=/subscribe";
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-ink px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-gilt font-serif text-xl tracking-widest">LIMEN</Link>
        <Link href="/login" className="text-parchment text-sm opacity-70 hover:opacity-100 font-sans">Sign in</Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="font-serif text-5xl text-ink">The Listing Launch Agent</h1>
          <p className="font-sans text-lg text-stone max-w-xl mx-auto leading-relaxed">
            From homeowner story to platform-ready listing package. Built for the first wave of listing marketing.
          </p>
        </div>

        {/* Pricing card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Main plan */}
          <div className="bg-ink rounded-2xl overflow-hidden">
            <div className="p-8 space-y-6">
              <div>
                <p className="font-sans text-xs tracking-widest uppercase text-gilt/70 mb-2">Limen Solo</p>
                <div className="flex items-end gap-2">
                  <span className="font-serif text-5xl text-gilt">$49</span>
                  <span className="font-sans text-stone pb-2">/month</span>
                </div>
                <p className="font-sans text-sm text-parchment/60 mt-2">
                  14-day free trial · Cancel anytime
                </p>
              </div>

              <div className="space-y-3">
                {FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-gilt mt-0.5 flex-shrink-0">✓</span>
                    <span className="font-sans text-sm text-parchment/80">{f}</span>
                  </div>
                ))}
              </div>

              {error && (
                <p className="font-sans text-xs text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">{error}</p>
              )}

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-gilt text-ink py-4 font-sans text-sm font-medium tracking-widest uppercase hover:bg-parchment transition-colors disabled:opacity-50 rounded-lg"
              >
                {loading ? "Redirecting…" : "Start free trial →"}
              </button>

              <p className="font-sans text-xs text-parchment/40 text-center">
                Card required to start trial. You won&apos;t be charged until day 15.
              </p>
            </div>
          </div>

          {/* Right side — agency pricing + trust */}
          <div className="space-y-6">
            {/* Agency tiers */}
            <div className="bg-white border border-stone/20 rounded-xl p-6 space-y-4">
              <h3 className="font-serif text-xl text-ink">Agency pricing</h3>
              <p className="font-sans text-sm text-stone">Invite your team. Pricing drops automatically as agents join.</p>
              <div className="space-y-2">
                {TIERS.map((tier, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 border-b border-stone/10 ${i === 0 ? "opacity-50" : ""}`}>
                    <span className="font-sans text-sm text-stone">{tier.agents}</span>
                    <span className="font-serif text-lg text-gilt">{tier.price}<span className="font-sans text-xs text-stone">{tier.per}</span></span>
                  </div>
                ))}
              </div>
              <p className="font-sans text-xs text-stone/50">Start solo at $49. Invite agents from Settings → Agency.</p>
            </div>

            {/* Trust signals */}
            <div className="bg-white border border-stone/20 rounded-xl p-6 space-y-4">
              <h3 className="font-serif text-xl text-ink">Built for realtors</h3>
              <div className="space-y-3">
                {[
                  "No prompt engineering. Limen walks you through it.",
                  "Fair Housing review built into every generated package.",
                  "Works on any listing — residential, luxury, land, investor.",
                  "Approved packages locked and ready for your records.",
                  "Cancel anytime from your account settings.",
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-gilt flex-shrink-0 mt-0.5">→</span>
                    <span className="font-sans text-sm text-stone">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Student offer */}
            <div className="bg-parchment border border-stone/20 rounded-xl p-5 space-y-2">
              <p className="font-sans text-xs tracking-widest uppercase text-stone">Student offer</p>
              <p className="font-sans text-sm text-ink">
                Real estate students receive a reward after approving their first listing package — a 50% discount code emailed automatically.
              </p>
              <Link href="/signup?student=true" className="font-sans text-xs text-gilt hover:underline">
                Sign up with a school code →
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="font-serif text-3xl text-ink text-center">Common questions</h2>
          {[
            {
              q: "What counts as an approved listing package?",
              a: "Only when you click 'Approve & Lock Listing.' Drafts, edits, and regenerations are always free. You're only counted when you approve.",
            },
            {
              q: "What happens after my 20 packages?",
              a: "Additional approved packages are $5 each. You'll see your usage in the meter at the bottom of every listing page.",
            },
            {
              q: "Can I cancel during my trial?",
              a: "Yes. Cancel any time from Settings → Billing before day 15 and you won't be charged.",
            },
            {
              q: "Does Limen post directly to social media?",
              a: "Limen creates ready-to-publish content for every major platform — formatted, styled, and downloadable as images. Direct posting is on the roadmap.",
            },
            {
              q: "Is this Fair Housing compliant?",
              a: "Every piece of generated copy goes through an automated Fair Housing review before you see it. Risky language is rewritten automatically. You're still responsible for final review before publishing.",
            },
          ].map((faq, i) => (
            <div key={i} className="border-b border-stone/20 pb-5 space-y-2">
              <p className="font-serif text-lg text-ink">{faq.q}</p>
              <p className="font-sans text-sm text-stone leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center space-y-4">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-ink text-gilt px-12 py-4 font-sans text-sm tracking-widest uppercase hover:bg-gilt hover:text-ink transition-colors disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Start your 14-day free trial"}
          </button>
          <p className="font-sans text-xs text-stone">
            Already have an account?{" "}
            <Link href="/login" className="text-gilt hover:underline">Sign in</Link>
            {" · "}
            <Link href="/disclaimer" className="text-stone/50 hover:text-stone">Disclaimer & Legal</Link>
          </p>
        </div>

      </main>
    </div>
  );
}
