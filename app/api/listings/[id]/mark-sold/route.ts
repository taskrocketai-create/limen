import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PREVIEW_MODE } from "@/utils/preview-data";

/**
 * POST /api/listings/[id]/mark-sold
 * Transitions a listing to the `sold` status. Reversible via mark-active
 * if needed in the future.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (PREVIEW_MODE) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: listing } = await supabase
    .from("listings")
    .select("id, status")
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (listing.status === "sold" || listing.status === "archived") {
    return NextResponse.json({ ok: true }); // idempotent
  }

  const { error } = await supabase
    .from("listings")
    .update({ status: "sold" })
    .eq("id", listing.id);

  if (error) {
    console.error("mark-sold error:", error);
    return NextResponse.json({ error: "Could not mark as sold." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
