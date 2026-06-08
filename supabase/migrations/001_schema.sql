-- ============================================================
-- 001_schema.sql
-- CCD Artist Platform — canonical schema
--
-- Creates / extends every table the platform needs.
-- Run FIRST, before any seed files.
--
-- Safe to re-run: every statement uses IF NOT EXISTS or
-- ADD COLUMN IF NOT EXISTS — nothing breaks on a second run.
--
-- What it does (in order):
--   1.  Extend artists table (kind, fees, enrichment cols…)
--   2.  artist_social_stats   — follower snapshots per platform
--   3.  artist_milestones     — career timeline events
--   4.  artist_discography    — releases (singles, EPs, albums…)
--   5.  artist_press          — press coverage / interviews
--   6.  artist_packages       — booking packages with pricing
--   7.  artist_availability_blocks — host-side calendar
--   8.  Extend booking_requests    — structured booking columns
--   9.  booking_messages      — in-thread messaging per booking
--   10. promoter_profiles     — Clerk-linked promoter accounts
--   11. booking_shortlist     — promoter saved-artists + fan-out
--   12. user_roles            — artist / promoter / admin
--   13. user_taste_profiles   — users following artists
--   14. fan_profiles          — XP / tier system
--   15. event_artist_lineups  — curated events ↔ artist slugs
--   16. Extend artist_dates   — link dates to bookings
-- ============================================================

-- ── 1. Extend artists table ───────────────────────────────────────────────────

ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS kind          text NOT NULL DEFAULT 'musician',
  ADD COLUMN IF NOT EXISTS why           text,
  ADD COLUMN IF NOT EXISTS members       text,
  ADD COLUMN IF NOT EXISTS festivals     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fee_currency  text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS fee_min_inr   integer,
  ADD COLUMN IF NOT EXISTS fee_max_inr   integer,
  ADD COLUMN IF NOT EXISTS available_cities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_to_bookings boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS source        text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS enriched_at   timestamptz,
  ADD COLUMN IF NOT EXISTS spotify_id    text,
  ADD COLUMN IF NOT EXISTS youtube_channel_id text,
  ADD COLUMN IF NOT EXISTS ra_id         text;

-- kind constraint (safe no-op if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'artists_kind_check'
  ) THEN
    ALTER TABLE artists ADD CONSTRAINT artists_kind_check
      CHECK (kind IN ('musician','photographer','lighting','mix_engineer',
                      'production','videographer','mc'));
  END IF;
END $$;

-- Indexes on artists
CREATE INDEX IF NOT EXISTS artists_slug_idx        ON artists(slug);
CREATE INDEX IF NOT EXISTS artists_featured_idx    ON artists(featured, status);
CREATE INDEX IF NOT EXISTS artists_claimed_by_idx  ON artists(claimed_by) WHERE claimed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS artists_kind_idx        ON artists(kind);


