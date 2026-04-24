import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PREVIEW_MODE } from "@/utils/preview-data";
import type { PropertyType } from "@/types/database";
import { sendIntakeInvite } from "@/utils/intake-invite";

export const runtime = "nodejs";

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

  if (body.send_intake_now && !body.homeowner_email?.trim() && !body.homeowner_phone?.trim()) {
    return NextResponse.json(
      { error: "Provide at least an email or phone number to send the intake invite." },
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
      homeowner_name: body.homeowner_name.trim(),
      homeowner_email: body.homeowner_email?.trim() || null,
      homeowner_phone: body.homeowner_phone?.trim() || null,
      status: "draft",
      intake_sent_at: null,
    })
    .select("id, intake_token")
    .single();

  if (error || !listing) {
    console.error("listings insert error:", error);
    return NextResponse.json({ error: "Failed to create listing." }, { status: 500 });
  }

  if (body.send_intake_now) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const intakeUrl = `${appUrl.replace(/\/$/, "")}/intake/${listing.intake_token}`;
    const propertyAddress = [body.address_line1, body.address_line2, `${body.city}, ${body.state} ${body.zip}`]
      .filter(Boolean)
      .join(", ");

    const inviteResult = await sendIntakeInvite({
      homeownerName: body.homeowner_name.trim(),
      homeownerEmail: body.homeowner_email?.trim() || null,
      homeownerPhone: body.homeowner_phone?.trim() || null,
      intakeUrl,
      propertyAddress,
    });

    if (!inviteResult.sent.email && !inviteResult.sent.sms) {
      return NextResponse.json(
        {
          error:
            "Listing created, but invite delivery failed. Configure RESEND/TWILIO env vars and provide a valid email or phone.",
          id: listing.id,
          delivery_errors: inviteResult.errors,
        },
        { status: 502 }
      );
    }

    await supabase
      .from("listings")
      .update({ status: "intake_pending", intake_sent_at: new Date().toISOString() })
      .eq("id", listing.id);
  }

  return NextResponse.json({ id: listing.id }, { status: 201 });
}
