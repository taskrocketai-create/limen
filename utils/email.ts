import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendIntakeEmail({
  to,
  homeownerName,
  propertyAddress,
  intakeUrl,
}: {
  to: string;
  homeownerName: string;
  propertyAddress: string;
  intakeUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[DEV] Intake email →', to, intakeUrl);
    return { id: 'dev-mode' };
  }
  return resend.emails.send({
    from: 'Limen <listings@limenai.org>',
    to,
    subject: `Your listing intake form — ${propertyAddress}`,
    html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1A1814">
<div style="background:#1A1814;padding:32px;text-align:center">
<h1 style="color:#C8A96E;font-size:28px;margin:0;letter-spacing:0.05em">LIMEN</h1>
<p style="color:#F7F5F1;font-size:13px;margin:4px 0 0;opacity:0.7">The threshold for listings</p>
</div>
<div style="padding:40px 32px;background:#F7F5F1">
<p style="font-size:16px;line-height:1.6">Dear ${homeownerName},</p>
<p style="font-size:16px;line-height:1.6">Your agent has invited you to complete the property intake form for <strong>${propertyAddress}</strong>.</p>
<p style="font-size:16px;line-height:1.6">This form helps us create an exceptional listing that showcases your home's unique character and features.</p>
<div style="text-align:center;margin:40px 0">
<a href="${intakeUrl}" style="background:#C8A96E;color:#1A1814;padding:16px 40px;text-decoration:none;font-family:Georgia,serif;font-size:16px;letter-spacing:0.05em">Begin Your Intake</a>
</div>
<p style="font-size:14px;color:#6B6456;line-height:1.6">This link is private and unique to your property. It will expire in 7 days.</p>
</div>
<div style="background:#1A1814;padding:16px;text-align:center">
<p style="color:#6B6456;font-size:12px;margin:0">© 2026 Limen · <a href="https://limenai.org" style="color:#6B6456">limenai.org</a></p>
</div>
</div>`,
  });
}
