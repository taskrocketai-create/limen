/**
 * Limen transactional email.
 *
 * Uses Resend when RESEND_API_KEY is configured; otherwise logs the email
 * to the server console so development without an email provider still works.
 *
 * To enable production email:
 *   1. Sign up at resend.com
 *   2. Verify the sending domain
 *   3. Set RESEND_API_KEY and RESEND_FROM_EMAIL in env
 *
 * The HTML templates below use inline styles (no external CSS) and Limen's
 * locked brand palette. Keep them spartan — email clients are hostile to
 * anything clever.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "Limen <noreply@limen.local>";

  if (!apiKey) {
    console.log("[email:stub]", {
      to: opts.to,
      subject: opts.subject,
      text: opts.text.slice(0, 200),
    });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "unknown");
    throw new Error(`Email provider error ${res.status}: ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Homeowner intake invite
// ---------------------------------------------------------------------------
interface IntakeEmailParams {
  to: string;
  homeownerName: string | null;
  realtorName: string;
  brokerage: string | null;
  address: string;
  intakeUrl: string;
}

export async function sendHomeownerIntakeEmail(p: IntakeEmailParams): Promise<void> {
  const greeting = p.homeownerName ? `Hi ${p.homeownerName},` : "Hello,";
  const signoff = p.brokerage ? `${p.realtorName}\n${p.brokerage}` : p.realtorName;

  const text = [
    greeting,
    ``,
    `I'm preparing the listing for ${p.address} and I'd love your help making it shine.`,
    ``,
    `I've set up a short form where you can share the things that make your home special — recent updates, neighbourhood favourites, anything you'd want the next owner to know. It takes about 5 minutes.`,
    ``,
    `Open the form:`,
    p.intakeUrl,
    ``,
    `Once you submit, I'll put it all together into a listing we're both proud of.`,
    ``,
    `Thank you,`,
    signoff,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F7F5F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F1;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid rgba(107,100,86,0.15);border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#1A1814;padding:24px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;">
                <svg width="20" height="28" viewBox="0 0 36 50" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="4" width="36" height="6" fill="#C8A96E"/>
                  <rect x="0" y="4" width="6" height="46" fill="#C8A96E"/>
                  <rect x="30" y="4" width="6" height="46" fill="#C8A96E"/>
                </svg>
              </td>
              <td style="color:#C8A96E;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:0.08em;">Limen</td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:40px 32px 32px;">
          <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;color:#1A1814;line-height:1.2;">
            Your home, in your own words
          </h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1A1814;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1A1814;">
            I'm preparing the listing for <strong>${p.address}</strong> and I'd love your help making it shine.
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#1A1814;">
            I've set up a short form where you can share the things that make your home special — recent updates, neighbourhood favourites, anything you'd want the next owner to know. It takes about five minutes.
          </p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td>
              <a href="${p.intakeUrl}" style="display:inline-block;background:#C8A96E;color:#1A1814;padding:14px 28px;text-decoration:none;font-weight:500;font-size:15px;border-radius:4px;">Open the form</a>
            </td></tr>
          </table>

          <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6B6456;">
            Or copy this link: <br/>
            <span style="word-break:break-all;color:#6B6456;">${p.intakeUrl}</span>
          </p>
          <p style="margin:24px 0 4px;font-size:15px;line-height:1.6;color:#1A1814;">Thank you,</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#1A1814;white-space:pre-line;">${signoff}</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#F7F5F1;border-top:1px solid rgba(107,100,86,0.15);">
          <p style="margin:0;font-size:11px;color:#6B6456;line-height:1.5;">
            This is a private link unique to your home. If you weren't expecting this, you can safely ignore it.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await sendEmail({
    to: p.to,
    subject: `Your listing intake for ${p.address}`,
    html,
    text,
  });
}
