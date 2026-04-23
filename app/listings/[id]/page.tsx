import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ListingOutputClient from "@/components/listings/output/ListingOutputClient";
import { PREVIEW_MODE, MOCK_LISTING_DETAIL } from "@/utils/preview-data";
import type { Json } from "@/types/database";

type SocialCaptions = { instagram?: string; facebook?: string; twitter?: string } | null;
function parseSocialCaptions(raw: Json): SocialCaptions {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    instagram: typeof obj.instagram === "string" ? obj.instagram : undefined,
    facebook: typeof obj.facebook === "string" ? obj.facebook : undefined,
    twitter: typeof obj.twitter === "string" ? obj.twitter : undefined,
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
        ai_outputs={m.ai_outputs}
      />
    );
  }

  // ── Production ─────────────────────────────────────────────────────────
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select(`
      id, address_line1, address_line2, city, state, zip,
      price, bedrooms, bathrooms, sqft, property_type,
      status, intake_token, intake_sent_at, intake_completed_at, mls_number
    `)
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .maybeSingle();

  if (!listing) notFound();

  if (listing.status === "sold" || listing.status === "archived") {
    redirect(`/listings/${params.id}/archived`);
  }

  // maybeSingle — no details row is expected until the homeowner submits intake
  const { data: listing_details } = await supabase
    .from("listing_details")
    .select("highlights, recent_updates, neighborhood_notes, hoa_details, seller_notes")
    .eq("listing_id", params.id)
    .maybeSingle();

  const { data: ai_outputs } = await supabase
    .from("ai_outputs")
    .select("id, version, listing_description, headline_variants, social_captions, generated_at, approved, approved_at")
    .eq("listing_id", params.id)
    .order("version", { ascending: false });

  return (
    <ListingOutputClient
      {...listing}
      listing_details={listing_details ?? null}
      ai_outputs={(ai_outputs ?? []).map((o) => ({
        ...o,
        social_captions: parseSocialCaptions(o.social_captions),
      }))}
    />
  );
}
