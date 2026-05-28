-- ============================================================
-- 003_extend_artist_dates_and_booking_requests.sql
--
-- Incremental additions to existing tables.
-- All wrapped in IF NOT EXISTS / DO $$ so re-running is safe.
-- ============================================================

-- ── artist_dates: link to a booking + package chosen ─────────────────────────

alter table artist_dates
  add column if not exists booking_id         uuid,
  add column if not exists package_id         uuid references artist_packages(id) on delete set null,
  add column if not exists availability_block_id uuid references artist_availability_blocks(id) on delete set null,
  add column if not exists fee_agreed_inr     integer,   -- negotiated fee for this specific gig
  add column if not exists promoter_name      text,
  add column if not exists promoter_email     text,
  add column if not exists set_duration_min   integer,
  add column if not exists internal_notes     text;      -- artist-only, never public

-- Index for reverse-lookup from booking pipeline
create index if not exists artist_dates_booking_idx
  on artist_dates(booking_id) where booking_id is not null;

-- ── booking_requests: promote to a real structured record ─────────────────────
-- We keep backward compat: the old 'purpose' blob stays; new structured cols
-- are added alongside it. Old rows keep working, new inquiries write both.

alter table booking_requests
  add column if not exists artist_id_resolved uuid references artists(id) on delete set null,
  add column if not exists package_id         uuid references artist_packages(id) on delete set null,
  add column if not exists requester_name     text,
  add column if not exists event_type         text,
  add column if not exists event_date         date,
  add column if not exists event_date_end     date,         -- for multi-day requests
  add column if not exists venue_name         text,
  add column if not exists venue_city         text,
  add column if not exists budget_inr         integer,      -- numeric, replaces budget text
  add column if not exists notes              text,
  add column if not exists status             text not null default 'new',
                           -- new | quoted | held | confirmed | declined | cancelled | completed
  add column if not exists quoted_inr         integer,
  add column if not exists hold_expires_at    timestamptz,
  add column if not exists confirmed_at       timestamptz,
  add column if not exists source             text not null default 'marketplace',
                           -- marketplace | artist_profile | direct
  add column if not exists updated_at         timestamptz not null default now();

-- Status index for artist inbox queries
create index if not exists booking_requests_status_idx
  on booking_requests(artist_id_resolved, status, created_at desc)
  where artist_id_resolved is not null;

-- ── artists: kind column for Phase 4 talent platform ─────────────────────────
-- Adding now (nullable) so we don't need another migration later.
-- All existing rows will have kind = 'musician'.

alter table artists
  add column if not exists kind text not null default 'musician';
  -- musician | photographer | lighting | mix_engineer | production | videographer | mc

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'artists_kind_check'
  ) then
    alter table artists add constraint artists_kind_check
      check (kind in ('musician','photographer','lighting','mix_engineer','production','videographer','mc'));
  end if;
end $$;

-- Backfill existing artists as musicians (already default, belt-and-suspenders)
update artists set kind = 'musician' where kind is null or kind = '';

-- Index for filtering talent by kind
create index if not exists artists_kind_idx on artists(kind);
