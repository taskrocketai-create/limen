import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { output_id } = await req.json().catch(() => ({}));
  if (!output_id) return NextResponse.json({ error: "output_id required." }, { status: 400 });

  // Verify ownership via listing
  const { data: listing } = await supabase
    .from("listings")
    .select("id")
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const now = new Date().toISOString();

  // Unapprove all other versions, approve this one
  await supabase
    .from("ai_outputs")
    .update({ approved: false, approved_at: null })
    .eq("listing_id", params.id);

  await supabase
    .from("ai_outputs")
    .update({ approved: true, approved_at: now })
    .eq("id", output_id)
    .eq("listing_id", params.id);

  // Advance listing status to reviewed
  await supabase
    .from("listings")
    .update({ status: "reviewed" })
    .eq("id", params.id);

  return NextResponse.json({ ok: true });
}
