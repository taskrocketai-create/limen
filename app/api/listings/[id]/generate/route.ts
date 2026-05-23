import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildPrompt(data: {
  address: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  lot_size: string | null;
  year_built: number | null;
  property_type: string | null;
  highlights: string[];
  recent_updates: string | null;
  neighborhood_notes: string | null;
  hoa_details: string | null;
  seller_notes: string | null;
}): string {
  const specs = [
    data.bedrooms != null && `${data.bedrooms} bedrooms`,
    data.bathrooms != null && `${data.bathrooms} bathrooms`,
    data.sqft != null && `${data.sqft.toLocaleString()} sq ft`,
    data.lot_size && `lot: ${data.lot_size}`,
    data.year_built && `built ${data.year_built}`,
  ]
    .filter(Boolean)
    .join(", ");

  return `You are a professional real estate copywriter specialising in high-quality listing content for residential properties.

Generate comprehensive listing content for the following property. All copy must be specific — never use generic filler.

---
PROPERTY: ${data.address}
${data.property_type ? `TYPE: ${data.property_type.replace("_", " ")}` : ""}
${data.price ? `PRICE: $${data.price.toLocaleString()}` : ""}
SPECS: ${specs || "Not provided"}
${data.highlights.length > 0 ? `HIGHLIGHTS: ${data.highlights.join(", ")}` : ""}
${data.recent_updates ? `RECENT UPDATES: ${data.recent_updates}` : ""}
${data.neighborhood_notes ? `NEIGHBOURHOOD: ${data.neighborhood_notes}` : ""}
${data.hoa_details ? `HOA: ${data.hoa_details}` : ""}
${data.seller_notes ? `SELLER NOTES: ${data.seller_notes}` : ""}
---

Return ONLY valid JSON in this exact shape — no markdown, no preamble:

{
  "listing_description": "...",
  "headline_variants": ["...", "...", "..."],
  "social_captions": {
    "instagram": "...",
    "facebook": "...",
    "twitter": "...",
    "tiktok": "...",
    "linkedin": "...",
    "nextdoor": "..."
  },
  "platform_content": {
    "mls": {
      "description": "...",
      "agent_remarks": "...",
      "highlights": ["...", "...", "...", "...", "..."]
    },
    "zillow": {
      "description": "...",
      "highlights": ["...", "...", "...", "...", "..."],
      "what_i_love": "..."
    },
    "realtor_com": {
      "description": "...",
      "highlights": ["...", "...", "...", "...", "..."]
    },
    "google": {
      "post": "..."
    }
  }
}

Rules:
- listing_description: 150-250 words. Warm, specific, no clichés. Lead with the strongest feature. End with location context.
- headline_variants: exactly 3 distinct headline options, each under 12 words. Elegant and evocative, not salesy.
- instagram: 100-150 words, conversational and aspirational. Include 10-15 relevant hashtags at end.
- facebook: 120-180 words. Informational and shareable. Include key specs. Friendly tone.
- twitter: under 240 characters including address. Punchy and specific.
- tiktok: a video script outline, 60-90 seconds. Include hook, 3 key moments to show, and closing call to action. Format as walking-through narration a realtor would say on camera.
- linkedin: 100-150 words. Professional tone. Focus on investment value, neighborhood growth, and property specs.
- nextdoor: 80-120 words. Hyper-local, neighborly tone. Reference the neighborhood, nearby amenities, and community feel.
- mls.description: 200-500 characters. Factual, spec-forward, no first-person. Standard MLS style.
- mls.agent_remarks: 100-200 characters. Agent-to-agent notes about showing instructions, special features, or offers.
- mls.highlights: exactly 5 bullet points, each under 10 words. Key selling points only.
- zillow.description: up to 2500 characters. Warm and detailed. Zillow buyers want the full story.
- zillow.highlights: exactly 5 bullet points matching Zillow home highlight format.
- zillow.what_i_love: 50-100 words. First-person from the seller's perspective. Emotional and specific.
- realtor_com.description: 200-400 words. Similar to Zillow but slightly more formal.
- realtor_com.highlights: exactly 5 bullet points.
- google.post: 100-150 words. Suitable for a Google Business Profile update. Include call to action.
- Never mention the realtor name or brokerage.
- Never include price unless provided above.`;
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, realtor_id, address_line1, address_line2, city, state, zip, price, bedrooms, bathrooms, sqft, lot_size, year_built, property_type, status"
    )
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const allowedStatuses = ["intake_received", "ai_ready", "reviewed"];
  if (!allowedStatuses.includes(listing.status)) {
    return NextResponse.json(
      { error: "Homeowner intake must be completed before generating copy." },
      { status: 422 }
    );
  }

  const { data: details } = await supabase
    .from("listing_details")
    .select("highlights, recent_updates, neighborhood_notes, hoa_details, seller_notes")
    .eq("listing_id", params.id)
    .single();

  const { data: latestOutput } = await supabase
    .from("ai_outputs")
    .select("version")
    .eq("listing_id", params.id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const nextVersion = (latestOutput?.version ?? 0) + 1;

  const address = [
    listing.address_line1,
    listing.address_line2,
    `${listing.city}, ${listing.state} ${listing.zip}`,
  ]
    .filter(Boolean)
    .join(", ");

  const prompt = buildPrompt({
    address,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    lot_size: listing.lot_size,
    year_built: listing.year_built,
    property_type: listing.property_type,
    highlights: details?.highlights ?? [],
    recent_updates: details?.recent_updates ?? null,
    neighborhood_notes: details?.neighborhood_notes ?? null,
    hoa_details: details?.hoa_details ?? null,
    seller_notes: details?.seller_notes ?? null,
  });

  let parsed: {
    listing_description: string;
    headline_variants: string[];
    social_captions: {
      instagram: string;
      facebook: string;
      twitter: string;
      tiktok: string;
      linkedin: string;
      nextdoor: string;
    };
    platform_content: {
      mls: { description: string; agent_remarks: string; highlights: string[] };
      zillow: { description: string; highlights: string[]; what_i_love: string };
      realtor_com: { description: string; highlights: string[] };
      google: { post: string };
    };
  };

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system:
        "You are a professional real estate copywriter. Always respond with valid JSON only — no markdown code fences, no preamble.",
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("Anthropic generation error:", err);
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 502 }
    );
  }

  const { data: newOutput, error: insertError } = await supabase
    .from("ai_outputs")
    .insert({
      listing_id: params.id,
      version: nextVersion,
      listing_description: parsed.listing_description,
      headline_variants: parsed.headline_variants,
      social_captions: parsed.social_captions,
      platform_content: parsed.platform_content,
    })
    .select("id, version, listing_description, headline_variants, social_captions, platform_content, generated_at, approved, approved_at")
    .single();

  if (listing.status === "intake_received") {
    await supabase
      .from("listings")
      .update({ status: "ai_ready" })
      .eq("id", params.id);

    await supabase.from("notifications").insert({
      realtor_id: user.id,
      listing_id: params.id,
      type: "ai_ready",
      message: `AI listing copy v${nextVersion} is ready for review.`,
    });
  }

  return NextResponse.json({
    ...newOutput,
    social_captions: parsed.social_captions,
    platform_content: parsed.platform_content,
  });
}
