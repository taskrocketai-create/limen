import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/agency/invite — send invite
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) {
    return NextResponse.json({ error: "You must create an agency first" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = supabase as any;

  // Check if already invited
  const { data: existing } = await supabaseAdmin
    .from("agency_invites")
    .select("id, status")
    .eq("agency_id", profile.agency_id)
    .eq("email", email.toLowerCase().trim())
    .eq("status", "pending")
    .single();

  if (existing) {
    return NextResponse.json({ error: "This email already has a pending invite" }, { status: 409 });
  }

  // Get agency name
  const { data: agency } = await supabaseAdmin
    .from("agencies")
    .select("name")
    .eq("id", profile.agency_id)
    .single();

  // Create invite
  const { data: invite, error } = await supabaseAdmin
    .from("agency_invites")
    .insert({
      agency_id: profile.agency_id,
      invited_by: user.id,
      email: email.toLowerCase().trim(),
    })
    .select("id, token")
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://limenai.org";
  const inviteUrl = `${siteUrl}/invite/${invite.token}`;

  // Send invite email
  try {
    await resend.emails.send({
      from: "Limen <hello@limenai.org>",
      to: email,
      subject: `${profile.full_name} invited you to join ${agency.name} on Limen`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1A1814;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-size: 28px; color: #C8A96E; letter-spacing: 4px;">LIMEN</span>
          </div>
          <h1 style="font-size: 24px; font-weight: normal; margin-bottom: 16px;">You've been invited</h1>
          <p style="color: #6B6456; line-height: 1.6; margin-bottom: 24px;">
            ${profile.full_name} has invited you to join <strong>${agency.name}</strong> on Limen — 
            the AI-powered listing platform for realtors.
          </p>
          <p style="color: #6B6456; line-height: 1.6; margin-bottom: 32px;">
            As part of the agency, you'll get access to AI-generated listing copy, 
            homeowner intake forms, photo analysis, and multi-platform publishing tools — 
            all at a discounted team rate.
          </p>
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${inviteUrl}" style="display: inline-block; background: #1A1814; color: #C8A96E; padding: 14px 32px; text-decoration: none; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #6B6456; font-size: 12px; text-align: center;">
            This invitation expires in 7 days. If you weren't expecting this, you can ignore this email.
          </p>
        </div>
      `,
    });
  } catch {
    // Email failed but invite was created — still return success
    console.error("Failed to send invite email");
  }

  return NextResponse.json({ success: true, invite_id: invite.id });
}

// DELETE /api/agency/invite — cancel invite
export async function DELETE(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invite_id } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("agency_invites")
    .update({ status: "cancelled" })
    .eq("id", invite_id);

  return NextResponse.json({ success: true });
}
