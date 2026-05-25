import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST /api/agency — create an agency
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Agency name required" }, { status: 400 });

  // Check if user already belongs to an agency
  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (profile?.agency_id) {
    return NextResponse.json({ error: "You already belong to an agency" }, { status: 409 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = supabase as any;

  // Create agency
  const { data: agency, error: agencyError } = await supabaseAdmin
    .from("agencies")
    .insert({ name: name.trim(), owner_id: user.id })
    .select("id, name, owner_id, agent_count, current_price_per_agent")
    .single();

  if (agencyError || !agency) {
    console.error("Agency insert error:", JSON.stringify(agencyError));
    return NextResponse.json({ error: agencyError?.message ?? "Failed to create agency" }, { status: 500 });
  }

  // Add owner as member
  await supabaseAdmin.from("agency_members").insert({
    agency_id: agency.id,
    profile_id: user.id,
    role: "owner",
  });

  // Link profile to agency
  await supabase.from("profiles").update({ agency_id: agency.id }).eq("id", user.id);

  return NextResponse.json(agency);
}

// GET /api/agency — get current user's agency
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = supabase as any;

  const { data: profile } = await supabase
    .from("profiles")
    .select("agency_id")
    .eq("id", user.id)
    .single();

  if (!profile?.agency_id) return NextResponse.json(null);

  const { data: agency } = await supabaseAdmin
    .from("agencies")
    .select("id, name, owner_id, agent_count, current_price_per_agent, stripe_subscription_status")
    .eq("id", profile.agency_id)
    .single();

  const { data: members } = await supabaseAdmin
    .from("agency_members")
    .select("id, role, joined_at, profiles(id, full_name, brokerage, license_number)")
    .eq("agency_id", profile.agency_id);

  const { data: invites } = await supabaseAdmin
    .from("agency_invites")
    .select("id, email, status, expires_at, created_at")
    .eq("agency_id", profile.agency_id)
    .eq("status", "pending");

  return NextResponse.json({ ...agency, members, pending_invites: invites });
}
