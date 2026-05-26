import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PLAN_LIMITS: Record<string, number> = {
  solo: 5,
  publish: 25,
  pro: Infinity,
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
const authClient = createServerClient();
const { data: { user } } = await authClient.auth.getUser();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("brand_profile, ai_image_generations_used, ai_image_generations_reset_at")
    .eq("id", user.id)
    .single() as {
      data: {
        brand_profile: Record<string, string> | null;
        ai_image_generations_used: number;
        ai_image_generations_reset_at: string | null;
      } | null
    };

  // Check monthly limit
  const now = new Date();
  const resetAt = profile?.ai_image_generations_reset_at ? new Date(profile.ai_image_generations_reset_at) : null;
  const needsReset = !resetAt || now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear();
  const generationsUsed = needsReset ? 0 : (profile?.ai_image_generations_used ?? 0);
  const limit = PLAN_LIMITS.solo;

  if (generationsUsed >= limit) {
    return NextResponse.json({
      error: `You've used all ${limit} AI image regenerations this month. Upgrade to Publish for 25/month or Pro for unlimited.`,
      used: generationsUsed, limit,
    }, { status: 429 });
  }

  // Fetch listing — no ai_outputs join to avoid foreign key issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase as any)
    .from("listings")
    .select("address_line1, city, state, zip, price, bedrooms, bathrooms, sqft, listing_details, realtor_id")
    .eq("id", params.id)
    .single() as {
      data: {
        address_line1: string;
        city: string;
        state: string;
        zip: string;
        price: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        sqft: number | null;
        listing_details: Record<string, unknown> | null;
        realtor_id: string;
      } | null
    };

  console.log("LISTING QUERY RESULT:", JSON.stringify({ listing, listingId: params.id, userId: user.id }));
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.realtor_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Fetch latest ai_output separately to avoid join issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let latestOutput: { listing_description: string | null } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("ai_outputs")
    .select("listing_description")
    .eq("listing_id", params.id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  latestOutput = data;
} catch {
  // ai_outputs fetch failed — continue without existing description
}

  const brand = profile?.brand_profile ?? {};
  const details = listing.listing_details ?? {};
  const highlights = Array.isArray(details.highlights) ? (details.highlights as string[]).join(", ") : "";
  const neighborhood = typeof details.neighborhood === "string" ? details.neighborhood : "";
  const recentUpdates = typeof details.recent_updates === "string" ? details.recent_updates : "";
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

  const brandBrief = brand ? `Agent brand: ${brand.tone ?? "professional"} tone, ${brand.design_notes ?? ""}` : "";

  // Generate image prompt + caption together via Claude
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
${brandBrief}
Platform: ${platform} — style: ${platformStyles[platform] ?? platformStyles.facebook}

Return JSON:
{
  "imagePrompt": "Detailed Flux image generation prompt 150-200 words for a stunning real estate marketing image of this specific property. Reference actual property details, Wilson NC location feel, highlights. Specify golden hour or twilight lighting. End with: professional real estate photography, 8K resolution, wide angle lens, magazine quality",
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

  // Generate image via Replicate Flux — poll for result
  let imageUrl: string | null = null;
  if (process.env.REPLICATE_API_TOKEN && imagePrompt) {
    try {
      // Start prediction
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
        // Poll for up to 50 seconds
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
            console.error("Replicate prediction failed:", pollData.error);
            break;
          }
        }
      }
    } catch (err) {
      console.error("Replicate error:", err);
    }
  }

  // Update usage count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("profiles")
    .update({
      ai_image_generations_used: needsReset ? 1 : generationsUsed + 1,
      ai_image_generations_reset_at: needsReset ? now.toISOString() : profile?.ai_image_generations_reset_at,
    })
    .eq("id", user.id);

  const newUsed = needsReset ? 1 : generationsUsed + 1;

  return NextResponse.json({
    imageUrl,
    caption,
    used: newUsed,
    limit,
    remaining: limit - newUsed,
  });
}
