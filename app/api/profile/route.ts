import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { full_name, brokerage, phone, license_number, website, brand_profile, logo_url, headshot_url, onboarding_completed } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = { updated_at: new Date().toISOString() };
  if (full_name !== undefined) updates.full_name = full_name;
  if (brokerage !== undefined) updates.brokerage = brokerage;
  if (phone !== undefined) updates.phone = phone;
  if (license_number !== undefined) updates.license_number = license_number;
  if (website !== undefined) updates.website = website;
  if (brand_profile !== undefined) updates.brand_profile = brand_profile;
  if (logo_url !== undefined) updates.logo_url = logo_url;
  if (headshot_url !== undefined) updates.headshot_url = headshot_url;
  if (onboarding_completed !== undefined) updates.onboarding_completed = onboarding_completed;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
