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
    .single();

  const { data: listings = [] } = await supabase
    .from("listings")
    .select(
      "id, address_line1, city, state, zip, price, bedrooms, bathrooms, sqft, property_type, status, intake_completed_at, created_at"
    )
    .eq("realtor_id", user.id)
    .order("created_at", { ascending: false });

  const listingIds = (listings ?? []).map((listing) => listing.id);
  let photoByListingId: Record<string, string> = {};

  if (listingIds.length > 0) {
    const { data: assets = [] } = await supabase
      .from("listing_assets")
      .select("listing_id, storage_path, sort_order")
      .eq("asset_type", "photo")
      .in("listing_id", listingIds)
      .order("sort_order", { ascending: true });

    const firstAssetByListing = new Map<string, string>();
    for (const asset of assets ?? []) {
      if (!firstAssetByListing.has(asset.listing_id)) {
        firstAssetByListing.set(asset.listing_id, asset.storage_path);
      }
    }

    const uniquePaths = Array.from(new Set(firstAssetByListing.values()));
    if (uniquePaths.length > 0) {
      const { data: signedUrls } = await supabase
        .storage
        .from("listing-assets")
        .createSignedUrls(uniquePaths, 3600);

      const signedUrlByPath = new Map<string, string>();
      for (let i = 0; i < uniquePaths.length; i += 1) {
        const signed = signedUrls?.[i];
        if (signed?.signedUrl) {
          signedUrlByPath.set(uniquePaths[i], signed.signedUrl);
        }
      }

      photoByListingId = Object.fromEntries(
        Array.from(firstAssetByListing.entries())
          .map(([listingId, path]) => [listingId, signedUrlByPath.get(path)])
          .filter((pair): pair is [string, string] => !!pair[1])
      );
    }
  }

  const { data: notifications = [] } = await supabase
    .from("notifications")
    .select("id, listing_id, type, message, read, created_at")
    .eq("realtor_id", user.id)
    .order("read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(30);

  const safeListings = (listings ?? []).map((listing) => ({
    ...listing,
    photo_path: photoByListingId[listing.id] ?? null,
  }));
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
