import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await (supabase as any)
    .from('listings')
    .select('id, address_line1, city, state, zip, intake_token, homeowner_name, homeowner_email')
    .eq('id', params.id)
    .eq('realtor_id', user.id)
    .single() as { data: { id: string; address_line1: string; city: string; state: string; zip: string; intake_token: string; homeowner_name: string | null; homeowner_email: string | null } | null };

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  if (!listing.homeowner_email) {
    return NextResponse.json({ error: 'No homeowner email on file. Edit the listing to add one.' }, { status: 400 });
  }

  const intakeUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://limenai.org'}/intake/${listing.intake_token}`;
  const address = `${listing.address_line1}, ${listing.city}, ${listing.state} ${listing.zip}`;
  const homeownerName = listing.homeowner_name ?? 'Homeowner';

  try {
    await resend.emails.send({
      from: 'Limen <listings@limenai.org>',
      to: listing.homeowner_email,
      subject: `Your listing intake form — ${address}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1A1814">
          <div style="background:#1A1814;padding:32px;text-align:center">
            <h1 style="color:#C8A96E;font-size:28px;margin:0;letter-spacing:0.05em">LIMEN</h1>
            <p style="color:#F7F5F1;font-size:13px;margin:4px 0 0;opacity:0.7">The threshold for listings</p>
          </div>
          <div style="padding:40px 32px;background:#F7F5F1">
            <p style="font-size:16px;line-height:1.6">Dear ${homeownerName},</p>
            <p style="font-size:16px;line-height:1.6">Your agent has invited you to complete a short intake form for <strong>${address}</strong>.</p>
            <p style="font-size:16px;line-height:1.6">This form takes about 5 minutes and helps us write listing copy that captures what makes your home genuinely special — in your words, not a template.</p>
            <div style="text-align:center;margin:40px 0">
              <a href="${intakeUrl}" style="background:#C8A96E;color:#1A1814;padding:16px 40px;text-decoration:none;font-family:Georgia,serif;font-size:16px;letter-spacing:0.05em;display:inline-block">
                Begin Your Intake →
              </a>
            </div>
            <p style="font-size:14px;color:#6B6456;line-height:1.6">This link is private and specific to your property. If you have questions, reply to this email or contact your agent directly.</p>
          </div>
          <div style="background:#1A1814;padding:16px;text-align:center">
            <p style="color:#6B6456;font-size:12px;margin:0">© 2026 Limen · <a href="https://limenai.org" style="color:#6B6456">limenai.org</a></p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Resend error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  await supabase
    .from('listings')
    .update({ intake_sent_at: new Date().toISOString() })
    .eq('id', params.id);

  return NextResponse.json({ success: true });
}