-- ── 2. artist_social_stats ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artist_social_stats (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id                uuid REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug              text NOT NULL,

  -- Platform follower counts
  instagram_followers      integer,
  soundcloud_followers     integer,
  spotify_followers        integer,
  spotify_monthly_listeners integer,
  youtube_subscribers      integer,
  bandcamp_followers       integer,

  -- Provenance
  source                   text NOT NULL DEFAULT 'manual',
  -- manual | spotify | youtube | soundcloud | ra | bandcamp

  captured_at              timestamptz NOT NULL DEFAULT now(),
  created_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artist_social_stats_slug_idx
  ON artist_social_stats(artist_slug, captured_at DESC);

CREATE INDEX IF NOT EXISTS artist_social_stats_artist_id_idx
  ON artist_social_stats(artist_id, captured_at DESC);


-- ── 3. artist_milestones ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artist_milestones (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id             uuid REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug           text NOT NULL,

  type                  text NOT NULL DEFAULT 'first_gig',
  -- first_gig | festival_debut | label_signing | release |
  -- milestone_followers | tour | b2b | residency | award | radio_show

  title                 text NOT NULL,
  description           text,
  date                  date NOT NULL,
  year                  integer,
  city                  text,
  venue                 text,
  is_featured           boolean NOT NULL DEFAULT false,
  importance            integer NOT NULL DEFAULT 5, -- 1–10

  -- Enrichment provenance
  source                text NOT NULL DEFAULT 'manual',
  enriched_at           timestamptz,

  related_artist_slug   text,
  related_artist_name   text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artist_milestones_slug_idx
  ON artist_milestones(artist_slug, date ASC);

CREATE INDEX IF NOT EXISTS artist_milestones_artist_id_idx
  ON artist_milestones(artist_id, date ASC);


-- ── 4. artist_discography ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artist_discography (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       uuid REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug     text NOT NULL,

  title           text NOT NULL,
  release_type    text NOT NULL DEFAULT 'single',
  -- single | ep | album | remix | feature | compilation | mix

  release_date    date,
  year            integer,
  label           text,
  artwork_url     text,

  -- Streaming links
  spotify_url     text,
  soundcloud_url  text,
  bandcamp_url    text,
  youtube_url     text,

  description     text,

  -- Enrichment provenance
  source          text NOT NULL DEFAULT 'manual',
  enriched_at     timestamptz,
  external_id     text, -- spotify track/album id, etc.

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artist_discography_slug_idx
  ON artist_discography(artist_slug, release_date DESC);

CREATE INDEX IF NOT EXISTS artist_discography_artist_id_idx
  ON artist_discography(artist_id, release_date DESC);


-- ── 5. artist_press ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artist_press (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id       uuid REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug     text NOT NULL,

  title           text NOT NULL,
  publication     text NOT NULL,
  author          text,
  excerpt         text,
  url             text,

  type            text NOT NULL DEFAULT 'review',
  -- review | interview | feature | premiere | mention | podcast

  date_published  date,
  is_featured     boolean NOT NULL DEFAULT false,
  quote_for_epk   text, -- best pull quote shown in EPK

  -- Enrichment provenance
  source          text NOT NULL DEFAULT 'manual',
  enriched_at     timestamptz,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artist_press_slug_idx
  ON artist_press(artist_slug, date_published DESC);

CREATE INDEX IF NOT EXISTS artist_press_artist_id_idx
  ON artist_press(artist_id, date_published DESC);


-- ── 6. artist_packages ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artist_packages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug      text NOT NULL,

  name             text NOT NULL,
  description      text,
  suitable_for     text[] NOT NULL DEFAULT '{}',

  price_inr        integer NOT NULL DEFAULT 0,
  price_is_minimum boolean NOT NULL DEFAULT true,
  travel_included  boolean NOT NULL DEFAULT false,
  travel_note      text,

  set_duration_min integer,
  set_type         text NOT NULL DEFAULT 'solo',
  -- solo | b2b | live | live_pa

  tech_rider       text,
  is_active        boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS artist_packages_artist_id_idx
  ON artist_packages(artist_id, sort_order);

CREATE INDEX IF NOT EXISTS artist_packages_slug_idx
  ON artist_packages(artist_slug) WHERE is_active = true;


-- ── 7. artist_availability_blocks ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artist_availability_blocks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,

  kind             text NOT NULL DEFAULT 'available',
  -- tour_leg | unavailable | available

  label            text,
  city             text,
  cities           text[] NOT NULL DEFAULT '{}',

  start_date       date NOT NULL,
  end_date         date NOT NULL,

  weekly_days      jsonb, -- e.g. [5, 6] for Fri+Sat

  fee_override_inr integer,
  notes            text,
  is_public        boolean NOT NULL DEFAULT true,

  booking_id       uuid,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT avail_blocks_date_range CHECK (end_date >= start_date),
  CONSTRAINT avail_blocks_kind_check CHECK (kind IN ('tour_leg','unavailable','available'))
);

CREATE INDEX IF NOT EXISTS avail_blocks_artist_dates_idx
  ON artist_availability_blocks(artist_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS avail_blocks_public_idx
  ON artist_availability_blocks(start_date, end_date) WHERE is_public = true;


-- ── 8. Extend booking_requests ───────────────────────────────────────────────

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS artist_id_resolved uuid REFERENCES artists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS package_id         uuid,
  ADD COLUMN IF NOT EXISTS requester_name     text,
  ADD COLUMN IF NOT EXISTS event_type         text,
  ADD COLUMN IF NOT EXISTS event_date         date,
  ADD COLUMN IF NOT EXISTS event_date_end     date,
  ADD COLUMN IF NOT EXISTS venue_name         text,
  ADD COLUMN IF NOT EXISTS venue_city         text,
  ADD COLUMN IF NOT EXISTS budget_inr         integer,
  ADD COLUMN IF NOT EXISTS notes              text,
  ADD COLUMN IF NOT EXISTS status             text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS quoted_inr         integer,
  ADD COLUMN IF NOT EXISTS hold_expires_at    timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at       timestamptz,
  ADD COLUMN IF NOT EXISTS source             text NOT NULL DEFAULT 'marketplace',
  ADD COLUMN IF NOT EXISTS promoter_clerk_id  text,
  ADD COLUMN IF NOT EXISTS promoter_name      text,
  ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS booking_requests_artist_resolved_idx
  ON booking_requests(artist_id_resolved, status, created_at DESC)
  WHERE artist_id_resolved IS NOT NULL;

CREATE INDEX IF NOT EXISTS booking_requests_promoter_idx
  ON booking_requests(promoter_clerk_id, created_at DESC)
  WHERE promoter_clerk_id IS NOT NULL;


-- ── 9. booking_messages ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS booking_messages (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,

  sender_role         text NOT NULL,
  -- artist | promoter | system

  sender_clerk_id     text,
  sender_name         text,

  body                text NOT NULL,
  is_system           boolean NOT NULL DEFAULT false,

  quote_inr           integer,
  quote_valid_until   timestamptz,

  read_by_artist      boolean NOT NULL DEFAULT false,
  read_by_promoter    boolean NOT NULL DEFAULT false,

  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT booking_messages_role_check
    CHECK (sender_role IN ('artist', 'promoter', 'system'))
);

CREATE INDEX IF NOT EXISTS booking_messages_booking_idx
  ON booking_messages(booking_id, created_at ASC);

CREATE INDEX IF NOT EXISTS booking_messages_unread_artist_idx
  ON booking_messages(booking_id)
  WHERE read_by_artist = false AND sender_role = 'promoter';

CREATE INDEX IF NOT EXISTS booking_messages_unread_promoter_idx
  ON booking_messages(booking_id)
  WHERE read_by_promoter = false AND sender_role = 'artist';


-- ── 10. promoter_profiles ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS promoter_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  clerk_user_id   text UNIQUE NOT NULL,
  email           text NOT NULL,

  company_name    text NOT NULL,
  contact_name    text,
  bio             text,
  logo_url        text,
  website         text,
  instagram       text,

  primary_city    text,
  cities          text[] NOT NULL DEFAULT '{}',
  genre_focus     text[] NOT NULL DEFAULT '{}',

  is_verified     boolean NOT NULL DEFAULT false,
  verified_at     timestamptz,
  verified_by     text,

  bookings_count  integer NOT NULL DEFAULT 0,
  total_spend_inr integer NOT NULL DEFAULT 0,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promoter_profiles_clerk_idx
  ON promoter_profiles(clerk_user_id);


-- ── 11. booking_shortlist ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS booking_shortlist (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  promoter_clerk_id   text NOT NULL,
  artist_id           uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,

  brief_event_type    text,
  brief_date          date,
  brief_date_end      date,
  brief_cities        text[] NOT NULL DEFAULT '{}',
  brief_budget_inr    integer,
  brief_notes         text,

  contacted           boolean NOT NULL DEFAULT false,
  contacted_at        timestamptz,
  booking_request_id  uuid REFERENCES booking_requests(id) ON DELETE SET NULL,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (promoter_clerk_id, artist_id)
);

CREATE INDEX IF NOT EXISTS shortlist_promoter_idx
  ON booking_shortlist(promoter_clerk_id, created_at DESC);


-- ── 12. user_roles ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   text NOT NULL,
  role            text NOT NULL,
  -- artist | promoter | admin

  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (clerk_user_id, role),
  CONSTRAINT user_roles_role_check CHECK (role IN ('artist', 'promoter', 'admin'))
);

CREATE INDEX IF NOT EXISTS user_roles_clerk_idx ON user_roles(clerk_user_id);


-- ── 13. user_taste_profiles ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_taste_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   text NOT NULL,
  artist_slug     text NOT NULL,
  followed_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE (clerk_user_id, artist_slug)
);

CREATE INDEX IF NOT EXISTS user_taste_clerk_idx ON user_taste_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS user_taste_artist_idx ON user_taste_profiles(artist_slug);


-- ── 14. fan_profiles ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fan_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   text UNIQUE NOT NULL,
  xp              integer NOT NULL DEFAULT 0,
  tier            text NOT NULL DEFAULT 'newcomer',
  -- newcomer | regular | devotee | insider
  followed_artists text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS fan_profiles_clerk_idx ON fan_profiles(clerk_user_id);


-- ── 15. event_artist_lineups (links curated events → artist slugs) ────────────

CREATE TABLE IF NOT EXISTS event_artist_lineups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid REFERENCES curated_events(id) ON DELETE CASCADE,
  artist_slug     text NOT NULL,
  role            text NOT NULL DEFAULT 'performer',
  -- headliner | performer | support | b2b
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (event_id, artist_slug)
);

CREATE INDEX IF NOT EXISTS event_lineups_artist_idx ON event_artist_lineups(artist_slug);
CREATE INDEX IF NOT EXISTS event_lineups_event_idx  ON event_artist_lineups(event_id);


-- ── 16. Extend artist_dates (link to bookings) ───────────────────────────────

ALTER TABLE artist_dates
  ADD COLUMN IF NOT EXISTS booking_id           uuid,
  ADD COLUMN IF NOT EXISTS package_id           uuid,
  ADD COLUMN IF NOT EXISTS availability_block_id uuid,
  ADD COLUMN IF NOT EXISTS fee_agreed_inr        integer,
  ADD COLUMN IF NOT EXISTS promoter_name         text,
  ADD COLUMN IF NOT EXISTS promoter_email        text,
  ADD COLUMN IF NOT EXISTS set_duration_min      integer,
  ADD COLUMN IF NOT EXISTS internal_notes        text,
  ADD COLUMN IF NOT EXISTS is_public             boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS artist_dates_artist_date_idx
  ON artist_dates(artist_id, event_date ASC);

CREATE INDEX IF NOT EXISTS artist_dates_public_idx
  ON artist_dates(event_date ASC) WHERE is_public = true;


-- ── Done ─────────────────────────────────────────────────────────────────────
-- Run 01_artists_seed.sql next to populate the artists table.
