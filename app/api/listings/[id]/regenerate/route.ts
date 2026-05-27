import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { platform } = await request.json();

  // Fetch listing
  const { data: listing } = await supabase
    .from("listings")
    .select("address_line1, city, state, zip, price, bedrooms, bathrooms, sqft")
    .eq("id", params.id)
    .maybeSingle();

  if (!listing)
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Fetch listing details
  const { data: listingDetails } = await supabase
    .from("listing_details")
    .select("highlights, neighborhood, recent_updates")
    .eq("listing_id", params.id)
    .maybeSingle();

  // Fetch latest description
  const { data: latestOutput } = await supabase
    .from("ai_outputs")
    .select("listing_description")
    .eq("listing_id", params.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const highlights = Array.isArray(listingDetails?.highlights)
    ? listingDetails.highlights.join(", ")
    : typeof listingDetails?.highlights === "string"
    ? listingDetails.highlights
    : "";
  const neighborhood = listingDetails?.neighborhood ?? "";
  const recentUpdates = listingDetails?.recent_updates ?? "";
  const existingDescription = latestOutput?.listing_description ?? "";
  const address = `${listing.address_line1}, ${listing.city}, ${listing.state} ${listing.zip}`;

  // Detect architecture from highlights/description for accurate image generation
  const textToScan = `${highlights} ${recentUpdates} ${existingDescription}`.toLowerCase();
  const isBrick = textToScan.includes("brick");
  const isRanch = textToScan.includes("ranch");
  const hasPorch = textToScan.includes("porch");
  const hasKitchen = textToScan.includes("kitchen");
  const hasHardwood = textToScan.includes("hardwood");

  // Determine the single best shot to generate
  let primaryShot = "exterior front";
  if (hasKitchen && hasHardwood) primaryShot = "kitchen interior";
  else if (hasPorch) primaryShot = "screened porch";
  else primaryShot = "exterior front";

  // Build a literal, constrained image prompt directly — no Claude hallucination risk
  const architectureDesc = [
    isBrick ? "brick" : "",
    isRanch ? "single-story ranch" : "single-family home",
  ]
    .filter(Boolean)
    .join(" ");

  const interiorDetails = [
    hasHardwood ? "hardwood floors" : "",
    hasKitchen ? "renovated kitchen with quartz countertops and stainless appliances" : "",
    hasPorch ? "screened porch with mature shade trees visible" : "",
  ]
    .filter(Boolean)
    .join(", ");

  const imagePrompt =
    primaryShot === "exterior front"
      ? `Photorealistic real estate photography of a ${architectureDesc} house exterior, ${listing.city} North Carolina neighborhood, bright natural daylight, blue sky, well-maintained lawn, clean composition, no people, no pets, no text overlays, wide angle lens, shot from the street at a flattering angle, professional real estate photography, 8K resolution, magazine quality, photorealistic`
      : `Photorealistic real estate photography of a ${primaryShot}, ${interiorDetails}, bright natural light from windows, clean and uncluttered, no people, no pets, no artwork on walls, no impossible composite angles, wide angle lens, professional real estate photography, 8K resolution, magazine quality, photorealistic`;

  const platformStyles: Record<string, string> = {
    facebook: "conversational, 150-200 words, no hashtags, warm and engaging, lead with the neighborhood feel",
    instagram: "punchy opener, 3-5 lines, then 5-8 relevant hashtags",
    tiktok: "hook + 3 talking points for a 60-second walkthrough script",
    twitter: "max 240 characters, direct and compelling",
    linkedin: "professional, market-aware, 100-150 words",
    nextdoor: "neighbor-to-neighbor tone, hyperlocal, 100-150 words",
  };

  // Generate caption via Claude
  const captionRes = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    system:
      "You are a senior real estate marketing creative director writing for top-tier agents. Write modern, lifestyle-focused copy. Never use clichés like 'nestled', 'stunning', 'don't miss out', or 'motivated seller'. Respond with the caption text only — no JSON, no preamble.",
    messages: [
      {
        role: "user",
        content: `Write a ${platform} post for this listing.

Property: ${address}
Price: ${listing.price ? `$${listing.price.toLocaleString()}` : "Call for price"}
${listing.bedrooms}bd / ${listing.bathrooms}ba / ${listing.sqft?.toLocaleString() ?? ""}sf
Architecture: ${architectureDesc}
Highlights: ${highlights}
Recent updates: ${recentUpdates}
Neighborhood: ${neighborhood}
${existingDescription ? `Description context: ${existingDescription.slice(0, 300)}` : ""}

Style: ${platformStyles[platform] ?? platformStyles.facebook}`,
      },
    ],
  });

  const caption =
    captionRes.content[0].type === "text" ? captionRes.content[0].text.trim() : "";

  if (!caption) {
    return NextResponse.json(
      { error: "Failed to generate caption. Please try again." },
      { status: 500 }
    );
  }

  // Generate image via Replicate Flux Schnell
  let imageUrl: string | null = null;

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      const startRes = await fetch(
        "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
            Prefer: "wait",
          },
          body: JSON.stringify({
            input: {
              prompt: imagePrompt,
              num_outputs: 1,
              aspect_ratio: "4:3",
              output_format: "webp",
              output_quality: 90,
              num_inference_steps: 4,
            },
          }),
        }
      );

      const prediction = await startRes.json();

      // Prefer: wait returns result immediately if done
      if (prediction.status === "succeeded" && prediction.output) {
        imageUrl = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output;
      } else if (prediction.id) {
        // Fall back to polling if not instant
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const pollRes = await fetch(
            `https://api.replicate.com/v1/predictions/${prediction.id}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
              },
            }
          );
          const pollData = await pollRes.json();
          if (pollData.status === "succeeded") {
            imageUrl = Array.isArray(pollData.output)
              ? pollData.output[0]
              : pollData.output;
            break;
          } else if (
            pollData.status === "failed" ||
            pollData.status === "canceled"
          ) {
            console.error("Replicate prediction failed:", pollData.error);
            break;
          }
        }
      }
    } catch (err) {
      console.error("Replicate error:", err);
    }
  }

  return NextResponse.json({ imageUrl, caption });
}
