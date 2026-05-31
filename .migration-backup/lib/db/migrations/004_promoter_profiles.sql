-- ============================================================
-- 004_promoter_profiles.sql
--
-- Promoter accounts — Clerk-linked, verified by admin.
-- Promoters are the supply side of the booking marketplace:
-- venue managers, event organisers, festival bookers.
-- ============================================================

create table if not exists promoter_profiles (
  id                uuid primary key default gen_random_uuid(),

  -- Clerk identity
  clerk_user_id     text unique not null,
  email             text not null,

  -- Display
  company_name      text not null,
  contact_name      text,
  bio               text,
  logo_url          text,
  website           text,
  instagram         text,

  -- Location + genre focus
  primary_city      text,
  cities            text[] not null default '{}',
  genre_focus       text[] not null default '{}',

  -- Trust
  is_verified       boolean not null default false,
  verified_at       timestamptz,
  verified_by       text,                        -- admin clerk_user_id

  -- Stats (denormalised for display speed)
  bookings_count    integer not null default 0,
  total_spend_inr   integer not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists promoter_profiles_clerk_idx
  on promoter_profiles(clerk_user_id);

create index if not exists promoter_profiles_city_idx
  on promoter_profiles using gin (cities);

alter table promoter_profiles enable row level security;

-- Promoter can read/update their own row
create policy "promoter can manage own profile"
  on promoter_profiles for all
  using (clerk_user_id = auth.uid()::text);

-- Public can read verified promoter profiles
create policy "public read verified promoters"
  on promoter_profiles for select
  using (is_verified = true);
