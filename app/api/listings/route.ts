import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PREVIEW_MODE } from "@/utils/preview-data";
import { sendHomeownerIntakeEmail } from "@/utils/email";
import type { PropertyType } from "@/types/database";

export async function POST(req: Request) {
  // Preview mode — skip auth and DB, redirect to mock listing
  if (PREVIEW_MODE) {
    return NextResponse.json({ id: "preview-1" }, { status: 201 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    zip: string;
    property_type: PropertyType | null;
    price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    sqft: number | null;
    lot_size: string | null;
    year_built: number | null;
    homeowner_name: string;
    homeowner_email: string | null;
    homeowner_phone: string | null;
    send_intake_now: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.address_line1?.trim() || !body.city?.trim() || !body.state || !body.zip?.trim()) {
    return NextResponse.json({ error: "Address fields are required." }, { status: 422 });
  }

  if (body.send_intake_now && !body.homeowner_email?.trim()) {
    return NextResponse.json(
      { error: "Homeowner email is required to send the intake immediately." },
      { status: 422 }
    );
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      realtor_id: user.id,
      address_line1: body.address_line1.trim(),
      address_line2: body.address_line2,
      city: body.city.trim(),
      state: body.state,
      zip: body.zip.trim(),
      property_type: body.property_type,
      price: body.price,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      sqft: body.sqft,
      lot_size: body.lot_size,
      year_built: body.year_built,
      status: body.send_intake_now ? "intake_pending" : "draft",
      intake_sent_at: body.send_intake_now ? new Date().toISOString() : null,
    })
    .select("id, intake_token")
    .single();

  if (error || !listing) {
    console.error("listings insert error:", error);
    return NextResponse.json({ error: "Failed to create listing." }, { status: 500 });
  }

  // Fire the intake email if requested. We don't block the listing creation
  // on an email delivery failure — the realtor can still copy the link manually.
  if (body.send_intake_now && body.homeowner_email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, brokerage")
      .eq("id", user.id)
      .maybeSingle();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const intakeUrl = `${appUrl}/intake/${listing.intake_token}`;
    const address = [
      body.address_line1.trim(),
      body.address_line2,
      `${body.city.trim()}, ${body.state} ${body.zip.trim()}`,
    ]
      .filter(Boolean)
      .join(", ");

    try {
      await sendHomeownerIntakeEmail({
        to: body.homeowner_email,
        homeownerName: body.homeowner_name?.trim() || null,
        realtorName: profile?.full_name ?? "Your realtor",
        brokerage: profile?.brokerage ?? null,
        address,
        intakeUrl,
      });
    } catch (err) {
      console.error("intake email send error:", err);
    }
  }

  return NextResponse.json({ id: listing.id }, { status: 201 });
}
