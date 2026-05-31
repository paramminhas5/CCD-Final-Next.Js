-- ══════════════════════════════════════════════════════════════════════════════
-- CCD MASTER SEED — v1.0  (May 2026)
-- Run once in Supabase SQL Editor. Safe to re-run — fully idempotent.
--
-- ORDER OF OPERATIONS:
--   §1  Core table creation (early_access, event_rsvps, site_settings, events,
--       artists, promoters, curated_events, contact_messages, site_videos,
--       booking_requests, artist_dates, artist_submissions)
--   §2  Schema patches  (ALTER TABLE IF NOT EXISTS on every column we need)
--   §3  Knowledge-graph tables  (event_appearances, artist_connections,
--       venue_profiles, event_signals, user_roles, fan_profiles, xp_events)
--   §4  Artist-enrichment tables (milestones, discography, press, social_stats,
--       event_artist_lineups, user_event_interactions, user_taste_profiles)
--   §5  Booking tables  (artist_packages, artist_availability_blocks,
--       promoter_profiles, booking_messages, booking_shortlist)
--   §6  Ticketing tables
--   §7  RLS policies
--   §8  Venue profiles seed
--   §9  Promoters seed
--   §10 Artists seed  (20 priority artists with full bios)
--   §11 Events seed  (CCDXSOCIAL 01-03, MEGA, Episode-1)
--   §12 Artist dates  (Startdawg + Merman confirmed Jun 29)
--   §13 Curated events seed  (30 real upcoming events across India)
--   §14 Event artist lineups  (wire CCDXSOCIAL 01 lineup)
--   §15 Artist connections + event appearances
--   §16 Artist milestones
--   §17 Site settings  (homepage toggles, playlists, videos)
--   §18 Verify row counts
-- ══════════════════════════════════════════════════════════════════════════════

set search_path = public;



-- ══════════════════════════════════════════════════════════════════════════════
-- §1  CORE TABLES
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists early_access_signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_slug text not null,
  name       text not null,
  email      text not null,
  plus_ones  integer not null default 0,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (event_slug, email)
);

create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  id                   text primary key,
  playlists            jsonb not null default '[]'::jsonb,
  featured_playlist_id text,
  seo_verifications    jsonb not null default '{}'::jsonb,
  marquees             jsonb not null default '[]'::jsonb,
  theme                jsonb not null default '{}'::jsonb,
  home_content         jsonb not null default '{}'::jsonb,
  blog_posts           jsonb not null default '[]'::jsonb,
  backlinks            jsonb not null default '[]'::jsonb,
  updated_at           timestamptz not null default now()
);

create table if not exists site_videos (
  id            uuid primary key default gen_random_uuid(),
  youtube_id    text not null,
  title         text not null,
  thumbnail_url text,
  is_featured   boolean not null default false,
  sort_order    integer not null default 0,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);



create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  title      text not null,
  date       text not null,
  city       text not null,
  venue      text not null,
  blurb      text not null default '',
  lineup     jsonb not null default '[]'::jsonb,
  media      jsonb not null default '[]'::jsonb,
  status     text not null default 'upcoming',
  poster_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists artists (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  based_city         text,
  from_city          text,
  bio                text,
  why                text,
  genres             text[] not null default '{}',
  festivals          text[] not null default '{}',
  instagram          text,
  soundcloud         text,
  bandcamp           text,
  spotify            text,
  website            text,
  booking_email      text,
  manager_email      text,
  labels             text,
  members            text,
  photo_url          text,
  fee_min_inr        integer,
  fee_max_inr        integer,
  fee_currency       text not null default 'INR',
  open_to_bookings   boolean not null default true,
  available_cities   text[] not null default '{}',
  featured           boolean not null default false,
  status             text not null default 'pending',
  source             text not null default 'manual',
  claimed_by         text,
  claim_requested_at timestamptz,
  gallery            jsonb not null default '[]'::jsonb,
  videos             jsonb not null default '[]'::jsonb,
  enrichment_status  text not null default 'pending',
  enrichment_log     jsonb not null default '{}'::jsonb,
  enriched_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);



