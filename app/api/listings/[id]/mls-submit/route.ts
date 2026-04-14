import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/listings/[id]/mls-submit
 * Human-triggered MLS submission via Flexmls Spark API.
 * Wired in Step 14 — returns 501 stub until then.
 * RULE: Never auto-submit. Always requires realtor action.
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: listing } = await supabase
    .from("listings")
    .select("id, status")
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (listing.status !== "reviewed") {
    return NextResponse.json(
      { error: "Listing must be reviewed and approved before MLS submission." },
      { status: 422 }
    );
  }

  return NextResponse.json(
    { error: "Spark API MLS submission will be wired in Step 14." },
    { status: 501 }
  );
}
