"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface ProfileData {
  stripe_subscription_status: string | null;
  stripe_customer_id: string | null;
  approved_packages_this_month: number;
}

export default function BillingPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("stripe_subscription_status, stripe_customer_id, approved_packages_this_month")
      .single()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        setProfile(data);
        setLoading(false);
      });
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const statusLabel: Record<string, { label: string; color: string }> = {
    trialing: { label: "Free trial active", color: "text-gilt bg-gilt/10 border-gilt/30" },
    active: { label: "Active", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    past_due: { label: "Payment past due", color: "text-red-700 bg-red-50 border-red-200" },
    canceled: { label: "Canceled", color: "text-stone bg-stone/10 border-stone/20" },
    unpaid: { label: "Unpaid", color: "text-red-700 bg-red-50 border-red-200" },
  };

  const status = profile?.stripe_subscription_status ?? "none";
  const statusInfo = statusLabel[status] ?? { label: "No subscription", color: "text-stone bg-stone/10 border-stone/20" };

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-ink px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-gilt font-serif text-xl tracking-widest">LIMEN</Link>
        <Link href="/dashboard" className="text-parchment text-sm opacity-70 hover:opacity-100 font-sans">← Dashboard</Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="font-serif text-4xl text-ink">Billing</h1>
          <p className="font-sans text-sm text-stone mt-1">Manage your Limen subscription and payment method.</p>
        </div>

        {loading ? (
          <div className="bg-white border border-stone/20 rounded-lg p-8 text-center">
            <p className="font-sans text-sm text-stone">Loading billing details…</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Subscription status */}
            <div className="bg-white border border-stone/20 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-ink">Subscription</h2>
                <span className={`font-sans text-xs px-3 py-1 rounded-full border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between font-sans text-sm">
                  <span className="text-stone">Plan</span>
                  <span className="text-ink font-medium">Limen Solo — $49/mo</span>
                </div>
                <div className="flex justify-between font-sans text-sm">
                  <span className="text-stone">Approved packages this month</span>
                  <span className="text-ink font-medium">{profile?.approved_packages_this_month ?? 0} / 20</span>
                </div>
                <div className="flex justify-between font-sans text-sm">
                  <span className="text-stone">Additional packages</span>
                  <span className="text-ink font-medium">$5 each</span>
                </div>
              </div>

              {status === "trialing" && (
                <div className="bg-gilt/10 border border-gilt/30 rounded-md px-4 py-3">
                  <p className="font-sans text-sm text-ink">
                    Your free trial is active. You won&apos;t be charged until your trial ends.
                    Add or update your payment method below.
                  </p>
                </div>
              )}

              {status === "past_due" && (
                <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3">
                  <p className="font-sans text-sm text-red-700">
                    Your last payment failed. Please update your payment method to keep access.
                  </p>
                </div>
              )}

              {error && (
                <p className="font-sans text-xs text-red-600">{error}</p>
              )}

              <button
                onClick={handlePortal}
                disabled={portalLoading || !profile?.stripe_customer_id}
                className="w-full bg-ink text-gilt py-3 font-sans text-xs tracking-widest uppercase hover:bg-gilt hover:text-ink transition-colors disabled:opacity-50"
              >
                {portalLoading ? "Opening billing portal…" : "Manage payment method & invoices →"}
              </button>

              {!profile?.stripe_customer_id && (
                <p className="font-sans text-xs text-stone text-center">
                  No billing account found.{" "}
                  <Link href="/subscribe" className="text-gilt hover:underline">Subscribe here</Link>
                </p>
              )}
            </div>

            {/* Agency pricing note */}
            <div className="bg-white border border-stone/20 rounded-lg p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-ink">Agency pricing</h2>
                <Link href="/settings" className="font-sans text-xs text-gilt hover:underline">
                  Manage agency →
                </Link>
              </div>
              <p className="font-sans text-sm text-stone">
                Invite agents from Settings → Agency. Pricing drops automatically as your team grows.
              </p>
              <div className="space-y-1.5">
                {[
                  ["1 agent", "$49/mo"],
                  ["2–5 agents", "$44/agent/mo"],
                  ["6–10 agents", "$39/agent/mo"],
                  ["11–20 agents", "$34/agent/mo"],
                  ["21+ agents", "$29/agent/mo"],
                ].map(([agents, price]) => (
                  <div key={agents} className="flex justify-between font-sans text-sm">
                    <span className="text-stone">{agents}</span>
                    <span className="text-ink">{price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="flex gap-6 justify-center">
              <Link href="/disclaimer" className="font-sans text-xs text-stone/50 hover:text-stone">Disclaimer & Legal</Link>
              <Link href="/dashboard" className="font-sans text-xs text-stone/50 hover:text-stone">Back to Dashboard</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
