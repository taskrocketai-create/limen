-- =============================================================================
-- Limen — Initial Schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type property_type as enum (
  'single_family',
  'condo',
  'townhouse',
  'land',
  'multi_family'
);

create type listing_status as enum (
  'draft',
  'intake_pending',
  'intake_received',
  'ai_ready',
  'reviewed',
  'submitted',
  'sold',
  'archived'
);

create type asset_type as enum (
  'photo',
  'floor_plan',
  'document'
);

create type asset_uploader as enum (
  'realtor',
  'homeowner'
);

create type notification_type as enum (
  'intake_submitted',
  'ai_ready',
  'mls_submitted'
);

create type subscription_status as enum (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'incomplete'
);

-- ---------------------------------------------------------------------------
-- profiles
-- Extends auth.users — one row per realtor account.
-- ---------------------------------------------------------------------------
create table profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  full_name                 text not null,
  license_number            text,
  brokerage                 text,
  phone                     text,
  stripe_customer_id        text unique,
  stripe_subscription_id    text unique,
  stripe_subscription_status subscription_status,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Realtors can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Realtors can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create table listings (
  id                  uuid primary key default uuid_generate_v4(),
  realtor_id          uuid not null references profiles(id) on delete cascade,
  -- address
  address_line1       text not null,
  address_line2       text,
  city                text not null,
  state               text not null,
  zip                 text not null,
  -- property details
  price               numeric(12, 2),
  bedrooms            numeric(4, 1),
  bathrooms           numeric(4, 1),
  sqft                integer,
  lot_size            text,
  year_built          integer,
  property_type       property_type,
  -- workflow
  status              listing_status not null default 'draft',
  intake_token        uuid not null unique default uuid_generate_v4(),
  intake_sent_at      timestamptz,
  intake_completed_at timestamptz,
  -- mls
  mls_number          text,
  submitted_at        timestamptz,
  -- timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table listings enable row level security;

create policy "Realtors can manage their own listings"
  on listings for all
  using (auth.uid() = realtor_id);

-- Public read via intake token — only the fields needed for the intake form.
-- Actual token validation is done server-side in the API route.
create policy "Intake token read"
  on listings for select
  using (true);

-- ---------------------------------------------------------------------------
-- listing_details
-- Homeowner intake responses.
-- ---------------------------------------------------------------------------
create table listing_details (
  id                  uuid primary key default uuid_generate_v4(),
  listing_id          uuid not null unique references listings(id) on delete cascade,
  highlights          text[],
  recent_updates      text,
  neighborhood_notes  text,
  hoa_details         text,
  seller_notes        text,
  submitted_at        timestamptz
);

alter table listing_details enable row level security;

create policy "Realtors can view details for their listings"
  on listing_details for select
  using (
    exists (
      select 1 from listings
      where listings.id = listing_details.listing_id
        and listings.realtor_id = auth.uid()
    )
  );

-- Homeowner upsert via service-role only (API route using admin client)

-- ---------------------------------------------------------------------------
-- listing_assets
-- Photos, floor plans, documents — paths into Supabase Storage only.
-- ---------------------------------------------------------------------------
create table listing_assets (
  id            uuid primary key default uuid_generate_v4(),
  listing_id    uuid not null references listings(id) on delete cascade,
  storage_path  text not null,
  asset_type    asset_type not null default 'photo',
  sort_order    integer not null default 0,
  uploaded_by   asset_uploader not null,
  created_at    timestamptz not null default now()
);

alter table listing_assets enable row level security;

create policy "Realtors can manage assets for their listings"
  on listing_assets for all
  using (
    exists (
      select 1 from listings
      where listings.id = listing_assets.listing_id
        and listings.realtor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- ai_outputs
-- Versioned AI-generated copy. Never auto-approved.
-- ---------------------------------------------------------------------------
create table ai_outputs (
  id                    uuid primary key default uuid_generate_v4(),
  listing_id            uuid not null references listings(id) on delete cascade,
  version               integer not null default 1,
  listing_description   text,
  headline_variants     text[],
  social_captions       jsonb,   -- { instagram, facebook, twitter }
  generated_at          timestamptz not null default now(),
  approved              boolean not null default false,
  approved_at           timestamptz,
  unique (listing_id, version)
);

alter table ai_outputs enable row level security;

create policy "Realtors can manage AI outputs for their listings"
  on ai_outputs for all
  using (
    exists (
      select 1 from listings
      where listings.id = ai_outputs.listing_id
        and listings.realtor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  realtor_id  uuid not null references profiles(id) on delete cascade,
  listing_id  uuid references listings(id) on delete set null,
  type        notification_type not null,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "Realtors can manage their own notifications"
  on notifications for all
  using (auth.uid() = realtor_id);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index on listings (realtor_id);
create index on listings (intake_token);
create index on listings (status);
create index on listing_assets (listing_id, sort_order);
create index on ai_outputs (listing_id, version desc);
create index on notifications (realtor_id, read, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles
  before update on profiles
  for each row execute function set_updated_at();

create trigger set_updated_at_listings
  before update on listings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
