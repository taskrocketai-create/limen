"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/brand/Logo";
import type { SubscriptionStatus } from "@/types/database";

interface ProfileData {
  full_name: string;
  license_number: string | null;
  brokerage: string | null;
  phone: string | null;
  stripe_subscription_status: SubscriptionStatus | null;
  stripe_customer_id: string | null;
}

interface SettingsClientProps {
  email: string;
  profile: ProfileData;
}

const inputCls =
  "w-full px-3 py-2.5 bg-white border border-stone/20 rounded-md font-sans text-sm text-ink placeholder:text-stone/40 focus:outline-none focus:border-gilt focus:ring-1 focus:ring-gilt transition-colors";
const labelCls = "block font-sans text-xs font-medium text-stone uppercase tracking-wider mb-1";

const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, { label: string; tone: string }> = {
  active: { label: "Active", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  trialing: { label: "Trial", tone: "text-gilt bg-gilt/10 border-gilt/30" },
  past_due: { label: "Past due", tone: "text-amber-700 bg-amber-50 border-amber-200" },
  canceled: { label: "Cancelled", tone: "text-stone bg-stone/10 border-stone/20" },
  incomplete: { label: "Incomplete", tone: "text-amber-700 bg-amber-50 border-amber-200" },
};

export default function SettingsClient({ email, profile }: SettingsClientProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    license_number: profile.license_number ?? "",
    brokerage: profile.brokerage ?? "",
    phone: profile.phone ?? "",
  });
  const [saving, startSave] = useTransition();
  const [portalLoading, startPortal] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const subStatus = profile.stripe_subscription_status;
  const subBadge = subStatus ? SUBSCRIPTION_LABELS[subStatus] : null;

  function saveProfile() {
    setMessage(null);
    startSave(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setMessage({ kind: "err", text: b.error ?? "Could not save." });
        return;
      }
      setMessage({ kind: "ok", text: "Profile saved." });
      router.refresh();
    });
  }

  function openBillingPortal() {
    startPortal(async () => {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setMessage({ kind: "err", text: b.error ?? "Could not open billing portal." });
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    });
  }

  async function signOut() {
    const res = await fetch("/api/auth/signout", { method: "POST", redirect: "manual" });
    // The route returns a redirect; we handle it manually for client navigation.
    if (res.type === "opaqueredirect" || res.status === 303 || res.ok) {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Nav */}
      <header className="bg-ink sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Logo size={28} variant="primary" label="Limen" />
            </Link>
            <span className="font-sans text-stone/60 text-xs hidden sm:block">/</span>
            <Link href="/dashboard" className="font-sans text-xs text-stone hover:text-parchment transition-colors hidden sm:block">
              Dashboard
            </Link>
            <span className="font-sans text-stone/60 text-xs hidden sm:block">/</span>
            <span className="font-sans text-xs text-parchment hidden sm:block">Settings</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">

        {/* Header */}
        <div>
          <h1 className="font-display text-4xl text-ink">Settings</h1>
          <p className="font-sans text-sm text-stone mt-1">{email}</p>
        </div>

        {/* Profile */}
        <section className="bg-white border border-stone/20 rounded-lg p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display text-2xl text-ink">Your profile</h2>
            <p className="font-sans text-sm text-stone mt-1">
              This information appears on your listings and communications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Full name</label>
              <input
                className={inputCls}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className={labelCls}>License number</label>
              <input
                className={inputCls}
                value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                placeholder="NC-123456"
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                className={inputCls}
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(910) 555-0100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Brokerage</label>
              <input
                className={inputCls}
                value={form.brokerage}
                onChange={(e) => setForm({ ...form, brokerage: e.target.value })}
                placeholder="Coastal Realty Group"
              />
            </div>
          </div>

          {message && (
            <div
              className={`p-3 border rounded-md ${
                message.kind === "ok"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <p className="font-sans text-sm">{message.text}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-5 py-2.5 bg-ink text-gilt font-sans text-sm font-medium rounded-md hover:bg-midnight transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </section>

        {/* Billing */}
        <section className="bg-white border border-stone/20 rounded-lg p-6 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-2xl text-ink">Billing</h2>
              <p className="font-sans text-sm text-stone mt-1">
                Manage your subscription, payment method, and invoices.
              </p>
            </div>
            {subBadge && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-sans font-medium border ${subBadge.tone}`}>
                {subBadge.label}
              </span>
            )}
          </div>

          {profile.stripe_customer_id ? (
            <button
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="px-5 py-2.5 border border-stone/30 text-ink font-sans text-sm font-medium rounded-md hover:border-gilt hover:text-gilt transition-colors disabled:opacity-60"
            >
              {portalLoading ? "Opening…" : "Open billing portal →"}
            </button>
          ) : (
            <div className="p-4 bg-parchment border border-stone/10 rounded-md">
              <p className="font-sans text-sm text-stone">
                You don&apos;t have an active subscription. Visit the pricing page to activate Limen for your business.
              </p>
            </div>
          )}
        </section>

        {/* Account */}
        <section className="bg-white border border-stone/20 rounded-lg p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="font-display text-2xl text-ink">Account</h2>
            <p className="font-sans text-sm text-stone mt-1">
              Sign out of this device.
            </p>
          </div>
          <button
            onClick={signOut}
            className="px-5 py-2.5 border border-stone/30 text-ink font-sans text-sm font-medium rounded-md hover:border-red-400 hover:text-red-700 transition-colors"
          >
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
}
