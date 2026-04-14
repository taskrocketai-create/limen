-- =============================================================================
-- Limen — Storage Buckets
-- Photos, floor plans, and documents stored in Supabase Storage only.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-assets',
  'listing-assets',
  false,
  52428800,  -- 50 MB per file
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf'
  ]
);

-- Realtors can upload to their own listing folders
create policy "Realtors can upload listing assets"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-assets'
    and auth.uid() is not null
  );

-- Realtors can read assets for their listings
create policy "Realtors can read listing assets"
  on storage.objects for select
  using (
    bucket_id = 'listing-assets'
    and auth.uid() is not null
  );

-- Realtors can delete their own assets
create policy "Realtors can delete listing assets"
  on storage.objects for delete
  using (
    bucket_id = 'listing-assets'
    and auth.uid() is not null
  );
