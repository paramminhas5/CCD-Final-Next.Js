-- CCD Events Seed — run in Supabase SQL editor
-- Upserts all current CCD events with correct dates, names, and slugs.
-- Uses ON CONFLICT (slug) DO UPDATE so it's safe to re-run.

INSERT INTO events (slug, title, date, city, venue, blurb, lineup, status, sort_order, series, series_label, event_type, pet_friendly, series_tagline, is_finale, created_at, updated_at)
VALUES
  -- ── Past Episode ──────────────────────────────────────────────────────────
  (
    'episode-1',
    'Episode 1',
    '2nd April 2025',
    'Bengaluru',
    'Bar Wild, Indiranagar',
    'The first Cats Can Dance episode. House, disco, garage, and the kind of floor that makes you forget what time it is. Startdawg and Merman held it down from open to close.',
    '["Startdawg", "Merman"]',
    'past',
    0,
    NULL,
    NULL,
    'standard',
    false,
    NULL,
    false,
    NOW(),
    NOW()
  ),

  -- ── CCD × SOCIAL Show 01: THE DEBUT ──────────────────────────────────────
  (
    'ccdxsocial-debut',
    'THE DEBUT',
    'Sun, 29 Jun 2026',
    'Bengaluru',
    'Indiranagar Social',
    'The first chapter. Portrait booth, lookalike contest, vendor market all afternoon. Startdawg b2b Merman take the floor at 9. The pack meets for the first time.',
    '["Startdawg", "Merman", "TBA"]',
    'upcoming',
    10,
    'ccdxsocial',
    'CCD × SOCIAL',
    'ccdxsocial',
    true,
    'BROAD · WELCOMING · FIRST IMPRESSION',
    false,
    NOW(),
    NOW()
  ),

  -- ── CCD × SOCIAL Show 02: THE HEAT ───────────────────────────────────────
  (
    'ccdxsocial-the-heat',
    'THE HEAT',
    'Sun, 27 Jul 2026',
    'Bengaluru',
    'Social BLR (TBC)',
    'The style chapter. Midsummer, outdoors, everyone at their best. Live grooming demo, best-dressed contest for pets and parents, dedicated photography corner.',
    '["Startdawg", "Merman", "TBA"]',
    'upcoming',
    20,
    'ccdxsocial',
    'CCD × SOCIAL',
    'ccdxsocial',
    true,
    'STYLE · FASHION · MIDSUMMER ENERGY',
    false,
    NOW(),
    NOW()
  ),

  -- ── CCD × SOCIAL Show 03: LOOSE ENDS ─────────────────────────────────────
  (
    'ccdxsocial-loose-ends',
    'LOOSE ENDS',
    'Sun, 30 Aug 2026',
    'Bengaluru',
    'Social BLR (TBC)',
    'The most physical show. Two agility courses, timed speed runs, performance contest. Finale tickets drop exclusively at this show.',
    '["Startdawg", "Merman", "TBA"]',
    'upcoming',
    30,
    'ccdxsocial',
    'CCD × SOCIAL',
    'ccdxsocial',
    true,
    'AGILITY · FINALE PREVIEW · ONE MORE',
    false,
    NOW(),
    NOW()
  ),

  -- ── CCD × SOCIAL Grand Finale: THE GATHERING ─────────────────────────────
  (
    'ccdxsocial-the-gathering',
    'THE GATHERING',
    'October 2026',
    'Bengaluru',
    'TBA — Large Format',
    'Everything the series has been building to. Full outdoor stage. 2,000+ people. Pet runway. Agility finals. The whole pack in one place.',
    '["TBA"]',
    'upcoming',
    40,
    'ccdxsocial',
    'CCD × SOCIAL',
    'ccdxsocial',
    true,
    'GRAND FINALE · SEASON CLOSER',
    true,
    NOW(),
    NOW()
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
