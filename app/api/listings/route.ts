import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PREVIEW_MODE } from "@/utils/preview-data";
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing, error } = await (supabase as any)
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
      homeowner_name: body.homeowner_name ?? null,
      homeowner_email: body.homeowner_email ?? null,
      homeowner_phone: body.homeowner_phone ?? null,
      status: body.send_intake_now ? "intake_pending" : "draft",
      intake_sent_at: body.send_intake_now ? new Date().toISOString() : null,
    })
    .select("id, intake_token")
    .single() as { data: { id: string; intake_token: string } | null; error: unknown };

  if (error || !listing) {
    console.error("listings insert error:", error);
    return NextResponse.json({ error: "Failed to create listing." }, { status: 500 });
  }

  // Send intake email if requested and email is provided
  if (body.send_intake_now && body.homeowner_email) {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://limenai.org";
    const intakeUrl = `${siteUrl}/intake/${listing.intake_token}`;
    const address = `${body.address_line1.trim()}, ${body.city.trim()}, ${body.state} ${body.zip.trim()}`;

    try {
      await resend.emails.send({
        from: "Limen <listings@limenai.org>",
        to: body.homeowner_email,
        subject: `Your listing intake form — ${address}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1A1814">
            <div style="background:#1A1814;padding:32px;text-align:center">
              <h1 style="color:#C8A96E;font-size:28px;margin:0;letter-spacing:0.05em">LIMEN</h1>
              <p style="color:#F7F5F1;font-size:13px;margin:4px 0 0;opacity:0.7">The threshold for listings</p>
            </div>
            <div style="padding:40px 32px;background:#F7F5F1">
              <p style="font-size:16px;line-height:1.6">Dear ${body.homeowner_name ?? "Homeowner"},</p>
              <p style="font-size:16px;line-height:1.6">Your agent has invited you to complete a short intake form for <strong>${address}</strong>.</p>
              <p style="font-size:16px;line-height:1.6">This form takes about 5 minutes and helps us write listing copy that captures what makes your home genuinely special — in your words, not a template.</p>
              <div style="text-align:center;margin:40px 0">
                <a href="${intakeUrl}" style="background:#C8A96E;color:#1A1814;padding:16px 40px;text-decoration:none;font-family:Georgia,serif;font-size:16px;letter-spacing:0.05em;display:inline-block">Begin Your Intake →</a>
              </div>
              <p style="font-size:14px;color:#6B6456;line-height:1.6">This link is private and specific to your property. If you have questions, contact your agent directly.</p>
            </div>
            <div style="background:#1A1814;padding:16px;text-align:center">
              <p style="color:#6B6456;font-size:12px;margin:0">© 2026 Limen · <a href="https://limenai.org" style="color:#6B6456">limenai.org</a></p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Intake email error:", emailErr);
      // Don't fail the listing creation if email fails
    }
  }

  return NextResponse.json({ id: listing.id }, { status: 201 });
}
