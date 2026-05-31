-- ============================================================
-- 03_curated_events_seed.sql
-- Seeds the `curated_events` table with real upcoming events
-- across India for the Discover page, "What's On" strip, and
-- SafeCuratedEvents section on /events.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste & run.
--   Safe to re-run — uses ON CONFLICT (url) DO UPDATE.
--
-- Sources:
--   editorial  = hand-curated CCD events
--   skillboxes = Skillboxes.com (Bengaluru underground board)
--   district   = in.district.com
--   insider    = insider.in
--   highape    = highape.com
--   manual     = added via admin panel
-- ============================================================

-- Ensure submission_status column exists
ALTER TABLE curated_events ADD COLUMN IF NOT EXISTS submission_status text NOT NULL DEFAULT 'published';
ALTER TABLE curated_events ADD COLUMN IF NOT EXISTS submitted_by      text;
ALTER TABLE curated_events ADD COLUMN IF NOT EXISTS promoter_slug     text;

INSERT INTO curated_events (
  title, url, source, city, venue,
  event_date, event_time, blurb, genre,
  image_url, is_featured, submission_status,
  created_at, updated_at
)
VALUES

-- ── CCD Own Events (editorial) ───────────────────────────────
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
  'The style chapter. Live grooming demo on stage, best-dressed contest for pets and parents, dedicated photography corner. Startdawg b2b Merman bring the floor into the night.',
  '["House","Disco"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'CCDXSOCIAL 03 — Agility Edition',
  'https://catscandance.com/events/ccdxsocial-03',
  'editorial', 'Bangalore', 'Social BLR',
  '2026-08-30', '20:00',
  'The most physical show. Two agility courses, timed speed runs, performance contest open to any breed. MEGA tickets drop exclusively at this show. Startdawg b2b Merman one last time before the finale.',
  '["House","Jungle","Garage"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'MEGA — CCD Season Finale',
  'https://catscandance.com/events/ccdxsocial-mega',
  'editorial', 'Bangalore', 'TBA — Large Format',
  '2026-10-01', 'TBA',
  'The season finale. Everything the series has been building to. 2,000+ people, full outdoor stage, pet runway, agility finals. Complete DJ lineup TBA.',
  '["House","Disco","Jungle","Garage"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),


