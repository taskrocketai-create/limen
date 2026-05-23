import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
    .select("id, locked")
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single() as { data: { id: string; locked: boolean } | null };

  if (!listing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (listing.locked) return NextResponse.json({ error: "This listing is locked and cannot be modified." }, { status: 403 });

  // Check and reset monthly usage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("approved_packages_this_month, approved_packages_reset_at")
    .eq("id", user.id)
    .single();

  const now = new Date();
  const resetAt = new Date(profile?.approved_packages_reset_at ?? now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  let currentCount = profile?.approved_packages_this_month ?? 0;

  // Reset counter if we're in a new month
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

  return NextResponse.json({ 
    ok: true, 
    packages_used: currentCount + 1,
    packages_limit: 10,
  });
}
