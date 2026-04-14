import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/listings/[id]/generate
 * Triggers AI copy generation via Anthropic SDK.
 * Wired in Step 12 — returns 501 stub until then.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: listing } = await supabase
    .from("listings")
    .select("id, status")
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(
    { error: "AI generation will be wired in Step 12." },
    { status: 501 }
  );
}
