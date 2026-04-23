import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { sendHomeownerIntakeEmail } from "@/utils/email";
import { PREVIEW_MODE } from "@/utils/preview-data";

/**
 * POST /api/listings/[id]/send-intake
 * Body (optional): { homeowner_email?: string; homeowner_name?: string }
 *
 * Marks the listing as intake_pending, stamps intake_sent_at, and dispatches
 * the email. Safe to call multiple times — acts as "resend" when used after
 * the initial send.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (PREVIEW_MODE) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { homeowner_email, homeowner_name } = await req
    .json()
    .catch(() => ({ homeowner_email: undefined, homeowner_name: undefined }));

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, realtor_id, address_line1, address_line2, city, state, zip, status, intake_token, intake_completed_at"
    )
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (listing.intake_completed_at) {
    return NextResponse.json(
      { error: "Intake already submitted." },
      { status: 409 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, brokerage")
    .eq("id", user.id)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const intakeUrl = `${appUrl}/intake/${listing.intake_token}`;
  const address = [
    listing.address_line1,
    listing.address_line2,
    `${listing.city}, ${listing.state} ${listing.zip}`,
  ]
    .filter(Boolean)
    .join(", ");

  if (homeowner_email) {
    try {
      await sendHomeownerIntakeEmail({
        to: homeowner_email,
        homeownerName: homeowner_name ?? null,
        realtorName: profile?.full_name ?? "Your realtor",
        brokerage: profile?.brokerage ?? null,
        address,
        intakeUrl,
      });
    } catch (err) {
      console.error("intake email error:", err);
      // Don't block status update if email fails — realtor can copy the link manually.
    }
  }

  const now = new Date().toISOString();
  await supabase
    .from("listings")
    .update({
      status: listing.status === "draft" ? "intake_pending" : listing.status,
      intake_sent_at: now,
    })
    .eq("id", listing.id);

  return NextResponse.json({ ok: true, intake_url: intakeUrl });
}
