import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ListingOutputClient from "@/components/listings/output/ListingOutputClient";
import { PREVIEW_MODE, MOCK_LISTING_DETAIL } from "@/utils/preview-data";
import type { Json } from "@/types/database";

type PropertyType = "single_family" | "condo" | "townhouse" | "land" | "multi_family";
type ListingStatus = "draft" | "intake_pending" | "intake_received" | "ai_ready" | "reviewed" | "submitted" | "sold" | "archived";

type SocialCaptions = { instagram?: string; facebook?: string; twitter?: string; tiktok?: string; linkedin?: string; nextdoor?: string } | null;

interface MlsContent { description: string; agent_remarks: string; highlights: string[] }
interface ZillowContent { description: string; highlights: string[]; what_i_love: string }
interface RealtorComContent { description: string; highlights: string[] }
interface GoogleContent { post: string }
type PlatformContent = { mls?: MlsContent; zillow?: ZillowContent; realtor_com?: RealtorComContent; google?: GoogleContent } | null;

function parseSocialCaptions(raw: Json): SocialCaptions {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    instagram: typeof obj.instagram === "string" ? obj.instagram : undefined,
    facebook: typeof obj.facebook === "string" ? obj.facebook : undefined,
    twitter: typeof obj.twitter === "string" ? obj.twitter : undefined,
    tiktok: typeof obj.tiktok === "string" ? obj.tiktok : undefined,
    linkedin: typeof obj.linkedin === "string" ? obj.linkedin : undefined,
    nextdoor: typeof obj.nextdoor === "string" ? obj.nextdoor : undefined,
  };
}

function parsePlatformContent(raw: Json): PlatformContent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    mls: (obj.mls as MlsContent) ?? undefined,
    zillow: (obj.zillow as ZillowContent) ?? undefined,
    realtor_com: (obj.realtor_com as RealtorComContent) ?? undefined,
    google: (obj.google as GoogleContent) ?? undefined,
  };
}

interface ListingPageProps {
  params: { id: string };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata(_a: ListingPageProps) {
  return { title: "Listing — Limen" };
}

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: ListingPageProps) {
  // ── Preview mode ───────────────────────────────────────────────────────
  if (PREVIEW_MODE) {
    const m = MOCK_LISTING_DETAIL;
    return (
      <ListingOutputClient
        id={m.id}
        address_line1={m.address_line1}
        address_line2={m.address_line2}
        city={m.city}
        state={m.state}
        zip={m.zip}
        price={m.price}
        bedrooms={m.bedrooms}
        bathrooms={m.bathrooms}
        sqft={m.sqft}
        property_type={m.property_type}
        status={m.status}
        intake_token={m.intake_token}
        intake_sent_at={m.intake_sent_at}
        intake_completed_at={m.intake_completed_at}
        mls_number={m.mls_number}
        listing_details={m.listing_details}
        photos={[]}
        listing_locked={false}
        packages_used={0}
        ai_outputs={m.ai_outputs.map((o: { id: string; version: number; listing_description: string; headline_variants: string[]; social_captions: { instagram: string; facebook: string; twitter: string }; generated_at: string; approved: boolean; approved_at: null }) => ({
        ...o,
        platform_content: null,
        locked: false,
        locked_at: null,
        compliance_notes: null,
      }))}
      />
    );
  }

  // ── Production ─────────────────────────────────────────────────────────
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing, error } = await (supabase as any)
    .from("listings")
    .select(`
      id, address_line1, address_line2, city, state, zip,
      price, bedrooms, bathrooms, sqft, property_type,
      status, intake_token, intake_sent_at, intake_completed_at, mls_number,
      locked
    `)
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single() as { data: {
      id: string; address_line1: string; address_line2: string | null;
      city: string; state: string; zip: string; price: number | null;
      bedrooms: number | null; bathrooms: number | null; sqft: number | null;
      property_type: string | null; status: string; intake_token: string;
      intake_sent_at: string | null; intake_completed_at: string | null;
      mls_number: string | null; locked: boolean;
    } | null; error: unknown };

  if (error || !listing) notFound();

  if (listing.status === "sold" || listing.status === "archived") {
    redirect(`/listings/${params.id}/archived`);
  }

  // Fetch agent brand profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agentProfile } = await (supabase as any)
    .from("profiles")
    .select("full_name, phone, website, brand_profile, logo_url, headshot_url")
    .eq("id", user.id)
    .single() as { data: { full_name: string | null; phone: string | null; website: string | null; brand_profile: Record<string, string> | null; logo_url: string | null; headshot_url: string | null } | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from("profiles")
    .select("approved_packages_this_month, approved_packages_reset_at")
    .eq("id", user.id)
    .single();

  const now = new Date();
  const resetAt = new Date(profileData?.approved_packages_reset_at ?? now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const packagesUsed = resetAt < monthStart ? 0 : (profileData?.approved_packages_this_month ?? 0);

  const { data: listing_details } = await supabase
    .from("listing_details")
    .select("highlights, recent_updates, neighborhood_notes, hoa_details, seller_notes")
    .eq("listing_id", params.id)
    .single();

  const { data: ai_outputs } = await supabase
    .from("ai_outputs")
    .select("id, version, listing_description, headline_variants, social_captions, platform_content, generated_at, approved, approved_at, locked, locked_at")
    .eq("listing_id", params.id)
    .order("version", { ascending: false });

  const { data: listing_assets } = await supabase
    .from("listing_assets")
    .select("id, storage_path, sort_order")
    .eq("listing_id", params.id)
    .eq("asset_type", "photo")
    .order("sort_order", { ascending: true });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const photos = (listing_assets ?? []).map((a) => ({
    id: a.id,
    url: `${supabaseUrl}/storage/v1/object/public/listing-assets/${a.storage_path}`,
    path: a.storage_path,
    sort_order: a.sort_order,
  }));

  return (
    <ListingOutputClient
      id={listing.id}
      address_line1={listing.address_line1}
      address_line2={listing.address_line2}
      city={listing.city}
      state={listing.state}
      zip={listing.zip}
      price={listing.price}
      bedrooms={listing.bedrooms}
      bathrooms={listing.bathrooms}
      sqft={listing.sqft}
      property_type={listing.property_type as PropertyType | null}
      status={listing.status as ListingStatus}
      intake_token={listing.intake_token}
      intake_sent_at={listing.intake_sent_at}
      intake_completed_at={listing.intake_completed_at}
      mls_number={listing.mls_number}
      listing_locked={listing.locked ?? false}
      packages_used={packagesUsed}
      brand={agentProfile?.brand_profile ?? null}
      agent_name={agentProfile?.full_name ?? undefined}
      agent_phone={agentProfile?.phone ?? undefined}
      agent_website={agentProfile?.website ?? undefined}
      logo_url={agentProfile?.logo_url ?? null}
      headshot_url={agentProfile?.headshot_url ?? null}
      listing_details={listing_details ?? null}
      photos={photos}
      ai_outputs={(ai_outputs ?? []).map((o) => ({
        ...o,
        social_captions: parseSocialCaptions(o.social_captions),
        platform_content: parsePlatformContent(o.platform_content),
        locked: (o as { locked?: boolean }).locked ?? false,
        locked_at: (o as { locked_at?: string | null }).locked_at ?? null,
        compliance_notes: (o as { compliance_notes?: string | null }).compliance_notes ?? null,
      }))}
    />
  );
}
