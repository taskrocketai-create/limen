import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Fetch listings
  const { data: listings = [] } = await supabase
    .from("listings")
    .select(
      "id, address_line1, city, state, zip, price, bedrooms, bathrooms, sqft, property_type, status, intake_completed_at, created_at"
    )
    .eq("realtor_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch notifications (latest 30, unread first)
  const { data: notifications = [] } = await supabase
    .from("notifications")
    .select("id, listing_id, type, message, read, created_at")
    .eq("realtor_id", user.id)
    .order("read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(30);

  const safeListings = listings ?? [];

  const metrics = {
    total: safeListings.length,
    intakePending: safeListings.filter((l) => l.status === "intake_pending").length,
    intakeReceived: safeListings.filter((l) => l.status === "intake_received").length,
    aiReady: safeListings.filter((l) => l.status === "ai_ready").length,
    submitted: safeListings.filter((l) => l.status === "submitted").length,
  };

  return (
    <DashboardClient
      listings={safeListings}
      notifications={notifications ?? []}
      realtorName={profile?.full_name ?? "Realtor"}
      metrics={metrics}
    />
  );
}
