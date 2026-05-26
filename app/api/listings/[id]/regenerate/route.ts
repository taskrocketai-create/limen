import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

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

  // Fetch listing — no listing_details column, that's a separate table
  const { data: listing } = await supabase
    .from("listings")
    .select("address_line1, city, state, zip, price, bedrooms, bathrooms, sqft")
    .eq("id", params.id)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  // Fetch listing details from the separate listing_details table
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

  const platformStyles: Record<string, string> = {
    facebook: "conversational, 150-200 words, no hashtags, warm and engaging",
    instagram: "punchy opener, 3-5 lines, then 5-8 relevant hashtags",
    tiktok: "hook + 3 talking points for a 60-second walkthrough",
    twitter: "max 240 characters, direct and compelling",
    linkedin: "professional, market-aware, 100-150 words",
    nextdoor: "neighbor-to-neighbor tone, hyperlocal, 100-150 words",
  };

  // Generate image prompt + caption via Claude
  const combinedRes = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    system: "You are a senior real estate marketing creative director. Respond with valid JSON only.",
    messages: [{
      role: "user",
      content: `Create a marketing package for this listing:

Property: ${address}
Price: ${listing.price ? `$${listing.price.toLocaleString()}` : "Call for price"}
${listing.bedrooms}bd / ${listing.bathrooms}ba / ${listing.sqft?.toLocaleString()}sf
Highlights: ${highlights}
Recent updates: ${recentUpdates}
Neighborhood: ${neighborhood}
${existingDescription ? `Description: ${existingDescription.slice(0, 300)}` : ""}
Platform: ${platform} — style: ${platformStyles[platform] ?? platformStyles.facebook}

Return JSON:
{
  "imagePrompt": "Detailed Flux image generation prompt 150-200 words for a stunning real estate marketing image. Reference actual property details, Wilson NC location feel, highlights. Specify golden hour lighting. End with: professional real estate photography, 8K resolution, wide angle lens, magazine quality",
  "caption": "The ${platform} caption"
}`
    }],
  });

  const text = combinedRes.content[0].type === "text" ? combinedRes.content[0].text : "{}";
  let imagePrompt = "";
  let caption = "";

  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    imagePrompt = parsed.imagePrompt ?? "";
    caption = parsed.caption ?? "";
  } catch {
    return NextResponse.json({ error: "Failed to generate content. Please try again." }, { status: 500 });
  }

  // Generate image via Replicate Flux
  let imageUrl: string | null = null;
  if (process.env.REPLICATE_API_TOKEN && imagePrompt) {
    try {
      const startRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            prompt: imagePrompt,
            num_outputs: 1,
            aspect_ratio: "4:3",
            output_format: "webp",
            output_quality: 90,
          }
        }),
      });

      const prediction = await startRes.json();

      if (prediction.id) {
        for (let i = 0; i < 25; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}` },
          });
          const pollData = await pollRes.json();
          if (pollData.status === "succeeded") {
            imageUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
            break;
          } else if (pollData.status === "failed" || pollData.status === "canceled") {
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
