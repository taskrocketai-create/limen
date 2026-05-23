"use client";

import { useState, useEffect, useCallback } from "react";

interface Member {
  id: string;
  role: string;
  joined_at: string;
  profiles: {
    id: string;
    full_name: string;
    brokerage: string;
    license_number: string;
  };
}

interface PendingInvite {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface Agency {
  id: string;
  name: string;
  owner_id: string;
  agent_count: number;
  current_price_per_agent: number;
  stripe_subscription_status: string | null;
  members: Member[];
  pending_invites: PendingInvite[];
}

const TIERS = [
  { min: 1, max: 1, price: 49, label: "1 agent" },
  { min: 2, max: 5, price: 44, label: "2–5 agents" },
  { min: 6, max: 10, price: 39, label: "6–10 agents" },
  { min: 11, max: 20, price: 34, label: "11–20 agents" },
  { min: 21, max: null, price: 29, label: "21+ agents" },
];

function getPriceForCount(count: number): number {
  const tier = TIERS.find(t => count >= t.min && (t.max === null || count <= t.max));
  return tier?.price ?? 49;
}

export default function AgencyPanel({ userId }: { userId: string }) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [createError, setCreateError] = useState("");

  const fetchAgency = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/agency");
    const data = await res.json();
    setAgency(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAgency(); }, [fetchAgency]);

  const handleCreate = async () => {
    if (!agencyName.trim()) return;
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/agency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: agencyName }),
    });
    if (!res.ok) {
      const b = await res.json();
      setCreateError(b.error ?? "Failed to create agency");
      setCreating(false);
      return;
    }
    await fetchAgency();
    setCreating(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");
    const res = await fetch("/api/agency/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    if (!res.ok) {
      const b = await res.json();
      setInviteError(b.error ?? "Failed to send invite");
      setInviting(false);
      return;
    }
    setInviteSuccess(`Invite sent to ${inviteEmail}`);
    setInviteEmail("");
    setInviting(false);
    await fetchAgency();
  };

  const handleCancelInvite = async (inviteId: string) => {
    await fetch("/api/agency/invite", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invite_id: inviteId }),
    });
    await fetchAgency();
  };

  const nextTierPrice = agency ? getPriceForCount(agency.agent_count + 1) : null;
  const currentPrice = agency ? agency.current_price_per_agent / 100 : null;
  const monthlyTotal = agency ? (agency.current_price_per_agent / 100) * agency.agent_count : null;

  if (loading) {
    return (
      <div className="bg-white border border-stone/20 p-8">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-stone/10 rounded w-1/3" />
          <div className="h-4 bg-stone/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="bg-white border border-stone/20 p-8 space-y-6">
        <div>
          <h2 className="font-serif text-xl text-ink mb-2">Agency</h2>
          <p className="font-sans text-sm text-stone">
            Create an agency to invite your team and unlock volume pricing. Everyone bills together — the more agents, the lower the per-agent rate.
          </p>
        </div>

        {/* Pricing preview */}
        <div className="grid grid-cols-5 gap-2">
          {TIERS.map((tier) => (
            <div key={tier.label} className="bg-parchment rounded-md p-3 text-center">
              <div className="font-sans text-xs text-stone mb-1">{tier.label}</div>
              <div className="font-serif text-lg text-gilt">${tier.price}</div>
              <div className="font-sans text-xs text-stone/50">per agent</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block font-sans text-xs tracking-widest uppercase text-stone mb-2">Agency name</label>
            <input
              value={agencyName}
              onChange={e => setAgencyName(e.target.value)}
              placeholder="Wilson Realty Group"
              className="w-full border border-stone/20 px-4 py-3 font-sans text-sm text-ink focus:outline-none focus:border-gilt"
            />
          </div>
          {createError && <p className="font-sans text-xs text-red-600">{createError}</p>}
          <button
            onClick={handleCreate}
            disabled={creating || !agencyName.trim()}
            className="bg-ink text-gilt px-8 py-3 font-sans text-xs tracking-widest uppercase hover:bg-gilt hover:text-ink transition-colors disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create agency"}
          </button>
        </div>
      </div>
    );
  }

  const isOwner = agency.owner_id === userId;

  return (
    <div className="bg-white border border-stone/20 p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-xl text-ink">{agency.name}</h2>
          <p className="font-sans text-xs text-stone mt-1">
            {agency.agent_count} agent{agency.agent_count !== 1 ? "s" : ""} · ${currentPrice}/agent/mo · ${monthlyTotal?.toFixed(0)}/mo total
          </p>
        </div>
        {agency.stripe_subscription_status && (
          <span className={`px-2 py-1 rounded font-sans text-xs ${
            agency.stripe_subscription_status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}>
            {agency.stripe_subscription_status}
          </span>
        )}
      </div>

      {/* Pricing tiers */}
      <div className="space-y-2">
        <p className="font-sans text-xs tracking-widest uppercase text-stone">Volume pricing</p>
        <div className="grid grid-cols-5 gap-2">
          {TIERS.map((tier) => {
            const isActive = agency.agent_count >= tier.min && (tier.max === null || agency.agent_count <= tier.max);
            return (
              <div key={tier.label} className={`rounded-md p-3 text-center border ${
                isActive ? "border-gilt bg-gilt/5" : "border-stone/10 bg-parchment"
              }`}>
                <div className="font-sans text-xs text-stone mb-1">{tier.label}</div>
                <div className={`font-serif text-lg ${isActive ? "text-gilt" : "text-stone"}`}>${tier.price}</div>
                <div className="font-sans text-xs text-stone/50">per agent</div>
                {isActive && <div className="font-sans text-xs text-gilt mt-1">Current</div>}
              </div>
            );
          })}
        </div>
        {nextTierPrice && nextTierPrice < (currentPrice ?? 49) && (
          <p className="font-sans text-xs text-emerald-600">
            Add {agency.agent_count < 2 ? 1 : agency.agent_count < 6 ? 6 - agency.agent_count : agency.agent_count < 11 ? 11 - agency.agent_count : 21 - agency.agent_count} more agent{agency.agent_count < 2 ? "" : "s"} to drop to ${nextTierPrice}/agent/mo
          </p>
        )}
      </div>

      {/* Members */}
      <div className="space-y-3">
        <p className="font-sans text-xs tracking-widest uppercase text-stone">Members</p>
        <div className="space-y-2">
          {agency.members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-3 border-b border-stone/10">
              <div>
                <p className="font-sans text-sm text-ink font-medium">{member.profiles.full_name}</p>
                {member.profiles.license_number && (
                  <p className="font-sans text-xs text-stone">License #{member.profiles.license_number}</p>
                )}
              </div>
              <span className={`font-sans text-xs px-2 py-1 rounded ${
                member.role === "owner"
                  ? "bg-ink text-gilt"
                  : "bg-stone/10 text-stone"
              }`}>
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      {isOwner && (
        <div className="space-y-3">
          <p className="font-sans text-xs tracking-widest uppercase text-stone">Invite an agent</p>
          <div className="flex gap-2">
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
              placeholder="agent@brokerage.com"
              type="email"
              className="flex-1 border border-stone/20 px-4 py-2.5 font-sans text-sm text-ink focus:outline-none focus:border-gilt"
            />
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="bg-ink text-gilt px-6 py-2.5 font-sans text-xs tracking-widest uppercase hover:bg-gilt hover:text-ink transition-colors disabled:opacity-50"
            >
              {inviting ? "Sending…" : "Invite"}
            </button>
          </div>
          {inviteError && <p className="font-sans text-xs text-red-600">{inviteError}</p>}
          {inviteSuccess && <p className="font-sans text-xs text-emerald-600">{inviteSuccess}</p>}

          {/* Pending invites */}
          {agency.pending_invites && agency.pending_invites.length > 0 && (
            <div className="space-y-2">
              <p className="font-sans text-xs text-stone">Pending invitations</p>
              {agency.pending_invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between py-2 border border-stone/10 rounded px-3">
                  <div>
                    <p className="font-sans text-sm text-ink">{invite.email}</p>
                    <p className="font-sans text-xs text-stone">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelInvite(invite.id)}
                    className="font-sans text-xs text-stone hover:text-red-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
