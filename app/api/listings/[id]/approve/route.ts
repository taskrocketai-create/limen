import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { output_id } = await req.json().catch(() => ({}));
  if (!output_id) return NextResponse.json({ error: "output_id required." }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase as any)
    .from("listings")
    .select("id, locked, address_line1, city, state, zip, homeowner_name, homeowner_email")
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single() as { data: { id: string; locked: boolean; address_line1: string; city: string; state: string; zip: string; homeowner_name: string | null; homeowner_email: string | null } | null };

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (listing.locked) return NextResponse.json({ error: "This listing is locked and cannot be modified." }, { status: 403 });

  // Get agent profile for the thank-you email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("full_name, phone, approved_packages_this_month, approved_packages_reset_at")
    .eq("id", user.id)
    .single() as { data: { full_name: string | null; phone: string | null; approved_packages_this_month: number; approved_packages_reset_at: string } | null };

  const now = new Date();
  const resetAt = new Date(profile?.approved_packages_reset_at ?? now.toISOString());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let currentCount = profile?.approved_packages_this_month ?? 0;

  if (resetAt < monthStart) {
    currentCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("profiles")
      .update({
        approved_packages_this_month: 0,
        approved_packages_reset_at: monthStart.toISOString(),
      })
      .eq("id", user.id);
  }

  const nowIso = now.toISOString();

  // Unapprove all other versions, approve and lock this one
  await supabase
    .from("ai_outputs")
    .update({ approved: false, approved_at: null })
    .eq("listing_id", params.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("ai_outputs")
    .update({ approved: true, approved_at: nowIso, locked: true, locked_at: nowIso })
    .eq("id", output_id)
    .eq("listing_id", params.id);

  // Lock the listing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("listings")
    .update({ status: "reviewed", locked: true, locked_at: nowIso })
    .eq("id", params.id);

  // Increment monthly usage counter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("profiles")
    .update({ approved_packages_this_month: currentCount + 1 })
    .eq("id", user.id);

  // Send thank-you email to homeowner
  if (listing.homeowner_email) {
    const address = `${listing.address_line1}, ${listing.city}, ${listing.state} ${listing.zip}`;
    const agentName = profile?.full_name ?? "Your agent";
    const agentPhone = profile?.phone ?? null;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://limenai.org";

    try {
      await resend.emails.send({
        from: "Limen <listings@limenai.org>",
        to: listing.homeowner_email,
        subject: `Your listing is ready — ${address}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1A1814">
            <div style="background:#1A1814;padding:32px;text-align:center">
              <h1 style="color:#C8A96E;font-size:28px;margin:0;letter-spacing:0.05em">LIMEN</h1>
              <p style="color:#F7F5F1;font-size:13px;margin:4px 0 0;opacity:0.7">The threshold for listings</p>
            </div>
            <div style="padding:40px 32px;background:#F7F5F1">
              <p style="font-size:16px;line-height:1.6">Dear ${listing.homeowner_name ?? "Homeowner"},</p>
              <p style="font-size:16px;line-height:1.6">
                Thank you for completing the intake form for <strong>${address}</strong>. 
                Your agent has reviewed and approved the listing marketing package — your home is ready to launch.
              </p>
              <p style="font-size:16px;line-height:1.6">
                The listing copy, social media posts, and platform content have been prepared and will be distributed across MLS, Zillow, Realtor.com, and social media. 
                Your story — in your words — is at the heart of every piece.
              </p>
              <div style="background:#fff;border:1px solid #E8E4DC;padding:24px;margin:32px 0;text-align:center">
                <p style="font-size:14px;color:#6B6456;margin:0 0 8px">Your agent</p>
                <p style="font-size:18px;color:#1A1814;font-weight:bold;margin:0 0 4px">${agentName}</p>
                ${agentPhone ? `<p style="font-size:14px;color:#6B6456;margin:0">${agentPhone}</p>` : ""}
              </div>
              <p style="font-size:14px;color:#6B6456;line-height:1.6">
                If you have any questions about your listing or the marketing process, contact your agent directly. 
                We wish you a smooth and successful sale.
              </p>
            </div>
            <div style="background:#1A1814;padding:16px;text-align:center">
              <p style="color:#6B6456;font-size:12px;margin:0">
                © 2026 Limen · <a href="${siteUrl}" style="color:#6B6456">limenai.org</a> · 
                <a href="${siteUrl}/disclaimer" style="color:#6B6456">Legal Disclaimer</a>
              </p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Thank-you email error:", emailErr);
      // Don't fail approval if email fails
    }
  }

  return NextResponse.json({
    ok: true,
    packages_used: currentCount + 1,
    packages_limit: 20,
  });
}

