'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

interface Profile {
  full_name: string;
  brokerage: string;
  phone: string;
}

export default function SettingsPage() {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>('');
 const [, setUserId] = useState<string>('');
  const [profile, setProfile] = useState<Profile>({ full_name: '', brokerage: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const loadProfile = useCallback(async (id: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) setProfile({ full_name: data.full_name ?? '', brokerage: data.brokerage ?? '', phone: data.phone ?? '' });
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? '');
        setUserId(user.id);
        loadProfile(user.id);
      }
    });
  }, [supabase, loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleBillingPortal = async () => {
    setPortalLoading(true);
    const res = await fetch('/api/stripe/create-portal', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setPortalLoading(false);
  };

  const handleSignOut = async () => {
    await fetch('/api/sign-out', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-[#F7F5F1]">
      <header className="bg-[#1A1814] px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-[#C8A96E] font-serif text-xl tracking-widest">LIMEN</Link>
        <Link href="/dashboard" className="text-[#F7F5F1] text-sm opacity-70 hover:opacity-100">← Dashboard</Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-serif text-3xl text-[#1A1814] mb-10">Settings</h1>

        {/* Profile */}
        <section className="bg-white border border-[#E8E4DC] p-8 mb-6">
          <h2 className="font-serif text-xl text-[#1A1814] mb-6">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#6B6456] mb-2">Email</label>
              <div className="text-[#1A1814] bg-[#F7F5F1] px-4 py-3 text-sm">{userEmail}</div>
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#6B6456] mb-2">Full Name</label>
              <input
                value={profile.full_name}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                className="w-full border border-[#E8E4DC] px-4 py-3 text-sm text-[#1A1814] focus:outline-none focus:border-[#C8A96E]"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#6B6456] mb-2">Brokerage</label>
              <input
                value={profile.brokerage}
                onChange={e => setProfile(p => ({ ...p, brokerage: e.target.value }))}
                className="w-full border border-[#E8E4DC] px-4 py-3 text-sm text-[#1A1814] focus:outline-none focus:border-[#C8A96E]"
                placeholder="Your brokerage"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest uppercase text-[#6B6456] mb-2">Phone</label>
              <input
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-[#E8E4DC] px-4 py-3 text-sm text-[#1A1814] focus:outline-none focus:border-[#C8A96E]"
                placeholder="(000) 000-0000"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1A1814] text-[#F7F5F1] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#C8A96E] hover:text-[#1A1814] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
            </button>
          </div>
        </section>

        {/* Billing */}
        <section className="bg-white border border-[#E8E4DC] p-8 mb-6">
          <h2 className="font-serif text-xl text-[#1A1814] mb-4">Billing</h2>
          <p className="text-[#6B6456] text-sm mb-6">Manage your subscription, payment methods, and invoices through the Stripe billing portal.</p>
          <button
            onClick={handleBillingPortal}
            disabled={portalLoading}
            className="border border-[#1A1814] text-[#1A1814] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#1A1814] hover:text-[#F7F5F1] transition-colors disabled:opacity-50"
          >
            {portalLoading ? 'Loading…' : 'Manage Billing'}
          </button>
        </section>

        {/* Sign out */}
        <section className="bg-white border border-[#E8E4DC] p-8">
          <h2 className="font-serif text-xl text-[#1A1814] mb-4">Account</h2>
          <button
            onClick={handleSignOut}
            className="text-red-600 border border-red-200 px-8 py-3 text-xs tracking-widest uppercase hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </section>
      </main>
    </div>
  );
}
