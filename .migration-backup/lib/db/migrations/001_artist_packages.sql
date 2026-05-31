-- ============================================================
-- 001_artist_packages.sql
-- Pricing packages that an artist offers when open to bookings.
-- One artist can have multiple packages (e.g. "Club Night 90 min",
-- "Festival Headline", "B2B Set"). Promoters see these when
-- opening the booking form on an artist's profile.
-- ============================================================

create table if not exists artist_packages (
  id               uuid primary key default gen_random_uuid(),
  artist_id        uuid not null references artists(id) on delete cascade,

  -- Display
  name             text not null,                          -- e.g. "Club Night"
  description      text,                                   -- promoter-facing blurb
  suitable_for     text[] not null default '{}',           -- ["Club night","Festival","Rooftop party",…]

  -- Pricing
  price_inr        integer not null,                       -- base price in INR
  price_is_minimum boolean not null default true,          -- true = "from ₹X", false = flat rate
  travel_included  boolean not null default false,
  travel_note      text,                                   -- "Includes travel within Karnataka"

  -- Set details
  set_duration_min integer,                                -- minutes
  set_type         text not null default 'solo',           -- solo | b2b | live | live_pa
  tech_rider       text,                                   -- short rider note

  -- Visibility
  is_active        boolean not null default true,
  sort_order       integer not null default 0,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- One artist, ordered by sort_order, most relevant first
create index if not exists artist_packages_artist_id_idx
  on artist_packages(artist_id, sort_order);

-- RLS: public can read active packages; only the owning artist can write
alter table artist_packages enable row level security;

create policy "public read active packages"
  on artist_packages for select
  using (is_active = true);

create policy "artist can manage own packages"
  on artist_packages for all
  using (
    artist_id in (
      select id from artists where claimed_by = auth.uid()::text
    )
  );
