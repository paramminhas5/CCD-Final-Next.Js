-- ============================================================
-- 003_seed_appearances.sql
-- Seeds artist gig history and relationships.
--
-- Run AFTER 002_seed_artists.sql.
-- Safe to re-run — uses ON CONFLICT / DO UPDATE throughout.
--
-- Contains:
--   §A  event_appearances   — gig history per artist
--   §B  artist_connections  — b2b / crew relationships
--   §C  featured flags      — marks spotlight artists (homepage)
--   §D  available_cities    — cities open for bookings
--   §E  site_settings       — turns on homepage sections
-- ============================================================

SET search_path = public;

-- ── Ensure required tables exist ────────────────────────────
CREATE TABLE IF NOT EXISTS event_appearances (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_slug text NOT NULL,
  artist_id   uuid,
  event_name  text NOT NULL,
  venue       text,
  city        text,
  event_date  date,
  year        integer,
  role        text DEFAULT 'dj',
  is_b2b      boolean DEFAULT false,
  b2b_with    text,
  created_at  timestamptz NOT NULL DEFAULT NOW(),
  updated_at  timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ea_slug ON event_appearances (artist_slug);

CREATE TABLE IF NOT EXISTS artist_connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_a_slug   text NOT NULL,
  artist_b_slug   text NOT NULL,
  connection_type text NOT NULL DEFAULT 'b2b',
  strength        integer NOT NULL DEFAULT 1,
  shared_events   text[] NOT NULL DEFAULT '{}',
  shared_venues   text[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (artist_a_slug, artist_b_slug)
);

-- ══════════════════════════════════════════════════════════════
-- §A  EVENT APPEARANCES
-- ══════════════════════════════════════════════════════════════

INSERT INTO event_appearances (artist_slug, event_name, venue, city, event_date, year, role, is_b2b, b2b_with)
VALUES
  -- ── Startdawg ───────────────────────────────────────────
  ('startdawg', 'CCD at Bar Wild — Episode 1',         'Bar Wild',           'Bengaluru', '2025-04-02', 2025, 'dj', true,  'merman'),
  ('startdawg', 'CCDXSOCIAL 01',                       'Indiranagar Social', 'Bengaluru', '2026-06-29', 2026, 'dj', true,  'merman'),
  ('startdawg', 'CCDXSOCIAL 02 — Style Edition',       'Social BLR',         'Bengaluru', '2026-07-27', 2026, 'dj', true,  'merman'),
  ('startdawg', 'CCDXSOCIAL 03 — Agility Edition',     'Social BLR',         'Bengaluru', '2026-08-30', 2026, 'dj', true,  'merman'),
  -- ── Merman ──────────────────────────────────────────────
  ('merman',    'CCD at Bar Wild — Episode 1',         'Bar Wild',           'Bengaluru', '2025-04-02', 2025, 'dj', true,  'startdawg'),
  ('merman',    'CCDXSOCIAL 01',                       'Indiranagar Social', 'Bengaluru', '2026-06-29', 2026, 'dj', true,  'startdawg'),
  ('merman',    'CCDXSOCIAL 02 — Style Edition',       'Social BLR',         'Bengaluru', '2026-07-27', 2026, 'dj', true,  'startdawg'),
  ('merman',    'CCDXSOCIAL 03 — Agility Edition',     'Social BLR',         'Bengaluru', '2026-08-30', 2026, 'dj', true,  'startdawg'),
  -- ── Kohra ───────────────────────────────────────────────
  ('kohra', 'Boiler Room Delhi NCR',          'Auro Kitchen & Bar', 'New Delhi',  '2024-06-15', 2024, 'dj', false, NULL),
  ('kohra', 'Boiler Room Bengaluru',          'The Humming Tree',   'Bengaluru',  '2024-08-10', 2024, 'dj', false, NULL),
  ('kohra', 'Magnetic Fields 2023',           'Alsisar Mahal',      'Rajasthan',  '2023-12-09', 2023, 'dj', false, NULL),
  ('kohra', 'Magnetic Fields 2022',           'Alsisar Mahal',      'Rajasthan',  '2022-12-10', 2022, 'dj', false, NULL),
  ('kohra', 'DGTL India 2024',                'MMRDA Grounds',      'Mumbai',     '2024-03-02', 2024, 'dj', false, NULL),
  ('kohra', 'Echoes of Earth Bengaluru 2024', 'NICE Grounds',       'Bengaluru',  '2024-11-09', 2024, 'dj', false, NULL),
  -- ── Nikki Nair ──────────────────────────────────────────
  ('nikki-nair', 'Boiler Room Hyderabad', '10D',           'Hyderabad', '2022-05-14', 2022, 'dj', false, NULL),
  ('nikki-nair', 'Sustain Release 2024',  'Hunter Mountain', 'New York', '2024-09-01', 2024, 'dj', false, NULL),
  -- ── Sandunes ────────────────────────────────────────────
  ('sandunes', 'NH7 Weekender Pune 2023',    'Mahalaxmi Lawns',     'Pune',      '2023-11-26', 2023, 'live', false, NULL),
  ('sandunes', 'NH7 Weekender Pune 2022',    'Mahalaxmi Lawns',     'Pune',      '2022-11-27', 2022, 'live', false, NULL),
  ('sandunes', 'Red Bull Music Academy',     'Dubai',                'Dubai',     '2023-03-15', 2023, 'live', false, NULL),
  -- ── Dotdat ──────────────────────────────────────────────
  ('dotdat', 'Echoes of Earth Bengaluru 2025', 'NICE Grounds',  'Bengaluru', '2025-11-08', 2025, 'dj', false, NULL),
  ('dotdat', 'DGTL India 2024',                'MMRDA Grounds', 'Mumbai',    '2024-03-02', 2024, 'dj', false, NULL),
  ('dotdat', 'Ellum Audio Showcase Goa',       'Hilltop',       'Goa',       '2023-12-28', 2023, 'dj', false, NULL),
  -- ── Dualist Inquiry ─────────────────────────────────────
  ('dualist-inquiry', 'Echoes of Earth Goa 2024',     'NICE Grounds',    'Goa',       '2024-02-04', 2024, 'live', false, NULL),
  ('dualist-inquiry', 'Echoes of Earth Bengaluru 2024','NICE Grounds',   'Bengaluru', '2024-11-09', 2024, 'live', false, NULL),
  ('dualist-inquiry', 'Lollapalooza India 2024',       'Mahalaxmi Racecourse','Mumbai','2024-01-27',2024,'live', false, NULL),
  ('dualist-inquiry', 'Ziro Festival 2025',            'Ziro Valley',     'Arunachal Pradesh','2025-10-01',2025,'live',false,NULL),
  -- ── Lost Stories ────────────────────────────────────────
  ('lost-stories', 'DGTL India 2024',          'MMRDA Grounds',       'Mumbai',    '2024-03-02', 2024, 'dj', false, NULL),
  ('lost-stories', 'Lollapalooza India 2024',  'Mahalaxmi Racecourse','Mumbai',    '2024-01-27', 2024, 'dj', false, NULL),
  -- ── Bullzeye ────────────────────────────────────────────
  ('bullzeye', 'Ellum Audio Showcase Goa',  'Hilltop',          'Goa',       '2022-12-29', 2022, 'dj', false, NULL),
  ('bullzeye', 'Awakenings India',           'NH7 Arena',        'Mumbai',    '2023-10-14', 2023, 'dj', false, NULL),
  ('bullzeye', 'Paradiso Amsterdam',         'Paradiso',         'Amsterdam', '2023-07-07', 2023, 'dj', false, NULL),
  ('bullzeye', 'Feel Festival Berlin',       'Feel Festival',    'Berlin',    '2023-08-18', 2023, 'dj', false, NULL),
  ('bullzeye', 'Ritter Butzke Berlin',       'Ritter Butzke',    'Berlin',    '2024-04-12', 2024, 'dj', false, NULL),
  ('bullzeye', 'DGTL India 2025',            'MMRDA Grounds',    'Mumbai',    '2025-03-01', 2025, 'dj', false, NULL),
  -- ── DJ Sartek ───────────────────────────────────────────
  ('dj-sartek', 'DGTL India 2024',   'MMRDA Grounds', 'Mumbai', '2024-03-02', 2024, 'dj', false, NULL),
  ('dj-sartek', 'Sunburn Festival',  'Vagator Beach', 'Goa',    '2023-12-27', 2023, 'dj', false, NULL),
  -- ── Kandy Kuri ──────────────────────────────────────────
  ('kandy-kuri', 'Boiler Room Bengaluru', 'The Humming Tree', 'Bengaluru', '2024-08-10', 2024, 'dj', false, NULL),
  ('kandy-kuri', 'Magnetic Fields 2024',  'Alsisar Mahal',    'Rajasthan', '2024-12-07', 2024, 'dj', false, NULL)

ON CONFLICT DO NOTHING;


-- ══════════════════════════════════════════════════════════════
-- §B  ARTIST CONNECTIONS (b2b / crew)
-- ══════════════════════════════════════════════════════════════

INSERT INTO artist_connections (artist_a_slug, artist_b_slug, connection_type, strength, shared_events, shared_venues)
VALUES
  ('startdawg',       'merman',          'b2b',   5, ARRAY['CCD at Bar Wild','CCDXSOCIAL 01','CCDXSOCIAL 02','CCDXSOCIAL 03'], ARRAY['Bar Wild','Indiranagar Social','Social BLR']),
  ('kohra',           'monophonik',      'crew',  3, ARRAY['Magnetic Fields 2022','Magnetic Fields 2023'],                   ARRAY['Alsisar Mahal']),
  ('kohra',           'dotdat',          'crew',  2, ARRAY['DGTL India 2024','Echoes of Earth'],                             ARRAY['MMRDA Grounds','NICE Grounds']),
  ('startdawg',       'kandy-kuri',      'crew',  2, ARRAY['Bengaluru underground circuit'],                                 ARRAY['Bar Wild','The Humming Tree']),
  ('dualist-inquiry', 'sandunes',        'crew',  2, ARRAY['NH7 Weekender','Echoes of Earth'],                              ARRAY['Mahalaxmi Lawns','NICE Grounds']),
  ('lost-stories',    'dj-sartek',       'crew',  2, ARRAY['DGTL India 2024'],                                               ARRAY['MMRDA Grounds']),
  ('bullzeye',        'dotdat',          'crew',  2, ARRAY['Ellum Audio Showcase Goa'],                                     ARRAY['Hilltop'])

ON CONFLICT (artist_a_slug, artist_b_slug) DO UPDATE SET
  strength     = EXCLUDED.strength,
  shared_events = EXCLUDED.shared_events,
  shared_venues = EXCLUDED.shared_venues,
  updated_at   = NOW();

-- ══════════════════════════════════════════════════════════════
-- §C  FEATURED FLAGS
-- ══════════════════════════════════════════════════════════════

UPDATE artists SET featured = true, updated_at = NOW()
WHERE slug IN (
  'startdawg', 'merman', 'kohra', 'nikki-nair', 'indo-warehouse',
  'sandunes', 'lost-stories', 'dualist-inquiry', 'dotdat', 'bullzeye',
  'kandy-kuri', 'monophonik', 'sunju-hargun'
);

-- ══════════════════════════════════════════════════════════════
-- §D  AVAILABLE CITIES (for booking marketplace)
-- ══════════════════════════════════════════════════════════════

UPDATE artists SET
  available_cities = ARRAY['Bengaluru','Mumbai','Delhi','Goa','Hyderabad','Pune','Chennai'],
  open_to_bookings = true,
  updated_at = NOW()
WHERE slug IN ('startdawg','merman','kohra','dotdat','bullzeye','kandy-kuri');

UPDATE artists SET
  available_cities = ARRAY['Mumbai','Delhi','Bengaluru','Goa','Hyderabad'],
  open_to_bookings = true,
  updated_at = NOW()
WHERE slug IN ('lost-stories','sandunes','karan-kanchan','sid-vashi','sickflip');

UPDATE artists SET
  available_cities = ARRAY['Delhi','Mumbai','Bengaluru'],
  open_to_bookings = true,
  updated_at = NOW()
WHERE slug IN ('kohra','dj-sartek','prabh-deep','dj-ravator');

UPDATE artists SET
  available_cities = ARRAY['Goa','Mumbai','Bengaluru'],
  open_to_bookings = true,
  updated_at = NOW()
WHERE slug IN ('dualist-inquiry','anish-sood','hamza-rahimtula');

-- ══════════════════════════════════════════════════════════════
-- §E  SITE SETTINGS — turn homepage sections ON
-- ══════════════════════════════════════════════════════════════

INSERT INTO site_settings (id, home_content, updated_at)
VALUES (
  'main',
  jsonb_build_object(
    'section_visibility', jsonb_build_object(
      'show_featured_artists', true,
      'show_scene_map',        true,
      'show_pick_your_sound',  true
    )
  ),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  home_content = site_settings.home_content || jsonb_build_object(
    'section_visibility', jsonb_build_object(
      'show_featured_artists', true,
      'show_scene_map',        true,
      'show_pick_your_sound',  true
    )
  ),
  updated_at = NOW();

-- ── Verify ───────────────────────────────────────────────────
SELECT
  a.slug,
  a.name,
  a.featured,
  a.based_city,
  COUNT(ea.id) AS gig_count,
  a.available_cities
FROM artists a
LEFT JOIN event_appearances ea ON ea.artist_slug = a.slug
GROUP BY a.slug, a.name, a.featured, a.based_city, a.available_cities
ORDER BY a.featured DESC, a.name;
