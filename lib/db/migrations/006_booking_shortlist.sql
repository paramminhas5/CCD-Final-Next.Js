-- ============================================================
-- 006_booking_shortlist.sql
--
-- Promoter shortlist — the Airbnb "saved" equivalent.
-- A promoter can save multiple artists they're considering
-- for an event, attach a brief, and then "fan-out" —
-- sending the same booking inquiry to all of them at once.
-- ============================================================

create table if not exists booking_shortlist (
  id               uuid primary key default gen_random_uuid(),

  promoter_clerk_id text not null,             -- links to promoter_profiles.clerk_user_id
  artist_id        uuid not null references artists(id) on delete cascade,

  -- Brief (shared context for the fan-out)
  brief_event_type text,
  brief_date       date,
  brief_date_end   date,
  brief_cities     text[] not null default '{}',
  brief_budget_inr integer,
  brief_notes      text,

  -- Status: whether this artist has already been contacted in a fan-out
  contacted        boolean not null default false,
  contacted_at     timestamptz,
  booking_request_id uuid references booking_requests(id) on delete set null,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (promoter_clerk_id, artist_id)        -- one entry per promoter+artist pair
);

create index if not exists shortlist_promoter_idx
  on booking_shortlist(promoter_clerk_id, created_at desc);

create index if not exists shortlist_artist_idx
  on booking_shortlist(artist_id);

alter table booking_shortlist enable row level security;

create policy "promoter manages own shortlist"
  on booking_shortlist for all
  using (promoter_clerk_id = auth.uid()::text);

-- ── Also add promoter_clerk_id column to booking_requests ──────────────────
-- Links a booking request back to the promoter who made it.
alter table booking_requests
  add column if not exists promoter_clerk_id text,
  add column if not exists promoter_name      text;

create index if not exists booking_requests_promoter_idx
  on booking_requests(promoter_clerk_id, created_at desc)
  where promoter_clerk_id is not null;
