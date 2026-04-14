import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { submitListingToSpark } from "@/utils/spark";

/**
 * POST /api/listings/[id]/mls-submit
 * Human-triggered MLS submission via Flexmls Spark API.
 * RULE: Never auto-submit. Always requires explicit realtor action.
 *
 * MLS path: Wilson Board of Realtors → NCRMLS → Hive MLS → Flexmls → Spark API
 */
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch listing — must be owned by this realtor
  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, realtor_id, address_line1, address_line2, city, state, zip, price, bedrooms, bathrooms, sqft, year_built, property_type, status"
    )
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single();

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (listing.status !== "reviewed") {
    return NextResponse.json(
      { error: "Listing must be approved (reviewed) before MLS submission." },
      { status: 422 }
    );
  }

  // Fetch the approved AI output for the listing description
  const { data: approvedOutput } = await supabase
    .from("ai_outputs")
    .select("listing_description")
    .eq("listing_id", params.id)
    .eq("approved", true)
    .single();

  if (!approvedOutput?.listing_description) {
    return NextResponse.json(
      { error: "No approved listing description found. Approve an AI output first." },
      { status: 422 }
    );
  }

  const address = [listing.address_line1, listing.address_line2]
    .filter(Boolean)
    .join(", ");

  let mlsId: string;
  try {
    const result = await submitListingToSpark({
      ListPrice: listing.price ?? 0,
      UnparsedAddress: address,
      City: listing.city,
      StateOrProvince: listing.state,
      PostalCode: listing.zip,
      BedroomsTotal: listing.bedrooms ?? undefined,
      BathroomsTotalInteger: listing.bathrooms != null ? Math.floor(listing.bathrooms) : undefined,
      LivingArea: listing.sqft ?? undefined,
      YearBuilt: listing.year_built ?? undefined,
      PropertyType: listing.property_type ?? undefined,
      PublicRemarks: approvedOutput.listing_description,
    });
    mlsId = result.mlsId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "MLS submission failed.";
    console.error("Spark API error:", err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const now = new Date().toISOString();

  // Advance listing status to submitted
  await supabase
    .from("listings")
    .update({
      status: "submitted",
      mls_number: mlsId,
      submitted_at: now,
    })
    .eq("id", params.id);

  // Notify realtor
  await supabase.from("notifications").insert({
    realtor_id: user.id,
    listing_id: params.id,
    type: "mls_submitted",
    message: `Listing submitted to MLS. MLS # ${mlsId}`,
  });

  return NextResponse.json({ ok: true, mls_number: mlsId });
}
