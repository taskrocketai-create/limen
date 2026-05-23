import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  // Verify listing ownership
  const { data: listing } = await supabase
    .from('listings')
    .select('id')
    .eq('id', params.id)
    .eq('realtor_id', user.id)
    .single();

  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file') as File;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${params.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('listing-assets')
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from('listing-assets')
    .getPublicUrl(path);

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('listing_assets')
    .select('sort_order')
    .eq('listing_id', params.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const sortOrder = (existing?.sort_order ?? -1) + 1;

  const { data: asset, error: insertError } = await supabase
    .from('listing_assets')
    .insert({
      listing_id: params.id,
      storage_path: path,
      asset_type: 'photo',
      sort_order: sortOrder,
      uploaded_by: 'realtor',
    })
    .select('id, storage_path, sort_order')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ id: asset.id, url: publicUrl, path, sort_order: sortOrder });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  const { assetId, path } = await request.json();

  // Delete from storage
  await supabase.storage.from('listing-assets').remove([path]);

  // Delete from DB
  await supabase.from('listing_assets').delete().eq('id', assetId);

  return NextResponse.json({ success: true });
}
