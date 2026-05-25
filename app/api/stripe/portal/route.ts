import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getStripe } from "@/utils/stripe";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const customerId = profile?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "No billing account found." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://limenai.org";

  const session = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl}/settings/billing`,
  });

  return NextResponse.json({ url: session.url });
}
