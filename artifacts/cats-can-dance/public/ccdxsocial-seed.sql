-- ============================================================
-- CCDxSocial Series — Seed Data
-- Run this in your Supabase SQL Editor to insert the 3 shows
-- and the grand finale teaser into the events table.
--
-- Fields used:
--   slug, title, date, city, venue, blurb, lineup (jsonb),
--   status, poster_url, sort_order, series, series_label,
--   event_type, pet_friendly, series_tagline, is_finale
--
-- lineup is stored as jsonb — values are cast with ::jsonb
-- ============================================================

-- ── 0. Add series columns if they don't exist ───────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS series         text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_label   text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type     text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS pet_friendly   boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_tagline text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_finale      boolean DEFAULT false;

-- ── 1. CCDxSocial Show 01 — The Debut ──────────────────────
INSERT INTO events (
  slug, title, date, city, venue, blurb, lineup, status,
  poster_url, sort_order,
  series, series_label, event_type, pet_friendly, series_tagline, is_finale
) VALUES (
  'ccdxsocial-debut',
  'THE DEBUT',
  'Sat, Jun 21, 2026',
  'Bangalore',
  'Social, Indiranagar',
  'India''s first curated pet lifestyle festival meets underground dance music. The Debut is the first chapter — outdoor pet zone from 4PM with activities, vendor market, agility tasters and portrait booth. Then Startdawg and Merman take over for the night.',
  '["Startdawg", "Merman", "TBA", "TBA", "TBA"]'::jsonb,
  'upcoming',
  NULL,
  1,
  'ccdxsocial',
  'CCD × SOCIAL',
  'ccdxsocial',
  true,
  'BROAD · WELCOMING · FIRST IMPRESSION',
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  date           = EXCLUDED.date,
  city           = EXCLUDED.city,
  venue          = EXCLUDED.venue,
  blurb          = EXCLUDED.blurb,
  lineup         = EXCLUDED.lineup,
  status         = EXCLUDED.status,
  sort_order     = EXCLUDED.sort_order,
  series         = EXCLUDED.series,
  series_label   = EXCLUDED.series_label,
  event_type     = EXCLUDED.event_type,
  pet_friendly   = EXCLUDED.pet_friendly,
  series_tagline = EXCLUDED.series_tagline,
  is_finale      = EXCLUDED.is_finale;

-- ── 2. CCDxSocial Show 02 — The Groom Room ─────────────────
INSERT INTO events (
  slug, title, date, city, venue, blurb, lineup, status,
  poster_url, sort_order,
  series, series_label, event_type, pet_friendly, series_tagline, is_finale
) VALUES (
  'ccdxsocial-groom-room',
  'THE GROOM ROOM',
  'Sat, Jun 28, 2026',
  'Bangalore',
  'Social, Church Street',
  'All about looking good — pets and parents alike. Fashion, grooming, accessories. Live grooming demo on stage, best dressed contest, dedicated style photography corner. Plus Startdawg and Merman keeping the floor moving.',
  '["Startdawg", "Merman", "TBA", "TBA", "TBA"]'::jsonb,
  'upcoming',
  NULL,
  2,
  'ccdxsocial',
  'CCD × SOCIAL',
  'ccdxsocial',
  true,
  'FASHION · GROOMING · STYLE',
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  date           = EXCLUDED.date,
  city           = EXCLUDED.city,
  venue          = EXCLUDED.venue,
  blurb          = EXCLUDED.blurb,
  lineup         = EXCLUDED.lineup,
  status         = EXCLUDED.status,
  sort_order     = EXCLUDED.sort_order,
  series         = EXCLUDED.series,
  series_label   = EXCLUDED.series_label,
  event_type     = EXCLUDED.event_type,
  pet_friendly   = EXCLUDED.pet_friendly,
  series_tagline = EXCLUDED.series_tagline,
  is_finale      = EXCLUDED.is_finale;

-- ── 3. CCDxSocial Show 03 — Zoomies ────────────────────────
INSERT INTO events (
  slug, title, date, city, venue, blurb, lineup, status,
  poster_url, sort_order,
  series, series_label, event_type, pet_friendly, series_tagline, is_finale
) VALUES (
  'ccdxsocial-zoomies',
  'ZOOMIES',
  'Sun, Jun 29, 2026',
  'Bangalore',
  'Social, Koramangala',
  'Dogs doing what dogs do best. The most physical show of the series — two agility courses, a timed speed run, performance contest. Raw energy, outdoor action, then Startdawg and Merman bringing the bass. Any breed, any age, any skill level welcome.',
  '["Startdawg", "Merman", "TBA", "TBA", "TBA"]'::jsonb,
  'upcoming',
  NULL,
  3,
  'ccdxsocial',
  'CCD × SOCIAL',
  'ccdxsocial',
  true,
  'AGILITY · PERFORMANCE · SPEED',
  false
)
ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  date           = EXCLUDED.date,
  city           = EXCLUDED.city,
  venue          = EXCLUDED.venue,
  blurb          = EXCLUDED.blurb,
  lineup         = EXCLUDED.lineup,
  status         = EXCLUDED.status,
  sort_order     = EXCLUDED.sort_order,
  series         = EXCLUDED.series,
  series_label   = EXCLUDED.series_label,
  event_type     = EXCLUDED.event_type,
  pet_friendly   = EXCLUDED.pet_friendly,
  series_tagline = EXCLUDED.series_tagline,
  is_finale      = EXCLUDED.is_finale;

-- ── 4. Grand Format Show — Finale Teaser ───────────────────
INSERT INTO events (
  slug, title, date, city, venue, blurb, lineup, status,
  poster_url, sort_order,
  series, series_label, event_type, pet_friendly, series_tagline, is_finale
) VALUES (
  'ccdxsocial-grand-finale',
  'GRAND FORMAT SHOW',
  'Date TBA · 2026',
  'Bangalore',
  'Venue TBA',
  'The season finale. Everything the series has been building to. 2,000+ people, full outdoor stage, pet runway, agility finals, complete DJ lineup TBA. The biggest thing we''ve ever done. Sponsorship enquiries open now.',
  '["Startdawg", "Merman", "Full lineup TBA"]'::jsonb,
  'upcoming',
  NULL,
  4,
  'ccdxsocial',
  'CCD × SOCIAL',
  'ccdxsocial',
  true,
  'SEASON FINALE · GRAND FORMAT',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title          = EXCLUDED.title,
  date           = EXCLUDED.date,
  city           = EXCLUDED.city,
  venue          = EXCLUDED.venue,
  blurb          = EXCLUDED.blurb,
  lineup         = EXCLUDED.lineup,
  status         = EXCLUDED.status,
  sort_order     = EXCLUDED.sort_order,
  series         = EXCLUDED.series,
  series_label   = EXCLUDED.series_label,
  event_type     = EXCLUDED.event_type,
  pet_friendly   = EXCLUDED.pet_friendly,
  series_tagline = EXCLUDED.series_tagline,
  is_finale      = EXCLUDED.is_finale;

-- ============================================================
-- Verify:
-- SELECT slug, title, date, series, pet_friendly, is_finale, sort_order
-- FROM events
-- WHERE series = 'ccdxsocial'
-- ORDER BY sort_order;
-- ============================================================
