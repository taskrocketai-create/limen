import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { platform } = await request.json();

  // Fetch listing and existing AI output
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase as any)
    .from("listings")
    .select("address_line1, city, state, zip, price, bedrooms, bathrooms, sqft, listing_details, ai_outputs(*)")
    .eq("id", params.id)
    .eq("profile_id", user.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const address = `${listing.address_line1}, ${listing.city}, ${listing.state} ${listing.zip}`;
  const details = listing.listing_details ?? {};
  const latestOutput = listing.ai_outputs?.[listing.ai_outputs.length - 1];
  const existingDescription = latestOutput?.description ?? "";

  const platformPrompts: Record<string, string> = {
    facebook: "Write a Facebook post for a real estate listing. Conversational, engaging, 150-250 words. Include key features, neighborhood feel, and a soft call to action. No hashtags.",
    instagram: "Write an Instagram caption for a real estate listing. Punchy opener, key highlights, 3-5 lines max, then 5-8 relevant hashtags on a new line.",
    tiktok: "Write a TikTok script hook for a real estate listing walkthrough. Attention-grabbing first line, 3 key features as talking points, 60-90 seconds pacing.",
    twitter: "Write an X/Twitter post for a real estate listing. Max 240 characters. Punchy, direct, one strong hook.",
    linkedin: "Write a LinkedIn post for a real estate listing. Professional tone, market context, 100-150 words. Target move-up buyers or investors.",
    nextdoor: "Write a Nextdoor post for a real estate listing. Neighbor-to-neighbor tone, hyperlocal details, welcoming. 100-150 words.",
  };

  const prompt = `${platformPrompts[platform] ?? platformPrompts.facebook}

Property: ${address}
Price: ${listing.price ? `$${listing.price.toLocaleString()}` : "Contact for price"}
Beds: ${listing.bedrooms ?? "N/A"} | Baths: ${listing.bathrooms ?? "N/A"} | Sqft: ${listing.sqft ?? "N/A"}
Highlights: ${details.highlights?.join(", ") ?? ""}
Recent updates: ${details.recent_updates ?? ""}
Neighborhood: ${details.neighborhood ?? ""}
${existingDescription ? `Existing description for reference: ${existingDescription.slice(0, 300)}` : ""}

Write only the caption/post text. No preamble, no labels.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const caption = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ caption });
  } catch {
    return NextResponse.json({ error: "Failed to regenerate caption" }, { status: 500 });
  }
}
