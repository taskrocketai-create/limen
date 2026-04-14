import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

// This route is intentionally unauthenticated — the token IS the auth.
export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  // Validate UUID
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(token)) {
    return NextResponse.json({ error: "Invalid token." }, { status: 400 });
  }

  let body: {
    listing_id: string;
    highlights: string[];
    recent_updates: string | null;
    hoa_details: string | null;
    neighborhood_notes: string | null;
    seller_notes: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify the token matches the listing_id — prevents cross-submission
  const { data: listing } = await supabase
    .from("listings")
    .select("id, realtor_id, intake_completed_at")
    .eq("intake_token", token)
    .eq("id", body.listing_id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Invalid or expired intake link." }, { status: 404 });
  }

  if (listing.intake_completed_at) {
    return NextResponse.json({ error: "This intake has already been submitted." }, { status: 409 });
  }

  const now = new Date().toISOString();

  // Upsert listing_details
  const { error: detailsError } = await supabase
    .from("listing_details")
    .upsert({
      listing_id: listing.id,
      highlights: body.highlights ?? [],
      recent_updates: body.recent_updates,
      hoa_details: body.hoa_details,
      neighborhood_notes: body.neighborhood_notes,
      seller_notes: body.seller_notes,
      submitted_at: now,
    });

  if (detailsError) {
    console.error("listing_details upsert error:", detailsError);
    return NextResponse.json({ error: "Failed to save intake." }, { status: 500 });
  }

  // Advance listing status to intake_received
  await supabase
    .from("listings")
    .update({
      status: "intake_received",
      intake_completed_at: now,
    })
    .eq("id", listing.id);

  // Create notification for the realtor
  await supabase.from("notifications").insert({
    realtor_id: listing.realtor_id,
    listing_id: listing.id,
    type: "intake_submitted",
    message: "Homeowner intake has been submitted and is ready for AI generation.",
  });

  return NextResponse.json({ ok: true });
}