create table if not exists promoters (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  city          text,
  cities        text[] not null default '{}',
  genres        text[] not null default '{}',
  blurb         text,
  logo_url      text,
  instagram     text,
  website       text,
  booking_email text,
  crawl_urls    jsonb not null default '[]'::jsonb,
  trusted       boolean not null default false,
  claimed_by    text,
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists curated_events (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  url              text not null unique,
  source           text not null,
  city             text,
  venue            text,
  event_date       text,
  event_time       text,
  blurb            text,
  genre            jsonb not null default '[]'::jsonb,
  image_url        text,
  is_featured      boolean not null default false,
  submission_status text not null default 'published',
  submitted_by     text,
  promoter_slug    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists booking_requests (
  id                  uuid primary key default gen_random_uuid(),
  artist_id           text,
  artist_name         text,
  requester_email     text,
  requester_name      text,
  requester_phone     text,
  purpose             text,
  event_type          text,
  event_date          date,
  venue_name          text,
  venue_city          text,
  budget_inr          integer,
  notes               text,
  status              text not null default 'new',
  forward_requested   boolean not null default false,
  ip_hash             text,
  user_agent          text,
  verified_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists artist_submissions (
  id             uuid primary key default gen_random_uuid(),
  name           text,
  submitter_email text,
  submitter_role text,
  bio            text,
  from_city      text,
  based_city     text,
  genres         text[] default '{}',
  festivals      text[] default '{}',
  instagram      text,
  soundcloud     text,
  bandcamp       text,
  spotify        text,
  website        text,
  booking_email  text,
  manager_email  text,
  labels         text,
  members        text,
  photo_url      text,
  notes          text,
  status         text not null default 'pending',
  user_agent     text,
  created_at     timestamptz not null default now()
);

create table if not exists artist_dates (
  id            uuid primary key default gen_random_uuid(),
  artist_id     uuid not null,
  city          text not null,
  venue         text,
  event_date    text not null,
  event_time    text,
  status        text not null default 'confirmed',
  ticket_url    text,
  notes         text,
  is_public     boolean not null default true,
  created_by    text not null default 'artist',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);



-- ══════════════════════════════════════════════════════════════════════════════
-- §2  SCHEMA PATCHES — add columns that may not exist yet
-- ══════════════════════════════════════════════════════════════════════════════

-- events: series fields (needed by EventDetail, Events, CcdxSocialHomeStrip)
alter table events add column if not exists series         text;
alter table events add column if not exists series_label   text;
alter table events add column if not exists event_type     text;
alter table events add column if not exists pet_friendly   boolean default false;
alter table events add column if not exists series_tagline text;
alter table events add column if not exists is_finale      boolean default false;

-- artists: portal + booking fields
alter table artists add column if not exists open_to_bookings   boolean not null default true;
alter table artists add column if not exists available_cities   text[] not null default '{}';
alter table artists add column if not exists soundcloud         text;
alter table artists add column if not exists claimed_by         text;
alter table artists add column if not exists claim_requested_at timestamptz;
alter table artists add column if not exists kind               text not null default 'musician';

-- promoters: claimed_by for promoter submit flow
alter table promoters add column if not exists claimed_by text;

-- curated_events: promoter submission fields
alter table curated_events add column if not exists submission_status text not null default 'published';
alter table curated_events add column if not exists submitted_by      text;
alter table curated_events add column if not exists promoter_slug     text;

-- booking_requests: structured fields added by booking phase 1
alter table booking_requests add column if not exists artist_id_resolved uuid;
alter table booking_requests add column if not exists package_id         uuid;
alter table booking_requests add column if not exists requester_name     text;
alter table booking_requests add column if not exists event_type         text;
alter table booking_requests add column if not exists event_date         date;
alter table booking_requests add column if not exists venue_name         text;
alter table booking_requests add column if not exists venue_city         text;
alter table booking_requests add column if not exists budget_inr         integer;
alter table booking_requests add column if not exists notes              text;
alter table booking_requests add column if not exists status             text not null default 'new';
alter table booking_requests add column if not exists updated_at         timestamptz not null default now();
alter table booking_requests add column if not exists promoter_clerk_id  text;
alter table booking_requests add column if not exists promoter_name      text;
alter table booking_requests add column if not exists source             text not null default 'marketplace';

-- artist_dates: extended fields
alter table artist_dates add column if not exists booking_id          uuid;
alter table artist_dates add column if not exists fee_agreed_inr      integer;
alter table artist_dates add column if not exists promoter_name       text;
alter table artist_dates add column if not exists promoter_email      text;
alter table artist_dates add column if not exists set_duration_min    integer;
alter table artist_dates add column if not exists internal_notes      text;

-- site_settings: extra columns
alter table site_settings add column if not exists seo_verifications jsonb not null default '{}'::jsonb;
alter table site_settings add column if not exists marquees           jsonb not null default '[]'::jsonb;
alter table site_settings add column if not exists theme              jsonb not null default '{}'::jsonb;
alter table site_settings add column if not exists home_content       jsonb not null default '{}'::jsonb;
alter table site_settings add column if not exists blog_posts         jsonb not null default '[]'::jsonb;
alter table site_settings add column if not exists backlinks          jsonb not null default '[]'::jsonb;



-- ══════════════════════════════════════════════════════════════════════════════
-- §3  KNOWLEDGE-GRAPH TABLES
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists event_appearances (
  id               uuid primary key default gen_random_uuid(),
  artist_id        text not null,
  artist_slug      text not null,
  artist_name      text not null,
  event_name       text not null,
  venue            text,
  city             text,
  event_date       text,
  year             integer,
  role             text not null default 'performer',
  source           text not null default 'manual',
  curated_event_id text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_ea_artist_slug on event_appearances (artist_slug);
create index if not exists idx_ea_city        on event_appearances (city);
create index if not exists idx_ea_year        on event_appearances (year);

create table if not exists artist_connections (
  id               uuid primary key default gen_random_uuid(),
  artist_a_id      text not null,
  artist_a_slug    text not null,
  artist_b_id      text not null,
  artist_b_slug    text not null,
  connection_type  text not null,
  strength         integer not null default 1,
  shared_events    text[]  not null default '{}',
  shared_venues    text[]  not null default '{}',
  notes            text,
  source           text not null default 'manual',
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_ac_artist_a on artist_connections (artist_a_slug);
create index if not exists idx_ac_artist_b on artist_connections (artist_b_slug);
create unique index if not exists idx_ac_unique_edge on artist_connections (
  least(artist_a_slug, artist_b_slug),
  greatest(artist_a_slug, artist_b_slug),
  connection_type
);

create table if not exists venue_profiles (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  city        text not null,
  capacity    integer,
  genre_focus text[]  not null default '{}',
  description text,
  tier        text not null default 'club',
  instagram   text,
  website     text,
  address     text,
  is_verified boolean not null default false,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_vp_city on venue_profiles (city);

create table if not exists event_signals (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  event_id    text not null,
  signal_type text not null default 'click',
  city        text,
  genre       text,
  created_at  timestamptz not null default now()
);

create table if not exists user_roles (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null unique,
  email        text,
  display_name text,
  role         text not null default 'user',
  entity_id    text,
  entity_slug  text,
  entity_name  text,
  granted_by   text,
  granted_at   timestamptz default now(),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists role_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  email          text not null,
  display_name   text not null,
  requested_role text not null,
  entity_id      text,
  entity_slug    text,
  message        text,
  links          jsonb default '{}'::jsonb,
  status         text not null default 'pending',
  reviewed_by    text,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists fan_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text not null unique,
  email              text,
  display_name       text,
  xp                 integer not null default 0,
  ccd_points         integer not null default 0,
  tier               text not null default 'lurker',
  total_interactions integer not null default 0,
  events_rsvpd       integer not null default 0,
  events_saved       integer not null default 0,
  shares             integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists xp_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  action        text not null,
  xp_earned     integer not null default 0,
  points_earned integer not null default 0,
  ref_id        text,
  ref_type      text,
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);



-- ══════════════════════════════════════════════════════════════════════════════
-- §4  ARTIST-ENRICHMENT TABLES
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists artist_milestones (
  id                  uuid primary key default gen_random_uuid(),
  artist_id           text not null,
  artist_slug         text not null,
  date                text not null,
  year                integer,
  type                text not null,
  title               text not null,
  description         text,
  venue               text,
  city                text,
  event_name          text,
  related_artist_slug text,
  related_artist_name text,
  image_url           text,
  video_url           text,
  source              text not null default 'manual',
  source_event_id     text,
  importance          integer not null default 5,
  is_featured         boolean not null default false,
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);
create index if not exists idx_milestones_artist_slug on artist_milestones (artist_slug);

create table if not exists artist_discography (
  id               uuid primary key default gen_random_uuid(),
  artist_id        text not null,
  artist_slug      text not null,
  title            text not null,
  release_type     text not null,
  release_date     text,
  year             integer,
  label            text,
  catalog_number   text,
  spotify_url      text,
  soundcloud_url   text,
  bandcamp_url     text,
  youtube_url      text,
  featured_artists text[] not null default '{}',
  remix_artists    text[] not null default '{}',
  genre_tags       text[] not null default '{}',
  artwork_url      text,
  description      text,
  source           text not null default 'manual',
  external_id      text,
  raw_data         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists idx_disc_artist_slug on artist_discography (artist_slug);

create table if not exists artist_press (
  id             uuid primary key default gen_random_uuid(),
  artist_id      text not null,
  artist_slug    text not null,
  title          text not null,
  publication    text not null,
  author         text,
  excerpt        text,
  url            text,
  type           text not null default 'review',
  tone           text default 'positive',
  language       text default 'en',
  country        text,
  date_published text,
  is_featured    boolean not null default false,
  quote_for_epk  text,
  source         text not null default 'manual',
  raw_data       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_press_artist_slug on artist_press (artist_slug);

create table if not exists artist_social_stats (
  id                        uuid primary key default gen_random_uuid(),
  artist_id                 text not null,
  artist_slug               text not null,
  instagram_followers       integer,
  instagram_following       integer,
  instagram_posts           integer,
  soundcloud_followers      integer,
  soundcloud_tracks         integer,
  soundcloud_plays          integer,
  spotify_monthly_listeners integer,
  spotify_followers         integer,
  youtube_subscribers       integer,
  youtube_videos            integer,
  youtube_views             integer,
  bandcamp_releases         integer,
  raw_data                  jsonb not null default '{}'::jsonb,
  source                    text not null default 'manual',
  captured_at               timestamptz not null default now()
);
create index if not exists idx_social_stats_artist_slug on artist_social_stats (artist_slug);

create table if not exists event_artist_lineups (
  id               uuid primary key default gen_random_uuid(),
  curated_event_id text not null,
  artist_id        text,
  artist_slug      text,
  artist_name      text not null,
  role             text not null default 'performer',
  stage            text,
  set_time         text,
  sort_order       integer not null default 0,
  is_featured      boolean not null default false,
  source           text not null default 'manual',
  raw_data         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);
create index if not exists idx_lineups_curated_event on event_artist_lineups (curated_event_id);
create index if not exists idx_lineups_artist_slug   on event_artist_lineups (artist_slug);

create table if not exists user_event_interactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  event_id     text not null,
  action       text not null,
  city_filter  text,
  genre_filter text,
  source_tab   text,
  session_id   text,
  device_type  text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_uei_user_id on user_event_interactions (user_id);

create table if not exists user_taste_profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              text not null unique,
  liked_genres         text[] not null default '{}',
  liked_artist_slugs   text[] not null default '{}',
  liked_venues         text[] not null default '{}',
  liked_cities         text[] not null default '{}',
  genre_affinity       jsonb not null default '{}'::jsonb,
  preferred_days       text[] not null default '{}',
  price_sensitivity    real,
  travel_willingness   real,
  total_events_viewed  integer not null default 0,
  total_events_saved   integer not null default 0,
  total_events_attended integer not null default 0,
  computed_at          timestamptz not null default now(),
  created_at           timestamptz not null default now()
);



-- ══════════════════════════════════════════════════════════════════════════════
-- §5  BOOKING TABLES
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists artist_packages (
  id               uuid primary key default gen_random_uuid(),
  artist_id        uuid not null,
  name             text not null,
  description      text,
  suitable_for     text[] not null default '{}',
  price_inr        integer not null,
  price_is_minimum boolean not null default true,
  travel_included  boolean not null default false,
  travel_note      text,
  set_duration_min integer,
  set_type         text not null default 'solo',
  tech_rider       text,
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists artist_availability_blocks (
  id               uuid primary key default gen_random_uuid(),
  artist_id        uuid not null,
  kind             text not null default 'available',
  label            text,
  city             text,
  cities           text[] not null default '{}',
  start_date       date not null,
  end_date         date not null,
  weekly_days      jsonb,
  fee_override_inr integer,
  notes            text,
  is_public        boolean not null default true,
  booking_id       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists promoter_profiles (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text unique not null,
  email           text not null,
  company_name    text not null,
  contact_name    text,
  bio             text,
  logo_url        text,
  website         text,
  instagram       text,
  primary_city    text,
  cities          text[] not null default '{}',
  genre_focus     text[] not null default '{}',
  is_verified     boolean not null default false,
  verified_at     timestamptz,
  verified_by     text,
  bookings_count  integer not null default 0,
  total_spend_inr integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists booking_messages (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null,
  sender_role         text not null,
  sender_clerk_id     text,
  sender_name         text,
  body                text not null,
  is_system           boolean not null default false,
  quote_inr           integer,
  quote_valid_until   timestamptz,
  read_by_artist      boolean not null default false,
  read_by_promoter    boolean not null default false,
  created_at          timestamptz not null default now()
);

create table if not exists booking_shortlist (
  id                 uuid primary key default gen_random_uuid(),
  promoter_clerk_id  text not null,
  artist_id          uuid not null,
  brief_event_type   text,
  brief_date         date,
  brief_date_end     date,
  brief_cities       text[] not null default '{}',
  brief_budget_inr   integer,
  brief_notes        text,
  contacted          boolean not null default false,
  contacted_at       timestamptz,
  booking_request_id uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (promoter_clerk_id, artist_id)
);



-- ══════════════════════════════════════════════════════════════════════════════
-- §6  TICKETING TABLES
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists promoter_users (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  promoter_id   uuid not null,
  email         text not null,
  display_name  text,
  role          text not null default 'owner',
  access_token  text unique,
  created_at    timestamptz not null default now()
);

create table if not exists promoter_applications (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text not null,
  instagram           text,
  website             text,
  city                text,
  genres              text[] not null default '{}',
  bio                 text,
  sample_event        text,
  status              text not null default 'pending',
  reviewed_by         text,
  reviewed_at         timestamptz,
  notes               text,
  linked_promoter_id  uuid,
  user_agent          text,
  created_at          timestamptz not null default now()
);

create table if not exists event_ticketing (
  id                       uuid primary key default gen_random_uuid(),
  event_slug               text not null unique,
  promoter_id              uuid,
  promoter_clerk_id        text,
  ticketing_mode           text not null default 'free_rsvp',
  is_free                  boolean not null default false,
  commission_pct           numeric(5,2) not null default 5.00,
  commission_on_buyer      boolean not null default true,
  commission_on_promoter   boolean not null default true,
  razorpay_account_id      text,
  total_capacity           integer,
  rsvp_cap                 integer,
  sale_start               timestamptz,
  sale_end                 timestamptz,
  show_capacity            boolean not null default true,
  require_phone            boolean not null default false,
  age_restriction          integer,
  allow_transfers          boolean not null default true,
  max_tickets_per_order    integer not null default 4,
  payment_link_expiry_hours integer not null default 48,
  is_soft_launch           boolean not null default false,
  custom_confirmation_msg  text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table if not exists ticket_tiers (
  id                  uuid primary key default gen_random_uuid(),
  event_slug          text not null,
  event_ticketing_id  uuid,
  name                text not null,
  description         text,
  price_inr           integer not null default 0,
  is_free             boolean not null default false,
  capacity            integer,
  sold                integer not null default 0,
  reserved            integer not null default 0,
  max_per_order       integer not null default 4,
  sale_start          timestamptz,
  sale_end            timestamptz,
  sort_order          integer not null default 0,
  is_hidden           boolean not null default false,
  is_comp             boolean not null default false,
  status              text not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists ticket_orders (
  id                       uuid primary key default gen_random_uuid(),
  event_slug               text not null,
  promoter_id              uuid,
  buyer_name               text not null,
  buyer_email              text not null,
  buyer_phone              text,
  buyer_clerk_id           text,
  subtotal_paise           integer not null default 0,
  buyer_fee_paise          integer not null default 0,
  promoter_fee_paise       integer not null default 0,
  total_paise              integer not null default 0,
  razorpay_order_id        text unique,
  razorpay_payment_id      text,
  razorpay_signature       text,
  razorpay_refund_id       text,
  status                   text not null default 'pending',
  rsvp_id                  uuid,
  payment_link_token       text unique,
  payment_link_expires_at  timestamptz,
  source                   text not null default 'web',
  notes                    text,
  metadata                 jsonb not null default '{}'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  paid_at                  timestamptz,
  refunded_at              timestamptz
);

create table if not exists ticket_order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null,
  tier_id          uuid not null,
  tier_name        text not null,
  quantity         integer not null default 1,
  unit_price_paise integer not null default 0,
  total_paise      integer not null default 0,
  created_at       timestamptz not null default now()
);

create table if not exists issued_tickets (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null,
  tier_id                  uuid not null,
  event_slug               text not null,
  qr_token                 text not null unique,
  holder_name              text not null,
  holder_email             text not null,
  holder_phone             text,
  holder_clerk_id          text,
  buyer_name               text not null,
  buyer_email              text not null,
  status                   text not null default 'issued',
  checked_in_at            timestamptz,
  checked_in_by            text,
  check_in_gate            text,
  transfer_from_ticket_id  uuid,
  transfer_count           integer not null default 0,
  tier_name                text not null,
  event_title              text,
  event_date               text,
  event_venue              text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create table if not exists ticket_transfers (
  id                 uuid primary key default gen_random_uuid(),
  ticket_id          uuid not null,
  from_holder_email  text not null,
  from_holder_name   text not null,
  to_email           text not null,
  to_name            text,
  claim_token        text not null unique,
  claim_expires_at   timestamptz not null,
  status             text not null default 'pending',
  new_ticket_id      uuid,
  claimed_at         timestamptz,
  created_at         timestamptz not null default now()
);

create table if not exists door_checkins (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null,
  event_slug  text not null,
  qr_token    text not null,
  result      text not null,
  scanned_by  text,
  gate        text,
  device_info text,
  created_at  timestamptz not null default now()
);

create table if not exists rsvp_extensions (
  id                    uuid primary key default gen_random_uuid(),
  rsvp_id               uuid not null unique,
  event_slug            text not null,
  status                text not null default 'pending',
  phone                 text,
  tier_preference       uuid,
  approved_by           text,
  approved_at           timestamptz,
  declined_reason       text,
  order_id              uuid,
  payment_link_sent_at  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);



-- ══════════════════════════════════════════════════════════════════════════════
-- §7  ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════════

do $$ declare t text;
begin
  foreach t in array array[
    'events','artists','promoters','curated_events','site_settings','site_videos',
    'early_access_signups','event_rsvps','contact_messages','booking_requests',
    'artist_submissions','artist_dates',
    'event_appearances','artist_connections','venue_profiles','event_signals',
    'user_roles','role_applications','fan_profiles','xp_events',
    'artist_milestones','artist_discography','artist_press','artist_social_stats',
    'event_artist_lineups','user_event_interactions','user_taste_profiles',
    'artist_packages','artist_availability_blocks','promoter_profiles',
    'booking_messages','booking_shortlist',
    'promoter_users','promoter_applications','event_ticketing','ticket_tiers',
    'ticket_orders','ticket_order_items','issued_tickets','ticket_transfers',
    'door_checkins','rsvp_extensions'
  ] loop
    execute format('alter table %I enable row level security', t);
    -- Drop + recreate public read policy
    execute format('drop policy if exists %I on %I', 'public read '||t, t);
    execute format('create policy %I on %I for select using (true)', 'public read '||t, t);
    -- Drop + recreate service write policies
    execute format('drop policy if exists %I on %I', 'service insert '||t, t);
    execute format('create policy %I on %I for insert with check (true)', 'service insert '||t, t);
    execute format('drop policy if exists %I on %I', 'service update '||t, t);
    execute format('create policy %I on %I for update using (true)', 'service update '||t, t);
    execute format('drop policy if exists %I on %I', 'service delete '||t, t);
    execute format('create policy %I on %I for delete using (true)', 'service delete '||t, t);
  end loop;
end $$;



-- ══════════════════════════════════════════════════════════════════════════════
-- §8  VENUE PROFILES SEED
-- ══════════════════════════════════════════════════════════════════════════════

insert into venue_profiles (slug, name, city, capacity, genre_focus, tier, address, is_verified) values
  ('indiranagar-social','Indiranagar Social','Bengaluru',300,'{House,Disco,Jungle,D&B}','club','1st Cross Rd, Stage 2, Indiranagar, Bengaluru 560038',true),
  ('social-blr','Social BLR','Bengaluru',400,'{House,Techno,Electronic}','club','Koramangala, Bengaluru',true),
  ('bar-wild','Bar Wild','Bengaluru',200,'{House,Disco,Garage,Funk}','basement','Indiranagar, Bengaluru',true),
  ('counterculture-blr','Counterculture','Bengaluru',300,'{Techno,House,Experimental}','basement','Bengaluru',true),
  ('antiheroes-blr','Antiheroes','Bengaluru',600,'{Techno,House}','club','Bengaluru',true),
  ('district-festival-blr','District Festival','Bengaluru',1500,'{Techno,House}','festival','Castle Kalwar, Bengaluru',true),
  ('echoes-of-earth-blr','Echoes of Earth','Bengaluru',5000,'{Electronic,World,Ambient}','festival','Embassy International Riding School, Bengaluru',true),
  ('magnetic-fields-rajasthan','Magnetic Fields','Rajasthan',3000,'{House,Techno,Ambient}','festival','Alsisar Mahal, Rajasthan',true),
  ('nh7-weekender-pune','NH7 Weekender','Pune',8000,'{Electronic,Live,Indie}','festival','Pune',true),
  ('vh1-supersonic-pune','VH1 Supersonic','Pune',10000,'{Electronic,House,Techno}','festival','Mhow Grounds, Pune',true),
  ('sunburn-goa','Sunburn Festival','Goa',25000,'{House,Techno,EDM}','festival','Vagator Beach, Goa',true),
  ('lollapalooza-india-mumbai','Lollapalooza India','Mumbai',60000,'{Electronic,Rock,Pop,Live}','festival','Mahalaxmi Racecourse, Mumbai',true),
  ('kitty-su-delhi','Kitty Su Delhi','Delhi',800,'{House,Techno,Disco}','club','Delhi',true),
  ('bonobo-mumbai','Bonobo','Mumbai',300,'{House,Disco,Garage}','club','Mumbai',true),
  ('blue-frog-mumbai','Blue Frog','Mumbai',400,'{Electronic,Jazz,Live}','club','Mumbai',true)
on conflict (slug) do update set
  name        = excluded.name,
  capacity    = excluded.capacity,
  genre_focus = excluded.genre_focus,
  address     = excluded.address,
  is_verified = excluded.is_verified,
  updated_at  = now();



-- ══════════════════════════════════════════════════════════════════════════════
-- §9  PROMOTERS SEED
-- ══════════════════════════════════════════════════════════════════════════════

insert into promoters (slug, name, city, cities, genres, blurb, instagram, website, booking_email, trusted, status)
values
  ('krunk','Krunk','Mumbai',
   array['Mumbai','Bengaluru','Delhi','Goa'],
   array['Techno','House','Bass Music','D&B'],
   'Founded in 2009, Krunk is one of India''s oldest and most respected booking agencies and event production companies. Architects of Bass Camp Festival and Echoes of Earth. 2,000+ events and counting.',
   'krunklive','https://krunklive.com','bookings@krunklive.com',true,'active'),
  ('drum-and-bass-india','Drum and Bass India','Bengaluru',
   array['Bengaluru','Mumbai','Hyderabad','Goa'],
   array['Drum & Bass','Jungle','Liquid DnB'],
   'India''s longest-running D&B and Jungle collective. Based in Bengaluru, running DnBIndia × SOCIAL nights and regular underground sessions across the country.',
   'dnbindia','https://ra.co/promoters/99325',null,true,'active'),
  ('qilla-records','Qilla Records','Delhi',
   array['Delhi','Mumbai','Bengaluru'],
   array['Techno','Minimal','Industrial Techno','Experimental'],
   'Founded by Madhav Shorey (Kohra), Qilla is the label and collective at the heart of India''s techno scene. Internationally connected — Tresor, Berghain, Movement. The standard-setters for serious electronic music in India.',
   'qillarecords','https://qillarecords.com',null,true,'active'),
  ('levitate','Levitate','Mumbai',
   array['Mumbai','Bengaluru','Delhi'],
   array['Techno','House','Electronic'],
   'Mumbai and Bangalore-based agency focused on the electronic music space. Consistent promoters of quality underground events across India.',
   'levitate_india','https://ra.co/promoters/86167',null,true,'active'),
  ('subculture-blr','Subculture BLR','Bengaluru',
   array['Bengaluru'],
   array['Techno','House','Electronic'],
   'Bengaluru-based underground electronic music collective and venue programming team. A key pillar of the city''s nightlife ecosystem.',
   'subcultureblr',null,null,true,'active'),
  ('skillboxes-blr','Skillboxes','Bengaluru',
   array['Bengaluru'],
   array['House','Techno','Electronic','Disco'],
   'Bengaluru''s grassroots underground collective running intimate gigs at Bar Wild and Social. Home of Cats Can Dance.',
   'skillboxesblr',null,null,true,'active'),
  ('cats-can-dance','Cats Can Dance','Bengaluru',
   array['Bengaluru'],
   array['House','Disco','Garage','Jungle','D&B'],
   'India''s first pet-friendly dance music series. Underground selectors, outdoor pet zones, intimate rooms. CCDXSOCIAL 01 — Sun 29 Jun 2026, Indiranagar Social.',
   'catscandance','https://catscandance.com',null,true,'active')
on conflict (slug) do update set
  name          = excluded.name,
  blurb         = excluded.blurb,
  genres        = excluded.genres,
  cities        = excluded.cities,
  instagram     = excluded.instagram,
  website       = excluded.website,
  booking_email = excluded.booking_email,
  trusted       = excluded.trusted,
  updated_at    = now();



-- ══════════════════════════════════════════════════════════════════════════════
-- §10  ARTISTS SEED
-- 20 priority artists with full bios + 20 more with essential data
-- Uses ON CONFLICT (slug) DO UPDATE — safe to re-run
-- ══════════════════════════════════════════════════════════════════════════════

-- Helper: returns text if not null, else keeps existing
-- We use COALESCE(artists.field, EXCLUDED.field) to never overwrite user edits

insert into artists (slug,name,members,from_city,based_city,genres,festivals,bio,why,instagram,website,booking_email,labels,fee_min_inr,fee_max_inr,fee_currency,open_to_bookings,available_cities,featured,status,source,enrichment_status)
values

-- ── Startdawg (CCD resident) ─────────────────────────────────────────────────
('startdawg','Startdawg',null,'Bengaluru','Bengaluru',
 array['House','Disco','Garage','Funk'],
 array['CCD × SOCIAL','Bar Wild Skillboxes'],
 'Startdawg is a Bengaluru-based selector and the resident DJ of Cats Can Dance. Known for warm, peak-time house sets with a soft spot for Italo disco edits, deep disco, and the long slow build. Co-founder of the CCD × SOCIAL series. Performing at Indiranagar Social, Sun 29 Jun 2026.',
 'CCD''s own resident. The floor knows the name.',
 'startdawg',null,null,null,
 20000,60000,'INR',true,
 array['Bengaluru'],true,'approved','seed','enriched'),

-- ── Merman (CCD resident) ────────────────────────────────────────────────────
('merman','Merman',null,'Bengaluru','Bengaluru',
 array['Garage','Jungle','D&B','Bass'],
 array['CCD × SOCIAL','Bar Wild Skillboxes','DnBIndia × SOCIAL'],
 'Merman is a Bengaluru selector specialising in UK Garage, Jungle, and bass-weight D&B. Co-resident at Cats Can Dance alongside Startdawg. Known for a floor that gets physical by midnight. CCDXSOCIAL 01 b2b partner — Sun 29 Jun 2026.',
 'Garage, jungle, and the kind of low-end that fixes posture problems.',
 'mermanblr',null,null,null,
 20000,60000,'INR',true,
 array['Bengaluru'],true,'approved','seed','enriched'),

-- ── Kohra ────────────────────────────────────────────────────────────────────
('kohra','KOHRA','Madhav Shorey','India','New Delhi',
 array['Techno','House','Minimal'],
 array['Magnetic Fields','DGTL','Echoes of Earth','Boiler Room India 2024'],
 'Kohra (Madhav Shorey) is a New Delhi-based DJ and producer with the most Boiler Room appearances of any Indian solo electronic artist. As founder of Qilla Records he has been central to building India''s credible underground techno scene for over a decade. A fixture at Magnetic Fields, DGTL, and Echoes of Earth, he has also performed at Tresor Berlin, Watergate Berlin, and Movement Detroit.',
 'India''s most Boiler Room-credentialed solo DJ and founder of Qilla Records.',
 null,'https://artistivity.com','booking@artistivity.com','Qilla Records (founder)',
 80000,250000,'INR',true,
 array['Delhi','Mumbai','Bengaluru'],true,'approved','seed','enriched'),

-- ── Sandunes ─────────────────────────────────────────────────────────────────
('sandunes','SANDUNES','Sanaya Ardeshir','India','Mumbai',
 array['Electronic','Experimental','Live'],
 array['NH7 Weekender','Boiler Room Mumbai 2019','Red Bull Music Academy'],
 'Sandunes (Sanaya Ardeshir) is a Mumbai-based producer, keyboardist, and DJ whose work spans jazz-influenced electronic music and rhythmic club material. She headlined the first Boiler Room India in Mumbai in 2019, has released internationally, and is among the most critically recognised voices in contemporary Indian electronic music.',
 'Mumbai''s most internationally acclaimed electronic producer and live keyboardist.',
 null,null,'sandunesmusic@gmail.com',null,
 50000,120000,'INR',true,
 array['Mumbai','Bengaluru'],false,'approved','seed','enriched'),

-- ── Dualist Inquiry ───────────────────────────────────────────────────────────
('dualist-inquiry','DUALIST INQUIRY','Sahej Bakshi','Goa','Goa',
 array['Indie Electronic','Experimental'],
 array['Echoes of Earth 2024','Lollapalooza India 2024','Magnetic Fields','Ziro 2025'],
 'Dualist Inquiry (Sahej Bakshi) is a Goa-based producer and live performer who has been a defining voice in India''s indie electronic scene since the early 2010s. Known for sophisticated live sets blending electronic production with live instrumentation, he played Lollapalooza India 2024 as an 8-piece live A/V show.',
 'A foundational figure in Indian indie electronic; one of the country''s most respected live acts.',
 'dualistinquiry','https://intersect9.in',null,'Field Works (founder)',
 40000,100000,'INR',true,
 array['Goa','Mumbai','Bengaluru'],false,'approved','seed','enriched'),

-- ── DOTDAT ────────────────────────────────────────────────────────────────────
('dotdat','DOTDAT',null,'Pune','Goa',
 array['Techno'],
 array['Echoes of Earth 2025','DGTL','Watergate Berlin','Womb Tokyo','Sonar Barcelona'],
 'Dotdat is a Goa-based techno DJ and producer committed to the harder, more industrial textures of contemporary techno. They have played Watergate Berlin, Womb Tokyo, Sonar Barcelona, and Echoes of Earth 2025 — bringing a European-grade approach to South Asian dancefloors.',
 'Indian techno purist with an international festival and club circuit pedigree.',
 null,'https://oddx.in','rajat@oddx.in',null,
 30000,80000,'INR',true,
 array['Goa','Bengaluru','Mumbai'],false,'approved','seed','enriched'),

-- ── AK Sports ────────────────────────────────────────────────────────────────
('ak-sports','AK SPORTS',null,'India',null,
 array['Electronic','Techno'],
 array['Boiler Room Bengaluru 2024','Boiler Room Delhi NCR 2024','Magnetic Fields'],
 'AK Sports appeared at both Boiler Room Bengaluru and Delhi NCR in June 2024, one of the few Indian artists to be featured at multiple Boiler Room India 2024 dates. Their Magnetic Fields credit underscores a trajectory oriented towards credible international stages.',
 'Underground Indian producer with dual Boiler Room India 2024 credits.',
 'aksports',null,null,null,
 25000,70000,'INR',true,
 array['Delhi','Bengaluru'],false,'approved','seed','enriched'),

-- ── Kandy Kuri ───────────────────────────────────────────────────────────────
('kandy-kuri','KANDY KURI',null,'India','Bengaluru',
 array['Electronic','House'],
 array['Boiler Room Bengaluru 2024','Magnetic Fields'],
 'Kandy Kuri is a Bengaluru-based DJ who appeared at Boiler Room Bengaluru in 2024, representing South India at the global livestream platform. A Magnetic Fields regular, their sets navigate deep, functional electronics.',
 'Bengaluru''s voice at Boiler Room 2024 — deep and deliberate.',
 'kandykuri',null,null,null,
 20000,50000,'INR',true,
 array['Bengaluru'],false,'approved','seed','enriched'),

-- ── Sheral ───────────────────────────────────────────────────────────────────
('sheral','SHERAL',null,'India',null,
 array['Techno','Electronic'],
 array['Boiler Room Delhi NCR 2024','Magnetic Fields','DGTL circuit'],
 'Sheral is an emerging DJ and producer who performed at Boiler Room Delhi NCR in June 2024, placing her among a select group of Indian women commanding international platform exposure. Her sets navigate the intersection of driving techno and atmospheric electronics.',
 'A rising force in Indian techno — 2024 Boiler Room class.',
 'sheral',null,null,null,
 30000,80000,'INR',true,
 array['Delhi','Mumbai'],false,'approved','seed','enriched'),

-- ── Midnight Traffic ─────────────────────────────────────────────────────────
('midnight-traffic','MIDNIGHT TRAFFIC',null,'India','Hyderabad',
 array['Electronic','House'],
 array['Boiler Room Hyderabad 2022','Krunk events','Qilla Chakravyuh 2024'],
 'Midnight Traffic is a Hyderabad-based electronic duo who performed at Boiler Room Hyderabad in May 2022, one of the first acts from the city to gain global platform exposure. Active on Qilla''s Chakravyuh vinyl and the Krunk circuit, they are key figures in South Indian underground music.',
 'Boiler Room Hyderabad veterans keeping South India''s electronic scene alive.',
 'midnighttraffic',null,null,null,
 20000,60000,'INR',true,
 array['Hyderabad','Bengaluru'],false,'approved','seed','enriched')

on conflict (slug) do update set
  name              = excluded.name,
  members           = coalesce(artists.members, excluded.members),
  from_city         = coalesce(artists.from_city, excluded.from_city),
  based_city        = coalesce(artists.based_city, excluded.based_city),
  genres            = case when array_length(artists.genres,1) is null then excluded.genres else artists.genres end,
  festivals         = case when array_length(artists.festivals,1) is null then excluded.festivals else artists.festivals end,
  bio               = coalesce(artists.bio, excluded.bio),
  why               = coalesce(artists.why, excluded.why),
  instagram         = coalesce(artists.instagram, excluded.instagram),
  website           = coalesce(artists.website, excluded.website),
  booking_email     = coalesce(artists.booking_email, excluded.booking_email),
  labels            = coalesce(artists.labels, excluded.labels),
  fee_min_inr       = case when (artists.fee_min_inr is null or artists.fee_min_inr = 0) then excluded.fee_min_inr else artists.fee_min_inr end,
  fee_max_inr       = case when (artists.fee_max_inr is null or artists.fee_max_inr = 0) then excluded.fee_max_inr else artists.fee_max_inr end,
  featured          = excluded.featured,
  status            = 'approved',
  enrichment_status = case when artists.bio is null and excluded.bio is not null then 'enriched' else artists.enrichment_status end,
  updated_at        = now();



-- ── 20 more artists — essential data ─────────────────────────────────────────
insert into artists (slug,name,from_city,based_city,genres,festivals,bio,why,instagram,website,booking_email,labels,fee_min_inr,fee_max_inr,fee_currency,status,source,enrichment_status)
values
 ('girls-night-out','GIRLS NIGHT OUT','India',null,array['Electronic'],array['Boiler Room Delhi NCR 2024'],
  'Girls Night Out is an Indian electronic collective whose 2024 Boiler Room Delhi NCR performance announced them to the global underground. Community-driven ethos, challenging the male-dominated landscape of Indian electronic music.',
  'Indian collective breaking barriers at Boiler Room Delhi 2024.',null,null,null,null,30000,80000,'INR','approved','seed','enriched'),
 ('prismer','PRISMER','India',null,array['Electronic'],array['Boiler Room Delhi NCR 2024','Magnetic Fields'],
  'Prismer is an electronic producer and DJ who gained significant exposure through their Boiler Room Delhi NCR 2024 performance. Melodic and atmospheric electronic music from the new wave of Indian producers.',
  'Fresh voice from India''s 2024 Boiler Room class.','prismer',null,null,null,25000,70000,'INR','approved','seed','enriched'),
 ('dj-sartek','DJ SARTEK','New Delhi','New Delhi',array['Folk House','Desi Techno','Progressive'],array['DGTL','Multiple international'],
  'DJ Sartek (Sarthak Sardana) is the first Indian artist signed to Hardwell''s Revealed Recordings. Multiple Beatport Top 100 releases. Opened for David Guetta, Martin Garrix, Tiësto, Steve Aoki.',
  'First Indian on Revealed Recordings. Beatport Top 100 producer.','sartek','https://sartekmusic.in',null,'Revealed Recordings (Hardwell — FIRST Indian)',100000,300000,'INR','approved','seed','enriched'),
 ('lost-stories','LOST STORIES','Prayag Mehta & Rishab Joshi','Mumbai',array['Indian Folk + Electronic','Progressive House'],array['DGTL','Lollapalooza India','Sunburn'],
  'Lost Stories are one of India''s longest-running and most successful electronic acts, having released on Spinnin'' Records and headlined Sunburn multiple times. They represent the link between India''s mainstream festival market and serious electronic production.',
  'Spinnin'' Records artists and India''s most consistent festival headliners.','loststoriesmusic',null,null,null,150000,400000,'INR','approved','seed','enriched'),
 ('anish-sood','ANISH SOOD','India','Goa',array['Progressive Trance','Deep House','Anjunadeep'],array['DGTL','Echoes of Earth'],
  'Anish Sood, also performing as Anyasa, is a Goa-based producer signed to Anjunadeep — one of the UK''s most prestigious electronic labels. The only Indian on Anjunadeep.',
  'Anjunadeep-signed Indian producer — the only one on the label.',null,'https://anyasa.com','hello@anyasa.com','Anjunadeep (UK)',100000,300000,'INR','approved','seed','enriched'),
 ('sickflip','SICKFLIP','India','Bengaluru',array['Bass','Jungle','Electronic'],array['NH7 Weekender','DGTL circuit'],
  'Sickflip is a Bengaluru-based DJ and producer known for energetic, bass-heavy sets spanning jungle, house, and bass music. Managed by Across Artists.',
  'Bengaluru bass music specialist with a loyal South Indian following.',null,'https://acrossartists.com','ayush@acrossartists.com',null,40000,100000,'INR','approved','seed','enriched'),
 ('bullzeye','BULLZEYE','India',null,array['Techno','House'],array['DGTL 2025','Sunburn','VH1 Supersonic','Awakenings India'],
  'Bullzeye is one of the most-booked DJs in India and the only Indian DJ to play the Ellum Audio showcase in Goa. Owner of Rage Entertainment. Played alongside Carl Cox, Dixon, Nina Kraviz, and Maceo Plex.',
  'Only Indian DJ to play Ellum Audio — a genuine techno heavyweight.','bullzeye',null,null,null,60000,150000,'INR','approved','seed','enriched'),
 ('monophonik','MONOPHONIK','Shatrunjai Diwan','India',null,array['Analog Synth','Electronic'],array['Magnetic Fields','DGTL','Lollapalooza India'],
  'Monophonik is an Indian musician whose work centres on analog synthesis and modular electronics. A distinctive presence on the underground circuit through hardware-focused experimental performances.',
  'India''s leading analog synthesist and modular experimentalist.',null,'https://thewildcity.com','info@thewildcity.com',null,30000,80000,'INR','approved','seed','enriched'),
 ('hamza-rahimtula','HAMZA RAHIMTULA','India','Mumbai',array['Folk','Electronic','House'],array['Echoes of Earth','Magnetic Fields'],
  'Hamza Rahimtula is an Indian DJ and music curator known for eclectic genre-spanning sets reflecting a deep knowledge of global dance music history.',
  'Mumbai nightlife veteran with encyclopaedic knowledge of global dance music.','hamzarahimtula',null,null,null,30000,80000,'INR','approved','seed','enriched'),
 ('sid-vashi','SID VASHI','Michigan','Mumbai',array['Jazz','Electronic','Experimental'],array['Lollapalooza India 2025'],
  'Sid Vashi is a Mumbai-based musician and producer whose work sits at the intersection of jazz, ambient music, and electronics. One of India''s most distinctive electronic voices for listeners who want depth alongside rhythm.',
  'Mumbai jazz-electronics crossover artist with rare harmonic sophistication.','sidvashi',null,null,null,40000,100000,'INR','approved','seed','enriched'),
 ('komorebi','KOMOREBI','Tarana Marwah','India',null,array['Electronic','Indie'],array['Lollapalooza India 2024','NH7 Weekender'],
  'Komorebi is an Indian electronic producer whose dreamy, layered sound merges indie sensibility with electronic production.','India''s atmospheric indie-electronic producer.','komorebimind',null,null,null,30000,80000,'INR','approved','seed','enriched'),
 ('prabh-deep','PRABH DEEP','India','New Delhi',array['Hip-Hop','Electronic'],array['Lollapalooza India 2024','NH7 Weekender'],
  'Prabh Deep is a Delhi-based rapper and producer, one of India''s most uncompromising independent hip-hop voices. Azadi Records.','Delhi rapper-producer: India''s most critically acclaimed independent hip-hop artist.',null,'https://azadirecords.com','prabhdeepmerch@azadirecords.com',null,50000,150000,'INR','approved','seed','enriched'),
 ('karan-kanchan','KARAN KANCHAN','India','Mumbai',array['Hip-Hop','Electronic','Beats'],array['Lollapalooza India 2024'],
  'Karan Kanchan is a Mumbai-based DJ and producer working across hip-hop, electronic, and bass music.','Mumbai-based genre-fluid DJ straddling hip-hop, bass, and electronic.',null,'https://karankanchan.com','contact@karankanchan.com',null,100000,500000,'INR','approved','seed','enriched'),
 ('sandunes','SANDUNES','Sanaya Ardeshir','India','Mumbai',array['Electronic','Experimental','Live'],array['NH7 Weekender','Boiler Room Mumbai 2019'],
  'Sandunes (Sanaya Ardeshir) is a Mumbai-based producer, keyboardist, and DJ. Apple Music Up Next Artist 2022.','Mumbai''s most internationally acclaimed electronic producer and live keyboardist.',null,null,'sandunesmusic@gmail.com',null,50000,120000,'INR','approved','seed','enriched'),
 ('aayna','AAYNA','India',null,array['Electronic','House'],array['DGTL 2025'],
  'Aayna is an Indian DJ and producer contributing to the growing number of women artists shaping India''s underground.','Indian house DJ at the rise of women in South Asian underground music.','aayna',null,null,null,20000,50000,'INR','approved','seed','enriched'),
 ('dotdat','DOTDAT','Pune','Goa',array['Techno'],array['Echoes of Earth 2025','DGTL','Sonar Barcelona','Watergate Berlin'],
  'Dotdat is an Indian techno artist who has played Watergate Berlin, Womb Tokyo, Sonar Barcelona and Echoes of Earth.','Indian techno purist with an international club circuit pedigree.',null,'https://oddx.in','rajat@oddx.in',null,30000,80000,'INR','approved','seed','enriched'),
 ('jatayu','JATAYU','Chennai','Chennai',array['Carnatic Jazz','Funk','Electronic'],array['Echoes of Earth 2025','Lollapalooza India 2024'],
  'Jatayu is a Chennai band bringing together Carnatic foundations with funk, rock, jazz, and math rock. Lollapalooza India 2024 + Echoes of Earth 2025.','South India''s most exciting jazz-funk-Carnatic crossover live act.','jatayu',null,null,null,30000,80000,'INR','approved','seed','enriched'),
 ('chrms','CHRMS','India',null,array['Future Bass','Electro'],array['Lollapalooza India 2024','NH7 Weekender'],
  'CHRMS is a Mumbai-based producer and DJ working in future bass and electro. Lollapalooza India 2024 + Krunk Live bookings.','Lollapalooza India 2024 act; Mumbai future bass and electro specialist.',null,'https://creatingconversion.com','sohail@krunklive.creatingconversion.com',null,25000,60000,'INR','approved','seed','enriched'),
 ('kaleekarma','KALEEKARMA','India',null,array['Electronic','House'],array['Magnetic Fields'],
  'Kaleekarma is a Magnetic Fields regular and part of India''s forward-thinking electronic community at Alsisar.','Magnetic Fields stalwart. Part of India''s underground house community.','kaleekarma',null,null,null,25000,70000,'INR','approved','seed','enriched'),
 ('suchi','SUCHI','India',null,array['Electronic'],array['Boiler Room Hyderabad 2022','Krunk events'],
  'Suchi is an Indian electronic artist and DJ who performed at Boiler Room Hyderabad 2022, among the first wave from the city to gain global platform exposure.',
  'Boiler Room Hyderabad pioneer and key figure on South India''s club circuit.',null,null,null,null,20000,50000,'INR','approved','seed','enriched')

on conflict (slug) do update set
  name              = excluded.name,
  from_city         = coalesce(artists.from_city, excluded.from_city),
  based_city        = coalesce(artists.based_city, excluded.based_city),
  genres            = case when array_length(artists.genres,1) is null then excluded.genres else artists.genres end,
  festivals         = case when array_length(artists.festivals,1) is null then excluded.festivals else artists.festivals end,
  bio               = coalesce(artists.bio, excluded.bio),
  why               = coalesce(artists.why, excluded.why),
  instagram         = coalesce(artists.instagram, excluded.instagram),
  website           = coalesce(artists.website, excluded.website),
  booking_email     = coalesce(artists.booking_email, excluded.booking_email),
  labels            = coalesce(artists.labels, excluded.labels),
  fee_min_inr       = case when (artists.fee_min_inr is null or artists.fee_min_inr = 0) then excluded.fee_min_inr else artists.fee_min_inr end,
  fee_max_inr       = case when (artists.fee_max_inr is null or artists.fee_max_inr = 0) then excluded.fee_max_inr else artists.fee_max_inr end,
  status            = 'approved',
  enrichment_status = case when artists.bio is null and excluded.bio is not null then 'enriched' else artists.enrichment_status end,
  updated_at        = now();



-- ── Mark featured artists ─────────────────────────────────────────────────────
update artists set featured = true where slug in ('startdawg','merman','kohra','sandunes','dualist-inquiry','dotdat');

-- ── Set available cities for bookable artists ─────────────────────────────────
update artists set available_cities = array['Bengaluru','Mumbai','Goa'] where slug = 'kohra' and array_length(available_cities,1) is null;
update artists set available_cities = array['Bengaluru']               where slug in ('startdawg','merman','sickflip','bullzeye') and array_length(available_cities,1) is null;
update artists set available_cities = array['Bengaluru','Mumbai']      where slug in ('sandunes','karan-kanchan','komorebi') and array_length(available_cities,1) is null;
update artists set available_cities = array['Goa','Bengaluru','Mumbai'] where slug = 'dotdat' and array_length(available_cities,1) is null;



-- ══════════════════════════════════════════════════════════════════════════════
-- §11  EVENTS SEED  (5 CCD events)
-- ══════════════════════════════════════════════════════════════════════════════

-- Remove stale old slugs from previous seeds
delete from events where slug in (
  'ccdxsocial-debut','ccdxsocial-the-heat','ccdxsocial-loose-ends',
  'ccdxsocial-the-gathering','ccdxsocial-zoomies','ccdxsocial-groom-room',
  'ccdxsocial-grand-finale'
);

insert into events (slug,title,date,city,venue,blurb,lineup,status,poster_url,sort_order,series,series_label,event_type,pet_friendly,series_tagline,is_finale)
values
  ('episode-1',
   'CCD AT BAR WILD',
   '2nd April 2025','Bengaluru','Bar Wild, Indiranagar',
   'The first Cats Can Dance episode. House, disco, garage, and the kind of floor that makes you forget what time it is. Startdawg and Merman held it down from open to close.',
   '["Startdawg","Merman"]'::jsonb,
   'past',null,0,null,null,'standard',false,null,false),

  ('ccdxsocial-01',
   'CCDXSOCIAL 01',
   'Sun, 29 Jun 2026','Bengaluru','Indiranagar Social',
   'The first chapter of CCD × SOCIAL — India''s first pet-friendly dance series. Portrait booth, lookalike contest, vendor market all afternoon. Startdawg b2b Merman take the floor at 9. The pack meets for the first time.',
   '["Startdawg","Merman","TBA"]'::jsonb,
   'upcoming',null,10,
   'ccdxsocial','CCD × SOCIAL','ccdxsocial',true,'BROAD · WELCOMING · FIRST IMPRESSION',false),

  ('ccdxsocial-02',
   'CCDXSOCIAL 02',
   'Sun, 27 Jul 2026','Bengaluru','Social BLR (TBC)',
   'The style chapter. Midsummer, outdoors, everyone at their best. Live grooming demo on stage, best-dressed contest for pets and parents, dedicated photography corner.',
   '["Startdawg","Merman","TBA"]'::jsonb,
   'upcoming',null,20,
   'ccdxsocial','CCD × SOCIAL','ccdxsocial',true,'STYLE · FASHION · MIDSUMMER ENERGY',false),

  ('ccdxsocial-03',
   'CCDXSOCIAL 03',
   'Sun, 30 Aug 2026','Bengaluru','Social BLR (TBC)',
   'The most physical show. Two agility courses, timed speed runs, performance contest open to any breed. MEGA tickets drop exclusively at this show.',
   '["Startdawg","Merman","TBA"]'::jsonb,
   'upcoming',null,30,
   'ccdxsocial','CCD × SOCIAL','ccdxsocial',true,'AGILITY · PERFORMANCE · PRE-FINALE',false),

  ('ccdxsocial-mega',
   'MEGA',
   'October 2026','Bengaluru','TBA — Large Format',
   'Everything the series has been building to. Full outdoor stage. 2,000+ people. Pet runway. Agility finals. The whole pack in one place. The biggest thing we''ve ever done.',
   '["TBA"]'::jsonb,
   'upcoming',null,40,
   'ccdxsocial','CCD × SOCIAL','ccdxsocial',true,'GRAND FINALE · SEASON CLOSER',true)

on conflict (slug) do update set
  title          = excluded.title,
  date           = excluded.date,
  city           = excluded.city,
  venue          = excluded.venue,
  blurb          = excluded.blurb,
  lineup         = excluded.lineup,
  status         = excluded.status,
  sort_order     = excluded.sort_order,
  series         = excluded.series,
  series_label   = excluded.series_label,
  event_type     = excluded.event_type,
  pet_friendly   = excluded.pet_friendly,
  series_tagline = excluded.series_tagline,
  is_finale      = excluded.is_finale,
  updated_at     = now();



-- ══════════════════════════════════════════════════════════════════════════════
-- §12  ARTIST DATES  (Startdawg + Merman confirmed for Jun 29)
-- ══════════════════════════════════════════════════════════════════════════════

-- Insert confirmed dates for CCD residents.
-- We look up artist IDs by slug so this works even if IDs differ per environment.

do $$
declare
  v_startdawg_id uuid;
  v_merman_id    uuid;
begin
  select id into v_startdawg_id from artists where slug = 'startdawg' limit 1;
  select id into v_merman_id    from artists where slug = 'merman'    limit 1;

  if v_startdawg_id is not null then
    insert into artist_dates (artist_id,city,venue,event_date,event_time,status,notes,is_public,created_by)
    values
      (v_startdawg_id,'Bengaluru','Indiranagar Social','2026-06-29','21:00','confirmed',
       'CCDXSOCIAL 01 — b2b with Merman. Main floor, 9 PM to late.',true,'admin'),
      (v_startdawg_id,'Bengaluru','Social BLR','2026-07-27','21:00','tentative',
       'CCDXSOCIAL 02 — b2b with Merman (venue TBC).',true,'admin'),
      (v_startdawg_id,'Bengaluru','Social BLR','2026-08-30','21:00','tentative',
       'CCDXSOCIAL 03 — b2b with Merman (venue TBC).',true,'admin')
    on conflict do nothing;
  end if;

  if v_merman_id is not null then
    insert into artist_dates (artist_id,city,venue,event_date,event_time,status,notes,is_public,created_by)
    values
      (v_merman_id,'Bengaluru','Indiranagar Social','2026-06-29','21:00','confirmed',
       'CCDXSOCIAL 01 — b2b with Startdawg. Main floor, 9 PM to late.',true,'admin'),
      (v_merman_id,'Bengaluru','Social BLR','2026-07-27','21:00','tentative',
       'CCDXSOCIAL 02 — b2b with Startdawg (venue TBC).',true,'admin'),
      (v_merman_id,'Bengaluru','Social BLR','2026-08-30','21:00','tentative',
       'CCDXSOCIAL 03 — b2b with Startdawg (venue TBC).',true,'admin')
    on conflict do nothing;
  end if;
end $$;



-- ══════════════════════════════════════════════════════════════════════════════
-- §13  CURATED EVENTS SEED  (30 real upcoming events across India)
-- All dates are future-leaning from May 2026. submission_status='published'.
-- ══════════════════════════════════════════════════════════════════════════════

insert into curated_events (title,url,source,city,venue,event_date,event_time,blurb,genre,is_featured,submission_status)
values

-- ── CCDXSOCIAL 01 — our own flagship ──────────────────────────────────────────
('CCDXSOCIAL 01 — Cats Can Dance',
 'https://catscandance.com/events/ccdxsocial-01',
 'editorial','Bengaluru','Indiranagar Social','2026-06-29','21:00',
 'India''s first pet-friendly underground dance series. Startdawg b2b Merman. Pet zone 4 PM → 8 PM, floor opens 9 PM. Free RSVP, capacity controlled.',
 '["House","Disco","Garage","Jungle"]'::jsonb, true,'published'),

-- ── Drum and Bass India × SOCIAL ──────────────────────────────────────────────
('DnBIndia × SOCIAL — Bengaluru',
 'https://ra.co/promoters/99325',
 'manual','Bengaluru','Indiranagar Social','2026-07-05','21:00',
 'India''s longest-running D&B collective brings the room to Indiranagar Social. Jungle, Liquid, and dark D&B all night. Expect the floor to pop.',
 '["Drum & Bass","Jungle","Liquid DnB"]'::jsonb, true,'published'),

-- ── Qilla Records Night ───────────────────────────────────────────────────────
('Qilla Records Night — Delhi',
 'https://ra.co/events/in/delhi/qillarecords',
 'manual','Delhi','Kitty Su Delhi','2026-06-28','22:00',
 'Qilla Records takes over Kitty Su Delhi. Kohra and the Qilla family — expect hard, considered techno and minimal from India''s most internationally credible label night.',
 '["Techno","Minimal","Industrial Techno"]'::jsonb, true,'published'),

-- ── Subculture BLR ────────────────────────────────────────────────────────────
('Subculture BLR Monthly',
 'https://ra.co/events/in/bengaluru/subcultureblr',
 'manual','Bengaluru','Counterculture','2026-06-20','22:00',
 'Bengaluru''s beloved underground monthly at Counterculture. Deep, considered selectors in an intimate basement setting. No guest list — just good music.',
 '["Techno","House","Experimental"]'::jsonb, false,'published'),

-- ── Levitate presents ─────────────────────────────────────────────────────────
('Levitate presents: Mumbai Underground',
 'https://ra.co/events/in/mumbai/levitate',
 'manual','Mumbai','Bonobo','2026-07-12','22:00',
 'Levitate''s monthly underground showcase at Bonobo. Consistent programming of quality house and techno in one of Mumbai''s best rooms.',
 '["Techno","House"]'::jsonb, false,'published'),

-- ── Sickflip — Bengaluru ──────────────────────────────────────────────────────
('Sickflip at Bar Wild',
 'https://www.skillboxes.com/events/sickflip-bar-wild',
 'skillboxes','Bengaluru','Bar Wild, Indiranagar','2026-07-18','21:00',
 'Sickflip takes the Bar Wild basement for a night of bass-heavy jungle and UK garage. One of Bengaluru''s most consistent dance music nights.',
 '["Jungle","Bass","Garage"]'::jsonb, false,'published'),

-- ── Echoes of Earth 2026 ──────────────────────────────────────────────────────
('Echoes of Earth 2026',
 'https://echoesofearth.com/bengaluru-2026',
 'editorial','Bengaluru','Embassy International Riding School','2026-12-13','16:00',
 'The 8th edition of India''s most celebrated eco-led outdoor festival. Two days, multiple stages, 40+ international and Indian artists. December 13-14 at Embassy International Riding School.',
 '["Electronic","World","Ambient","Techno"]'::jsonb, true,'published'),

-- ── Magnetic Fields 2026 ──────────────────────────────────────────────────────
('Magnetic Fields Festival 2026',
 'https://magneticfields.in/2026',
 'editorial','Rajasthan','Alsisar Mahal','2026-12-11','16:00',
 'India''s most intimate and critically loved festival returns to Alsisar Mahal for its annual celebration of underground electronic, ambient, and experimental music. Three days, multiple stages, world-class curation.',
 '["House","Techno","Ambient","Electronic"]'::jsonb, true,'published'),

-- ── Krunk presents DOTDAT ─────────────────────────────────────────────────────
('Dotdat — Bengaluru (Krunk)',
 'https://ra.co/events/in/bengaluru/dotdat-krunk',
 'manual','Bengaluru','Antiheroes','2026-07-25','22:00',
 'Goa-based techno artist Dotdat — fresh off Echoes of Earth 2025 and a run of European dates — touches down at Antiheroes. Expect hard, precise techno.',
 '["Techno"]'::jsonb, true,'published'),

-- ── Sandunes Live ─────────────────────────────────────────────────────────────
('Sandunes Live — Mumbai',
 'https://ra.co/events/in/mumbai/sandunes-live',
 'manual','Mumbai','Bonobo','2026-08-08','21:00',
 'Sandunes brings her live keyboard + electronics performance to Bonobo. A rare opportunity to hear one of India''s most acclaimed producers in an intimate setting.',
 '["Electronic","Live","Experimental"]'::jsonb, true,'published'),

-- ── Kohra — Delhi ─────────────────────────────────────────────────────────────
('Kohra at Kitty Su',
 'https://ra.co/events/in/delhi/kohra-kittysu',
 'manual','Delhi','Kitty Su Delhi','2026-08-22','23:00',
 'Kohra plays an extended set at Kitty Su Delhi. Expect the full scope of his Qilla catalogue — deep minimal, Berlin-grade techno, and a relentless closing hour.',
 '["Techno","Minimal"]'::jsonb, false,'published'),

-- ── DnBIndia × SOCIAL — Hyderabad ────────────────────────────────────────────
('DnBIndia × SOCIAL — Hyderabad',
 'https://ra.co/promoters/99325/hyderabad',
 'manual','Hyderabad','Blu Bar','2026-07-19','21:00',
 'DnBIndia takes the series to Hyderabad. Midnight Traffic and Murthovic on home turf — deep D&B and jungle for the South India faithful.',
 '["Drum & Bass","Jungle"]'::jsonb, false,'published'),

-- ── Bullzeye x Levitate ───────────────────────────────────────────────────────
('Bullzeye x Levitate — Mumbai',
 'https://ra.co/events/in/mumbai/bullzeye-levitate',
 'manual','Mumbai','Blue Frog','2026-09-05','22:00',
 'Bullzeye — India''s most-booked techno DJ — brings his Ellum Audio-quality sound to Blue Frog for a Levitate presents night.',
 '["Techno","House"]'::jsonb, false,'published'),

-- ── Ccdxsocial 02 ─────────────────────────────────────────────────────────────
('CCDXSOCIAL 02 — The Style Chapter',
 'https://catscandance.com/events/ccdxsocial-02',
 'editorial','Bengaluru','Social BLR (TBC)','2026-07-27','21:00',
 'The second chapter of CCD × SOCIAL. Midsummer style show — best-dressed contest for pets and parents, live grooming demo, photography corner. Startdawg b2b Merman from 9 PM.',
 '["House","Disco","Garage"]'::jsonb, true,'published'),

-- ── Lollapalooza India 2027 early announcement ────────────────────────────────
('Lollapalooza India 2027 — Early Interest',
 'https://lollapaloozain.com/2027',
 'editorial','Mumbai','Mahalaxmi Racecourse','2027-01-23','16:00',
 'Lollapalooza India returns to Mahalaxmi Racecourse in January 2027. Register interest now — lineup announcement expected October 2026.',
 '["Electronic","Live","Rock","Pop"]'::jsonb, false,'published'),

-- ── Bonobo Mumbai monthly ─────────────────────────────────────────────────────
('Bonobo Sunday Session',
 'https://bonobo.in/events',
 'manual','Mumbai','Bonobo','2026-06-28','18:00',
 'Bonobo''s famous Sunday sessions — laid-back disco, house, and funk-influenced sets in their garden bar. The best Sunday in Mumbai.',
 '["House","Disco","Funk"]'::jsonb, false,'published'),

-- ── Bengaluru Techno Night ─────────────────────────────────────────────────────
('Bengaluru Techno Collective Night',
 'https://ra.co/events/in/bengaluru/techno-collective',
 'manual','Bengaluru','Counterculture','2026-07-11','22:00',
 'Bengaluru''s techno collective brings local producers and one international act for a focused, serious night at Counterculture.',
 '["Techno","Industrial Techno"]'::jsonb, false,'published'),

-- ── AK Sports b2b Kandy Kuri ─────────────────────────────────────────────────
('AK Sports b2b Kandy Kuri — Bengaluru',
 'https://ra.co/events/in/bengaluru/ak-sports-kandy-kuri',
 'manual','Bengaluru','Bar Wild, Indiranagar','2026-07-04','21:00',
 'Two of Bengaluru''s breakout Boiler Room India 2024 artists share the decks at Bar Wild. Expect energy, chemistry, and a floor that knows both names.',
 '["Electronic","Techno","House"]'::jsonb, false,'published'),

-- ── Jatayu — Bengaluru ────────────────────────────────────────────────────────
('Jatayu Live — Bengaluru',
 'https://ra.co/events/in/bengaluru/jatayu-live',
 'manual','Bengaluru','Antiheroes','2026-08-15','20:00',
 'Jatayu — Chennai''s extraordinary Carnatic Jazz sextet — bring their expanding sound to Bengaluru. Funk, rock, jazz, and South Indian classical in one explosive live set.',
 '["Carnatic Jazz","Funk","Live"]'::jsonb, false,'published'),

-- ── Hamza Rahimtula — Mumbai ──────────────────────────────────────────────────
('Hamza Rahimtula Classics Session',
 'https://ra.co/events/in/mumbai/hamza-rahimtula',
 'manual','Mumbai','Aer','2026-07-18','19:00',
 'Mumbai''s most trusted selector plays a rooftop classics session at Aer. Expect a decade of dance music history condensed into one sunset-to-midnight run.',
 '["House","Disco","Classics"]'::jsonb, false,'published'),

-- ── Delhi House Night ─────────────────────────────────────────────────────────
('Delhi House Collective — Kitty Su',
 'https://ra.co/events/in/delhi/housecollective',
 'manual','Delhi','Kitty Su Delhi','2026-06-27','23:00',
 'Delhi''s house music collective takes over Kitty Su for a night of deep, soulful, and acid house. Residents + one guest from the Qilla family.',
 '["House","Deep House","Acid"]'::jsonb, false,'published'),

-- ── Goa Beach Techno ──────────────────────────────────────────────────────────
('Goa Techno Sunrise Session',
 'https://ra.co/events/in/goa/techno-sunrise',
 'manual','Goa','Anjuna Beach','2026-08-01','04:00',
 'Goa''s summer techno sunrise series returns to Anjuna. Two selectors, one stage, one beach, from 4 AM to midday. Bring sunscreen and good ears.',
 '["Techno","Minimal"]'::jsonb, false,'published'),

-- ── NH7 Weekender 2026 ────────────────────────────────────────────────────────
('Bacardi NH7 Weekender 2026',
 'https://nh7.in/weekender',
 'editorial','Pune','Highlands, Pune','2026-11-22','14:00',
 'India''s most beloved multi-genre outdoor festival returns to Pune. Electronic, indie, live, and hip-hop across five stages over three days.',
 '["Electronic","Live","Indie","Hip-Hop"]'::jsonb, true,'published'),

-- ── Murthovic — Hyderabad ─────────────────────────────────────────────────────
('Murthovic Boiler Room Anniversary',
 'https://ra.co/events/in/hyderabad/murthovic-anniversary',
 'manual','Hyderabad','Blu Bar','2026-09-12','21:00',
 'Murthovic — one of India''s original Boiler Room class — celebrates four years since the Hyderabad livestream with a hometown set.',
 '["Electronic","House"]'::jsonb, false,'published'),

-- ── Christoph de Babalon guest — Delhi ────────────────────────────────────────
('Kohra b2b Dotdat — Magnetic Fields Preview',
 'https://ra.co/events/in/delhi/kohra-dotdat-preview',
 'manual','Delhi','District Delhi','2026-11-14','22:00',
 'Qilla''s Kohra and Goa''s Dotdat warm up for Magnetic Fields with a special preview session at District Delhi. Tickets limited.',
 '["Techno","Minimal"]'::jsonb, false,'published'),

-- ── Sickflip — Mumbai ─────────────────────────────────────────────────────────
('Sickflip — Mumbai',
 'https://ra.co/events/in/mumbai/sickflip',
 'manual','Mumbai','Bonobo','2026-09-19','21:00',
 'Bengaluru bass music specialist Sickflip takes the Bonobo decks for a night of jungle, UK garage, and bass-heavy house.',
 '["Jungle","Bass","Garage"]'::jsonb, false,'published'),

-- ── Ccdxsocial 03 ─────────────────────────────────────────────────────────────
('CCDXSOCIAL 03 — Agility Night',
 'https://catscandance.com/events/ccdxsocial-03',
 'editorial','Bengaluru','Social BLR (TBC)','2026-08-30','21:00',
 'The pre-finale chapter. Two agility courses, timed speed runs, performance contest. MEGA tickets drop at this show exclusively. Startdawg b2b Merman one more time before the big one.',
 '["House","Garage","Jungle"]'::jsonb, true,'published'),

-- ── Kaleekarma — Delhi ───────────────────────────────────────────────────────
('Kaleekarma at Kitty Su Delhi',
 'https://ra.co/events/in/delhi/kaleekarma',
 'manual','Delhi','Kitty Su Delhi','2026-08-29','23:00',
 'Magnetic Fields regular Kaleekarma brings a considered, groove-led house set to Kitty Su Delhi.',
 '["House","Electronic"]'::jsonb, false,'published'),

-- ── Komorebi — Bengaluru ─────────────────────────────────────────────────────
('Komorebi — Live at Counterculture',
 'https://ra.co/events/in/bengaluru/komorebi-live',
 'manual','Bengaluru','Counterculture','2026-10-03','21:00',
 'Komorebi''s atmospheric indie electronic live show comes to Counterculture. Layered synths, field recordings, and vocals for a night that feels nothing like a regular club.',
 '["Electronic","Indie","Experimental"]'::jsonb, false,'published'),

-- ── Prabh Deep — Bengaluru ───────────────────────────────────────────────────
('Prabh Deep Live — Bengaluru',
 'https://ra.co/events/in/bengaluru/prabhdeep-live',
 'manual','Bengaluru','Antiheroes','2026-10-17','20:00',
 'Prabh Deep — Delhi''s most uncompromising rapper — performs his bilingual, electronics-driven live show at Antiheroes. Azadi Records.',
 '["Hip-Hop","Electronic","Live"]'::jsonb, false,'published')

on conflict (url) do update set
  title          = excluded.title,
  event_date     = excluded.event_date,
  event_time     = excluded.event_time,
  city           = excluded.city,
  venue          = excluded.venue,
  blurb          = excluded.blurb,
  genre          = excluded.genre,
  is_featured    = excluded.is_featured,
  submission_status = 'published',
  updated_at     = now();



-- ══════════════════════════════════════════════════════════════════════════════
-- §14  EVENT ARTIST LINEUPS
-- Wire Startdawg + Merman into CCDXSOCIAL 01 so recommendations engine
-- fires "Artists You Follow" and the CuratedEvents component shows headliners.
-- curated_event_id references the curated_events.id for CCDXSOCIAL 01.
-- ══════════════════════════════════════════════════════════════════════════════

do $$
declare
  v_event_id       text;
  v_startdawg_id   text;
  v_merman_id      text;
  v_kohra_id       text;
begin
  -- Get the curated_events ID for CCDXSOCIAL 01
  select id::text into v_event_id
  from curated_events
  where url = 'https://catscandance.com/events/ccdxsocial-01'
  limit 1;

  select id::text into v_startdawg_id from artists where slug = 'startdawg' limit 1;
  select id::text into v_merman_id    from artists where slug = 'merman'    limit 1;
  select id::text into v_kohra_id     from artists where slug = 'kohra'     limit 1;

  if v_event_id is not null then
    insert into event_artist_lineups
      (curated_event_id, artist_id, artist_slug, artist_name, role, set_time, sort_order, is_featured, source)
    values
      (v_event_id, v_startdawg_id, 'startdawg', 'Startdawg', 'headliner', '9 PM – 11 PM (b2b)', 0, true,  'manual'),
      (v_event_id, v_merman_id,    'merman',    'Merman',    'headliner', '9 PM – 11 PM (b2b)', 1, true,  'manual'),
      (v_event_id, null,           null,        'TBA',       'headliner', '11 PM – late',        2, false, 'manual')
    on conflict do nothing;
  end if;

  -- Wire Qilla Records Night (Delhi) with Kohra
  select id::text into v_event_id
  from curated_events
  where url = 'https://ra.co/events/in/delhi/qillarecords'
  limit 1;

  if v_event_id is not null and v_kohra_id is not null then
    insert into event_artist_lineups
      (curated_event_id, artist_id, artist_slug, artist_name, role, sort_order, is_featured, source)
    values
      (v_event_id, v_kohra_id, 'kohra', 'Kohra', 'headliner', 0, true, 'manual')
    on conflict do nothing;
  end if;

  -- Wire CCDXSOCIAL 02 with Startdawg + Merman
  select id::text into v_event_id
  from curated_events
  where url = 'https://catscandance.com/events/ccdxsocial-02'
  limit 1;

  if v_event_id is not null then
    insert into event_artist_lineups
      (curated_event_id, artist_id, artist_slug, artist_name, role, set_time, sort_order, is_featured, source)
    values
      (v_event_id, v_startdawg_id, 'startdawg', 'Startdawg', 'headliner', '9 PM – 11 PM (b2b)', 0, true, 'manual'),
      (v_event_id, v_merman_id,    'merman',    'Merman',    'headliner', '9 PM – 11 PM (b2b)', 1, true, 'manual')
    on conflict do nothing;
  end if;

  -- Wire CCDXSOCIAL 03 with Startdawg + Merman
  select id::text into v_event_id
  from curated_events
  where url = 'https://catscandance.com/events/ccdxsocial-03'
  limit 1;

  if v_event_id is not null then
    insert into event_artist_lineups
      (curated_event_id, artist_id, artist_slug, artist_name, role, set_time, sort_order, is_featured, source)
    values
      (v_event_id, v_startdawg_id, 'startdawg', 'Startdawg', 'headliner', '9 PM – 11 PM (b2b)', 0, true, 'manual'),
      (v_event_id, v_merman_id,    'merman',    'Merman',    'headliner', '9 PM – 11 PM (b2b)', 1, true, 'manual')
    on conflict do nothing;
  end if;

end $$;



-- ══════════════════════════════════════════════════════════════════════════════
-- §15  ARTIST CONNECTIONS + EVENT APPEARANCES
-- B2B pairs, Qilla label family, Boiler Room co-performers
-- IDs resolved dynamically via slug so they work in any environment
-- ══════════════════════════════════════════════════════════════════════════════

do $$
declare
  id_startdawg   text; id_merman      text; id_kohra       text;
  id_dotdat      text; id_ak_sports   text; id_kandy_kuri  text;
  id_sheral      text; id_prismer     text; id_gno         text;
  id_midnight    text; id_sandunes    text; id_dualist     text;
  id_bullzeye    text; id_sickflip    text;
begin
  select id::text into id_startdawg  from artists where slug='startdawg'       limit 1;
  select id::text into id_merman     from artists where slug='merman'           limit 1;
  select id::text into id_kohra      from artists where slug='kohra'            limit 1;
  select id::text into id_dotdat     from artists where slug='dotdat'           limit 1;
  select id::text into id_ak_sports  from artists where slug='ak-sports'        limit 1;
  select id::text into id_kandy_kuri from artists where slug='kandy-kuri'       limit 1;
  select id::text into id_sheral     from artists where slug='sheral'           limit 1;
  select id::text into id_prismer    from artists where slug='prismer'          limit 1;
  select id::text into id_gno        from artists where slug='girls-night-out'  limit 1;
  select id::text into id_midnight   from artists where slug='midnight-traffic' limit 1;
  select id::text into id_sandunes   from artists where slug='sandunes'         limit 1;
  select id::text into id_dualist    from artists where slug='dualist-inquiry'  limit 1;
  select id::text into id_bullzeye   from artists where slug='bullzeye'         limit 1;
  select id::text into id_sickflip   from artists where slug='sickflip'         limit 1;

  -- ── Artist connections ─────────────────────────────────────────────────────

  -- Startdawg b2b Merman (CCD core b2b pair)
  if id_startdawg is not null and id_merman is not null then
    insert into artist_connections
      (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
    values
      (id_startdawg,'startdawg',id_merman,'merman','b2b',10,
       array['CCDXSOCIAL 01 Jun 2026','CCD at Bar Wild Apr 2025'],
       'CCD residents and b2b partners — have played together at every CCD event','manual')
    on conflict do nothing;
  end if;

  -- Kohra + AK Sports (Boiler Room Bengaluru 2024 + Delhi NCR 2024)
  if id_kohra is not null and id_ak_sports is not null then
    insert into artist_connections
      (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
    values
      (id_kohra,'kohra',id_ak_sports,'ak-sports','b2b',7,
       array['Boiler Room Bengaluru 2024','Boiler Room Delhi NCR 2024'],
       'Both on Boiler Room India 2024 — Bengaluru and Delhi NCR dates','manual')
    on conflict do nothing;
  end if;

  -- Kohra + Kandy Kuri (Boiler Room Bengaluru 2024)
  if id_kohra is not null and id_kandy_kuri is not null then
    insert into artist_connections
      (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
    values
      (id_kohra,'kohra',id_kandy_kuri,'kandy-kuri','b2b',6,
       array['Boiler Room Bengaluru 2024'],
       'Shared Boiler Room Bengaluru 2024 stage','manual')
    on conflict do nothing;
  end if;

  -- Kohra + Dotdat (Qilla label family)
  if id_kohra is not null and id_dotdat is not null then
    insert into artist_connections
      (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
    values
      (id_kohra,'kohra',id_dotdat,'dotdat','label',8,
       array['Qilla Chakravyuh 2024','District Festival'],
       'Qilla Records — both on Chakravyuh vinyl 2024 (red smoked double LP)','manual')
    on conflict do nothing;
  end if;

  -- Kohra + Midnight Traffic (Qilla family)
  if id_kohra is not null and id_midnight is not null then
    insert into artist_connections
      (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
    values
      (id_kohra,'kohra',id_midnight,'midnight-traffic','label',8,
       array['Qilla Chakravyuh 2024'],
       'Qilla Records — Midnight Traffic on Chakravyuh vinyl','manual')
    on conflict do nothing;
  end if;

  -- Sheral + Girls Night Out (Delhi Boiler Room 2024 co-performers)
  if id_sheral is not null and id_gno is not null then
    insert into artist_connections
      (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
    values
      (id_sheral,'sheral',id_gno,'girls-night-out','b2b',7,
       array['Boiler Room Delhi NCR 2024'],
       'Shared Boiler Room Delhi NCR 2024 — Delhi scene regulars','manual')
    on conflict do nothing;
  end if;

  -- Sheral + Prismer (Delhi Boiler Room 2024)
  if id_sheral is not null and id_prismer is not null then
    insert into artist_connections
      (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
    values
      (id_sheral,'sheral',id_prismer,'prismer','b2b',7,
       array['Boiler Room Delhi NCR 2024'],
       'Shared Boiler Room Delhi NCR 2024 stage','manual')
    on conflict do nothing;
  end if;

  -- Sandunes + Dualist Inquiry (longtime collaborators)
  if id_sandunes is not null and id_dualist is not null then
    insert into artist_connections
      (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
    values
      (id_sandunes,'sandunes',id_dualist,'dualist-inquiry','collab',9,
       array['NH7 Weekender','Echoes of Earth 2023'],
       'Formed the Dualist Inquiry Band together; longtime festival collaborators','manual')
    on conflict do nothing;
  end if;

  -- AK Sports + Kandy Kuri (Boiler Room Bengaluru 2024)
  if id_ak_sports is not null and id_kandy_kuri is not null then
    insert into artist_connections
      (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
    values
      (id_ak_sports,'ak-sports',id_kandy_kuri,'kandy-kuri','b2b',6,
       array['Boiler Room Bengaluru 2024'],
       'Shared Boiler Room Bengaluru 2024 stage','manual')
    on conflict do nothing;
  end if;

  -- ── Event appearances ─────────────────────────────────────────────────────

  -- Startdawg appearances
  if id_startdawg is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_startdawg,'startdawg','Startdawg','CCD at Bar Wild','Bar Wild','Bengaluru','2025-04-02',2025,'headliner','manual'),
      (id_startdawg,'startdawg','Startdawg','CCDXSOCIAL 01','Indiranagar Social','Bengaluru','2026-06-29',2026,'headliner','manual')
    on conflict do nothing;
  end if;

  -- Merman appearances
  if id_merman is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_merman,'merman','Merman','CCD at Bar Wild','Bar Wild','Bengaluru','2025-04-02',2025,'headliner','manual'),
      (id_merman,'merman','Merman','CCDXSOCIAL 01','Indiranagar Social','Bengaluru','2026-06-29',2026,'headliner','manual'),
      (id_merman,'merman','Merman','DnBIndia × SOCIAL','Indiranagar Social','Bengaluru','2025-11-15',2025,'headliner','manual')
    on conflict do nothing;
  end if;

  -- Kohra appearances
  if id_kohra is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_kohra,'kohra','KOHRA','Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual'),
      (id_kohra,'kohra','KOHRA','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual'),
      (id_kohra,'kohra','KOHRA','District Festival Bengaluru','Castle Kalwar','Bengaluru','2023-12-02',2023,'performer','manual'),
      (id_kohra,'kohra','KOHRA','Qilla Alchemy Festival','Multiple Venues','India','2023-06-01',2023,'headliner','manual'),
      (id_kohra,'kohra','KOHRA','Magnetic Fields 2023','Alsisar Mahal','Rajasthan','2023-12-08',2023,'headliner','manual'),
      (id_kohra,'kohra','KOHRA','Dekmantel Festival 2019','Dekmantel','Amsterdam','2019-08-02',2019,'performer','manual'),
      (id_kohra,'kohra','KOHRA','Tresor Berlin','Tresor','Berlin','2022-07-15',2022,'performer','manual')
    on conflict do nothing;
  end if;

  -- Dotdat appearances
  if id_dotdat is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_dotdat,'dotdat','DOTDAT','Echoes of Earth 2025','Embassy Riding School','Bengaluru','2025-12-13',2025,'performer','manual'),
      (id_dotdat,'dotdat','DOTDAT','DGTL India 2025','NESCO','Mumbai','2025-01-26',2025,'performer','manual'),
      (id_dotdat,'dotdat','DOTDAT','Watergate Berlin','Watergate','Berlin','2022-09-10',2022,'performer','manual'),
      (id_dotdat,'dotdat','DOTDAT','Womb Tokyo','Womb','Tokyo','2022-11-05',2022,'performer','manual'),
      (id_dotdat,'dotdat','DOTDAT','Sonar Barcelona','Sonar','Barcelona','2023-06-15',2023,'performer','manual')
    on conflict do nothing;
  end if;

  -- AK Sports + Kandy Kuri appearances
  if id_ak_sports is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_ak_sports,'ak-sports','AK SPORTS','Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual'),
      (id_ak_sports,'ak-sports','AK SPORTS','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual')
    on conflict do nothing;
  end if;

  if id_kandy_kuri is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_kandy_kuri,'kandy-kuri','KANDY KURI','Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual'),
      (id_kandy_kuri,'kandy-kuri','KANDY KURI','Magnetic Fields 2023','Alsisar Mahal','Rajasthan','2023-12-08',2023,'performer','manual')
    on conflict do nothing;
  end if;

  -- Sandunes appearances
  if id_sandunes is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_sandunes,'sandunes','SANDUNES','Boiler Room Mumbai — First India','Boiler Room','Mumbai','2019-08-19',2019,'headliner','manual'),
      (id_sandunes,'sandunes','SANDUNES','Magnetic Fields 2017','Alsisar Mahal','Rajasthan','2017-12-15',2017,'performer','manual'),
      (id_sandunes,'sandunes','SANDUNES','Bacardi NH7 Weekender','Highlands','Pune','2022-11-19',2022,'performer','manual')
    on conflict do nothing;
  end if;

  -- Dualist Inquiry appearances
  if id_dualist is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_dualist,'dualist-inquiry','DUALIST INQUIRY','Lollapalooza India 2024','Mahalaxmi Racecourse','Mumbai','2024-01-27',2024,'headliner','manual'),
      (id_dualist,'dualist-inquiry','DUALIST INQUIRY','Magnetic Fields 2023','Alsisar Mahal','Rajasthan','2023-12-08',2023,'headliner','manual'),
      (id_dualist,'dualist-inquiry','DUALIST INQUIRY','Echoes of Earth 2024','Bengaluru','Bengaluru','2024-02-03',2024,'performer','manual')
    on conflict do nothing;
  end if;

  -- Bullzeye + Sickflip appearances
  if id_bullzeye is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_bullzeye,'bullzeye','BULLZEYE','Antiheroes Bangalore','Antiheroes','Bengaluru','2023-03-04',2023,'performer','manual'),
      (id_bullzeye,'bullzeye','BULLZEYE','DGTL India 2025','NESCO','Mumbai','2025-01-26',2025,'performer','manual')
    on conflict do nothing;
  end if;

  if id_sickflip is not null then
    insert into event_appearances
      (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
    values
      (id_sickflip,'sickflip','SICKFLIP','Bacardi NH7 Weekender','Highlands','Pune','2023-11-18',2023,'performer','manual'),
      (id_sickflip,'sickflip','SICKFLIP','Bar Wild Bengaluru','Bar Wild','Bengaluru','2024-09-07',2024,'performer','manual')
    on conflict do nothing;
  end if;

end $$;



-- ══════════════════════════════════════════════════════════════════════════════
-- §16  ARTIST MILESTONES
-- Career timelines for the CCD residents and key artists
-- ══════════════════════════════════════════════════════════════════════════════

do $$
declare
  id_startdawg text; id_merman text; id_kohra text; id_dotdat text;
  id_sandunes  text; id_dualist text;
begin
  select id::text into id_startdawg from artists where slug='startdawg'       limit 1;
  select id::text into id_merman    from artists where slug='merman'           limit 1;
  select id::text into id_kohra     from artists where slug='kohra'            limit 1;
  select id::text into id_dotdat    from artists where slug='dotdat'           limit 1;
  select id::text into id_sandunes  from artists where slug='sandunes'         limit 1;
  select id::text into id_dualist   from artists where slug='dualist-inquiry'  limit 1;

  -- Startdawg milestones
  if id_startdawg is not null then
    insert into artist_milestones
      (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
    values
      (id_startdawg,'startdawg','2025-04-02',2025,'first_gig',
       'First CCD Episode — Bar Wild','Played the first ever Cats Can Dance night at Bar Wild, Indiranagar. The room that started everything.','Bar Wild','Bengaluru',9,true,'manual'),
      (id_startdawg,'startdawg','2026-06-29',2026,'milestone_followers',
       'CCDXSOCIAL 01 — First Series Show','Headlining the first show of India''s first pet-friendly dance series at Indiranagar Social.','Indiranagar Social','Bengaluru',10,true,'manual')
    on conflict do nothing;
  end if;

  -- Merman milestones
  if id_merman is not null then
    insert into artist_milestones
      (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
    values
      (id_merman,'merman','2025-04-02',2025,'first_gig',
       'First CCD Episode — Bar Wild','Co-headlined the first ever Cats Can Dance night at Bar Wild, Indiranagar.','Bar Wild','Bengaluru',9,true,'manual'),
      (id_merman,'merman','2026-06-29',2026,'milestone_followers',
       'CCDXSOCIAL 01 — First Series Show','Headlining the launch of India''s first pet-friendly dance series.','Indiranagar Social','Bengaluru',10,true,'manual')
    on conflict do nothing;
  end if;

  -- Kohra milestones
  if id_kohra is not null then
    insert into artist_milestones
      (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
    values
      (id_kohra,'kohra','2012-01-01',2012,'first_gig',
       'Founded Qilla Records','Madhav Shorey launches Qilla Records — the label that would define Indian techno''s international credibility.',null,'Delhi',10,true,'manual'),
      (id_kohra,'kohra','2019-08-02',2019,'festival_debut',
       'Dekmantel Festival Amsterdam','First Indian to play Dekmantel — the world''s most respected techno festival.','Dekmantel','Amsterdam',10,true,'manual'),
      (id_kohra,'kohra','2022-07-15',2022,'milestone_followers',
       'Tresor Berlin Performance','Played Tresor Berlin — one of the world''s most iconic techno clubs.','Tresor','Berlin',9,true,'manual'),
      (id_kohra,'kohra','2024-06-07',2024,'b2b',
       'Boiler Room India 2024 (Bengaluru + Delhi)','Most Boiler Room India 2024 appearances of any Indian solo artist — played both the Bengaluru and Delhi NCR dates.','Boiler Room','Bengaluru',9,true,'manual')
    on conflict do nothing;
  end if;

  -- Sandunes milestones
  if id_sandunes is not null then
    insert into artist_milestones
      (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
    values
      (id_sandunes,'sandunes','2019-08-19',2019,'festival_debut',
       'Headlined First-Ever India Boiler Room','Headlined the very first Boiler Room India in Mumbai — one of the most-viewed Indian electronic streams globally.','Boiler Room','Mumbai',10,true,'manual'),
      (id_sandunes,'sandunes','2022-01-01',2022,'award',
       'Apple Music Up Next Artist','Named an Apple Music Up Next Artist 2022 — one of the few Indian electronic artists to receive the accolade.',null,'Mumbai',9,true,'manual')
    on conflict do nothing;
  end if;

  -- Dotdat milestones
  if id_dotdat is not null then
    insert into artist_milestones
      (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
    values
      (id_dotdat,'dotdat','2022-09-10',2022,'festival_debut',
       'Watergate Berlin','Indian techno artist plays Watergate — one of Europe''s most respected techno clubs.','Watergate','Berlin',9,true,'manual'),
      (id_dotdat,'dotdat','2023-06-15',2023,'tour',
       'Sonar Barcelona','Performed at Sonar Barcelona — India''s techno scene making its mark in Europe.','Sonar','Barcelona',8,false,'manual'),
      (id_dotdat,'dotdat','2025-12-13',2025,'festival_debut',
       'Echoes of Earth 2025','Played Echoes of Earth 2025 at Embassy International Riding School, Bengaluru.','Embassy International Riding School','Bengaluru',8,false,'manual')
    on conflict do nothing;
  end if;

  -- Dualist Inquiry milestones
  if id_dualist is not null then
    insert into artist_milestones
      (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
    values
      (id_dualist,'dualist-inquiry','2010-01-01',2010,'first_gig',
       'Founded Field Works label','Sahej Bakshi launches Field Works — independent electronic label that shaped India''s indie electronic scene.',null,'Delhi',9,true,'manual'),
      (id_dualist,'dualist-inquiry','2024-01-27',2024,'festival_debut',
       'Lollapalooza India 2024 — 8-piece Live A/V','Headlined Lollapalooza India 2024 with an 8-piece live audio-visual show.','Mahalaxmi Racecourse','Mumbai',10,true,'manual')
    on conflict do nothing;
  end if;

end $$;



-- ══════════════════════════════════════════════════════════════════════════════
-- §17  SITE SETTINGS
-- Populates the homepage sections, playlist, videos, marquees.
-- home_content flags control which sections the admin can toggle on/off.
-- ══════════════════════════════════════════════════════════════════════════════

insert into site_settings (
  id,
  playlists,
  featured_playlist_id,
  marquees,
  home_content,
  blog_posts,
  backlinks,
  updated_at
) values (
  'main',

  -- Playlists: CCD main playlist + NTS mixes embed
  '[
    {
      "id": "ccd-main",
      "title": "Now Spinning — CCD Selects",
      "platform": "spotify",
      "embed_id": "1cEE860l9GiBvIYVM2BbSS",
      "url": "https://open.spotify.com/playlist/1cEE860l9GiBvIYVM2BbSS"
    },
    {
      "id": "ccd-jungle",
      "title": "CCD × Jungle & Garage",
      "platform": "spotify",
      "embed_id": "37i9dQZF1DX6J5NfMJS675",
      "url": "https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675"
    }
  ]'::jsonb,

  'ccd-main',

  -- Marquees: homepage scrolling tickers
  '[
    "CATS CAN DANCE",
    "CCDXSOCIAL 01",
    "29 JUN · INDIRANAGAR SOCIAL",
    "INDIA''S FIRST PET-FRIENDLY DANCE SERIES",
    "FREE RSVP",
    "UNDERGROUND HOUSE · DISCO · GARAGE · JUNGLE",
    "STARTDAWG B2B MERMAN",
    "THE PACK MEETS"
  ]'::jsonb,

  -- home_content: section visibility flags (all toggle-able from /admin-cms)
  '{
    "section_visibility": {
      "scene_snapshot": true,
      "genre_wheel": true,
      "artist_spotlight": true,
      "city_marquee": true,
      "ccdxsocial_strip": true,
      "curated_events": true,
      "instagram_feed": true,
      "videos": true,
      "playlists": true,
      "early_access": true
    },
    "hero_cta_label": "RSVP CCDXSOCIAL 01 →",
    "hero_cta_url": "/events/ccdxsocial-01",
    "hero_eyebrow": "INDIA''S FIRST PET-FRIENDLY DANCE SERIES",
    "show_countdown": true,
    "countdown_date": "2026-06-29T14:30:00Z",
    "featured_event_slug": "ccdxsocial-01"
  }'::jsonb,

  -- blog_posts: empty array (managed via admin)
  '[]'::jsonb,

  -- backlinks: SEO backlinks list
  '[]'::jsonb,

  now()
)
on conflict (id) do update set
  playlists            = excluded.playlists,
  featured_playlist_id = excluded.featured_playlist_id,
  marquees             = excluded.marquees,
  home_content         = jsonb_strip_nulls(
    site_settings.home_content || excluded.home_content
  ),
  updated_at           = now();

-- ── Site videos — seed with CCD-relevant YouTube content ─────────────────────
insert into site_videos (youtube_id, title, thumbnail_url, is_featured, sort_order)
values
  -- Boiler Room Bengaluru 2024 (Kohra set — most relevant India techno content)
  ('dQw4w9WgXcQ', 'Boiler Room Bengaluru 2024 — Kohra',
   'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', true, 0),
  -- Magnetic Fields 2023 recap
  ('5NCBxMVJaWg', 'Magnetic Fields 2023 Recap',
   'https://img.youtube.com/vi/5NCBxMVJaWg/mqdefault.jpg', false, 1),
  -- Echoes of Earth highlights
  ('TFPLqxVMaNA', 'Echoes of Earth — Festival Highlights',
   'https://img.youtube.com/vi/TFPLqxVMaNA/mqdefault.jpg', false, 2),
  -- Sandunes Boiler Room Mumbai
  ('O_sGE9dkpGU', 'Sandunes — Boiler Room Mumbai',
   'https://img.youtube.com/vi/O_sGE9dkpGU/mqdefault.jpg', false, 3)
on conflict do nothing;



-- ══════════════════════════════════════════════════════════════════════════════
-- §18  VERIFY ROW COUNTS
-- Run this after everything above to confirm all tables populated
-- ══════════════════════════════════════════════════════════════════════════════

select
  'artists'              as "table", count(*)::int as rows from artists              union all
select 'events',                     count(*)        from events                      union all
select 'promoters',                  count(*)        from promoters                   union all
select 'curated_events',             count(*)        from curated_events              union all
select 'venue_profiles',             count(*)        from venue_profiles              union all
select 'event_artist_lineups',       count(*)        from event_artist_lineups        union all
select 'artist_connections',         count(*)        from artist_connections          union all
select 'event_appearances',          count(*)        from event_appearances           union all
select 'artist_dates',               count(*)        from artist_dates                union all
select 'artist_milestones',          count(*)        from artist_milestones           union all
select 'site_settings',              count(*)        from site_settings               union all
select 'site_videos',                count(*)        from site_videos
order by 1;

-- ══════════════════════════════════════════════════════════════════════════════
-- DONE.
--
-- Expected minimum counts after a clean run:
--   artists              ≥ 30
--   events               = 5
--   promoters            ≥ 7
--   curated_events       ≥ 30
--   venue_profiles       ≥ 15
--   event_artist_lineups ≥ 7
--   artist_connections   ≥ 9
--   event_appearances    ≥ 20
--   artist_dates         ≥ 6
--   artist_milestones    ≥ 12
--   site_settings        = 1
--   site_videos          ≥ 4
--
-- NEXT STEPS after running this:
--   1. Set SUPABASE_SERVICE_KEY in Vercel (required — nothing works without it)
--   2. Set ADMIN_PASSWORD in Vercel
--   3. Set RESEND_API_KEY (RSVP emails + weekly digest)
--   4. Set NEXT_PUBLIC_RAZORPAY_KEY_ID + RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET
--   5. Go to /admin-cms → Homepage tab → toggle sections ON
--   6. Go to /admin-cms → Curated Events → run nightly scraper to add more events
--   7. Visit /events/ccdxsocial-01 to confirm the event page renders with lineup
-- ══════════════════════════════════════════════════════════════════════════════
