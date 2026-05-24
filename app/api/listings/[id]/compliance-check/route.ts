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

  const { output_id, content } = await req.json().catch(() => ({}));
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

  // Verify ownership
  const { data: listing } = await supabase
    .from("listings")
    .select("id, address_line1, city, state")
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prompt = `You are a real estate compliance specialist reviewing listing marketing copy for Fair Housing violations and unsupported claims.

Review the following listing content and check for:

FAIR HOUSING VIOLATIONS — language that directly or indirectly references:
- Race, color, national origin, religion
- Sex, gender, familial status, or disability
- Age (unless specifically allowed, e.g. 55+ communities)
- Terms like "perfect for families", "safe neighborhood", "exclusive", "walking distance to church"
- Phrases implying preference for or against any protected class
- Steering language that describes neighborhood demographics

UNSUPPORTED CLAIMS — statements that cannot be verified:
- School quality claims ("top-rated schools", "best schools") without citing a source
- Crime/safety claims ("safe area", "low crime") without data
- Investment return claims ("great investment", "guaranteed appreciation")
- Price predictions or market projections
- Claims about neighbors or neighborhood character

MISSING FACTS — check if critical info appears to be fabricated or inconsistent:
- Square footage claims inconsistent with bedroom/bathroom count
- Year built that seems implausible
- Renovation claims that seem exaggerated

Return ONLY valid JSON in this exact shape:

{
  "status": "ready" | "review" | "violation",
  "fair_housing": {
    "passed": true | false,
    "issues": [
      { "text": "exact phrase from listing", "issue": "explanation", "severity": "warning" | "violation", "suggestion": "safer alternative wording" }
    ]
  },
  "unsupported_claims": {
    "passed": true | false,
    "issues": [
      { "text": "exact phrase", "issue": "explanation", "suggestion": "safer alternative" }
    ]
  },
  "missing_facts": {
    "passed": true | false,
    "issues": [
      { "text": "what seems inconsistent", "issue": "explanation" }
    ]
  },
  "platform_completeness": {
    "passed": true | false,
    "missing": ["list of platforms with no content generated"]
  },
  "summary": "One sentence plain English summary of the check result"
}

Status rules:
- "ready" = all checks passed, no issues found
- "review" = warnings found that should be reviewed but are not hard violations
- "violation" = Fair Housing violation found that must be fixed before approval

LISTING CONTENT TO REVIEW:
${content}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: "You are a real estate compliance specialist. Always respond with valid JSON only — no markdown, no preamble.",
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const result = JSON.parse(text);

    // Store result on the ai_output record
    if (output_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("ai_outputs")
        .update({ compliance_check: result })
        .eq("id", output_id);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Compliance check error:", err);
    return NextResponse.json({ error: "Compliance check failed" }, { status: 500 });
  }
}
