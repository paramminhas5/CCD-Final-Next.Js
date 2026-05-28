-- ============================================================
-- 002_artist_availability_blocks.sql
--
-- Replaces the flat per-row artist_dates pattern for MANAGING
-- the artist's own schedule. artist_dates stays for individual
-- confirmed gig records. Blocks are the HOST-SIDE availability
-- calendar (like Airbnb host calendar).
--
-- Three kinds of block:
--   tour_leg    — "I'm in Goa Dec 27 – Jan 5, all dates negotiable"
--   unavailable — hard block-out (recording, personal, travel)
--   available   — explicit "I'm free here, please pitch me"
--
-- Weekly rules (optional):
--   weekly_days jsonb array e.g. [5,6] = Fri+Sat
--   When set, the block applies only on those weekdays within
--   the date range, giving a recurring rule feel.
-- ============================================================

create table if not exists artist_availability_blocks (
  id               uuid primary key default gen_random_uuid(),
  artist_id        uuid not null references artists(id) on delete cascade,

  -- Block identity
  kind             text not null default 'available',
                   -- tour_leg | unavailable | available
  label            text,                   -- e.g. "Goa leg", "NDA recording week"
  city             text,                   -- primary city / region for this block
  cities           text[] not null default '{}',  -- multi-city tour leg

  -- Dates
  start_date       date not null,
  end_date         date not null,          -- inclusive

  -- Weekly recurrence (null = applies every day in range)
  weekly_days      jsonb,                  -- e.g. [5, 6] for Fri+Sat (0=Sun … 6=Sat)

  -- Booking details
  fee_override_inr integer,               -- override artist default for this leg
  notes            text,                  -- promoter-visible notes
  is_public        boolean not null default true,

  -- Link back to a confirmed booking once held
  booking_id       uuid,                  -- FK added after bookings table exists

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint valid_date_range check (end_date >= start_date),
  constraint valid_kind check (kind in ('tour_leg','unavailable','available'))
);

create index if not exists avail_blocks_artist_dates_idx
  on artist_availability_blocks(artist_id, start_date, end_date);

create index if not exists avail_blocks_city_idx
  on artist_availability_blocks using gin (cities);

alter table artist_availability_blocks enable row level security;

create policy "public read public blocks"
  on artist_availability_blocks for select
  using (is_public = true);

create policy "artist can manage own blocks"
  on artist_availability_blocks for all
  using (
    artist_id in (
      select id from artists where claimed_by = auth.uid()::text
    )
  );
