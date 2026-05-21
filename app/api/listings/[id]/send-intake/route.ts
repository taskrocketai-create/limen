import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendIntakeEmail } from '@/utils/email';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: listing } = await supabase
    .from('listings')
    .select('*, homeowner_contacts(*)')
    .eq('id', params.id)
    .eq('realtor_id', user.id)
    .maybeSingle();

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

  const contact = listing.homeowner_contacts?.[0];
  if (!contact?.email) {
    return NextResponse.json({ error: 'No homeowner email on file' }, { status: 400 });
  }

  const intakeUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://limenai.org'}/intake/${listing.intake_token}`;

  await sendIntakeEmail({
    to: contact.email,
    homeownerName: contact.name ?? 'Homeowner',
    propertyAddress: listing.address ?? 'your property',
    intakeUrl,
  });

  await supabase
    .from('listings')
    .update({ intake_sent_at: new Date().toISOString() })
    .eq('id', params.id);

  return NextResponse.json({ success: true });
}
