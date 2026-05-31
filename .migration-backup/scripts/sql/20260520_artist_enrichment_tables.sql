-- ─────────────────────────────────────────────────────────────────────────────
-- Artist enrichment tables migration
-- Run this in Supabase SQL Editor to add all new artist tables and columns
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Patch event_appearances: add missing columns (new schema) alongside old ones
ALTER TABLE public.event_appearances
  ADD COLUMN IF NOT EXISTS artist_slug   text,
  ADD COLUMN IF NOT EXISTS artist_name   text,
  ADD COLUMN IF NOT EXISTS venue         text,
  ADD COLUMN IF NOT EXISTS city          text,
  ADD COLUMN IF NOT EXISTS year          integer,
  ADD COLUMN IF NOT EXISTS source        text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS curated_event_id text;

-- Backfill new columns from old ones where they exist
UPDATE public.event_appearances SET
  venue  = COALESCE(venue, venue_name),
  city   = COALESCE(city, venue_city),
  year   = COALESCE(year, CASE WHEN event_date IS NOT NULL THEN EXTRACT(YEAR FROM event_date::date)::integer ELSE NULL END)
WHERE venue IS NULL OR city IS NULL OR year IS NULL;

CREATE INDEX IF NOT EXISTS idx_ea_artist_slug ON public.event_appearances (artist_slug);
CREATE INDEX IF NOT EXISTS idx_ea_year        ON public.event_appearances (year);

-- 2. Patch artist_connections: add new schema columns alongside old ones
ALTER TABLE public.artist_connections
  ADD COLUMN IF NOT EXISTS artist_a_id     text,
  ADD COLUMN IF NOT EXISTS artist_a_slug   text,
  ADD COLUMN IF NOT EXISTS artist_b_id     text,
  ADD COLUMN IF NOT EXISTS artist_b_slug   text,
  ADD COLUMN IF NOT EXISTS strength        integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS shared_events   text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shared_venues   text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source          text    NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS metadata        jsonb   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz;

CREATE INDEX IF NOT EXISTS idx_ac_artist_a_slug ON public.artist_connections (artist_a_slug);
CREATE INDEX IF NOT EXISTS idx_ac_artist_b_slug ON public.artist_connections (artist_b_slug);

-- 3. Artist discography
CREATE TABLE IF NOT EXISTS public.artist_discography (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        text NOT NULL,
  artist_slug      text NOT NULL,
  title            text NOT NULL,
  release_type     text NOT NULL, -- single | ep | album | remix | feature | compilation
  release_date     text,
  year             integer,
  label            text,
  catalog_number   text,
  spotify_url      text,
  soundcloud_url   text,
  bandcamp_url     text,
  youtube_url      text,
  featured_artists text[] NOT NULL DEFAULT '{}',
  remix_artists    text[] NOT NULL DEFAULT '{}',
  genre_tags       text[] NOT NULL DEFAULT '{}',
  artwork_url      text,
  description      text,
  source           text NOT NULL DEFAULT 'manual',
  external_id      text,
  raw_data         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_discography ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read artist discography"
  ON public.artist_discography FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_disc_artist_slug ON public.artist_discography (artist_slug);
CREATE INDEX IF NOT EXISTS idx_disc_year        ON public.artist_discography (year DESC);

-- 4. Artist milestones
CREATE TABLE IF NOT EXISTS public.artist_milestones (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id            text NOT NULL,
  artist_slug          text NOT NULL,
  date                 text NOT NULL,
  year                 integer,
  type                 text NOT NULL, -- first_gig | festival_debut | label_signing | release | milestone_followers | tour | b2b | residency | award | radio_show
  title                text NOT NULL,
  description          text,
  venue                text,
  city                 text,
  event_name           text,
  related_artist_slug  text,
  related_artist_name  text,
  image_url            text,
  video_url            text,
  source               text NOT NULL DEFAULT 'auto',
  source_event_id      text,
  importance           integer NOT NULL DEFAULT 5,
  is_featured          boolean NOT NULL DEFAULT false,
  metadata             jsonb NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read artist milestones"
  ON public.artist_milestones FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_milestones_artist_slug ON public.artist_milestones (artist_slug);
CREATE INDEX IF NOT EXISTS idx_milestones_date        ON public.artist_milestones (date ASC);

-- 5. Artist press
CREATE TABLE IF NOT EXISTS public.artist_press (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id      text NOT NULL,
  artist_slug    text NOT NULL,
  title          text NOT NULL,
  publication    text NOT NULL,
  author         text,
  excerpt        text,
  url            text,
  type           text NOT NULL DEFAULT 'review', -- review | interview | feature | premiere | mention | podcast
  tone           text DEFAULT 'positive',
  language       text DEFAULT 'en',
  country        text,
  date_published text,
  is_featured    boolean NOT NULL DEFAULT false,
  quote_for_epk  text,
  source         text NOT NULL DEFAULT 'manual',
  raw_data       jsonb NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_press ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read artist press"
  ON public.artist_press FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_press_artist_slug ON public.artist_press (artist_slug);

-- 6. Artist social stats (time-series)
CREATE TABLE IF NOT EXISTS public.artist_social_stats (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id                   text NOT NULL,
  artist_slug                 text NOT NULL,
  instagram_followers         integer,
  instagram_following         integer,
  instagram_posts             integer,
  soundcloud_followers        integer,
  soundcloud_tracks           integer,
  soundcloud_plays            integer,
  spotify_monthly_listeners   integer,
  spotify_followers           integer,
  youtube_subscribers         integer,
  youtube_videos              integer,
  youtube_views               integer,
  bandcamp_releases           integer,
  raw_data                    jsonb NOT NULL DEFAULT '{}',
  source                      text NOT NULL DEFAULT 'api',
  captured_at                 timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_social_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read artist social stats"
  ON public.artist_social_stats FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_social_stats_artist_slug ON public.artist_social_stats (artist_slug);
CREATE INDEX IF NOT EXISTS idx_social_stats_captured    ON public.artist_social_stats (captured_at DESC);

-- 7. Event artist lineups (structured lineups for curated events)
CREATE TABLE IF NOT EXISTS public.event_artist_lineups (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curated_event_id text NOT NULL,
  artist_id        text,
  artist_slug      text,
  artist_name      text NOT NULL,
  role             text NOT NULL DEFAULT 'performer', -- headliner | performer | b2b | support | dj | live
  stage            text,
  set_time         text,
  sort_order       integer NOT NULL DEFAULT 0,
  is_featured      boolean NOT NULL DEFAULT false,
  source           text NOT NULL DEFAULT 'manual',
  raw_data         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_artist_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read event artist lineups"
  ON public.event_artist_lineups FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_lineups_curated_event ON public.event_artist_lineups (curated_event_id);
CREATE INDEX IF NOT EXISTS idx_lineups_artist_slug   ON public.event_artist_lineups (artist_slug);
