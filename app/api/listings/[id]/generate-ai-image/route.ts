import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Plan limits
const PLAN_LIMITS: Record<string, number> = {
  solo: 5,
  publish: 25,
  pro: Infinity,
};

function getPlanLimit(status: string | null, planName: string | null): number {
  if (planName === "pro") return PLAN_LIMITS.pro;
  if (planName === "publish") return PLAN_LIMITS.publish;
  return PLAN_LIMITS.solo; // default
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: "Image generation not configured." }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("stripe_subscription_status, ai_image_generations_used, ai_image_generations_reset_at")
    .eq("id", user.id)
    .single() as {
      data: {
        stripe_subscription_status: string | null;
        ai_image_generations_used: number;
        ai_image_generations_reset_at: string | null;
      } | null
    };

  // Reset monthly count if needed
  const now = new Date();
  const resetAt = profile?.ai_image_generations_reset_at ? new Date(profile.ai_image_generations_reset_at) : null;
  const needsReset = !resetAt || now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear();

  let generationsUsed = needsReset ? 0 : (profile?.ai_image_generations_used ?? 0);

  // Determine plan — for now use subscription status; expand when plan names are stored
  const status = profile?.stripe_subscription_status ?? null;
  const planName = "solo"; // TODO: expand when Publish/Pro tiers are live
  const limit = getPlanLimit(status, planName);

  if (generationsUsed >= limit) {
    return NextResponse.json({
      error: `You've used all ${limit} AI image generations for this month. ${limit === 5 ? "Upgrade to Publish for 25/month." : limit === 25 ? "Upgrade to Pro for unlimited." : ""}`,
      limit,
      used: generationsUsed,
    }, { status: 429 });
  }

  // Fetch listing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase as any)
    .from("listings")
    .select("address_line1, city, state, price, bedrooms, bathrooms, sqft, listing_details, ai_image_generations_used")
    .eq("id", params.id)
    .single() as {
      data: {
        address_line1: string;
        city: string;
        state: string;
        price: number | null;
        bedrooms: number | null;
        bathrooms: number | null;
        sqft: number | null;
        listing_details: Record<string, unknown> | null;
        ai_image_generations_used: number;
      } | null
    };

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const details = listing.listing_details ?? {};
  const highlights = Array.isArray(details.highlights) ? (details.highlights as string[]).join(", ") : "";
  const neighborhood = typeof details.neighborhood === "string" ? details.neighborhood : "";

  // Generate image prompt via Claude
  const promptRes = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `You are a professional real estate photographer and visual director. Write a Flux image generation prompt for a stunning real estate marketing hero image.

Property: ${listing.address_line1}, ${listing.city}, ${listing.state}
Beds: ${listing.bedrooms ?? "?"} | Baths: ${listing.bathrooms ?? "?"} | Sqft: ${listing.sqft ?? "?"}
Highlights: ${highlights}
Neighborhood: ${neighborhood}
Price: ${listing.price ? `$${listing.price.toLocaleString()}` : "contact for price"}

Write a single detailed image generation prompt (150-200 words) that:
- Describes a stunning exterior or dramatic interior shot of this specific property
- Specifies professional real estate photography style
- Includes lighting (golden hour, twilight, or bright natural light)
- Mentions architectural details from the highlights
- Ends with: "professional real estate photography, 8K, sharp focus, magazine quality, wide angle lens"

Return ONLY the prompt text, nothing else.`
    }],
  });

  const imagePrompt = promptRes.content[0].type === "text" ? promptRes.content[0].text.trim() : "";

  // Call Replicate Flux API
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

  if (!replicateRes.ok || replicateData.error) {
    console.error("Replicate error:", replicateData);
    return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 500 });
  }

  // Get output URL — Flux schnell returns immediately with "wait"
  let imageUrl: string | null = null;
  if (Array.isArray(replicateData.output) && replicateData.output[0]) {
    imageUrl = replicateData.output[0];
  } else if (typeof replicateData.output === "string") {
    imageUrl = replicateData.output;
  }

  if (!imageUrl) {
    return NextResponse.json({ error: "No image returned. Please try again." }, { status: 500 });
  }

  // Update usage counts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("profiles")
    .update({
      ai_image_generations_used: needsReset ? 1 : generationsUsed + 1,
      ai_image_generations_reset_at: needsReset ? now.toISOString() : profile?.ai_image_generations_reset_at,
    })
    .eq("id", user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("listings")
    .update({
      ai_image_url: imageUrl,
      ai_image_prompt: imagePrompt,
      ai_image_generations_used: (listing.ai_image_generations_used ?? 0) + 1,
    })
    .eq("id", params.id);

  generationsUsed = needsReset ? 1 : generationsUsed + 1;

  return NextResponse.json({
    imageUrl,
    prompt: imagePrompt,
    used: generationsUsed,
    limit,
    remaining: limit === Infinity ? "unlimited" : limit - generationsUsed,
  });
}
