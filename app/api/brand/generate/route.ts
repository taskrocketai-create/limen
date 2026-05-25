import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answers, logoUrl } = await req.json();

  const prompt = `You are a senior brand strategist at a top-tier real estate marketing firm. You have been briefed on a real estate agent's brand preferences and must generate a complete brand profile that will drive all their marketing materials.

AGENT PROFILE:
- Market focus: ${answers.market_focus?.replace(/_/g, " ")}
- Agent style: ${answers.agent_style?.replace(/_/g, " ")}
- Market area: ${answers.market_area?.replace(/_/g, " ")}
- Ideal client: ${answers.ideal_client?.replace(/_/g, " ")}
- Marketing word: ${answers.marketing_word}
${logoUrl ? `- Has uploaded a logo` : "- No logo uploaded"}

Based on this profile, generate a complete brand system for this agent's real estate marketing. Think like you are designing for a high-end real estate marketing agency.

Return ONLY valid JSON:

{
  "brand_name": "short descriptor of this brand (e.g. 'Modern Luxury', 'Warm Community', 'Bold Investor')",
  "primary_color": "#hexcode — dominant brand color",
  "secondary_color": "#hexcode — accent color",
  "background_color": "#hexcode — card background (white, cream, or dark)",
  "text_color": "#hexcode — primary text color",
  "accent_color": "#hexcode — highlight color for CTAs, prices, badges",
  "card_style": "luxury_dark | clean_white | bold_split | warm_editorial | modern_grid",
  "typography": "serif_dominant | sans_dominant | mixed",
  "tone": "elevated | professional | warm | bold | friendly | authoritative",
  "cta_style": "prestigious | urgent | inviting | direct | conversational",
  "headline_style": "poetic | punchy | factual | storytelling | aspirational",
  "badge_text": "what text to show on Just Listed badges (e.g. 'Just Listed', 'New to Market', 'Now Available')",
  "tagline_style": "one sentence describing how captions should feel for this agent",
  "design_notes": "2-3 sentences of specific design direction for this agent's cards and flyers — reference their market, style, and ideal client specifically"
}

Be specific and opinionated. A luxury agent should get dark sophisticated palettes. A warm community agent should get warm creams and inviting typography. An investor-focused agent should get clean, data-forward design. Never generate generic beige/blue combinations.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: "You are a senior real estate brand strategist. Always respond with valid JSON only — no markdown, no preamble.",
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const brandProfile = JSON.parse(text);

    return NextResponse.json(brandProfile);
  } catch (err) {
    console.error("Brand generation error:", err);
    // Return a sensible default if generation fails
    return NextResponse.json({
      brand_name: "Professional",
      primary_color: "#1A1814",
      secondary_color: "#C8A96E",
      background_color: "#F7F5F1",
      text_color: "#1A1814",
      accent_color: "#C8A96E",
      card_style: "clean_white",
      typography: "mixed",
      tone: "professional",
      cta_style: "inviting",
      headline_style: "factual",
      badge_text: "Just Listed",
      tagline_style: "Clear and professional listing announcements",
      design_notes: "Clean, professional design that works across all market types.",
    });
  }
}