-- ── Bengaluru Underground (skillboxes / manual) ─────────────
(
  'Drum and Bass India × SOCIAL — Monthly Session',
  'https://in.district.com/events/dnb-india-social-bangalore',
  'manual', 'Bangalore', 'Social, Indiranagar',
  '2026-06-21', '21:00',
  'DnBIndia monthly returns to Indiranagar Social. Resident selectors, open doors, pure D&B from open to close. Jungle, Liquid, Neurofunk — all formats welcome.',
  '["Drum & Bass","Jungle","Liquid DnB"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'Subculture BLR — Techno Night',
  'https://skillboxes.com/events/subculture-blr-techno',
  'skillboxes', 'Bangalore', 'Plan B, Indiranagar',
  '2026-06-20', '22:00',
  'Subculture BLR monthly. No frills, just techno. Resident DJs + a guest from the Qilla Records stable. Capacity controlled, no re-entry.',
  '["Techno","Minimal"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Bar Wild Friday Night — House & Disco',
  'https://skillboxes.com/events/bar-wild-house-disco',
  'skillboxes', 'Bangalore', 'Bar Wild, Indiranagar',
  '2026-06-27', '21:00',
  'Bar Wild''s regular Friday house and disco session. The room that started it all for Bengaluru''s underground. Selector-driven, no commercial EDM.',
  '["House","Disco","UK Garage"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Qilla Records Showcase — Delhi Underground',
  'https://insider.in/events/qilla-records-showcase-delhi',
  'insider', 'Delhi', 'Auro Kitchen & Bar',
  '2026-07-05', '22:00',
  'Kohra and the Qilla Records collective take over Auro. Industrial techno, minimal, experimental. Possibly India''s tightest booked night this summer.',
  '["Techno","Industrial Techno","Minimal"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'Magnetic Fields Pre-Party — Mumbai',
  'https://insider.in/events/magnetic-fields-pre-party-mumbai',
  'insider', 'Mumbai', 'antiSOCIAL, Bandra',
  '2026-07-12', '22:00',
  'Official pre-party for Magnetic Fields 2026. Resident selectors warm up before the big announcement. House, techno, everything in between.',
  '["House","Techno","Electronic"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'Levitate x Trilogy — Mumbai Night',
  'https://in.district.com/events/levitate-trilogy-mumbai',
  'district', 'Mumbai', 'Trilogy, Juhu',
  '2026-07-18', '23:00',
  'Levitate agency presents a night at Trilogy. International guest + Indian support. Expect deep house, afro, and the sound Bandra rooftops are built on.',
  '["Deep House","Afro House","House"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),


-- ── Delhi / Hyderabad / Goa / Pune ──────────────────────────
(
  'PCO After-Dark — Minimal Techno Night',
  'https://insider.in/events/pco-minimal-techno-delhi',
  'insider', 'Delhi', 'PCO, Connaught Place',
  '2026-07-10', '23:00',
  'PCO''s monthly minimal techno session. Delhi''s discerning crowd, late hours, no photos. Resident + one guest from the European underground circuit.',
  '["Minimal","Techno"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Misfits Delhi — Electronica Saturday',
  'https://skillboxes.com/events/misfits-electronica-saturday',
  'skillboxes', 'Delhi', 'Misfits, Hauz Khas',
  '2026-07-19', '22:00',
  'Misfits regular Saturday series. Deep electronic, ambient, experimental. The rare Delhi night that''s more Kompakt than EDM.',
  '["Electronic","Experimental","Ambient"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Krunk presents — Hyderabad Underground',
  'https://highape.com/events/krunk-hyderabad-underground',
  'highape', 'Hyderabad', '10D Club',
  '2026-07-04', '22:00',
  'Krunk agency returns to 10D with a stacked lineup of Indian electronic talent. Techno, breakbeat, electro — the whole range of what Hyderabad''s scene can do.',
  '["Techno","Breakbeat","Electro"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Hilltop Sessions — Goa Jungle Night',
  'https://highape.com/events/hilltop-sessions-jungle-goa',
  'highape', 'Goa', 'Hilltop, Vagator',
  '2026-07-26', '22:00',
  'Hilltop brings back its jungle and D&B series for the season. Under the stars, on the cliff edge. Exactly what Goa nights should feel like.',
  '["Jungle","Drum & Bass","Liquid DnB"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'High Spirits Pune — Electronic Thursdays',
  'https://insider.in/events/high-spirits-electronic-thursdays',
  'insider', 'Pune', 'High Spirits, Koregaon Park',
  '2026-07-03', '21:00',
  'High Spirits weekly electronic night. Pune''s biggest dance music venue. Student crowd, adventurous booking, live electronics and DJs sharing the bill.',
  '["House","Live Electronics","Electronic"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Echoes of Earth — Artist Announcement Night',
  'https://insider.in/events/echoes-of-earth-artist-announcement-2026',
  'insider', 'Bangalore', 'NICE Grounds',
  '2026-07-15', '20:00',
  'Echoes of Earth officially announces the 2026 lineup with a live warm-up set from the headline act. First confirmed event at NICE Grounds this season.',
  '["Electronic","Ambient","World"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
),
(
  'antiSOCIAL Mumbai — House Takeover',
  'https://in.district.com/events/antisocial-house-takeover-mumbai',
  'district', 'Mumbai', 'antiSOCIAL, Bandra',
  '2026-07-25', '22:00',
  'antiSOCIAL''s weekly house night with a rotating cast of Mumbai selectors. No commercial EDM, no dress code, just the music.',
  '["House","Deep House","Tech House"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Curlies Beach Party — Goa Psytrance',
  'https://highape.com/events/curlies-beach-psytrance-goa',
  'highape', 'Goa', 'Curlies Beach Shack, Anjuna',
  '2026-07-06', '22:00',
  'Curlies brings back the original Goa Trance energy for a full-moon session. Psytrance, forest, full-on — the genre that put India on the global map.',
  '["Goa Trance","Psytrance","Forest"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'The Humming Tree — Indie Electronic Night',
  'https://skillboxes.com/events/the-humming-tree-indie-electronic',
  'skillboxes', 'Bangalore', 'The Humming Tree, Indiranagar',
  '2026-07-11', '21:00',
  'The Humming Tree''s indie electronic series. Live acts + DJs. Bengaluru''s most eclectic room — you might hear ambient, you might hear jungle, you''ll leave with new favourites.',
  '["Indie Electronic","Experimental","Electronic"]'::jsonb,
  NULL, false, 'published', NOW(), NOW()
),
(
  'Boiler Room India 2026 — Bengaluru Edition',
  'https://boilerroom.tv/recording/india-2026-bangalore',
  'editorial', 'Bangalore', 'TBA',
  '2026-08-09', '20:00',
  'Boiler Room returns to Bengaluru for its second India edition. Lineup to be announced. Expect CCD-adjacent selectors on the stream.',
  '["House","Techno","Jungle","Garage"]'::jsonb,
  NULL, true, 'published', NOW(), NOW()
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

-- ── Verify ───────────────────────────────────────────────────
SELECT city, COUNT(*) AS event_count
FROM curated_events
WHERE submission_status = 'published'
GROUP BY city
ORDER BY event_count DESC;
