import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { date, start_time, end_time, notes } = body;

  if (!date || !start_time || !end_time) {
    return NextResponse.json({ error: "date, start_time, and end_time are required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase as any)
    .from("listings")
    .select("id, address_line1, address_line2, city, state, zip, price, bedrooms, bathrooms, sqft, intake_token")
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single() as {
      data: {
        id: string; address_line1: string; address_line2: string | null;
        city: string; state: string; zip: string; price: number | null;
        bedrooms: number | null; bathrooms: number | null; sqft: number | null;
        intake_token: string;
      } | null;
    };

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: details } = await supabase
    .from("listing_details")
    .select("highlights, neighborhood_notes, seller_notes")
    .eq("listing_id", params.id)
    .single();

  const address = [listing.address_line1, listing.address_line2, `${listing.city}, ${listing.state} ${listing.zip}`]
    .filter(Boolean).join(", ");

  const specs = [
    listing.bedrooms && `${listing.bedrooms} bed`,
    listing.bathrooms && `${listing.bathrooms} bath`,
    listing.sqft && `${listing.sqft.toLocaleString()} sq ft`,
  ].filter(Boolean).join(" · ");

  const priceStr = listing.price ? `$${listing.price.toLocaleString()}` : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://limenai.org";
  const listingUrl = `${siteUrl}/intake/${listing.intake_token}`;

  const prompt = `You are a real estate marketing specialist creating open house content.

PROPERTY: ${address}
${priceStr ? `PRICE: ${priceStr}` : ""}
SPECS: ${specs}
${details?.highlights?.length ? `HIGHLIGHTS: ${(details.highlights as string[]).join(", ")}` : ""}
${details?.neighborhood_notes ? `NEIGHBOURHOOD: ${details.neighborhood_notes}` : ""}
${notes ? `AGENT NOTES: ${notes}` : ""}

OPEN HOUSE:
Date: ${date}
Time: ${start_time} – ${end_time}

Generate open house marketing content. Return ONLY valid JSON:

{
  "announcement": "...",
  "facebook_post": "...",
  "instagram_caption": "...",
  "twitter_post": "...",
  "nextdoor_post": "...",
  "text_blast": "...",
  "email_subject": "...",
  "email_body": "...",
  "sign_in_sheet_header": "...",
  "talking_points": ["...", "...", "...", "...", "..."]
}

Rules:
- announcement: 50-80 words. Clean, professional open house announcement with date, time, address, and 2-3 key features.
- facebook_post: 100-150 words. Warm and inviting. Include date, time, address. End with "See you there!"
- instagram_caption: 80-120 words. Visual and aspirational. Include open house details and hashtags.
- twitter_post: Under 240 characters. Punchy. Include date, time, and address.
- nextdoor_post: 60-80 words. Hyper-local, neighborly. Reference the neighborhood.
- text_blast: Under 160 characters. SMS-ready. Date, time, address, 1 key feature.
- email_subject: Under 60 characters. Compelling open house email subject line.
- email_body: 100-150 words. Professional email body for sphere of influence blast. Formal opening, key features, date/time/address, RSVP or walk-in welcome.
- sign_in_sheet_header: 2-3 sentences welcoming visitors at the door. Warm and professional.
- talking_points: Exactly 5 bullet points the agent can use during the open house tour. Specific to this property's features.
- All content must comply with Fair Housing. No demographic references.`;

  let parsed: {
    announcement: string;
    facebook_post: string;
    instagram_caption: string;
    twitter_post: string;
    nextdoor_post: string;
    text_blast: string;
    email_subject: string;
    email_body: string;
    sign_in_sheet_header: string;
    talking_points: string[];
  };

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: "You are a real estate marketing specialist. Always respond with valid JSON only — no markdown, no preamble.",
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    parsed = JSON.parse(text);
  } catch (err) {
    console.error("Open house generation error:", err);
    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    ...parsed,
    meta: {
      address,
      date,
      start_time,
      end_time,
      specs,
      price: priceStr,
      listing_url: listingUrl,
    },
  });
}
