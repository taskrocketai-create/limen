import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";
import {
  PREVIEW_MODE,
  MOCK_LISTINGS,
  MOCK_NOTIFICATIONS,
  MOCK_REALTOR_NAME,
} from "@/utils/preview-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // ── Preview mode — no Supabase credentials needed ──────────────────────
  if (PREVIEW_MODE) {
    const metrics = {
      total: MOCK_LISTINGS.length,
      intakePending: MOCK_LISTINGS.filter((l) => l.status === "intake_pending").length,
      intakeReceived: MOCK_LISTINGS.filter((l) => l.status === "intake_received").length,
      aiReady: MOCK_LISTINGS.filter((l) => l.status === "ai_ready").length,
      submitted: MOCK_LISTINGS.filter((l) => l.status === "submitted").length,
    };
    return (
      <DashboardClient
        listings={MOCK_LISTINGS}
        notifications={MOCK_NOTIFICATIONS}
        realtorName={MOCK_REALTOR_NAME}
        metrics={metrics}
      />
    );
  }

  // ── Production ─────────────────────────────────────────────────────────
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: listingsData } = await supabase
    .from("listings")
    .select(
      "id, address_line1, city, state, zip, price, bedrooms, bathrooms, sqft, property_type, status, intake_completed_at, created_at"
    )
    .eq("realtor_id", user.id)
    .order("created_at", { ascending: false });

  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("id, listing_id, type, message, read, created_at")
    .eq("realtor_id", user.id)
    .order("read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(30);

  const listings = listingsData ?? [];
  const notifications = notificationsData ?? [];

  const metrics = {
    total: listings.length,
    intakePending: listings.filter((l) => l.status === "intake_pending").length,
    intakeReceived: listings.filter((l) => l.status === "intake_received").length,
    aiReady: listings.filter((l) => l.status === "ai_ready").length,
    submitted: listings.filter((l) => l.status === "submitted").length,
  };

  return (
    <DashboardClient
      listings={listings}
      notifications={notifications}
      realtorName={profile?.full_name ?? "Realtor"}
      metrics={metrics}
    />
  );
}
