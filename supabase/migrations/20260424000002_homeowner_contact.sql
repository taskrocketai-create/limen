-- =============================================================================
-- Limen — Persist homeowner invite contact details on listings
-- =============================================================================

alter table listings
  add column if not exists homeowner_name text,
  add column if not exists homeowner_email text,
  add column if not exists homeowner_phone text;

create index if not exists listings_homeowner_email_idx on listings (homeowner_email);
