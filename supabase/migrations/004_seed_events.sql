-- ============================================================
-- 004_seed_events.sql
-- Seeds all event data in two sections.
--
-- Run AFTER 003_seed_appearances.sql.
-- Safe to re-run — both sections use ON CONFLICT ... DO UPDATE.
--
-- §A  CCD own events (5 rows → `events` table)
--       episode-1, ccdxsocial-01 through 03, MEGA
--
-- §B  Curated third-party events (20 rows → `curated_events`)
--       Bengaluru, Mumbai, Delhi, Hyderabad, Goa, Pune
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- §A  CCD OWN EVENTS  →  `events` table
-- ══════════════════════════════════════════════════════════════

-- Add series columns if this is an older schema version
ALTER TABLE events ADD COLUMN IF NOT EXISTS series         text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_label   text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type     text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS pet_friendly   boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS series_tagline text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_finale      boolean DEFAULT false;

-- Remove stale slugs from previous seeds
DELETE FROM events WHERE slug IN (
  'ccdxsocial-debut', 'ccdxsocial-the-heat', 'ccdxsocial-loose-ends',
  'ccdxsocial-the-gathering', 'ccdxsocial-zoomies',
  'ccdxsocial-groom-room', 'ccdxsocial-grand-finale'
);

INSERT INTO events (
  slug, title, date, city, venue, blurb, lineup, status,
  poster_url, sort_order,
  series, series_label, event_type, pet_friendly, series_tagline, is_finale,
  created_at, updated_at
) VALUES

  (
    'episode-1',
    'CCD AT BAR WILD',
    '2nd April 2025',
    'Bengaluru', 'Bar Wild, Indiranagar',
    'The first Cats Can Dance episode. House, disco, garage, and the kind of floor that makes you forget what time it is. Startdawg and Merman held it down from open to close.',
    '["Startdawg", "Merman"]'::jsonb,
    'past', NULL, 0,
    NULL, NULL, 'standard', false, NULL, false,
    NOW(), NOW()
  ),
  (
    'ccdxsocial-01',
    'CCDXSOCIAL 01',
    'Sun, 29 Jun 2026',
    'Bengaluru', 'Indiranagar Social',
    'The first chapter of CCD × SOCIAL. Wide open — portrait booth, lookalike contest, vendor market all afternoon. Startdawg b2b Merman take the floor at 9. The pack meets for the first time.',
    '["Startdawg", "Merman", "TBA"]'::jsonb,
    'upcoming', NULL, 10,
    'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true,
    'BROAD · WELCOMING · FIRST IMPRESSION', false,
    NOW(), NOW()
  ),
  (
    'ccdxsocial-02',
    'CCDXSOCIAL 02',
    'Sun, 27 Jul 2026',
    'Bengaluru', 'Social BLR (TBC)',
    'The style chapter. Midsummer, outdoors, everyone at their best. Live grooming demo, best-dressed contest for pets and parents, dedicated photography corner.',
    '["Startdawg", "Merman", "TBA"]'::jsonb,
    'upcoming', NULL, 20,
    'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true,
    'STYLE · FASHION · MIDSUMMER ENERGY', false,
    NOW(), NOW()
  ),
  (
    'ccdxsocial-03',
    'CCDXSOCIAL 03',
    'Sun, 30 Aug 2026',
    'Bengaluru', 'Social BLR (TBC)',
    'The most physical show. Two agility courses, timed speed runs, performance contest. MEGA tickets drop exclusively at this show.',
    '["Startdawg", "Merman", "TBA"]'::jsonb,
    'upcoming', NULL, 30,
    'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true,
    'AGILITY · FINALE PREVIEW · ONE MORE', false,
    NOW(), NOW()
  ),
  (
    'ccdxsocial-mega',
    'MEGA',
    'October 2026',
    'Bengaluru', 'TBA — Large Format',
    'Everything the series has been building to. Full outdoor stage. 2,000+ people. Pet runway. Agility finals. The whole pack in one place.',
    '["TBA"]'::jsonb,
    'upcoming', NULL, 40,
    'ccdxsocial', 'CCD × SOCIAL', 'ccdxsocial', true,
    'GRAND FINALE · SEASON CLOSER', true,
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


-- ══════════════════════════════════════════════════════════════
-- §B  CURATED THIRD-PARTY EVENTS  →  `curated_events` table
-- ══════════════════════════════════════════════════════════════

-- Add submission columns if not present (older schema)
ALTER TABLE curated_events ADD COLUMN IF NOT EXISTS submission_status text NOT NULL DEFAULT 'published';
ALTER TABLE curated_events ADD COLUMN IF NOT EXISTS submitted_by      text;
ALTER TABLE curated_events ADD COLUMN IF NOT EXISTS promoter_slug     text;

INSERT INTO curated_events (
  title, url, source, city, venue,
  event_date, event_time, blurb, genre,
  image_url, is_featured, submission_status,
  created_at, updated_at
) VALUES

-- ── CCD Own (editorial) ──────────────────────────────────────
(
  'CCDXSOCIAL 01 — Cats Can Dance × Social',
  'https://catscandance.com/events/ccdxsocial-01',
  'editorial', 'Bangalore', 'Indiranagar Social',
  '2026-06-29', '20:00',
  'India''s first curated pet lifestyle festival meets underground dance music. Outdoor pet zone from 4 PM, vendor market, portrait booth. Startdawg b2b Merman take the floor at 9. Free, RSVP only.',
  '["House","Disco","Garage"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'CCDXSOCIAL 02 — Style Edition',
  'https://catscandance.com/events/ccdxsocial-02',
  'editorial', 'Bangalore', 'Social BLR',
  '2026-07-27', '20:00',
  'The style chapter. Live grooming demo on stage, best-dressed contest for pets and parents. Startdawg b2b Merman bring the floor into the night.',
  '["House","Disco"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'CCDXSOCIAL 03 — Agility Edition',
  'https://catscandance.com/events/ccdxsocial-03',
  'editorial', 'Bangalore', 'Social BLR',
  '2026-08-30', '20:00',
  'The most physical show. Two agility courses, timed speed runs. MEGA tickets drop exclusively at this show.',
  '["House","Jungle","Garage"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'MEGA — CCD Season Finale',
  'https://catscandance.com/events/ccdxsocial-mega',
  'editorial', 'Bangalore', 'TBA — Large Format',
  '2026-10-01', 'TBA',
  'The season finale. Everything the series has been building to. 2,000+ people, full outdoor stage, pet runway, agility finals.',
  '["House","Disco","Jungle","Garage"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),

-- ── Bengaluru ────────────────────────────────────────────────
(
  'Drum and Bass India × SOCIAL — Monthly Session',
  'https://in.district.com/events/dnb-india-social-bangalore',
  'manual', 'Bangalore', 'Social, Indiranagar',
  '2026-06-21', '21:00',
  'DnBIndia monthly returns to Indiranagar Social. Resident selectors, open doors, pure D&B from open to close.',
  '["Drum & Bass","Jungle","Liquid DnB"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'Subculture BLR — Techno Night',
  'https://skillboxes.com/events/subculture-blr-techno',
  'skillboxes', 'Bangalore', 'Plan B, Indiranagar',
  '2026-06-20', '22:00',
  'Subculture BLR monthly. No frills, just techno. Resident DJs + a guest from the Qilla Records stable.',
  '["Techno","Minimal"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Bar Wild Friday Night — House & Disco',
  'https://skillboxes.com/events/bar-wild-house-disco',
  'skillboxes', 'Bangalore', 'Bar Wild, Indiranagar',
  '2026-06-27', '21:00',
  'Bar Wild''s regular Friday house and disco session. The room that started it all for Bengaluru''s underground.',
  '["House","Disco","UK Garage"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'The Humming Tree — Indie Electronic Night',
  'https://skillboxes.com/events/the-humming-tree-indie-electronic',
  'skillboxes', 'Bangalore', 'The Humming Tree, Indiranagar',
  '2026-07-11', '21:00',
  'The Humming Tree''s indie electronic series. Live acts + DJs. Bengaluru''s most eclectic room.',
  '["Indie Electronic","Experimental","Electronic"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Boiler Room India 2026 — Bengaluru Edition',
  'https://boilerroom.tv/recording/india-2026-bangalore',
  'editorial', 'Bangalore', 'TBA',
  '2026-08-09', '20:00',
  'Boiler Room returns to Bengaluru for its second India edition. Lineup to be announced.',
  '["House","Techno","Jungle","Garage"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'Echoes of Earth — Artist Announcement Night',
  'https://insider.in/events/echoes-of-earth-artist-announcement-2026',
  'insider', 'Bangalore', 'NICE Grounds',
  '2026-07-15', '20:00',
  'Echoes of Earth officially announces the 2026 lineup with a live warm-up set from the headline act.',
  '["Electronic","Ambient","World"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),

-- ── Delhi ────────────────────────────────────────────────────
(
  'Qilla Records Showcase — Delhi Underground',
  'https://insider.in/events/qilla-records-showcase-delhi',
  'insider', 'Delhi', 'Auro Kitchen & Bar',
  '2026-07-05', '22:00',
  'Kohra and the Qilla Records collective take over Auro. Industrial techno, minimal, experimental.',
  '["Techno","Industrial Techno","Minimal"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'PCO After-Dark — Minimal Techno Night',
  'https://insider.in/events/pco-minimal-techno-delhi',
  'insider', 'Delhi', 'PCO, Connaught Place',
  '2026-07-10', '23:00',
  'PCO''s monthly minimal techno session. Delhi''s discerning crowd, late hours, no photos.',
  '["Minimal","Techno"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Misfits Delhi — Electronica Saturday',
  'https://skillboxes.com/events/misfits-electronica-saturday',
  'skillboxes', 'Delhi', 'Misfits, Hauz Khas',
  '2026-07-19', '22:00',
  'Misfits regular Saturday series. Deep electronic, ambient, experimental.',
  '["Electronic","Experimental","Ambient"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),

-- ── Mumbai ───────────────────────────────────────────────────
(
  'Magnetic Fields Pre-Party — Mumbai',
  'https://insider.in/events/magnetic-fields-pre-party-mumbai',
  'insider', 'Mumbai', 'antiSOCIAL, Bandra',
  '2026-07-12', '22:00',
  'Official pre-party for Magnetic Fields 2026. Resident selectors warm up before the big announcement.',
  '["House","Techno","Electronic"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'Levitate x Trilogy — Mumbai Night',
  'https://in.district.com/events/levitate-trilogy-mumbai',
  'district', 'Mumbai', 'Trilogy, Juhu',
  '2026-07-18', '23:00',
  'Levitate agency presents a night at Trilogy. International guest + Indian support.',
  '["Deep House","Afro House","House"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'antiSOCIAL Mumbai — House Takeover',
  'https://in.district.com/events/antisocial-house-takeover-mumbai',
  'district', 'Mumbai', 'antiSOCIAL, Bandra',
  '2026-07-25', '22:00',
  'antiSOCIAL''s weekly house night with a rotating cast of Mumbai selectors. No commercial EDM.',
  '["House","Deep House","Tech House"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),

-- ── Goa ─────────────────────────────────────────────────────
(
  'Hilltop Sessions — Goa Jungle Night',
  'https://highape.com/events/hilltop-sessions-jungle-goa',
  'highape', 'Goa', 'Hilltop, Vagator',
  '2026-07-26', '22:00',
  'Hilltop brings back its jungle and D&B series for the season. Under the stars, on the cliff edge.',
  '["Jungle","Drum & Bass","Liquid DnB"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'Curlies Beach Party — Goa Psytrance',
  'https://highape.com/events/curlies-beach-psytrance-goa',
  'highape', 'Goa', 'Curlies Beach Shack, Anjuna',
  '2026-07-06', '22:00',
  'Curlies brings back the original Goa Trance energy for a full-moon session.',
  '["Goa Trance","Psytrance","Forest"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),

-- ── Hyderabad ────────────────────────────────────────────────
(
  'Krunk presents — Hyderabad Underground',
  'https://highape.com/events/krunk-hyderabad-underground',
  'highape', 'Hyderabad', '10D Club',
  '2026-07-04', '22:00',
  'Krunk agency returns to 10D with a stacked lineup of Indian electronic talent.',
  '["Techno","Breakbeat","Electro"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),

-- ── Pune ─────────────────────────────────────────────────────
(
  'High Spirits Pune — Electronic Thursdays',
  'https://insider.in/events/high-spirits-electronic-thursdays',
  'insider', 'Pune', 'High Spirits, Koregaon Park',
  '2026-07-03', '21:00',
  'High Spirits weekly electronic night. Pune''s biggest dance music venue. Student crowd, adventurous booking.',
  '["House","Live Electronics","Electronic"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
)

ON CONFLICT (url) DO UPDATE SET
  title             = EXCLUDED.title,
  source            = EXCLUDED.source,
  city              = EXCLUDED.city,
  venue             = EXCLUDED.venue,
  event_date        = EXCLUDED.event_date,
  event_time        = EXCLUDED.event_time,
  blurb             = EXCLUDED.blurb,
  genre             = EXCLUDED.genre,
  is_featured       = EXCLUDED.is_featured,
  submission_status = EXCLUDED.submission_status,
  updated_at        = NOW();
