import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("brand_profile, ai_image_generations_used, ai_image_generations_reset_at, stripe_subscription_status")
    .eq("id", user.id)
    .single() as {
      data: {
        brand_profile: Record<string, string> | null;
        ai_image_generations_used: number;
        ai_image_generations_reset_at: string | null;
        stripe_subscription_status: string | null;
      } | null
    };

  // Check monthly limit
  const now = new Date();
  const resetAt = profile?.ai_image_generations_reset_at ? new Date(profile.ai_image_generations_reset_at) : null;
  const needsReset = !resetAt || now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear();
  const generationsUsed = needsReset ? 0 : (profile?.ai_image_generations_used ?? 0);
  const limit = PLAN_LIMITS.solo; // TODO: expand per plan
  
  if (generationsUsed >= limit) {
    return NextResponse.json({
      error: `You've used all ${limit} regenerations this month. Upgrade to Publish for 25/month or Pro for unlimited.`,
      used: generationsUsed,
      limit,
    }, { status: 429 });
  }

  // Fetch listing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase as any)
    .from("listings")
    .select("address_line1, city, state, zip, price, bedrooms, bathrooms, sqft, listing_details, realtor_id, ai_outputs(*)")
    .eq("id", params.id)
    .single() as {
      data: {
        address_line1: string; city: string; state: string; zip: string;
        price: number | null; bedrooms: number | null; bathrooms: number | null; sqft: number | null;
        listing_details: Record<string, unknown> | null;
        realtor_id: string;
        ai_outputs: Array<{ description?: string }>;
      } | null
    };

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.realtor_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const brand = profile?.brand_profile ?? {};
  const details = listing.listing_details ?? {};
  const highlights = Array.isArray(details.highlights) ? (details.highlights as string[]).join(", ") : "";
  const neighborhood = typeof details.neighborhood === "string" ? details.neighborhood : "";
  const recentUpdates = typeof details.recent_updates === "string" ? details.recent_updates : "";
  const address = `${listing.address_line1}, ${listing.city}, ${listing.state} ${listing.zip}`;
  const latestOutput = listing.ai_outputs?.[listing.ai_outputs.length - 1];
  const existingDescription = latestOutput?.description ?? "";

  // Platform-specific caption style
  const platformStyles: Record<string, string> = {
    facebook: "conversational, 150-200 words, no hashtags, warm and community-focused",
    instagram: "punchy opener, 3-5 lines, then 5-8 relevant hashtags",
    tiktok: "hook + 3 talking points, 60-second walkthrough script",
    twitter: "max 240 characters, punchy and direct",
    linkedin: "professional, market-aware, 100-150 words",
    nextdoor: "neighbor-to-neighbor tone, hyperlocal, 100-150 words",
  };

  const captionStyle = platformStyles[platform] ?? platformStyles.facebook;

  // Build brand creative brief from questionnaire answers
  const brandBrief = brand ? `
Agent brand profile:
- Market focus: ${brand.tone ?? "professional"}
- Style: ${brand.card_style ?? "clean"}
- Badge: ${brand.badge_text ?? "Just Listed"}
- Design notes: ${brand.design_notes ?? "Professional real estate marketing"}
- Tagline style: ${brand.tagline_style ?? "Clear and compelling"}
` : "";

  // Generate image prompt + caption together
  const combinedRes = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    system: `You are a senior creative director at a top real estate marketing agency. 
You generate compelling image prompts and platform captions that feel premium, not generic.
Always respond with valid JSON only.`,
    messages: [{
      role: "user",
      content: `Create a marketing package for this listing:

Property: ${address}
Price: ${listing.price ? `$${listing.price.toLocaleString()}` : "Call for price"}
Beds/Baths/Sqft: ${listing.bedrooms ?? "?"}bd / ${listing.bathrooms ?? "?"}ba / ${listing.sqft?.toLocaleString() ?? "?"}sf
Highlights: ${highlights}
Recent updates: ${recentUpdates}
Neighborhood: ${neighborhood}
${existingDescription ? `Property description: ${existingDescription.slice(0, 400)}` : ""}
${brandBrief}

Platform: ${platform}
Caption style: ${captionStyle}

Return JSON with exactly these two fields:
{
  "imagePrompt": "A detailed Flux image generation prompt (150-200 words) for a stunning real estate marketing hero image of this specific property. Reference the actual property details, location feel, and highlights. Specify lighting, mood, and angle. End with: professional real estate photography, 8K resolution, wide angle lens, magazine quality",
  "caption": "The ${platform} caption following the style guidelines above"
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
      const replicateRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
          "Prefer": "wait",
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

      const replicateData = await replicateRes.json();
      if (Array.isArray(replicateData.output) && replicateData.output[0]) {
        imageUrl = replicateData.output[0];
      } else if (typeof replicateData.output === "string") {
        imageUrl = replicateData.output;
      }
    } catch (err) {
      console.error("Replicate error:", err);
      // Continue without image — caption still works
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
    imagePrompt,
    used: newUsed,
    limit,
    remaining: limit === Infinity ? "unlimited" : limit - newUsed,
  });
}
