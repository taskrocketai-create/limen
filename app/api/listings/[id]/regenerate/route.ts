import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import Replicate from "replicate";

export const maxDuration = 300;

const FACEBOOK_PROMPT_INSTRUCTIONS = `Generate a 2026-style real estate Facebook post caption.
Tone: modern, conversational, lifestyle-focused, and not salesy.
Lead with neighborhood/lifestyle context and end with a soft CTA.
Length: 150-200 words maximum.
Do not include hashtags.
Return only the caption text.`;

type ListingRow = {
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
};

type ListingDetailsRow = {
  highlights: string[] | string | null;
  recent_updates: string | null;
  neighborhood_notes: string | null;
  seller_notes: string | null;
};

const formatCurrency = (value: number | null) => {
  if (value == null) return "Price on request";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
};

const formatAddress = (listing: ListingRow) => {
  const line1 = [listing.address_line1, listing.address_line2].filter(Boolean).join(" ").trim();
  const locality = [listing.city, listing.state, listing.zip].filter(Boolean).join(", ").replace(", ,", ",");
  return [line1, locality].filter(Boolean).join(", ") || "Address unavailable";
};

const toText = (value: string[] | string | null | undefined) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value?.trim() ?? "";
};

const buildDescription = (
  aiDescription: string | null | undefined,
  details: ListingDetailsRow | null,
  listing: ListingRow
) => {
  const preferred = aiDescription?.trim();
  if (preferred) return preferred;

  const parts = [
    toText(details?.highlights),
    details?.recent_updates?.trim(),
    details?.neighborhood_notes?.trim(),
    details?.seller_notes?.trim(),
  ].filter(Boolean);

  if (parts.length > 0) return parts.join("\n\n");

  const facts = [
    listing.bedrooms != null ? `${listing.bedrooms} bedrooms` : null,
    listing.bathrooms != null ? `${listing.bathrooms} bathrooms` : null,
    listing.sqft != null ? `${listing.sqft.toLocaleString()} sqft` : null,
  ].filter(Boolean);

  return facts.length > 0 ? facts.join(" • ") : "Beautiful, move-in-ready home.";
};

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;

  const missingEnv = [
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !supabaseServiceKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    !anthropicApiKey ? "ANTHROPIC_API_KEY" : null,
    !replicateToken ? "REPLICATE_API_TOKEN" : null,
  ].filter(Boolean);

  if (missingEnv.length > 0) {
    return NextResponse.json(
      { error: `Missing required environment variables: ${missingEnv.join(", ")}` },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    const [{ data: listing, error: listingError }, { data: details, error: detailsError }, { data: latestOutput, error: outputError }] = await Promise.all([
      supabase
        .from("listings")
        .select("address_line1,address_line2,city,state,zip,price,bedrooms,bathrooms,sqft")
        .eq("id", params.id)
        .maybeSingle<ListingRow>(),
      supabase
        .from("listing_details")
        .select("highlights,recent_updates,neighborhood_notes,seller_notes")
        .eq("listing_id", params.id)
        .maybeSingle<ListingDetailsRow>(),
      supabase
        .from("ai_outputs")
        .select("listing_description")
        .eq("listing_id", params.id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle<{ listing_description: string | null }>(),
    ]);

    if (listingError || detailsError || outputError) {
      return NextResponse.json(
        { error: "Failed to load listing data from Supabase." },
        { status: 500 }
      );
    }

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const address = formatAddress(listing);
    const description = buildDescription(latestOutput?.listing_description, details ?? null, listing);

    const anthropic = new Anthropic({ apiKey: anthropicApiKey });
    const captionResponse = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `${FACEBOOK_PROMPT_INSTRUCTIONS}\n\nListing data:\n- Address: ${address}\n- Price: ${formatCurrency(listing.price)}\n- Beds: ${listing.bedrooms ?? "N/A"}\n- Baths: ${listing.bathrooms ?? "N/A"}\n- Sqft: ${listing.sqft?.toLocaleString() ?? "N/A"}\n- Description: ${description}`,
        },
      ],
    });

    const captionText = captionResponse.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n")
      .trim();

    if (!captionText) {
      return NextResponse.json({ error: "Anthropic did not return a caption." }, { status: 500 });
    }

    const replicate = new Replicate({ auth: replicateToken! });
    const locationPhrase = details?.neighborhood_notes?.trim() || [listing.city, listing.state].filter(Boolean).join(", ") || address;
    const imagePrompt = `Modern luxury real estate photography, ${locationPhrase}, bright airy interior, hardwood floors, natural light, architectural digest style, 8k, photorealistic`;

    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-schnell",
      input: {
        prompt: imagePrompt,
      },
    });

    if (!prediction?.id) {
      return NextResponse.json({ error: "Replicate did not return a prediction ID." }, { status: 500 });
    }

    return NextResponse.json({
      caption: captionText,
      predictionId: prediction.id,
      imageStatus: "processing",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to regenerate Facebook content.",
      },
      { status: 500 }
    );
  }
}
