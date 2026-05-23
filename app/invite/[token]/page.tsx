import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAdmin = supabase as any;

  // Look up invite
  const { data: invite } = await supabaseAdmin
    .from("agency_invites")
    .select("id, agency_id, email, status, expires_at, agencies(name, owner_id, agent_count, current_price_per_agent, profiles(full_name))")
    .eq("token", params.token)
    .single();

  if (!invite || invite.status !== "pending") {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-gilt font-serif text-4xl mb-4">LIMEN</div>
          <h1 className="font-serif text-2xl text-ink mb-4">Invalid invitation</h1>
          <p className="font-sans text-stone mb-8">This invitation has expired, been cancelled, or already been used.</p>
          <Link href="/signup" className="bg-ink text-gilt px-8 py-3 font-sans text-xs tracking-widest uppercase">
            Create your own account
          </Link>
        </div>
      </div>
    );
  }

  const expired = new Date(invite.expires_at) < new Date();
  if (expired) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-gilt font-serif text-4xl mb-4">LIMEN</div>
          <h1 className="font-serif text-2xl text-ink mb-4">Invitation expired</h1>
          <p className="font-sans text-stone mb-8">This invitation has expired. Ask {invite.agencies?.profiles?.full_name} to send a new one.</p>
        </div>
      </div>
    );
  }

  const agency = invite.agencies;
  const pricePerAgent = agency?.current_price_per_agent ?? 4900;
  const newCount = (agency?.agent_count ?? 1) + 1;

  // Calculate what the new price will be after joining
  const newPrice = newCount <= 1 ? 4900
    : newCount <= 5 ? 4400
    : newCount <= 10 ? 3900
    : newCount <= 20 ? 3400
    : 2900;

  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, accept the invite
  if (user) {
    // Check if already in an agency
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (profile?.agency_id) {
      return (
        <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-gilt font-serif text-4xl mb-4">LIMEN</div>
            <h1 className="font-serif text-2xl text-ink mb-4">Already in an agency</h1>
            <p className="font-sans text-stone mb-8">You&apos;re already a member of an agency on Limen.</p>
            <Link href="/dashboard" className="bg-ink text-gilt px-8 py-3 font-sans text-xs tracking-widest uppercase">
              Go to dashboard
            </Link>
          </div>
        </div>
      );
    }

    // Accept the invite
    await supabaseAdmin.from("agency_members").insert({
      agency_id: invite.agency_id,
      profile_id: user.id,
      role: "member",
    });

    await supabase.from("profiles").update({ agency_id: invite.agency_id }).eq("id", user.id);

    await supabaseAdmin.from("agency_invites").update({ status: "accepted" }).eq("id", invite.id);

    redirect("/dashboard?joined=agency");
  }

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="text-gilt font-serif text-4xl tracking-widest mb-2">LIMEN</div>
          <p className="font-sans text-xs text-stone tracking-widest uppercase">The threshold for listings</p>
        </div>

        <div className="bg-white border border-stone/20 p-8 space-y-6">
          <div>
            <h1 className="font-serif text-2xl text-ink mb-2">You&apos;re invited</h1>
            <p className="font-sans text-sm text-stone">
              Join <strong className="text-ink">{agency?.name}</strong> on Limen and get AI-powered listing copy, 
              homeowner intake forms, and multi-platform publishing tools.
            </p>
          </div>

          <div className="bg-parchment rounded-lg p-4 space-y-2">
            <div className="flex justify-between font-sans text-sm">
              <span className="text-stone">Agency</span>
              <span className="text-ink font-medium">{agency?.name}</span>
            </div>
            <div className="flex justify-between font-sans text-sm">
              <span className="text-stone">Invited by</span>
              <span className="text-ink">{agency?.profiles?.full_name}</span>
            </div>
            <div className="flex justify-between font-sans text-sm">
              <span className="text-stone">Team size after you join</span>
              <span className="text-ink">{newCount} agents</span>
            </div>
            <div className="flex justify-between font-sans text-sm border-t border-stone/20 pt-2 mt-2">
              <span className="text-stone">Your rate</span>
              <span className="text-gilt font-medium">${(newPrice / 100).toFixed(0)}/mo</span>
            </div>
            {newPrice < pricePerAgent && (
              <p className="font-sans text-xs text-emerald-600">
                ↓ Everyone on the team saves ${((pricePerAgent - newPrice) / 100).toFixed(0)}/mo by you joining
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href={`/signup?invite=${params.token}&email=${encodeURIComponent(invite.email)}`}
              className="block w-full bg-ink text-gilt text-center py-3 font-sans text-xs tracking-widest uppercase hover:bg-gilt hover:text-ink transition-colors"
            >
              Create account & join
            </Link>
            <Link
              href={`/login?invite=${params.token}`}
              className="block w-full border border-ink text-ink text-center py-3 font-sans text-xs tracking-widest uppercase hover:bg-ink hover:text-gilt transition-colors"
            >
              Sign in to existing account
            </Link>
          </div>

          <p className="font-sans text-xs text-stone/50 text-center">
            Invitation expires {new Date(invite.expires_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
