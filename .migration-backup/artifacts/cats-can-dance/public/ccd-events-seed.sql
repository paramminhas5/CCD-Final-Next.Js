-- ============================================================
-- CCD Events — Canonical Seed
-- Run in Supabase SQL editor to fully reset event data.
-- Safe to re-run — uses ON CONFLICT (slug) DO UPDATE.
--
-- 5 events total:
--   1. CCD AT BAR WILD  (past · episode-1)
--   2. CCDXSOCIAL 01    (upcoming · 29 Jun 2026 · Indiranagar Social)
--   3. CCDXSOCIAL 02    (upcoming · 27 Jul 2026 · Social BLR)
--   4. CCDXSOCIAL 03    (upcoming · 30 Aug 2026 · Social BLR)
--   5. MEGA             (upcoming · Oct 2026   · Grand Finale)
-- ============================================================

-- ── 0. Add series columns if they don't exist ────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS series         text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_label   text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type     text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS pet_friendly   boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_tagline text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_finale      boolean DEFAULT false;

-- ── 1. Purge stale events ────────────────────────────────────
-- Remove old slugs from previous seeds that no longer exist
DELETE FROM events WHERE slug IN (
  'ccdxsocial-debut',
  'ccdxsocial-the-heat',
  'ccdxsocial-loose-ends',
  'ccdxsocial-the-gathering',
  'ccdxsocial-zoomies',
  'ccdxsocial-groom-room',
  'ccdxsocial-grand-finale'
);

-- ── 2. Upsert all current events ────────────────────────────
INSERT INTO events (
  slug, title, date, city, venue, blurb, lineup, status,
  poster_url, sort_order,
  series, series_label, event_type, pet_friendly, series_tagline, is_finale,
  created_at, updated_at
)
VALUES

  -- ── Past: CCD AT BAR WILD ─────────────────────────────────
  (
    'episode-1',
    'CCD AT BAR WILD',
    '2nd April 2025',
    'Bengaluru',
    'Bar Wild, Indiranagar',
    'The first Cats Can Dance episode. House, disco, garage, and the kind of floor that makes you forget what time it is. Startdawg and Merman held it down from open to close.',
    '["Startdawg", "Merman"]'::jsonb,
    'past',
    NULL,
    0,
    NULL, NULL, 'standard', false, NULL, false,
    NOW(), NOW()
  ),

  -- ── CCDXSOCIAL 01 ─────────────────────────────────────────
  (
    'ccdxsocial-01',
    'CCDXSOCIAL 01',
    'Sun, 29 Jun 2026',
    'Bengaluru',
    'Indiranagar Social',
    'The first chapter of CCD × SOCIAL. Wide open — portrait booth, lookalike contest, vendor market all afternoon. Startdawg b2b Merman take the floor at 9. The pack meets for the first time.',
    '["Startdawg", "Merman", "TBA"]'::jsonb,
    'upcoming',
    NULL,
    10,
    'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true,
    'BROAD · WELCOMING · FIRST IMPRESSION',
    false,
    NOW(), NOW()
  ),

  -- ── CCDXSOCIAL 02 ─────────────────────────────────────────
  (
    'ccdxsocial-02',
    'CCDXSOCIAL 02',
    'Sun, 27 Jul 2026',
    'Bengaluru',
    'Social BLR (TBC)',
    'The style chapter. Midsummer, outdoors, everyone at their best. Live grooming demo, best-dressed contest for pets and parents, dedicated photography corner.',
    '["Startdawg", "Merman", "TBA"]'::jsonb,
    'upcoming',
    NULL,
    20,
    'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true,
    'STYLE · FASHION · MIDSUMMER ENERGY',
    false,
    NOW(), NOW()
  ),

  -- ── CCDXSOCIAL 03 ─────────────────────────────────────────
  (
    'ccdxsocial-03',
    'CCDXSOCIAL 03',
    'Sun, 30 Aug 2026',
    'Bengaluru',
    'Social BLR (TBC)',
    'The most physical show. Two agility courses, timed speed runs, performance contest. MEGA tickets drop exclusively at this show.',
    '["Startdawg", "Merman", "TBA"]'::jsonb,
    'upcoming',
    NULL,
    30,
    'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true,
    'AGILITY · FINALE PREVIEW · ONE MORE',
    false,
    NOW(), NOW()
  ),

  -- ── MEGA — Grand Finale ────────────────────────────────────
  (
    'ccdxsocial-mega',
    'MEGA',
    'October 2026',
    'Bengaluru',
    'TBA — Large Format',
    'Everything the series has been building to. Full outdoor stage. 2,000+ people. Pet runway. Agility finals. The whole pack in one place.',
    '["TBA"]'::jsonb,
    'upcoming',
    NULL,
    40,
    'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true,
    'GRAND FINALE · SEASON CLOSER',
    true,
    NOW(), NOW()
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
  is_finale      = EXCLUDED.is_finale,
  updated_at     = NOW();

-- ── 3. Verify ────────────────────────────────────────────────
-- SELECT slug, title, date, status, series, pet_friendly, is_finale, sort_order
-- FROM events
-- ORDER BY sort_order;
