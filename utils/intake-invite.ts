interface InvitePayload {
  homeownerName: string;
  homeownerEmail: string | null;
  homeownerPhone: string | null;
  intakeUrl: string;
  propertyAddress: string;
}

interface InviteResult {
  sent: { email: boolean; sms: boolean };
  errors: string[];
}

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return trimmed;
}

async function sendEmailInvite(payload: InvitePayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from || !payload.homeownerEmail) {
    throw new Error("Email invite not configured or no homeowner email.");
  }

  const subject = `Your Limen intake form for ${payload.propertyAddress}`;
  const html = `
    <p>Hi ${payload.homeownerName},</p>
    <p>Your realtor has invited you to complete a short intake form for <strong>${payload.propertyAddress}</strong>.</p>
    <p><a href="${payload.intakeUrl}">Open your private intake link</a></p>
    <p>This link is private. If you weren’t expecting this, you can ignore this email.</p>
    <p>— Limen</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.homeownerEmail],
      subject,
      html,
      text: `Hi ${payload.homeownerName}, your realtor invited you to complete the intake form for ${payload.propertyAddress}. Open your private link: ${payload.intakeUrl}`,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown email provider error");
    throw new Error(`Email invite failed: ${res.status} ${errorText}`);
  }
}

async function sendSmsInvite(payload: InvitePayload): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from || !payload.homeownerPhone) {
    throw new Error("SMS invite not configured or no homeowner phone.");
  }

  const to = normalizePhone(payload.homeownerPhone);
  const body = `Hi ${payload.homeownerName} — your realtor invited you to complete your intake for ${payload.propertyAddress}: ${payload.intakeUrl}`;

  const form = new URLSearchParams();
  form.set("To", to);
  form.set("From", from);
  form.set("Body", body);

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown SMS provider error");
    throw new Error(`SMS invite failed: ${res.status} ${errorText}`);
  }
}

export async function sendIntakeInvite(payload: InvitePayload): Promise<InviteResult> {
  const errors: string[] = [];
  let sentEmail = false;
  let sentSms = false;

  if (payload.homeownerEmail && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    try {
      await sendEmailInvite(payload);
      sentEmail = true;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Email invite failed.");
    }
  }

  if (payload.homeownerPhone && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    try {
      await sendSmsInvite(payload);
      sentSms = true;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "SMS invite failed.");
    }
  }

  return {
    sent: { email: sentEmail, sms: sentSms },
    errors,
  };
}
