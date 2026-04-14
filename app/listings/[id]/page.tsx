import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ListingOutputClient from "@/components/listings/output/ListingOutputClient";
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      id, address_line1, address_line2, city, state, zip,
      price, bedrooms, bathrooms, sqft, property_type,
      status, intake_token, intake_sent_at, intake_completed_at, mls_number
    `)
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single();

  if (error || !listing) notFound();

  // Redirect sold/archived to the archived view
  if (listing.status === "sold" || listing.status === "archived") {
    redirect(`/listings/${params.id}/archived`);
  }

  const { data: listing_details } = await supabase
    .from("listing_details")
    .select("highlights, recent_updates, neighborhood_notes, hoa_details, seller_notes")
    .eq("listing_id", params.id)
    .single();

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
