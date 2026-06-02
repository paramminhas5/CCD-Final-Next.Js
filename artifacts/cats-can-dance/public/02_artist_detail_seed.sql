-- ============================================================
-- 02_artist_detail_seed.sql
-- Run AFTER 01_artists_seed.sql.
--
-- Seeds:
--   §A  event_appearances   — gig history per artist
--   §B  artist_connections  — b2b / crew relationships
--   §C  featured flags      — marks spotlight artists
--   §D  available_cities    — cities artists accept bookings in
--   §E  site_settings       — turns on homepage sections
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste & run.
--   Safe to re-run — uses ON CONFLICT / DO UPDATE throughout.
-- ============================================================

SET search_path = public;

-- ── Ensure tables exist with the correct live schema ────────

CREATE TABLE IF NOT EXISTS event_appearances (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        text NOT NULL DEFAULT '',
  artist_slug      text NOT NULL DEFAULT '',
  artist_name      text NOT NULL DEFAULT '',
  event_name       text NOT NULL,
  venue            text,
  city             text,
  event_date       text,
  year             integer,
  role             text NOT NULL DEFAULT 'performer',
  source           text NOT NULL DEFAULT 'manual',
  curated_event_id text,
  created_at       timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ea_artist_slug ON event_appearances (artist_slug);
CREATE INDEX IF NOT EXISTS idx_ea_city        ON event_appearances (city);
CREATE INDEX IF NOT EXISTS idx_ea_year        ON event_appearances (year);

CREATE TABLE IF NOT EXISTS artist_connections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_a_id      text NOT NULL DEFAULT '',
  artist_a_slug    text NOT NULL,
  artist_b_id      text NOT NULL DEFAULT '',
  artist_b_slug    text NOT NULL,
  connection_type  text NOT NULL DEFAULT 'b2b',
  strength         integer NOT NULL DEFAULT 1,
  shared_events    text[] NOT NULL DEFAULT '{}',
  shared_venues    text[] NOT NULL DEFAULT '{}',
  notes            text,
  source           text NOT NULL DEFAULT 'manual',
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ac_unique_edge ON artist_connections (
  least(artist_a_slug, artist_b_slug),
  greatest(artist_a_slug, artist_b_slug),
  connection_type
);

-- ══════════════════════════════════════════════════════════════
-- §A  EVENT APPEARANCES
-- Columns used: artist_slug, artist_name, event_name, venue,
--               city, event_date (text), year, role, source
-- ══════════════════════════════════════════════════════════════

INSERT INTO event_appearances
  (artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
VALUES
  -- Startdawg
  ('startdawg', 'STARTDAWG', 'CCD at Bar Wild — Episode 1',     'Bar Wild',           'Bengaluru', '2025-04-02', 2025, 'dj',   'manual'),
  ('startdawg', 'STARTDAWG', 'CCDXSOCIAL 01',                   'Indiranagar Social', 'Bengaluru', '2026-06-29', 2026, 'dj',   'manual'),
  ('startdawg', 'STARTDAWG', 'CCDXSOCIAL 02 — Style Edition',   'Social BLR',         'Bengaluru', '2026-07-27', 2026, 'dj',   'manual'),
  ('startdawg', 'STARTDAWG', 'CCDXSOCIAL 03 — Agility Edition', 'Social BLR',         'Bengaluru', '2026-08-30', 2026, 'dj',   'manual'),
  -- Merman
  ('merman', 'MERMAN', 'CCD at Bar Wild — Episode 1',     'Bar Wild',           'Bengaluru', '2025-04-02', 2025, 'dj', 'manual'),
  ('merman', 'MERMAN', 'CCDXSOCIAL 01',                   'Indiranagar Social', 'Bengaluru', '2026-06-29', 2026, 'dj', 'manual'),
  ('merman', 'MERMAN', 'CCDXSOCIAL 02 — Style Edition',   'Social BLR',         'Bengaluru', '2026-07-27', 2026, 'dj', 'manual'),
  ('merman', 'MERMAN', 'CCDXSOCIAL 03 — Agility Edition', 'Social BLR',         'Bengaluru', '2026-08-30', 2026, 'dj', 'manual'),
  -- Kohra
  ('kohra', 'KOHRA', 'Boiler Room Delhi NCR',          'Auro Kitchen & Bar', 'New Delhi', '2024-06-15', 2024, 'dj', 'manual'),
  ('kohra', 'KOHRA', 'Boiler Room Bengaluru',          'The Humming Tree',   'Bengaluru', '2024-08-10', 2024, 'dj', 'manual'),
  ('kohra', 'KOHRA', 'Magnetic Fields 2023',           'Alsisar Mahal',      'Rajasthan', '2023-12-09', 2023, 'dj', 'manual'),
  ('kohra', 'KOHRA', 'Magnetic Fields 2022',           'Alsisar Mahal',      'Rajasthan', '2022-12-10', 2022, 'dj', 'manual'),
  ('kohra', 'KOHRA', 'DGTL India 2024',                'MMRDA Grounds',      'Mumbai',    '2024-03-02', 2024, 'dj', 'manual'),
  ('kohra', 'KOHRA', 'Echoes of Earth Bengaluru 2024', 'NICE Grounds',       'Bengaluru', '2024-11-09', 2024, 'dj', 'manual'),
  -- Nikki Nair
  ('nikki-nair', 'NIKKI NAIR', 'Boiler Room Hyderabad', '10D',            'Hyderabad', '2022-05-14', 2022, 'dj',   'manual'),
  ('nikki-nair', 'NIKKI NAIR', 'Sustain Release 2024',  'Hunter Mountain', 'New York',  '2024-09-01', 2024, 'dj',   'manual'),
  -- Sandunes
  ('sandunes', 'SANDUNES', 'NH7 Weekender Pune 2023', 'Mahalaxmi Lawns', 'Pune',  '2023-11-26', 2023, 'live', 'manual'),
  ('sandunes', 'SANDUNES', 'NH7 Weekender Pune 2022', 'Mahalaxmi Lawns', 'Pune',  '2022-11-27', 2022, 'live', 'manual'),
  ('sandunes', 'SANDUNES', 'Red Bull Music Academy',  'BaseCamp Dubai',  'Dubai', '2023-03-15', 2023, 'live', 'manual'),
  -- Dotdat
  ('dotdat', 'DOTDAT', 'Echoes of Earth Bengaluru 2025', 'NICE Grounds',  'Bengaluru', '2025-11-08', 2025, 'dj', 'manual'),
  ('dotdat', 'DOTDAT', 'DGTL India 2024',                'MMRDA Grounds', 'Mumbai',    '2024-03-02', 2024, 'dj', 'manual'),
  ('dotdat', 'DOTDAT', 'Ellum Audio Showcase Goa',       'Hilltop',       'Goa',       '2023-12-28', 2023, 'dj', 'manual'),
  -- Dualist Inquiry
  ('dualist-inquiry', 'DUALIST INQUIRY', 'Echoes of Earth Goa 2024',       'NICE Grounds',        'Goa',               '2024-02-04', 2024, 'live', 'manual'),
  ('dualist-inquiry', 'DUALIST INQUIRY', 'Echoes of Earth Bengaluru 2024', 'NICE Grounds',        'Bengaluru',         '2024-11-09', 2024, 'live', 'manual'),
  ('dualist-inquiry', 'DUALIST INQUIRY', 'Lollapalooza India 2024',        'Mahalaxmi Racecourse','Mumbai',            '2024-01-27', 2024, 'live', 'manual'),
  ('dualist-inquiry', 'DUALIST INQUIRY', 'Ziro Festival 2025',             'Ziro Valley',         'Arunachal Pradesh', '2025-10-01', 2025, 'live', 'manual'),
  -- Lost Stories
  ('lost-stories', 'LOST STORIES', 'DGTL India 2024',         'MMRDA Grounds',        'Mumbai', '2024-03-02', 2024, 'dj', 'manual'),
  ('lost-stories', 'LOST STORIES', 'Lollapalooza India 2024', 'Mahalaxmi Racecourse', 'Mumbai', '2024-01-27', 2024, 'dj', 'manual'),
  -- Bullzeye
  ('bullzeye', 'BULLZEYE', 'Ellum Audio Showcase Goa', 'Hilltop',       'Goa',       '2022-12-29', 2022, 'dj', 'manual'),
  ('bullzeye', 'BULLZEYE', 'Awakenings India',          'NH7 Arena',     'Mumbai',    '2023-10-14', 2023, 'dj', 'manual'),
  ('bullzeye', 'BULLZEYE', 'Paradiso Amsterdam',        'Paradiso',      'Amsterdam', '2023-07-07', 2023, 'dj', 'manual'),
  ('bullzeye', 'BULLZEYE', 'Feel Festival Berlin',      'Feel Festival', 'Berlin',    '2023-08-18', 2023, 'dj', 'manual'),
  ('bullzeye', 'BULLZEYE', 'Ritter Butzke Berlin',      'Ritter Butzke', 'Berlin',    '2024-04-12', 2024, 'dj', 'manual'),
  ('bullzeye', 'BULLZEYE', 'DGTL India 2025',           'MMRDA Grounds', 'Mumbai',    '2025-03-01', 2025, 'dj', 'manual'),
  -- DJ Sartek
  ('dj-sartek', 'DJ SARTEK', 'DGTL India 2024',  'MMRDA Grounds', 'Mumbai', '2024-03-02', 2024, 'dj', 'manual'),
  ('dj-sartek', 'DJ SARTEK', 'Sunburn Festival', 'Vagator Beach',  'Goa',    '2023-12-27', 2023, 'dj', 'manual'),
  -- Kandy Kuri
  ('kandy-kuri', 'KANDY KURI', 'Boiler Room Bengaluru', 'The Humming Tree', 'Bengaluru', '2024-08-10', 2024, 'dj', 'manual'),
  ('kandy-kuri', 'KANDY KURI', 'Magnetic Fields 2024',  'Alsisar Mahal',    'Rajasthan', '2024-12-07', 2024, 'dj', 'manual')

ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- §B  ARTIST CONNECTIONS (b2b / crew)
-- ══════════════════════════════════════════════════════════════

INSERT INTO artist_connections
  (artist_a_slug, artist_b_slug, connection_type, strength, shared_events, shared_venues)
VALUES
  ('startdawg',       'merman',          'b2b',  5, ARRAY['CCD at Bar Wild','CCDXSOCIAL 01','CCDXSOCIAL 02','CCDXSOCIAL 03'], ARRAY['Bar Wild','Indiranagar Social','Social BLR']),
  ('kohra',           'monophonik',      'crew', 3, ARRAY['Magnetic Fields 2022','Magnetic Fields 2023'],                     ARRAY['Alsisar Mahal']),
  ('kohra',           'dotdat',          'crew', 2, ARRAY['DGTL India 2024','Echoes of Earth'],                               ARRAY['MMRDA Grounds','NICE Grounds']),
  ('startdawg',       'kandy-kuri',      'crew', 2, ARRAY['Bengaluru underground circuit'],                                   ARRAY['Bar Wild','The Humming Tree']),
  ('dualist-inquiry', 'sandunes',        'crew', 2, ARRAY['NH7 Weekender','Echoes of Earth'],                                 ARRAY['Mahalaxmi Lawns','NICE Grounds']),
  ('bullzeye',        'dotdat',          'crew', 2, ARRAY['Ellum Audio Showcase Goa'],                                        ARRAY['Hilltop'])

ON CONFLICT ON CONSTRAINT idx_ac_unique_edge DO UPDATE SET
  strength      = EXCLUDED.strength,
  shared_events = EXCLUDED.shared_events,
  shared_venues = EXCLUDED.shared_venues,
  updated_at    = NOW();

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
-- §D  AVAILABLE CITIES
-- ══════════════════════════════════════════════════════════════

UPDATE artists SET
  available_cities = ARRAY['Bengaluru','Mumbai','Delhi','Goa','Hyderabad','Pune','Chennai'],
  open_to_bookings = true, updated_at = NOW()
WHERE slug IN ('startdawg','merman','kohra','dotdat','bullzeye','kandy-kuri');

UPDATE artists SET
  available_cities = ARRAY['Mumbai','Delhi','Bengaluru','Goa','Hyderabad'],
  open_to_bookings = true, updated_at = NOW()
WHERE slug IN ('lost-stories','sandunes','karan-kanchan','sid-vashi','sickflip');

UPDATE artists SET
  available_cities = ARRAY['Delhi','Mumbai','Bengaluru'],
  open_to_bookings = true, updated_at = NOW()
WHERE slug IN ('kohra','dj-sartek','prabh-deep','dj-ravator');

UPDATE artists SET
  available_cities = ARRAY['Goa','Mumbai','Bengaluru'],
  open_to_bookings = true, updated_at = NOW()
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
