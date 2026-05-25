"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import Logo from "@/components/brand/Logo";
import ListingCard from "@/components/dashboard/ListingCard";
import NotificationBar from "@/components/dashboard/NotificationBar";
import type { ListingStatus, PropertyType } from "@/types/database";
import type { NotificationType } from "@/types/database";

interface Listing {
  id: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  property_type: PropertyType | null;
  status: ListingStatus;
  intake_completed_at: string | null;
  created_at: string;
}

interface Notification {
  id: string;
  listing_id: string | null;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

interface DashboardMetrics {
  total: number;
  intakePending: number;
  intakeReceived: number;
  aiReady: number;
  submitted: number;
}

import OnboardingPrompt from "@/components/dashboard/OnboardingPrompt";

interface DashboardClientProps {
  listings: Listing[];
  notifications: Notification[];
  realtorName: string;
  metrics: DashboardMetrics;
  subscriptionStatus?: string | null;
  onboardingCompleted?: boolean;
}

const FILTER_TABS: { label: string; value: "all" | ListingStatus }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Intake pending", value: "intake_pending" },
  { label: "Intake received", value: "intake_received" },
  { label: "AI ready", value: "ai_ready" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Submitted", value: "submitted" },
  { label: "Sold / Archived", value: "sold" },
];

export default function DashboardClient({
  listings,
  notifications: initialNotifications,
  realtorName,
  metrics,
  subscriptionStatus,
  onboardingCompleted,
}: DashboardClientProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | ListingStatus>("all");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let result = listings;

    if (activeFilter !== "all") {
      result = result.filter((l) =>
        activeFilter === "sold"
          ? l.status === "sold" || l.status === "archived"
          : l.status === activeFilter
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.address_line1.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.zip.includes(q)
      );
    }

    return result;
  }, [listings, activeFilter, search]);

  function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    startTransition(async () => {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    });
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    startTransition(async () => {
      await fetch("/api/notifications/read-all", { method: "POST" });
    });
  }

  const firstName = realtorName.split(" ")[0];

  return (
    <div className="min-h-screen bg-parchment">

      {/* Trial banner */}
      {subscriptionStatus === "trialing" && (
        <div className="bg-gilt text-ink px-6 py-2 flex items-center justify-between">
          <p className="font-sans text-xs font-medium">
            Your 14-day free trial is active. You will not be charged until your trial ends.
          </p>
          <a href="/settings/billing" className="font-sans text-xs underline hover:no-underline flex-shrink-0 ml-4">
            Manage billing →
          </a>
        </div>
      )}

      {/* Past due banner */}
      {subscriptionStatus === "past_due" && (
        <div className="bg-red-600 text-white px-6 py-2 flex items-center justify-between">
          <p className="font-sans text-xs font-medium">
            Your payment failed. Update your payment method to keep access.
          </p>
          <a href="/settings/billing" className="font-sans text-xs underline hover:no-underline flex-shrink-0 ml-4">
            Update payment →
          </a>
        </div>
      )}

      {/* Top nav */}
      <header className="bg-ink border-b border-ink sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Logo size={32} variant="primary" label="Limen" />
            <span className="font-display text-gilt text-xl tracking-wide hidden sm:block">
              Limen
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <NotificationBar
              notifications={notifications}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
            />
            <Link
              href="/settings"
              className="w-8 h-8 rounded-full bg-gilt/20 flex items-center justify-center font-sans text-sm font-medium text-gilt hover:bg-gilt/30 transition-colors"
              aria-label="Settings"
            >
              {firstName[0]}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Onboarding prompt for users who haven't set up their brand */}
        {!onboardingCompleted && <OnboardingPrompt />}

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-ink">
              Good morning, {firstName}.
            </h1>
            <p className="font-sans text-sm text-stone mt-1">
              {metrics.total} listing{metrics.total !== 1 ? "s" : ""} in your portfolio
            </p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gilt text-ink font-sans font-medium text-sm rounded-md hover:bg-gilt/90 transition-colors self-start sm:self-auto"
          >
            <span className="text-base leading-none">+</span>
            New listing
          </Link>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total", value: metrics.total },
            { label: "Intake pending", value: metrics.intakePending, amber: true },
            { label: "Intake received", value: metrics.intakeReceived, green: true },
            { label: "AI ready", value: metrics.aiReady, gilt: true },
            { label: "Submitted", value: metrics.submitted },
          ].map(({ label, value, amber, green, gilt: isGilt }) => (
            <div
              key={label}
              className="bg-white border border-stone/20 rounded-lg px-4 py-4"
            >
              <p
                className={`font-display text-3xl ${
                  amber
                    ? "text-amber-600"
                    : green
                    ? "text-emerald-600"
                    : isGilt
                    ? "text-gilt"
                    : "text-ink"
                }`}
              >
                {value}
              </p>
              <p className="font-sans text-xs text-stone mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone/50 w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Search by address, city, or zip…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone/20 rounded-md font-sans text-sm text-ink placeholder:text-stone/50 focus:outline-none focus:border-gilt focus:ring-1 focus:ring-gilt"
            />
          </div>

          {/* Filter tabs — horizontal scroll on mobile */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-md font-sans text-xs font-medium transition-colors ${
                  activeFilter === tab.value
                    ? "bg-ink text-gilt"
                    : "bg-white text-stone border border-stone/20 hover:border-stone/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg width="48" height="66" viewBox="0 0 36 50" fill="none" aria-hidden>
              <rect x="0" y="4" width="36" height="6" fill="#6B6456" opacity="0.3" />
              <rect x="0" y="4" width="6" height="46" fill="#6B6456" opacity="0.3" />
              <rect x="30" y="4" width="6" height="46" fill="#6B6456" opacity="0.3" />
            </svg>
            <p className="font-display text-2xl text-stone">
              {search ? "No listings match your search." : "No listings yet."}
            </p>
            {!search && (
              <Link
                href="/listings/new"
                className="font-sans text-sm text-gilt hover:underline"
              >
                Create your first listing →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
