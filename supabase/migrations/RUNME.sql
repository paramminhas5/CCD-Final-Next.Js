-- ============================================================
-- RUNME.sql  —  CCD complete database setup
--
-- Paste this ENTIRE file into Supabase SQL Editor → Run.
-- Works on a FRESH database and on an EXISTING one.
-- Every statement is idempotent — safe to re-run.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- STEP 1/5 · Schema
-- ─────────────────────────────────────────────────────────────

-- ── Extend artists ───────────────────────────────────────────
ALTER TABLE artists ADD COLUMN IF NOT EXISTS kind               text NOT NULL DEFAULT 'musician';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS why                text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS members            text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS festivals          text[] NOT NULL DEFAULT '{}';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS fee_currency       text NOT NULL DEFAULT 'INR';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS fee_min_inr        integer;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS fee_max_inr        integer;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS available_cities   text[] NOT NULL DEFAULT '{}';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS open_to_bookings   boolean NOT NULL DEFAULT true;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS source             text NOT NULL DEFAULT 'manual';
ALTER TABLE artists ADD COLUMN IF NOT EXISTS enriched_at        timestamptz;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS spotify_id         text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS youtube_channel_id text;
ALTER TABLE artists ADD COLUMN IF NOT EXISTS ra_id              text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'artists_kind_check') THEN
    ALTER TABLE artists ADD CONSTRAINT artists_kind_check
      CHECK (kind IN ('musician','photographer','lighting','mix_engineer','production','videographer','mc'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS artists_slug_idx       ON artists(slug);
CREATE INDEX IF NOT EXISTS artists_featured_idx   ON artists(featured, status);
CREATE INDEX IF NOT EXISTS artists_claimed_by_idx ON artists(claimed_by) WHERE claimed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS artists_kind_idx       ON artists(kind);

-- ── artist_social_stats ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_social_stats (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id                 uuid REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug               text NOT NULL DEFAULT '',
  instagram_followers       integer,
  soundcloud_followers      integer,
  spotify_followers         integer,
  spotify_monthly_listeners integer,
  youtube_subscribers       integer,
  bandcamp_followers        integer,
  source                    text NOT NULL DEFAULT 'manual',
  captured_at               timestamptz NOT NULL DEFAULT now(),
  created_at                timestamptz NOT NULL DEFAULT now()
);
-- Backfill: table may already exist without these columns
ALTER TABLE artist_social_stats ADD COLUMN IF NOT EXISTS artist_slug text NOT NULL DEFAULT '';
ALTER TABLE artist_social_stats ADD COLUMN IF NOT EXISTS source      text NOT NULL DEFAULT 'manual';
ALTER TABLE artist_social_stats ADD COLUMN IF NOT EXISTS captured_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE artist_social_stats ADD COLUMN IF NOT EXISTS instagram_followers       integer;
ALTER TABLE artist_social_stats ADD COLUMN IF NOT EXISTS soundcloud_followers      integer;
ALTER TABLE artist_social_stats ADD COLUMN IF NOT EXISTS spotify_followers         integer;
ALTER TABLE artist_social_stats ADD COLUMN IF NOT EXISTS spotify_monthly_listeners integer;
ALTER TABLE artist_social_stats ADD COLUMN IF NOT EXISTS youtube_subscribers       integer;
ALTER TABLE artist_social_stats ADD COLUMN IF NOT EXISTS bandcamp_followers        integer;
CREATE INDEX IF NOT EXISTS artist_social_stats_slug_idx      ON artist_social_stats(artist_slug, captured_at DESC);
CREATE INDEX IF NOT EXISTS artist_social_stats_artist_id_idx ON artist_social_stats(artist_id, captured_at DESC);

-- ── artist_milestones ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_milestones (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id            uuid REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug          text NOT NULL DEFAULT '',
  type                 text NOT NULL DEFAULT 'first_gig',
  title                text NOT NULL DEFAULT '',
  description          text,
  date                 date NOT NULL DEFAULT CURRENT_DATE,
  year                 integer,
  city                 text,
  venue                text,
  is_featured          boolean NOT NULL DEFAULT false,
  importance           integer NOT NULL DEFAULT 5,
  source               text NOT NULL DEFAULT 'manual',
  enriched_at          timestamptz,
  related_artist_slug  text,
  related_artist_name  text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE artist_milestones ADD COLUMN IF NOT EXISTS artist_slug         text NOT NULL DEFAULT '';
ALTER TABLE artist_milestones ADD COLUMN IF NOT EXISTS source              text NOT NULL DEFAULT 'manual';
ALTER TABLE artist_milestones ADD COLUMN IF NOT EXISTS enriched_at         timestamptz;
ALTER TABLE artist_milestones ADD COLUMN IF NOT EXISTS importance          integer NOT NULL DEFAULT 5;
ALTER TABLE artist_milestones ADD COLUMN IF NOT EXISTS related_artist_slug text;
ALTER TABLE artist_milestones ADD COLUMN IF NOT EXISTS related_artist_name text;
ALTER TABLE artist_milestones ADD COLUMN IF NOT EXISTS is_featured         boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS artist_milestones_slug_idx      ON artist_milestones(artist_slug, date ASC);
CREATE INDEX IF NOT EXISTS artist_milestones_artist_id_idx ON artist_milestones(artist_id, date ASC);

-- ── artist_discography ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_discography (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id      uuid REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug    text NOT NULL DEFAULT '',
  title          text NOT NULL DEFAULT '',
  release_type   text NOT NULL DEFAULT 'single',
  release_date   date,
  year           integer,
  label          text,
  artwork_url    text,
  spotify_url    text,
  soundcloud_url text,
  bandcamp_url   text,
  youtube_url    text,
  description    text,
  source         text NOT NULL DEFAULT 'manual',
  enriched_at    timestamptz,
  external_id    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE artist_discography ADD COLUMN IF NOT EXISTS artist_slug    text NOT NULL DEFAULT '';
ALTER TABLE artist_discography ADD COLUMN IF NOT EXISTS source         text NOT NULL DEFAULT 'manual';
ALTER TABLE artist_discography ADD COLUMN IF NOT EXISTS enriched_at    timestamptz;
ALTER TABLE artist_discography ADD COLUMN IF NOT EXISTS external_id    text;
ALTER TABLE artist_discography ADD COLUMN IF NOT EXISTS youtube_url    text;
ALTER TABLE artist_discography ADD COLUMN IF NOT EXISTS soundcloud_url text;
ALTER TABLE artist_discography ADD COLUMN IF NOT EXISTS bandcamp_url   text;
ALTER TABLE artist_discography ADD COLUMN IF NOT EXISTS artwork_url    text;
ALTER TABLE artist_discography ADD COLUMN IF NOT EXISTS spotify_url    text;
CREATE INDEX IF NOT EXISTS artist_discography_slug_idx      ON artist_discography(artist_slug, release_date DESC);
CREATE INDEX IF NOT EXISTS artist_discography_artist_id_idx ON artist_discography(artist_id, release_date DESC);

-- ── artist_press ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_press (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id      uuid REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug    text NOT NULL DEFAULT '',
  title          text NOT NULL DEFAULT '',
  publication    text NOT NULL DEFAULT '',
  author         text,
  excerpt        text,
  url            text,
  type           text NOT NULL DEFAULT 'review',
  date_published date,
  is_featured    boolean NOT NULL DEFAULT false,
  quote_for_epk  text,
  source         text NOT NULL DEFAULT 'manual',
  enriched_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE artist_press ADD COLUMN IF NOT EXISTS artist_slug  text NOT NULL DEFAULT '';
ALTER TABLE artist_press ADD COLUMN IF NOT EXISTS source       text NOT NULL DEFAULT 'manual';
ALTER TABLE artist_press ADD COLUMN IF NOT EXISTS enriched_at  timestamptz;
ALTER TABLE artist_press ADD COLUMN IF NOT EXISTS quote_for_epk text;
ALTER TABLE artist_press ADD COLUMN IF NOT EXISTS is_featured   boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS artist_press_slug_idx      ON artist_press(artist_slug, date_published DESC);
CREATE INDEX IF NOT EXISTS artist_press_artist_id_idx ON artist_press(artist_id, date_published DESC);

-- ── artist_packages ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artist_packages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  artist_slug      text NOT NULL DEFAULT '',
  name             text NOT NULL DEFAULT '',
  description      text,
  suitable_for     text[] NOT NULL DEFAULT '{}',
  price_inr        integer NOT NULL DEFAULT 0,
  price_is_minimum boolean NOT NULL DEFAULT true,
  travel_included  boolean NOT NULL DEFAULT false,
  travel_note      text,
  set_duration_min integer,
  set_type         text NOT NULL DEFAULT 'solo',
  tech_rider       text,
  is_active        boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS artist_slug      text NOT NULL DEFAULT '';
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS suitable_for     text[] NOT NULL DEFAULT '{}';
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS price_inr        integer NOT NULL DEFAULT 0;
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS price_is_minimum boolean NOT NULL DEFAULT true;
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS travel_included  boolean NOT NULL DEFAULT false;
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS travel_note      text;
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS set_duration_min integer;
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS tech_rider       text;
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS is_active        boolean NOT NULL DEFAULT true;
ALTER TABLE artist_packages ADD COLUMN IF NOT EXISTS sort_order       integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS artist_packages_artist_id_idx ON artist_packages(artist_id, sort_order);
CREATE INDEX IF NOT EXISTS artist_packages_slug_idx      ON artist_packages(artist_slug) WHERE is_active = true;

-- ── artist_availability_blocks ───────────────────────────────
CREATE TABLE IF NOT EXISTS artist_availability_blocks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  kind             text NOT NULL DEFAULT 'available',
  label            text,
  city             text,
  cities           text[] NOT NULL DEFAULT '{}',
  start_date       date NOT NULL DEFAULT CURRENT_DATE,
  end_date         date NOT NULL DEFAULT CURRENT_DATE,
  weekly_days      jsonb,
  fee_override_inr integer,
  notes            text,
  is_public        boolean NOT NULL DEFAULT true,
  booking_id       uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE artist_availability_blocks ADD COLUMN IF NOT EXISTS cities           text[] NOT NULL DEFAULT '{}';
ALTER TABLE artist_availability_blocks ADD COLUMN IF NOT EXISTS weekly_days      jsonb;
ALTER TABLE artist_availability_blocks ADD COLUMN IF NOT EXISTS fee_override_inr integer;
ALTER TABLE artist_availability_blocks ADD COLUMN IF NOT EXISTS booking_id       uuid;
ALTER TABLE artist_availability_blocks ADD COLUMN IF NOT EXISTS is_public        boolean NOT NULL DEFAULT true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avail_blocks_date_range') THEN
    ALTER TABLE artist_availability_blocks ADD CONSTRAINT avail_blocks_date_range CHECK (end_date >= start_date);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avail_blocks_kind_check') THEN
    ALTER TABLE artist_availability_blocks ADD CONSTRAINT avail_blocks_kind_check CHECK (kind IN ('tour_leg','unavailable','available'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS avail_blocks_artist_dates_idx ON artist_availability_blocks(artist_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS avail_blocks_public_idx       ON artist_availability_blocks(start_date, end_date) WHERE is_public = true;

-- ── Extend booking_requests ──────────────────────────────────
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS artist_id_resolved uuid REFERENCES artists(id) ON DELETE SET NULL;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS package_id         uuid;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS requester_name     text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS event_type         text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS event_date         date;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS event_date_end     date;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS venue_name         text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS venue_city         text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS budget_inr         integer;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS notes              text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS status             text NOT NULL DEFAULT 'new';
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS quoted_inr         integer;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS hold_expires_at    timestamptz;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS confirmed_at       timestamptz;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS source             text NOT NULL DEFAULT 'marketplace';
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS promoter_clerk_id  text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS promoter_name      text;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS booking_requests_artist_resolved_idx ON booking_requests(artist_id_resolved, status, created_at DESC) WHERE artist_id_resolved IS NOT NULL;
CREATE INDEX IF NOT EXISTS booking_requests_promoter_idx        ON booking_requests(promoter_clerk_id, created_at DESC) WHERE promoter_clerk_id IS NOT NULL;

-- ── booking_messages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  sender_role      text NOT NULL DEFAULT 'system',
  sender_clerk_id  text,
  sender_name      text,
  body             text NOT NULL DEFAULT '',
  is_system        boolean NOT NULL DEFAULT false,
  quote_inr        integer,
  quote_valid_until timestamptz,
  read_by_artist   boolean NOT NULL DEFAULT false,
  read_by_promoter boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE booking_messages ADD COLUMN IF NOT EXISTS sender_clerk_id   text;
ALTER TABLE booking_messages ADD COLUMN IF NOT EXISTS sender_name        text;
ALTER TABLE booking_messages ADD COLUMN IF NOT EXISTS is_system          boolean NOT NULL DEFAULT false;
ALTER TABLE booking_messages ADD COLUMN IF NOT EXISTS quote_inr          integer;
ALTER TABLE booking_messages ADD COLUMN IF NOT EXISTS quote_valid_until  timestamptz;
ALTER TABLE booking_messages ADD COLUMN IF NOT EXISTS read_by_artist     boolean NOT NULL DEFAULT false;
ALTER TABLE booking_messages ADD COLUMN IF NOT EXISTS read_by_promoter   boolean NOT NULL DEFAULT false;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_messages_role_check') THEN
    ALTER TABLE booking_messages ADD CONSTRAINT booking_messages_role_check CHECK (sender_role IN ('artist','promoter','system'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS booking_messages_booking_idx         ON booking_messages(booking_id, created_at ASC);
CREATE INDEX IF NOT EXISTS booking_messages_unread_artist_idx   ON booking_messages(booking_id) WHERE read_by_artist   = false AND sender_role = 'promoter';
CREATE INDEX IF NOT EXISTS booking_messages_unread_promoter_idx ON booking_messages(booking_id) WHERE read_by_promoter = false AND sender_role = 'artist';

-- ── promoter_profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promoter_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   text UNIQUE NOT NULL,
  email           text NOT NULL DEFAULT '',
  company_name    text NOT NULL DEFAULT '',
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
CREATE INDEX IF NOT EXISTS promoter_profiles_clerk_idx ON promoter_profiles(clerk_user_id);

-- ── booking_shortlist ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_shortlist (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_clerk_id  text NOT NULL,
  artist_id          uuid NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  brief_event_type   text,
  brief_date         date,
  brief_date_end     date,
  brief_cities       text[] NOT NULL DEFAULT '{}',
  brief_budget_inr   integer,
  brief_notes        text,
  contacted          boolean NOT NULL DEFAULT false,
  contacted_at       timestamptz,
  booking_request_id uuid REFERENCES booking_requests(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promoter_clerk_id, artist_id)
);
CREATE INDEX IF NOT EXISTS shortlist_promoter_idx ON booking_shortlist(promoter_clerk_id, created_at DESC);

-- ── user_roles ───────────────────────────────────────────────
-- NOTE: user_roles already exists in Supabase with columns:
--   user_id, role, entity_id, entity_slug, entity_name, email, etc.
-- The proxy reads/writes using user_id (not clerk_user_id).
-- We only add missing columns — we never change existing ones.
CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL,
  role       text NOT NULL DEFAULT 'fan',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Add columns used by the proxy if they don't exist
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS user_id     text;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role        text NOT NULL DEFAULT 'fan';
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS entity_id   uuid;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS entity_slug text;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS entity_name text;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS email       text;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS granted_by  text;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS granted_at  timestamptz;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);

-- ── user_taste_profiles ──────────────────────────────────────
-- NOTE: user_taste_profiles already exists with columns:
--   user_id, liked_artist_slugs (text array), cities, genres, etc.
-- The proxy reads/writes using user_id + liked_artist_slugs.
CREATE TABLE IF NOT EXISTS user_taste_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             text NOT NULL,
  liked_artist_slugs  text[] NOT NULL DEFAULT '{}',
  cities              text[] NOT NULL DEFAULT '{}',
  genres              text[] NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_taste_profiles ADD COLUMN IF NOT EXISTS user_id            text;
ALTER TABLE user_taste_profiles ADD COLUMN IF NOT EXISTS liked_artist_slugs text[] NOT NULL DEFAULT '{}';
ALTER TABLE user_taste_profiles ADD COLUMN IF NOT EXISTS cities             text[] NOT NULL DEFAULT '{}';
ALTER TABLE user_taste_profiles ADD COLUMN IF NOT EXISTS genres             text[] NOT NULL DEFAULT '{}';
ALTER TABLE user_taste_profiles ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS user_taste_user_id_idx ON user_taste_profiles(user_id);

-- ── fan_profiles ─────────────────────────────────────────────
-- NOTE: fan_profiles already exists with columns:
--   user_id, xp, ccd_points, tier, total_interactions, etc.
-- The proxy reads/writes using user_id (not clerk_user_id).
CREATE TABLE IF NOT EXISTS fan_profiles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            text UNIQUE NOT NULL,
  xp                 integer NOT NULL DEFAULT 0,
  ccd_points         integer NOT NULL DEFAULT 0,
  tier               text NOT NULL DEFAULT 'newcomer',
  total_interactions integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fan_profiles ADD COLUMN IF NOT EXISTS user_id            text;
ALTER TABLE fan_profiles ADD COLUMN IF NOT EXISTS xp                 integer NOT NULL DEFAULT 0;
ALTER TABLE fan_profiles ADD COLUMN IF NOT EXISTS ccd_points         integer NOT NULL DEFAULT 0;
ALTER TABLE fan_profiles ADD COLUMN IF NOT EXISTS tier               text NOT NULL DEFAULT 'newcomer';
ALTER TABLE fan_profiles ADD COLUMN IF NOT EXISTS total_interactions integer NOT NULL DEFAULT 0;
ALTER TABLE fan_profiles ADD COLUMN IF NOT EXISTS updated_at         timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS fan_profiles_user_id_idx ON fan_profiles(user_id);

-- ── event_artist_lineups ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_artist_lineups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid REFERENCES curated_events(id) ON DELETE CASCADE,
  artist_slug text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'performer',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, artist_slug)
);
ALTER TABLE event_artist_lineups ADD COLUMN IF NOT EXISTS artist_slug text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS event_lineups_artist_idx ON event_artist_lineups(artist_slug);
CREATE INDEX IF NOT EXISTS event_lineups_event_idx  ON event_artist_lineups(event_id);

-- ── Extend artist_dates ──────────────────────────────────────
ALTER TABLE artist_dates ADD COLUMN IF NOT EXISTS booking_id            uuid;
ALTER TABLE artist_dates ADD COLUMN IF NOT EXISTS package_id            uuid;
ALTER TABLE artist_dates ADD COLUMN IF NOT EXISTS availability_block_id uuid;
ALTER TABLE artist_dates ADD COLUMN IF NOT EXISTS fee_agreed_inr        integer;
ALTER TABLE artist_dates ADD COLUMN IF NOT EXISTS promoter_name         text;
ALTER TABLE artist_dates ADD COLUMN IF NOT EXISTS promoter_email        text;
ALTER TABLE artist_dates ADD COLUMN IF NOT EXISTS set_duration_min      integer;
ALTER TABLE artist_dates ADD COLUMN IF NOT EXISTS internal_notes        text;
ALTER TABLE artist_dates ADD COLUMN IF NOT EXISTS is_public             boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS artist_dates_artist_date_idx ON artist_dates(artist_id, event_date ASC);
CREATE INDEX IF NOT EXISTS artist_dates_public_idx      ON artist_dates(event_date ASC) WHERE is_public = true;


-- ─────────────────────────────────────────────────────────────
-- STEP 2/5 · Artists (40 rows)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE artists ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'musician';

INSERT INTO artists (slug,name,based_city,from_city,bio,why,genres,festivals,instagram,website,booking_email,labels,members,fee_min_inr,fee_max_inr,fee_currency,open_to_bookings,status,source,featured,kind,created_at,updated_at) VALUES
('indo-warehouse','INDO WAREHOUSE','New York, USA','India','First South Asian electronic collective at Coachella 2025 (both weekends). Coined "Indo House" — a globally recognized genre blending Indian classical/folk with house/techno. Also played Hï Ibiza and F1 Singapore.','First South Asian electronic collective at Coachella. Coined "Indo House". The biggest Indian electronic export right now.',ARRAY['Indo House','Melodic Techno'],ARRAY['Coachella 2025 (both weekends)','Hï Ibiza','F1 Singapore'],'indowarehouse','https://indowarehouse.com',NULL,NULL,'Kahani + Kunal Merchant',NULL,NULL,'USD',true,'approved','manual',true,'musician',NOW(),NOW()),
('nikki-nair','NIKKI NAIR','USA','India','Most booked Indian-origin producer in global underground. Boiler Room Hyderabad (May 2022). Pure electronic — no Bollywood, no EDM.','Most booked Indian-origin producer in global underground.',ARRAY['Breakbeat','Techno','Electro'],ARRAY['Multiple global bookings'],'nikkinair',NULL,NULL,NULL,NULL,500000,1500000,'USD',true,'approved','manual',true,'musician',NOW(),NOW()),
('kohra','KOHRA','New Delhi','India','Most Boiler Room appearances by an Indian solo electronic artist (Delhi NCR Jun 2024, Bengaluru Aug 2024). Founder of Qilla Records. Magnetic Fields, DGTL, Echoes of Earth regular.','Most Boiler Room appearances by an Indian solo electronic artist. Defines India''s credible techno output. Qilla Records founder.',ARRAY['Techno','House','Minimal'],ARRAY['Magnetic Fields','DGTL','Echoes of Earth'],'kohra','https://artistivity.com','booking@artistivity.com','Qilla Records','Madhav Shorey',80000,250000,'INR',true,'approved','manual',true,'musician',NOW(),NOW()),
('sheral','SHERAL','India','India','Rising female DJ in Indian electronic scene. Boiler Room Delhi NCR (June 2024). DGTL circuit regular.','Rising female DJ in Indian electronic scene.',ARRAY['Electronic','Techno'],ARRAY['Magnetic Fields','DGTL circuit'],'sheral',NULL,NULL,NULL,NULL,30000,80000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('prismer','PRISMER','India','India','Emerging Indian electronic producer. Boiler Room Delhi NCR (June 2024). Magnetic Fields regular.','Emerging Indian electronic producer on world stage.',ARRAY['Electronic'],ARRAY['Magnetic Fields'],'prismer',NULL,NULL,NULL,NULL,25000,70000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('kandy-kuri','KANDY KURI','Bengaluru','India','South Indian electronic representative on Boiler Room. Boiler Room Bengaluru (Aug 2024). Magnetic Fields regular.','South Indian electronic representative on Boiler Room. Bengaluru scene pillar.',ARRAY['Electronic'],ARRAY['Magnetic Fields'],'kandykuri',NULL,NULL,NULL,NULL,20000,50000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('dj-sartek','DJ SARTEK','New Delhi','New Delhi','First Indian on Hardwell''s Revealed Recordings. All releases on Beatport Top 100. Meta Awards winner 2024.','First Indian on Hardwell''s Revealed Recordings. Beatport Top 100. Meta Awards winner 2024.',ARRAY['Folk House','Desi Techno','Progressive'],ARRAY['DGTL','Multiple international'],'sartek','https://sartekmusic.in',NULL,'Revealed Recordings (Hardwell)','Sarthak Sardana',100000,300000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('anish-sood','ANISH SOOD','Goa','India','Only Indian on Anjunadeep (UK). Credible progressive sound. 15+ years experience.','Only Indian on Anjunadeep. 15+ years experience.',ARRAY['Progressive Trance','Deep House','Anjunadeep'],ARRAY['DGTL','Echoes of Earth','International'],'anyasa.music','https://anyasa.com','hello@anyasa.com','Anjunadeep (UK)','ANYASA',100000,300000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('lost-stories','LOST STORIES','Mumbai','Mumbai','Pioneers of Indian folk-electronic fusion. Hits "Mahi", "Bombay Dreams". International festival regulars — DGTL, Lollapalooza. 500K+ followers.','Pioneers of Indian folk-electronic fusion. International festival regulars. 500K+ followers.',ARRAY['Indian Folk + Electronic','Progressive House'],ARRAY['DGTL','Lollapalooza','Multiple international'],'loststoriesmusic',NULL,NULL,NULL,'Prayag Mehta & Rishab Joshi',150000,400000,'INR',true,'approved','manual',true,'musician',NOW(),NOW()),
('dualist-inquiry','DUALIST INQUIRY','Goa','Goa','Goa''s indie electronic pioneer. Founder of Field Works label. Echoes of Earth, Lollapalooza 2024, Ziro 2025.','Goa''s indie electronic pioneer. Founder of Field Works.',ARRAY['Indie Electronic','Experimental'],ARRAY['Echoes of Earth 2024','Lollapalooza 2024','Ziro 2025'],'dualistinquiry','https://intersect9.in',NULL,'Field Works','Sahej Bakshi',40000,100000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('monophonik','MONOPHONIK','India','India','Analog synth enthusiast. Magnetic Fields, DGTL, Lollapalooza regular. Qilla Records artist.','Analog synth enthusiast. Regular on India''s most credible electronic festival lineup.',ARRAY['Analog Synth','Electronic'],ARRAY['Magnetic Fields','DGTL','Lollapalooza'],'monophonik','https://thewildcity.com','info@thewildcity.com',NULL,'Shatrunjai Diwan',30000,80000,'INR',false,'approved','manual',false,'musician',NOW(),NOW()),
('sandunes','SANDUNES','Mumbai','India','Apple Music Up Next Artist 2022. Red Bull Music Academy BaseCamp Dubai. OneBeat Residency USA. NH7 Weekender regular.','Apple Music Up Next Artist 2022. Red Bull Music Academy BaseCamp Dubai.',ARRAY['Electronic','Experimental','Live'],ARRAY['NH7 Weekender','Multiple festivals'],'sandunesmusic',NULL,'sandunesmusic@gmail.com',NULL,'Sanaya Ardeshir',50000,120000,'INR',true,'approved','manual',true,'musician',NOW(),NOW()),
('karan-kanchan','KARAN KANCHAN','Mumbai','India','Beatmaker/producer bridging hip-hop and electronic. Lollapalooza 2024 curated set.','Beatmaker/producer bridging hip-hop and electronic. Lollapalooza curated set.',ARRAY['Hip-Hop','Electronic','Beats'],ARRAY['Lollapalooza 2024'],'karankanchan','https://karankanchan.com','contact@karankanchan.com',NULL,NULL,100000,500000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('sid-vashi','SID VASHI','Mumbai','Michigan, USA','Trained jazz saxophonist + electronic producer. Signed to Only Much Louder (OML). Lollapalooza 2025.','Trained jazz saxophonist + electronic producer. OML signed. Lollapalooza 2025.',ARRAY['Jazz','Electronic','Experimental'],ARRAY['Lollapalooza 2025'],'sidvashi',NULL,NULL,NULL,NULL,40000,100000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('sickflip','SICKFLIP','India','India','Bass music producer. Managed by Across Artists. NH7 Weekender, DGTL circuit regular.','Bass music producer. Across Artists management.',ARRAY['Bass','Electronic'],ARRAY['NH7 Weekender','DGTL circuit'],'sickflip','https://acrossartists.com','ayush@acrossartists.com',NULL,NULL,40000,100000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('dotdat','DOTDAT','Goa','Pune','Standout figure in Indian techno scene. Goa-based. Groove-infused sci-fi techno. Echoes of Earth 2025, DGTL.','Standout figure in Indian techno scene. Groove-infused sci-fi techno.',ARRAY['Techno'],ARRAY['Echoes of Earth 2025','DGTL'],'dotdatofficial','https://oddx.in','rajat@oddx.in',NULL,NULL,30000,80000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('bullzeye','BULLZEYE','India','India','One of the most booked DJs in India. Only Indian DJ to play Ellum Audio showcase in Goa. Played alongside Carl Cox, Dixon, Nina Kraviz. Paradiso Amsterdam, Feel Festival Berlin.','One of the most booked DJs in India. Only Indian DJ at Ellum Audio showcase Goa.',ARRAY['Techno','House'],ARRAY['DGTL 2025','Sunburn','Awakenings India'],'bullzeye',NULL,NULL,NULL,NULL,60000,150000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('hamza-rahimtula','HAMZA RAHIMTULA','Rajasthan','India','Rajasthan folk meets electronic. Echoes of Earth (multiple years). Magnetic Fields regular.','Rajasthan folk meets electronic. Regular at Echoes of Earth.',ARRAY['Folk','Electronic','House'],ARRAY['Echoes of Earth','Magnetic Fields'],'hamzarahimtula',NULL,NULL,NULL,NULL,30000,80000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('jatayu','JATAYU','Chennai','Chennai','Chennai band. Carnatic foundations with funk, rock, jazz. Lollapalooza 2024 + Echoes of Earth 2025.','Chennai band. Carnatic foundations with funk, rock, jazz. Lollapalooza 2024.',ARRAY['Carnatic Jazz','Funk','Electronic'],ARRAY['Echoes of Earth 2025','Lollapalooza 2024'],'jatayu',NULL,NULL,NULL,NULL,30000,80000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('the-f16s','THE F16s','Chennai','Chennai','Chennai rock act with electronic elements. Echoes of Earth 2025. NH7 Weekender regular.','Chennai rock act. Echoes of Earth 2025. NH7 Weekender regular.',ARRAY['Rock','Electronic'],ARRAY['Echoes of Earth 2025','NH7 Weekender'],'thef16s',NULL,NULL,NULL,NULL,40000,100000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('madame-gandhi','MADAME GANDHI','USA','India/USA','Indian-origin producer/drummer Kiran Gandhi. Rhythm-driven sets tied to empowerment and activism. Echoes of Earth 2025.','Indian-origin producer/drummer. Rhythm-driven activist sets. Echoes of Earth 2025.',ARRAY['Electronic','Percussion'],ARRAY['Echoes of Earth 2025'],'madamegandhi',NULL,NULL,NULL,'Kiran Gandhi',NULL,NULL,'USD',true,'approved','manual',false,'musician',NOW(),NOW()),
('sunju-hargun','SUNJU HARGUN','India','India','Magnetic Fields (multiple years) regular. Part of India''s forward-thinking electronic scene.','Magnetic Fields regular. Part of India''s forward-thinking scene.',ARRAY['Electronic'],ARRAY['Magnetic Fields'],'sunjuhargun',NULL,NULL,NULL,NULL,25000,70000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('kaleekarma','KALEEKARMA','India','India','Magnetic Fields (multiple years) regular.','Magnetic Fields regular.',ARRAY['Electronic','House'],ARRAY['Magnetic Fields'],'kaleekarma',NULL,NULL,NULL,NULL,25000,70000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('komorebi','KOMOREBI','India','India','Singer-producer bridging electronic and indie. Lollapalooza 2024. NH7 Weekender performer.','Singer-producer bridging electronic and indie. Lollapalooza 2024 performer.',ARRAY['Electronic','Indie'],ARRAY['Lollapalooza 2024','NH7 Weekender'],'komorebimind',NULL,NULL,NULL,'Tarana Marwah',30000,80000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('prabh-deep','PRABH DEEP','New Delhi','India','Indian rapper with electronic production. Azadi Records. Lollapalooza 2024. NH7 Weekender.','Indian rapper with electronic production. Azadi Records. Lollapalooza 2024.',ARRAY['Hip-Hop','Electronic'],ARRAY['Lollapalooza 2024','NH7 Weekender'],'azadirecords.com','https://azadirecords.com','prabhdeepmerch@azadirecords.com','Azadi Records',NULL,50000,150000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('dreamstates','DREAMSTATES','India','India','Psychedelic electronic producer. DGTL India 2025, Echoes of Earth.','Psychedelic electronic sound. DGTL India 2025.',ARRAY['Electronic','Psychedelic'],ARRAY['DGTL 2025','Echoes of Earth'],'dreamstates',NULL,NULL,NULL,NULL,20000,50000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('mogasu','MOGASU','India','India','Part of DGTL India 2025 and Echoes of Earth 2024 lineup.','Part of DGTL India 2025 and Echoes of Earth lineup.',ARRAY['Electronic'],ARRAY['DGTL 2025','Echoes of Earth 2024'],'mogasu',NULL,NULL,NULL,NULL,20000,50000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('midnight-traffic','MIDNIGHT TRAFFIC','Hyderabad','India','Active Hyderabad electronic duo. Boiler Room Hyderabad (May 2022). Regional scene builders.','Active Hyderabad electronic duo, regional scene builders.',ARRAY['Electronic','House'],ARRAY['Krunk events','Hyderabad scene'],'midnighttraffic',NULL,NULL,NULL,NULL,20000,60000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('murthovic','MURTHOVIC','India','India','Part of India''s original Boiler Room class. Boiler Room Hyderabad (May 2022). Magnetic Fields regular.','Part of India''s original Boiler Room class. Magnetic Fields regular.',ARRAY['Electronic'],ARRAY['Magnetic Fields'],'murthovic',NULL,NULL,NULL,NULL,20000,50000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('suchi','SUCHI','India','India','Early Indian electronic artist to get Boiler Room platform. Boiler Room Hyderabad (May 2022).','Early Indian electronic artist to get Boiler Room platform.',ARRAY['Electronic'],ARRAY['Krunk events'],NULL,NULL,NULL,NULL,NULL,20000,50000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('chrms','CHRMS','India','India','Future bass/electro producer. Lollapalooza 2024. NH7 Weekender. Krunk affiliated.','Future bass/electro producer. Lollapalooza 2024.',ARRAY['Future Bass','Electro'],ARRAY['Lollapalooza 2024','NH7 Weekender'],'chrms','https://creatingconversion.com','sohail@krunklive.creatingconversion.com',NULL,NULL,25000,60000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('long-distances','LONG DISTANCES','Mumbai','Mumbai','Mumbai post-punk/shoegaze band with electronic elements. Lollapalooza 2024. Echoes of Earth 2025.','Mumbai post-punk/shoegaze band. Lollapalooza 2024.',ARRAY['Post-Punk','Shoegaze','Electronic'],ARRAY['Echoes of Earth 2025','Lollapalooza 2024'],'longdistances',NULL,NULL,NULL,NULL,25000,60000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('dj-ravetek','DJ RAVETEK','Mumbai','Mumbai','First Indian signed to Tiesto''s Musical Freedom label.','First Indian signed to Tiesto''s Musical Freedom.',ARRAY['EDM','Big Room'],ARRAY['Multiple international'],'theartisteco',NULL,NULL,'Musical Freedom (Tiesto''s label)',NULL,40000,100000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('project-91','PROJECT 91','Pune','Pune','India''s most credible electronic duo on international labels — Revealed Recordings, Generation Smash. Performed in 8 countries.','India''s most credible electronic duo on international labels.',ARRAY['EDM','House'],ARRAY['DGTL','Multiple international'],'project91music',NULL,NULL,'Revealed Recordings / Generation Smash','Anil & Sunil Sindagi',80000,200000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('dj-ravator','DJ RAVATOR','New Delhi','New Delhi','Delhi underground electronic scene. DGTL circuit.','Delhi underground electronic scene.',ARRAY['Independent','EDM','Bass'],ARRAY['DGTL circuit'],'saprasap','https://sapwroks.co',NULL,NULL,NULL,30000,80000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('startdawg','STARTDAWG','Bengaluru','Bengaluru','Bangalore staple. House selector with a soft spot for disco edits and the long build. CCD resident DJ.','Bangalore staple. House selector. CCD resident.',ARRAY['House','Disco','Garage'],ARRAY['CCD at Bar Wild','CCDXSOCIAL series'],'startdawg',NULL,NULL,NULL,NULL,15000,40000,'INR',true,'approved','manual',true,'musician',NOW(),NOW()),
('merman','MERMAN','Bengaluru','Bengaluru','Garage, jungle, and the kind of low-end that fixes posture problems. CCD resident DJ.','Garage, jungle, and the kind of low-end that fixes posture problems. CCD resident.',ARRAY['Garage','Jungle','D&B'],ARRAY['CCD at Bar Wild','CCDXSOCIAL series'],'merman',NULL,NULL,NULL,NULL,15000,40000,'INR',true,'approved','manual',true,'musician',NOW(),NOW()),
('girls-night-out','GIRLS NIGHT OUT','India','India','Collective pushing India''s electronic sound forward. Boiler Room Delhi NCR (June 2024).','Collective pushing India''s electronic sound forward.',ARRAY['Electronic'],ARRAY['Magnetic Fields'],NULL,NULL,NULL,NULL,NULL,30000,80000,'INR',true,'approved','manual',false,'musician',NOW(),NOW()),
('ak-sports','AK SPORTS','India','India','New generation of Indian electronic acts breaking into global platforms. Boiler Room Delhi NCR (June 2024).','New generation of Indian electronic acts breaking into global platforms.',ARRAY['Electronic'],ARRAY['Magnetic Fields'],'aksports',NULL,NULL,NULL,NULL,25000,70000,'INR',true,'approved','manual',false,'musician',NOW(),NOW())
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, based_city=EXCLUDED.based_city, from_city=EXCLUDED.from_city,
  bio=EXCLUDED.bio, why=EXCLUDED.why, genres=EXCLUDED.genres, festivals=EXCLUDED.festivals,
  instagram=EXCLUDED.instagram, website=EXCLUDED.website, booking_email=EXCLUDED.booking_email,
  labels=EXCLUDED.labels, members=EXCLUDED.members,
  fee_min_inr=EXCLUDED.fee_min_inr, fee_max_inr=EXCLUDED.fee_max_inr,
  open_to_bookings=EXCLUDED.open_to_bookings, status=EXCLUDED.status,
  featured=EXCLUDED.featured, kind=EXCLUDED.kind, updated_at=NOW();


-- ─────────────────────────────────────────────────────────────
-- STEP 3/5 · Appearances & connections
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_appearances (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_slug text NOT NULL DEFAULT '',
  artist_id   uuid,
  event_name  text NOT NULL DEFAULT '',
  venue       text, city text, event_date date, year integer,
  role        text DEFAULT 'dj', is_b2b boolean DEFAULT false, b2b_with text,
  created_at  timestamptz NOT NULL DEFAULT NOW(), updated_at timestamptz NOT NULL DEFAULT NOW()
);
ALTER TABLE event_appearances ADD COLUMN IF NOT EXISTS artist_slug text NOT NULL DEFAULT '';
ALTER TABLE event_appearances ADD COLUMN IF NOT EXISTS is_b2b      boolean DEFAULT false;
ALTER TABLE event_appearances ADD COLUMN IF NOT EXISTS b2b_with    text;
CREATE INDEX IF NOT EXISTS idx_ea_slug ON event_appearances(artist_slug);

CREATE TABLE IF NOT EXISTS artist_connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_a_slug   text NOT NULL DEFAULT '', artist_b_slug text NOT NULL DEFAULT '',
  connection_type text NOT NULL DEFAULT 'b2b', strength integer NOT NULL DEFAULT 1,
  shared_events   text[] NOT NULL DEFAULT '{}', shared_venues text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT NOW(), updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (artist_a_slug, artist_b_slug)
);

INSERT INTO event_appearances (artist_slug,event_name,venue,city,event_date,year,role,is_b2b,b2b_with) VALUES
  ('startdawg','CCD at Bar Wild — Episode 1','Bar Wild','Bengaluru','2025-04-02',2025,'dj',true,'merman'),
  ('startdawg','CCDXSOCIAL 01','Indiranagar Social','Bengaluru','2026-06-29',2026,'dj',true,'merman'),
  ('startdawg','CCDXSOCIAL 02 — Style Edition','Social BLR','Bengaluru','2026-07-27',2026,'dj',true,'merman'),
  ('startdawg','CCDXSOCIAL 03 — Agility Edition','Social BLR','Bengaluru','2026-08-30',2026,'dj',true,'merman'),
  ('merman','CCD at Bar Wild — Episode 1','Bar Wild','Bengaluru','2025-04-02',2025,'dj',true,'startdawg'),
  ('merman','CCDXSOCIAL 01','Indiranagar Social','Bengaluru','2026-06-29',2026,'dj',true,'startdawg'),
  ('merman','CCDXSOCIAL 02 — Style Edition','Social BLR','Bengaluru','2026-07-27',2026,'dj',true,'startdawg'),
  ('merman','CCDXSOCIAL 03 — Agility Edition','Social BLR','Bengaluru','2026-08-30',2026,'dj',true,'startdawg'),
  ('kohra','Boiler Room Delhi NCR','Auro Kitchen & Bar','New Delhi','2024-06-15',2024,'dj',false,NULL),
  ('kohra','Boiler Room Bengaluru','The Humming Tree','Bengaluru','2024-08-10',2024,'dj',false,NULL),
  ('kohra','Magnetic Fields 2023','Alsisar Mahal','Rajasthan','2023-12-09',2023,'dj',false,NULL),
  ('kohra','Magnetic Fields 2022','Alsisar Mahal','Rajasthan','2022-12-10',2022,'dj',false,NULL),
  ('kohra','DGTL India 2024','MMRDA Grounds','Mumbai','2024-03-02',2024,'dj',false,NULL),
  ('kohra','Echoes of Earth Bengaluru 2024','NICE Grounds','Bengaluru','2024-11-09',2024,'dj',false,NULL),
  ('nikki-nair','Boiler Room Hyderabad','10D','Hyderabad','2022-05-14',2022,'dj',false,NULL),
  ('nikki-nair','Sustain Release 2024','Hunter Mountain','New York','2024-09-01',2024,'dj',false,NULL),
  ('sandunes','NH7 Weekender Pune 2023','Mahalaxmi Lawns','Pune','2023-11-26',2023,'live',false,NULL),
  ('sandunes','NH7 Weekender Pune 2022','Mahalaxmi Lawns','Pune','2022-11-27',2022,'live',false,NULL),
  ('sandunes','Red Bull Music Academy','Dubai','Dubai','2023-03-15',2023,'live',false,NULL),
  ('dotdat','Echoes of Earth Bengaluru 2025','NICE Grounds','Bengaluru','2025-11-08',2025,'dj',false,NULL),
  ('dotdat','DGTL India 2024','MMRDA Grounds','Mumbai','2024-03-02',2024,'dj',false,NULL),
  ('dotdat','Ellum Audio Showcase Goa','Hilltop','Goa','2023-12-28',2023,'dj',false,NULL),
  ('dualist-inquiry','Echoes of Earth Goa 2024','NICE Grounds','Goa','2024-02-04',2024,'live',false,NULL),
  ('dualist-inquiry','Echoes of Earth Bengaluru 2024','NICE Grounds','Bengaluru','2024-11-09',2024,'live',false,NULL),
  ('dualist-inquiry','Lollapalooza India 2024','Mahalaxmi Racecourse','Mumbai','2024-01-27',2024,'live',false,NULL),
  ('dualist-inquiry','Ziro Festival 2025','Ziro Valley','Arunachal Pradesh','2025-10-01',2025,'live',false,NULL),
  ('lost-stories','DGTL India 2024','MMRDA Grounds','Mumbai','2024-03-02',2024,'dj',false,NULL),
  ('lost-stories','Lollapalooza India 2024','Mahalaxmi Racecourse','Mumbai','2024-01-27',2024,'dj',false,NULL),
  ('bullzeye','Ellum Audio Showcase Goa','Hilltop','Goa','2022-12-29',2022,'dj',false,NULL),
  ('bullzeye','Awakenings India','NH7 Arena','Mumbai','2023-10-14',2023,'dj',false,NULL),
  ('bullzeye','Paradiso Amsterdam','Paradiso','Amsterdam','2023-07-07',2023,'dj',false,NULL),
  ('bullzeye','DGTL India 2025','MMRDA Grounds','Mumbai','2025-03-01',2025,'dj',false,NULL),
  ('dj-sartek','DGTL India 2024','MMRDA Grounds','Mumbai','2024-03-02',2024,'dj',false,NULL),
  ('dj-sartek','Sunburn Festival','Vagator Beach','Goa','2023-12-27',2023,'dj',false,NULL),
  ('kandy-kuri','Boiler Room Bengaluru','The Humming Tree','Bengaluru','2024-08-10',2024,'dj',false,NULL),
  ('kandy-kuri','Magnetic Fields 2024','Alsisar Mahal','Rajasthan','2024-12-07',2024,'dj',false,NULL)
ON CONFLICT DO NOTHING;

INSERT INTO artist_connections (artist_a_slug,artist_b_slug,connection_type,strength,shared_events,shared_venues) VALUES
  ('startdawg','merman','b2b',5,ARRAY['CCD at Bar Wild','CCDXSOCIAL 01','CCDXSOCIAL 02','CCDXSOCIAL 03'],ARRAY['Bar Wild','Indiranagar Social','Social BLR']),
  ('kohra','monophonik','crew',3,ARRAY['Magnetic Fields 2022','Magnetic Fields 2023'],ARRAY['Alsisar Mahal']),
  ('kohra','dotdat','crew',2,ARRAY['DGTL India 2024','Echoes of Earth'],ARRAY['MMRDA Grounds','NICE Grounds']),
  ('startdawg','kandy-kuri','crew',2,ARRAY['Bengaluru underground circuit'],ARRAY['Bar Wild','The Humming Tree']),
  ('dualist-inquiry','sandunes','crew',2,ARRAY['NH7 Weekender','Echoes of Earth'],ARRAY['Mahalaxmi Lawns','NICE Grounds']),
  ('lost-stories','dj-sartek','crew',2,ARRAY['DGTL India 2024'],ARRAY['MMRDA Grounds']),
  ('bullzeye','dotdat','crew',2,ARRAY['Ellum Audio Showcase Goa'],ARRAY['Hilltop'])
ON CONFLICT (artist_a_slug,artist_b_slug) DO UPDATE SET
  strength=EXCLUDED.strength, shared_events=EXCLUDED.shared_events,
  shared_venues=EXCLUDED.shared_venues, updated_at=NOW();

UPDATE artists SET featured=true, updated_at=NOW()
  WHERE slug IN ('startdawg','merman','kohra','nikki-nair','indo-warehouse',
                 'sandunes','lost-stories','dualist-inquiry','dotdat','bullzeye',
                 'kandy-kuri','monophonik','sunju-hargun');

UPDATE artists SET available_cities=ARRAY['Bengaluru','Mumbai','Delhi','Goa','Hyderabad','Pune','Chennai'], open_to_bookings=true, updated_at=NOW()
  WHERE slug IN ('startdawg','merman','kohra','dotdat','bullzeye','kandy-kuri');
UPDATE artists SET available_cities=ARRAY['Mumbai','Delhi','Bengaluru','Goa','Hyderabad'], open_to_bookings=true, updated_at=NOW()
  WHERE slug IN ('lost-stories','sandunes','karan-kanchan','sid-vashi','sickflip');
UPDATE artists SET available_cities=ARRAY['Delhi','Mumbai','Bengaluru'], open_to_bookings=true, updated_at=NOW()
  WHERE slug IN ('dj-sartek','prabh-deep','dj-ravator');
UPDATE artists SET available_cities=ARRAY['Goa','Mumbai','Bengaluru'], open_to_bookings=true, updated_at=NOW()
  WHERE slug IN ('dualist-inquiry','anish-sood','hamza-rahimtula');

INSERT INTO site_settings (id,home_content,updated_at)
VALUES ('main', jsonb_build_object('section_visibility', jsonb_build_object('show_featured_artists',true,'show_scene_map',true,'show_pick_your_sound',true)), NOW())
ON CONFLICT (id) DO UPDATE SET
  home_content = site_settings.home_content || jsonb_build_object('section_visibility', jsonb_build_object('show_featured_artists',true,'show_scene_map',true,'show_pick_your_sound',true)),
  updated_at = NOW();


-- ─────────────────────────────────────────────────────────────
-- STEP 4/5 · Events
-- ─────────────────────────────────────────────────────────────

ALTER TABLE events ADD COLUMN IF NOT EXISTS series         text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_label   text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type     text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS pet_friendly   boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_tagline text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_finale      boolean DEFAULT false;

DELETE FROM events WHERE slug IN ('ccdxsocial-debut','ccdxsocial-the-heat','ccdxsocial-loose-ends','ccdxsocial-the-gathering','ccdxsocial-zoomies','ccdxsocial-groom-room','ccdxsocial-grand-finale');

INSERT INTO events (slug,title,date,city,venue,blurb,lineup,status,poster_url,sort_order,series,series_label,event_type,pet_friendly,series_tagline,is_finale,created_at,updated_at) VALUES
  ('episode-1','CCD AT BAR WILD','2nd April 2025','Bengaluru','Bar Wild, Indiranagar','The first Cats Can Dance episode. House, disco, garage, and the kind of floor that makes you forget what time it is.','["Startdawg","Merman"]'::jsonb,'past',NULL,0,NULL,NULL,'standard',false,NULL,false,NOW(),NOW()),
  ('ccdxsocial-01','CCDXSOCIAL 01','Sun, 29 Jun 2026','Bengaluru','Indiranagar Social','The first chapter of CCD × SOCIAL. Portrait booth, lookalike contest, vendor market. Startdawg b2b Merman take the floor at 9.','["Startdawg","Merman","TBA"]'::jsonb,'upcoming',NULL,10,'ccdxsocial','CCD × SOCIAL','ccdxsocial',true,'BROAD · WELCOMING · FIRST IMPRESSION',false,NOW(),NOW()),
  ('ccdxsocial-02','CCDXSOCIAL 02','Sun, 27 Jul 2026','Bengaluru','Social BLR (TBC)','The style chapter. Live grooming demo, best-dressed contest for pets and parents.','["Startdawg","Merman","TBA"]'::jsonb,'upcoming',NULL,20,'ccdxsocial','CCD × SOCIAL','ccdxsocial',true,'STYLE · FASHION · MIDSUMMER ENERGY',false,NOW(),NOW()),
  ('ccdxsocial-03','CCDXSOCIAL 03','Sun, 30 Aug 2026','Bengaluru','Social BLR (TBC)','Two agility courses, timed speed runs. MEGA tickets drop exclusively at this show.','["Startdawg","Merman","TBA"]'::jsonb,'upcoming',NULL,30,'ccdxsocial','CCD × SOCIAL','ccdxsocial',true,'AGILITY · FINALE PREVIEW · ONE MORE',false,NOW(),NOW()),
  ('ccdxsocial-mega','MEGA','October 2026','Bengaluru','TBA — Large Format','Everything the series has been building to. 2,000+ people. Pet runway. Agility finals.','["TBA"]'::jsonb,'upcoming',NULL,40,'ccdxsocial','CCD × SOCIAL','ccdxsocial',true,'GRAND FINALE · SEASON CLOSER',true,NOW(),NOW())
ON CONFLICT (slug) DO UPDATE SET
  title=EXCLUDED.title, date=EXCLUDED.date, city=EXCLUDED.city, venue=EXCLUDED.venue,
  blurb=EXCLUDED.blurb, lineup=EXCLUDED.lineup, status=EXCLUDED.status, sort_order=EXCLUDED.sort_order,
  series=EXCLUDED.series, series_label=EXCLUDED.series_label, event_type=EXCLUDED.event_type,
  pet_friendly=EXCLUDED.pet_friendly, series_tagline=EXCLUDED.series_tagline, is_finale=EXCLUDED.is_finale,
  updated_at=NOW();

ALTER TABLE curated_events ADD COLUMN IF NOT EXISTS submission_status text NOT NULL DEFAULT 'published';
ALTER TABLE curated_events ADD COLUMN IF NOT EXISTS submitted_by      text;
ALTER TABLE curated_events ADD COLUMN IF NOT EXISTS promoter_slug     text;

INSERT INTO curated_events (title,url,source,city,venue,event_date,event_time,blurb,genre,image_url,is_featured,submission_status,created_at,updated_at) VALUES
  ('CCDXSOCIAL 01 — Cats Can Dance × Social','https://catscandance.com/events/ccdxsocial-01','editorial','Bangalore','Indiranagar Social','2026-06-29','20:00','India''s first curated pet lifestyle festival meets underground dance music. Free, RSVP only.','["House","Disco","Garage"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('CCDXSOCIAL 02 — Style Edition','https://catscandance.com/events/ccdxsocial-02','editorial','Bangalore','Social BLR','2026-07-27','20:00','The style chapter. Live grooming demo. Startdawg b2b Merman.','["House","Disco"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('CCDXSOCIAL 03 — Agility Edition','https://catscandance.com/events/ccdxsocial-03','editorial','Bangalore','Social BLR','2026-08-30','20:00','Two agility courses, timed speed runs. MEGA tickets drop at this show.','["House","Jungle","Garage"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('MEGA — CCD Season Finale','https://catscandance.com/events/ccdxsocial-mega','editorial','Bangalore','TBA — Large Format','2026-10-01','TBA','The season finale. 2,000+ people, full outdoor stage, pet runway, agility finals.','["House","Disco","Jungle","Garage"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('Drum and Bass India × SOCIAL','https://in.district.com/events/dnb-india-social-bangalore','manual','Bangalore','Social, Indiranagar','2026-06-21','21:00','DnBIndia monthly. Resident selectors, pure D&B from open to close.','["Drum & Bass","Jungle","Liquid DnB"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('Subculture BLR — Techno Night','https://skillboxes.com/events/subculture-blr-techno','skillboxes','Bangalore','Plan B, Indiranagar','2026-06-20','22:00','Subculture BLR monthly. No frills, just techno.','["Techno","Minimal"]'::jsonb,NULL,false,'published',NOW(),NOW()),
  ('Bar Wild Friday Night — House & Disco','https://skillboxes.com/events/bar-wild-house-disco','skillboxes','Bangalore','Bar Wild, Indiranagar','2026-06-27','21:00','Bar Wild''s regular Friday house and disco session.','["House","Disco","UK Garage"]'::jsonb,NULL,false,'published',NOW(),NOW()),
  ('The Humming Tree — Indie Electronic Night','https://skillboxes.com/events/the-humming-tree-indie-electronic','skillboxes','Bangalore','The Humming Tree, Indiranagar','2026-07-11','21:00','Bengaluru''s most eclectic room. Live acts + DJs.','["Indie Electronic","Experimental","Electronic"]'::jsonb,NULL,false,'published',NOW(),NOW()),
  ('Boiler Room India 2026 — Bengaluru Edition','https://boilerroom.tv/recording/india-2026-bangalore','editorial','Bangalore','TBA','2026-08-09','20:00','Boiler Room returns to Bengaluru. Lineup to be announced.','["House","Techno","Jungle","Garage"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('Echoes of Earth — Artist Announcement Night','https://insider.in/events/echoes-of-earth-artist-announcement-2026','insider','Bangalore','NICE Grounds','2026-07-15','20:00','Echoes of Earth officially announces the 2026 lineup.','["Electronic","Ambient","World"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('Qilla Records Showcase — Delhi Underground','https://insider.in/events/qilla-records-showcase-delhi','insider','Delhi','Auro Kitchen & Bar','2026-07-05','22:00','Kohra and the Qilla Records collective take over Auro.','["Techno","Industrial Techno","Minimal"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('PCO After-Dark — Minimal Techno Night','https://insider.in/events/pco-minimal-techno-delhi','insider','Delhi','PCO, Connaught Place','2026-07-10','23:00','PCO''s monthly minimal techno session.','["Minimal","Techno"]'::jsonb,NULL,false,'published',NOW(),NOW()),
  ('Misfits Delhi — Electronica Saturday','https://skillboxes.com/events/misfits-electronica-saturday','skillboxes','Delhi','Misfits, Hauz Khas','2026-07-19','22:00','Misfits Saturday series. Deep electronic, ambient, experimental.','["Electronic","Experimental","Ambient"]'::jsonb,NULL,false,'published',NOW(),NOW()),
  ('Magnetic Fields Pre-Party — Mumbai','https://insider.in/events/magnetic-fields-pre-party-mumbai','insider','Mumbai','antiSOCIAL, Bandra','2026-07-12','22:00','Official pre-party for Magnetic Fields 2026.','["House","Techno","Electronic"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('Levitate x Trilogy — Mumbai Night','https://in.district.com/events/levitate-trilogy-mumbai','district','Mumbai','Trilogy, Juhu','2026-07-18','23:00','Levitate agency presents a night at Trilogy.','["Deep House","Afro House","House"]'::jsonb,NULL,false,'published',NOW(),NOW()),
  ('antiSOCIAL Mumbai — House Takeover','https://in.district.com/events/antisocial-house-takeover-mumbai','district','Mumbai','antiSOCIAL, Bandra','2026-07-25','22:00','antiSOCIAL''s weekly house night. No commercial EDM.','["House","Deep House","Tech House"]'::jsonb,NULL,false,'published',NOW(),NOW()),
  ('Hilltop Sessions — Goa Jungle Night','https://highape.com/events/hilltop-sessions-jungle-goa','highape','Goa','Hilltop, Vagator','2026-07-26','22:00','Hilltop jungle and D&B series. Under the stars, on the cliff edge.','["Jungle","Drum & Bass","Liquid DnB"]'::jsonb,NULL,true,'published',NOW(),NOW()),
  ('Curlies Beach Party — Goa Psytrance','https://highape.com/events/curlies-beach-psytrance-goa','highape','Goa','Curlies Beach Shack, Anjuna','2026-07-06','22:00','Full-moon Goa Trance session.','["Goa Trance","Psytrance","Forest"]'::jsonb,NULL,false,'published',NOW(),NOW()),
  ('Krunk presents — Hyderabad Underground','https://highape.com/events/krunk-hyderabad-underground','highape','Hyderabad','10D Club','2026-07-04','22:00','Krunk agency returns to 10D with stacked Indian electronic talent.','["Techno","Breakbeat","Electro"]'::jsonb,NULL,false,'published',NOW(),NOW()),
  ('High Spirits Pune — Electronic Thursdays','https://insider.in/events/high-spirits-electronic-thursdays','insider','Pune','High Spirits, Koregaon Park','2026-07-03','21:00','High Spirits weekly electronic night. Pune''s biggest dance music venue.','["House","Live Electronics","Electronic"]'::jsonb,NULL,false,'published',NOW(),NOW())
ON CONFLICT (url) DO UPDATE SET
  title=EXCLUDED.title, source=EXCLUDED.source, city=EXCLUDED.city, venue=EXCLUDED.venue,
  event_date=EXCLUDED.event_date, event_time=EXCLUDED.event_time, blurb=EXCLUDED.blurb,
  genre=EXCLUDED.genre, is_featured=EXCLUDED.is_featured,
  submission_status=EXCLUDED.submission_status, updated_at=NOW();


-- ─────────────────────────────────────────────────────────────
-- STEP 5/5 · Promoters
-- ─────────────────────────────────────────────────────────────

INSERT INTO promoters (slug,name,city,cities,genres,blurb,instagram,website,booking_email,trusted,status,created_at,updated_at) VALUES
  ('krunk','Krunk','Mumbai',ARRAY['Mumbai','Bengaluru','Delhi','Goa'],ARRAY['Techno','House','Bass Music','D&B'],'Founded in 2009, Krunk is one of India''s oldest and most respected booking agencies. Architects of Bass Camp Festival and Echoes of Earth. Over 2,000 events and counting.','krunklive','https://krunklive.com','bookings@krunklive.com',true,'active',NOW(),NOW()),
  ('drum-and-bass-india','Drum and Bass India','Bengaluru',ARRAY['Bengaluru','Mumbai','Hyderabad','Goa'],ARRAY['Drum & Bass','Jungle','Liquid DnB'],'India''s longest-running D&B and Jungle collective. Running DnBIndia × SOCIAL nights and regular underground sessions across the country.','dnbindia','https://ra.co/promoters/99325',NULL,true,'active',NOW(),NOW()),
  ('qilla-records','Qilla Records','Delhi',ARRAY['Delhi','Mumbai','Bengaluru'],ARRAY['Techno','Minimal','Industrial Techno','Experimental'],'Founded by Madhav Shorey (Kohra), Qilla is the label at the heart of India''s techno scene. Internationally connected — Tresor, Berghain, Movement.','qillarecords','https://qillarecords.com',NULL,true,'active',NOW(),NOW()),
  ('levitate','Levitate','Mumbai',ARRAY['Mumbai','Bengaluru','Delhi'],ARRAY['Techno','House','Electronic'],'Mumbai and Bangalore-based agency focused on the electronic music space.','levitate_india','https://ra.co/promoters/86167',NULL,true,'active',NOW(),NOW()),
  ('subculture-blr','Subculture BLR','Bengaluru',ARRAY['Bengaluru'],ARRAY['Techno','House','Electronic'],'Bengaluru-based underground electronic music collective.','subcultureblr',NULL,NULL,true,'active',NOW(),NOW())
ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- DONE — verify row counts
-- ─────────────────────────────────────────────────────────────

SELECT 'artists'            AS "table", COUNT(*) AS rows FROM artists
UNION ALL SELECT 'event_appearances',   COUNT(*) FROM event_appearances
UNION ALL SELECT 'artist_connections',  COUNT(*) FROM artist_connections
UNION ALL SELECT 'curated_events',      COUNT(*) FROM curated_events
UNION ALL SELECT 'events',              COUNT(*) FROM events
UNION ALL SELECT 'promoters',           COUNT(*) FROM promoters
ORDER BY 1;



-- ─────────────────────────────────────────────────────────────
-- STEP 6/6 · Normalise artist_connections to slug-based schema
-- (Run this AFTER existing data is present)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS artist_a_slug   text NOT NULL DEFAULT '';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS artist_b_slug   text NOT NULL DEFAULT '';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS connection_type text NOT NULL DEFAULT 'b2b';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS strength        integer NOT NULL DEFAULT 5;
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS shared_events   text[] NOT NULL DEFAULT '{}';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS shared_venues   text[] NOT NULL DEFAULT '{}';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS notes           text;
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

-- Backfill slugs — uses DO blocks to safely handle whichever column names your table has
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artist_connections' AND column_name='artist_a_id') THEN
    UPDATE artist_connections ac SET artist_a_slug = a.slug FROM artists a
    WHERE ac.artist_a_slug = '' AND ac.artist_a_id IS NOT NULL AND a.id = ac.artist_a_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artist_connections' AND column_name='artist_id') THEN
    UPDATE artist_connections ac SET artist_a_slug = a.slug FROM artists a
    WHERE ac.artist_a_slug = '' AND ac.artist_id IS NOT NULL AND a.id = ac.artist_id;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artist_connections' AND column_name='artist_b_id') THEN
    UPDATE artist_connections ac SET artist_b_slug = a.slug FROM artists a
    WHERE ac.artist_b_slug = '' AND ac.artist_b_id IS NOT NULL AND a.id = ac.artist_b_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='artist_connections' AND column_name='connected_artist_id') THEN
    UPDATE artist_connections ac SET artist_b_slug = a.slug FROM artists a
    WHERE ac.artist_b_slug = '' AND ac.connected_artist_id IS NOT NULL AND a.id = ac.connected_artist_id;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS artist_connections_a_slug_idx  ON artist_connections(artist_a_slug);
CREATE INDEX IF NOT EXISTS artist_connections_b_slug_idx  ON artist_connections(artist_b_slug);
CREATE INDEX IF NOT EXISTS artist_connections_strength_idx ON artist_connections(strength DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'artist_connections_slug_pair_key') THEN
    ALTER TABLE artist_connections ADD CONSTRAINT artist_connections_slug_pair_key UNIQUE (artist_a_slug, artist_b_slug);
  END IF;
END $$;
