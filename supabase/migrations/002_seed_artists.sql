-- ============================================================
-- 002_seed_artists.sql
-- Seeds the `artists` table.
--
-- Run AFTER 001_schema.sql.
-- Safe to re-run — uses ON CONFLICT (slug) DO UPDATE.
--
-- Contains: 40 artists (Tier 1–4 Indian electronic scene
--           + CCD residents Startdawg & Merman)
--
-- Columns seeded:
--   slug, name, based_city, from_city, bio, why, genres[],
--   festivals[], instagram, website, booking_email, labels,
--   members, fee_min_inr, fee_max_inr, fee_currency,
--   open_to_bookings, status, source, featured, kind
-- ============================================================

-- Ensure the kind column exists (added in a later migration)
ALTER TABLE artists ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'musician';

INSERT INTO artists (
  slug, name, based_city, from_city, bio, why,
  genres, festivals, instagram, website, booking_email,
  labels, members, fee_min_inr, fee_max_inr, fee_currency,
  open_to_bookings, status, source, featured, kind,
  created_at, updated_at
) VALUES

-- ── Tier 1 ──────────────────────────────────────────────────
(
  'indo-warehouse', 'INDO WAREHOUSE', 'New York, USA', 'India',
  'First South Asian electronic collective at Coachella 2025 (both weekends). Coined "Indo House" — a globally recognized genre blending Indian classical/folk with house/techno. Also played Hï Ibiza and F1 Singapore.',
  'First South Asian electronic collective at Coachella. Coined "Indo House". The biggest Indian electronic export right now.',
  ARRAY['Indo House','Melodic Techno'],
  ARRAY['Coachella 2025 (both weekends)','Hï Ibiza','F1 Singapore'],
  'indowarehouse', 'https://indowarehouse.com', NULL,
  NULL, 'Kahani + Kunal Merchant', NULL, NULL, 'USD',
  true, 'approved', 'manual', true, 'musician',
  NOW(), NOW()
),
(
  'nikki-nair', 'NIKKI NAIR', 'USA', 'India',
  'Most booked Indian-origin producer in global underground. Boiler Room Hyderabad (May 2022). Pure electronic — no Bollywood, no EDM.',
  'Most booked Indian-origin producer in global underground. Represents Indian-origin talent at highest level.',
  ARRAY['Breakbeat','Techno','Electro'],
  ARRAY['Multiple global bookings'],
  'nikkinair', NULL, NULL,
  NULL, NULL, 500000, 1500000, 'USD',
  true, 'approved', 'manual', true, 'musician',
  NOW(), NOW()
),
(
  'kohra', 'KOHRA', 'New Delhi', 'India',
  'Most Boiler Room appearances by an Indian solo electronic artist (Delhi NCR Jun 2024, Bengaluru Aug 2024). Founder of Qilla Records. Magnetic Fields, DGTL, Echoes of Earth regular.',
  'Most Boiler Room appearances by an Indian solo electronic artist. Defines India''s credible techno output. Qilla Records founder.',
  ARRAY['Techno','House','Minimal'],
  ARRAY['Magnetic Fields','DGTL','Echoes of Earth'],
  'kohra', 'https://artistivity.com', 'booking@artistivity.com',
  'Qilla Records', 'Madhav Shorey', 80000, 250000, 'INR',
  true, 'approved', 'manual', true, 'musician',
  NOW(), NOW()
),

-- ── Tier 2 ──────────────────────────────────────────────────
(
  'sheral', 'SHERAL', 'India', 'India',
  'Rising female DJ in Indian electronic scene. Boiler Room Delhi NCR (June 2024). DGTL circuit regular.',
  'Rising female DJ in Indian electronic scene. Part of new wave getting global platform exposure.',
  ARRAY['Electronic','Techno'],
  ARRAY['Magnetic Fields','DGTL circuit'],
  'sheral', NULL, NULL,
  NULL, NULL, 30000, 80000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'prismer', 'PRISMER', 'India', 'India',
  'Emerging Indian electronic producer. Boiler Room Delhi NCR (June 2024). Magnetic Fields regular.',
  'Emerging Indian electronic producer on world stage.',
  ARRAY['Electronic'],
  ARRAY['Magnetic Fields'],
  'prismer', NULL, NULL,
  NULL, NULL, 25000, 70000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'girls-night-out', 'GIRLS NIGHT OUT', 'India', 'India',
  'Collective pushing India''s electronic sound forward. Boiler Room Delhi NCR (June 2024). Magnetic Fields regular.',
  'Collective pushing India''s electronic sound forward.',
  ARRAY['Electronic'],
  ARRAY['Magnetic Fields'],
  NULL, NULL, NULL,
  NULL, NULL, 30000, 80000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'ak-sports', 'AK SPORTS', 'India', 'India',
  'New generation of Indian electronic acts breaking into global platforms. Boiler Room Delhi NCR (June 2024).',
  'New generation of Indian electronic acts breaking into global platforms.',
  ARRAY['Electronic'],
  ARRAY['Magnetic Fields'],
  'aksports', NULL, NULL,
  NULL, NULL, 25000, 70000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'midnight-traffic', 'MIDNIGHT TRAFFIC', 'Hyderabad', 'India',
  'Active Hyderabad electronic duo. Boiler Room Hyderabad (May 2022). Regional scene builders keeping Hyderabad''s electronic scene alive outside Mumbai/Delhi.',
  'Active Hyderabad electronic duo, regional scene builders.',
  ARRAY['Electronic','House'],
  ARRAY['Krunk events','Hyderabad scene'],
  'midnighttraffic', NULL, NULL,
  NULL, NULL, 20000, 60000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'suchi', 'SUCHI', 'India', 'India',
  'Early Indian electronic artist to get Boiler Room platform. Boiler Room Hyderabad (May 2022). Krunk events regular.',
  'Early Indian electronic artist to get Boiler Room platform.',
  ARRAY['Electronic'],
  ARRAY['Krunk events'],
  NULL, NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'murthovic', 'MURTHOVIC', 'India', 'India',
  'Part of India''s original Boiler Room class. Boiler Room Hyderabad (May 2022). Magnetic Fields (multiple years) regular.',
  'Part of India''s original Boiler Room class. Magnetic Fields regular.',
  ARRAY['Electronic'],
  ARRAY['Magnetic Fields'],
  'murthovic', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'kandy-kuri', 'KANDY KURI', 'Bengaluru', 'India',
  'South Indian electronic representative on Boiler Room. Boiler Room Bengaluru (Aug 2024). Magnetic Fields regular.',
  'South Indian electronic representative on Boiler Room. Bengaluru scene pillar.',
  ARRAY['Electronic'],
  ARRAY['Magnetic Fields'],
  'kandykuri', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),


-- ── Tier 3 ──────────────────────────────────────────────────
(
  'dj-sartek', 'DJ SARTEK', 'New Delhi', 'New Delhi',
  'First Indian on Hardwell''s Revealed Recordings. All releases on Beatport Top 100. Opened for David Guetta, Justin Bieber, Martin Garrix, Steve Aoki, Tiesto. Meta Awards winner 2024.',
  'First Indian on Hardwell''s Revealed Recordings. Beatport Top 100. Meta Awards winner 2024.',
  ARRAY['Folk House','Desi Techno','Progressive'],
  ARRAY['DGTL','Multiple international'],
  'sartek', 'https://sartekmusic.in', NULL,
  'Revealed Recordings (Hardwell)', 'Sarthak Sardana', 100000, 300000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'anish-sood', 'ANISH SOOD', 'Goa', 'India',
  'Only Indian on Anjunadeep (UK). Credible progressive sound, not commercial EDM. Performed with David Guetta, Kygo, Tiesto. 15+ years experience.',
  'Only Indian on Anjunadeep. Credible progressive sound. 15+ years experience.',
  ARRAY['Progressive Trance','Deep House','Anjunadeep'],
  ARRAY['DGTL','Echoes of Earth','International'],
  'anyasa.music', 'https://anyasa.com', 'hello@anyasa.com',
  'Anjunadeep (UK)', 'ANYASA', 100000, 300000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'lost-stories', 'LOST STORIES', 'Mumbai', 'Mumbai',
  'Pioneers of Indian folk-electronic fusion. Hits "Mahi", "Bombay Dreams", "Faded Remix". International festival regulars — DGTL, Lollapalooza. 500K+ followers.',
  'Pioneers of Indian folk-electronic fusion. International festival regulars. 500K+ followers.',
  ARRAY['Indian Folk + Electronic','Progressive House'],
  ARRAY['DGTL','Lollapalooza','Multiple international'],
  'loststoriesmusic', NULL, NULL,
  NULL, 'Prayag Mehta & Rishab Joshi', 150000, 400000, 'INR',
  true, 'approved', 'manual', true, 'musician',
  NOW(), NOW()
),
(
  'dualist-inquiry', 'DUALIST INQUIRY', 'Goa', 'Goa',
  'Goa''s indie electronic pioneer. Founder of Field Works label. Represents India''s independent electronic culture. Echoes of Earth, Lollapalooza 2024, Ziro 2025.',
  'Goa''s indie electronic pioneer. Founder of Field Works. Represents India''s independent electronic culture.',
  ARRAY['Indie Electronic','Experimental'],
  ARRAY['Echoes of Earth 2024','Lollapalooza 2024','Ziro 2025'],
  'dualistinquiry', 'https://intersect9.in', NULL,
  'Field Works', 'Sahej Bakshi', 40000, 100000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'dj-ravetek', 'DJ RAVETEK', 'Mumbai', 'Mumbai',
  'First Indian signed to Tiesto''s Musical Freedom label. Shared stage with world''s top DJs. Rare achievement for Indian artist.',
  'First Indian signed to Tiesto''s Musical Freedom. Rare achievement for Indian artist.',
  ARRAY['EDM','Big Room'],
  ARRAY['Multiple international'],
  'theartisteco', NULL, NULL,
  'Musical Freedom (Tiesto''s label)', NULL, 40000, 100000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'project-91', 'PROJECT 91', 'Pune', 'Pune',
  'India''s most credible electronic duo on international labels — Revealed Recordings, Generation Smash. Performed in 8 countries.',
  'India''s most credible electronic duo on international labels. Performed in 8 countries.',
  ARRAY['EDM','House'],
  ARRAY['DGTL','Multiple international'],
  'project91music', NULL, NULL,
  'Revealed Recordings / Generation Smash', 'Anil & Sunil Sindagi', 80000, 200000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'dj-ravator', 'DJ RAVATOR', 'New Delhi', 'New Delhi',
  'Represents India''s independent artist movement. Self-made producer. Delhi underground electronic scene. DGTL circuit.',
  'Represents India''s independent artist movement. Delhi underground electronic scene.',
  ARRAY['Independent','EDM','Bass'],
  ARRAY['DGTL circuit'],
  'saprasap', 'https://sapwroks.co', NULL,
  NULL, NULL, 30000, 80000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),


-- ── Tier 4 — Part 1 ──────────────────────────────────────────
(
  'monophonik', 'MONOPHONIK', 'India', 'India',
  'Analog synth enthusiast. Magnetic Fields (multiple years), DGTL, Lollapalooza regular. Qilla Records artist.',
  'Analog synth enthusiast. Regular on India''s most credible electronic festival lineup. Qilla Records artist.',
  ARRAY['Analog Synth','Electronic'],
  ARRAY['Magnetic Fields','DGTL','Lollapalooza'],
  'monophonik', 'https://thewildcity.com', 'info@thewildcity.com',
  NULL, 'Shatrunjai Diwan', 30000, 80000, 'INR',
  false, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'kaleekarma', 'KALEEKARMA', 'India', 'India',
  'Magnetic Fields (multiple years) regular. Part of India''s forward-thinking electronic community at Alsisar.',
  'Magnetic Fields regular. Part of India''s forward-thinking electronic community at Alsisar.',
  ARRAY['Electronic','House'],
  ARRAY['Magnetic Fields'],
  'kaleekarma', NULL, NULL,
  NULL, NULL, 25000, 70000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'sid-vashi', 'SID VASHI', 'Mumbai', 'Michigan, USA',
  'Trained jazz saxophonist + electronic producer. Signed to Only Much Louder (OML). Lollapalooza 2025.',
  'Trained jazz saxophonist + electronic producer. OML signed. Lollapalooza 2025.',
  ARRAY['Jazz','Electronic','Experimental'],
  ARRAY['Lollapalooza 2025'],
  'sidvashi', NULL, NULL,
  NULL, NULL, 40000, 100000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'sandunes', 'SANDUNES', 'Mumbai', 'India',
  'One of India''s most prominent electronic producers. Apple Music Up Next Artist 2022. Red Bull Music Academy BaseCamp Dubai. OneBeat Residency USA. NH7 Weekender regular.',
  'Apple Music Up Next Artist 2022. Red Bull Music Academy BaseCamp Dubai. OneBeat Residency USA.',
  ARRAY['Electronic','Experimental','Live'],
  ARRAY['NH7 Weekender','Multiple festivals'],
  'sandunesmusic', NULL, 'sandunesmusic@gmail.com',
  NULL, 'Sanaya Ardeshir', 50000, 120000, 'INR',
  true, 'approved', 'manual', true, 'musician',
  NOW(), NOW()
),
(
  'karan-kanchan', 'KARAN KANCHAN', 'Mumbai', 'India',
  'Beatmaker/producer bridging hip-hop and electronic. Lollapalooza 2024 curated set. Battleground Mobile India composer.',
  'Beatmaker/producer bridging hip-hop and electronic. Lollapalooza curated set.',
  ARRAY['Hip-Hop','Electronic','Beats'],
  ARRAY['Lollapalooza 2024'],
  'karankanchan', 'https://karankanchan.com', 'contact@karankanchan.com',
  NULL, NULL, 100000, 500000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'komorebi', 'KOMOREBI', 'India', 'India',
  'Singer-producer bridging electronic and indie. Lollapalooza 2024. NH7 Weekender performer. Unique electronic soundscapes.',
  'Singer-producer bridging electronic and indie. Lollapalooza 2024 performer.',
  ARRAY['Electronic','Indie'],
  ARRAY['Lollapalooza 2024','NH7 Weekender'],
  'komorebimind', NULL, NULL,
  NULL, 'Tarana Marwah', 30000, 80000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'prabh-deep', 'PRABH DEEP', 'New Delhi', 'India',
  'Indian rapper with electronic production. Azadi Records. Lollapalooza 2024. NH7 Weekender. Socially conscious hip-hop with electronic beats.',
  'Indian rapper with electronic production. Azadi Records. Lollapalooza 2024.',
  ARRAY['Hip-Hop','Electronic'],
  ARRAY['Lollapalooza 2024','NH7 Weekender'],
  'azadirecords.com', 'https://azadirecords.com', 'prabhdeepmerch@azadirecords.com',
  'Azadi Records', NULL, 50000, 150000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'stalvart-john', 'STALVART JOHN', 'India', 'India',
  'Part of India''s electronic DJ-producer community. Lollapalooza 2024.',
  'Part of India''s electronic DJ-producer community. Lollapalooza 2024.',
  ARRAY['Electronic','House'],
  ARRAY['Lollapalooza 2024'],
  'stalvartjohn', NULL, NULL,
  NULL, NULL, 25000, 60000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'chrms', 'CHRMS', 'India', 'India',
  'Future bass/electro producer. Lollapalooza 2024. NH7 Weekender. Krunk affiliated.',
  'Future bass/electro producer. Lollapalooza 2024. Krunk affiliated.',
  ARRAY['Future Bass','Electro'],
  ARRAY['Lollapalooza 2024','NH7 Weekender'],
  'chrms', 'https://creatingconversion.com', 'sohail@krunklive.creatingconversion.com',
  NULL, NULL, 25000, 60000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'sickflip', 'SICKFLIP', 'India', 'India',
  'Bass music producer. Managed by Across Artists. Strong in Indian bass scene. NH7 Weekender, DGTL circuit regular.',
  'Bass music producer. Across Artists management. Strong in Indian bass scene.',
  ARRAY['Bass','Electronic'],
  ARRAY['NH7 Weekender','DGTL circuit'],
  'sickflip', 'https://acrossartists.com', 'ayush@acrossartists.com',
  NULL, NULL, 40000, 100000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),


-- ── Tier 4 — Part 2 ──────────────────────────────────────────
(
  'dotdat', 'DOTDAT', 'Goa', 'Pune',
  'Standout figure in Indian techno scene. Goa-based. Groove-infused sci-fi techno. Echoes of Earth 2025, DGTL.',
  'Standout figure in Indian techno scene. Groove-infused sci-fi techno. Rising force.',
  ARRAY['Techno'],
  ARRAY['Echoes of Earth 2025','DGTL'],
  'dotdatofficial', 'https://oddx.in', 'rajat@oddx.in',
  NULL, NULL, 30000, 80000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'bullzeye', 'BULLZEYE', 'India', 'India',
  'One of the most booked DJs in India. Only Indian DJ to play Ellum Audio showcase in Goa. Played alongside Carl Cox, Dixon, Nina Kraviz, Maceo Plex. Paradiso Amsterdam, Feel Festival Berlin, Ritter Butzke Berlin. Owner of Rage Entertainment.',
  'One of the most booked DJs in India. Only Indian DJ to play Ellum Audio showcase in Goa.',
  ARRAY['Techno','House'],
  ARRAY['DGTL 2025','Sunburn','Supersonic','Awakenings India'],
  'bullzeye', NULL, NULL,
  NULL, NULL, 60000, 150000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'dreamstates', 'DREAMSTATES', 'India', 'India',
  'Psychedelic electronic producer. DGTL India 2025, Echoes of Earth.',
  'Part of DGTL India 2025. Psychedelic electronic sound.',
  ARRAY['Electronic','Psychedelic'],
  ARRAY['DGTL 2025','Echoes of Earth'],
  'dreamstates', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'mogasu', 'MOGASU', 'India', 'India',
  'Part of DGTL India 2025 and Echoes of Earth 2024 lineup.',
  'Part of DGTL India 2025 and Echoes of Earth lineup.',
  ARRAY['Electronic'],
  ARRAY['DGTL 2025','Echoes of Earth 2024'],
  'mogasu', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'bawra', 'BAWRA', 'India', 'India',
  'Part of DGTL India 2025 domestic lineup.',
  'Part of DGTL India 2025 domestic lineup.',
  ARRAY['Electronic'],
  ARRAY['DGTL 2025','Echoes of Earth 2024'],
  'bawra', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'hamza-rahimtula', 'HAMZA RAHIMTULA', 'Rajasthan', 'India',
  'Rajasthan folk meets electronic. Echoes of Earth (multiple years). Magnetic Fields regular. Unique sound blending traditional folk with contemporary beats.',
  'Rajasthan folk meets electronic. Regular at Echoes of Earth.',
  ARRAY['Folk','Electronic','House'],
  ARRAY['Echoes of Earth','Magnetic Fields'],
  'hamzarahimtula', NULL, NULL,
  NULL, NULL, 30000, 80000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'shantam', 'SHANTAM', 'India', 'India',
  'Part of India''s electronic scene. Echoes of Earth 2024, Magnetic Fields regular.',
  'Part of India''s electronic scene. Echoes of Earth regular.',
  ARRAY['Electronic'],
  ARRAY['Echoes of Earth 2024','Magnetic Fields'],
  'shantam', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'weird-sounding-dude', 'WEIRD SOUNDING DUDE', 'India', 'India',
  'Part of India''s electronic producer community. Echoes of Earth 2024.',
  'Part of India''s electronic producer community.',
  ARRAY['Electronic','House'],
  ARRAY['Echoes of Earth 2024'],
  'weirdsoundingdude', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'jatayu', 'JATAYU', 'Chennai', 'Chennai',
  'Chennai band expanding to six-piece with horns. Carnatic foundations with funk, rock, jazz, math rock. Lollapalooza 2024 + Echoes of Earth 2025.',
  'Chennai band. Carnatic foundations with funk, rock, jazz. Lollapalooza 2024 + Echoes of Earth 2025.',
  ARRAY['Carnatic Jazz','Funk','Electronic'],
  ARRAY['Echoes of Earth 2025','Lollapalooza 2024'],
  'jatayu', NULL, NULL,
  NULL, NULL, 30000, 80000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'long-distances', 'LONG DISTANCES', 'Mumbai', 'Mumbai',
  'Mumbai post-punk/shoegaze band with electronic elements. Lollapalooza 2024. Echoes of Earth 2025.',
  'Mumbai post-punk/shoegaze band with electronic elements. Lollapalooza 2024.',
  ARRAY['Post-Punk','Shoegaze','Electronic'],
  ARRAY['Echoes of Earth 2025','Lollapalooza 2024'],
  'longdistances', NULL, NULL,
  NULL, NULL, 25000, 60000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),


-- ── Tier 4 — Part 3 ──────────────────────────────────────────
(
  'the-f16s', 'THE F16s', 'Chennai', 'Chennai',
  'Chennai rock act with electronic elements. Echoes of Earth 2025. NH7 Weekender regular.',
  'Chennai rock act. Echoes of Earth 2025. NH7 Weekender regular.',
  ARRAY['Rock','Electronic'],
  ARRAY['Echoes of Earth 2025','NH7 Weekender'],
  'thef16s', NULL, NULL,
  NULL, NULL, 40000, 100000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'madame-gandhi', 'MADAME GANDHI', 'USA', 'India/USA',
  'Indian-origin producer/drummer Kiran Gandhi. Rhythm-driven sets tied to empowerment and activism. Echoes of Earth 2025.',
  'Indian-origin producer/drummer. Rhythm-driven activist sets. Echoes of Earth 2025.',
  ARRAY['Electronic','Percussion'],
  ARRAY['Echoes of Earth 2025'],
  'madamegandhi', NULL, NULL,
  NULL, 'Kiran Gandhi', NULL, NULL, 'USD',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'sunju-hargun', 'SUNJU HARGUN', 'India', 'India',
  'Magnetic Fields (multiple years) regular. Part of India''s forward-thinking electronic scene.',
  'Magnetic Fields regular. Part of India''s forward-thinking scene.',
  ARRAY['Electronic'],
  ARRAY['Magnetic Fields'],
  'sunjuhargun', NULL, NULL,
  NULL, NULL, 25000, 70000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'lush-lata', 'LUSH LATA', 'India', 'India',
  'Magnetic Fields (multiple years) regular.',
  'Magnetic Fields regular.',
  ARRAY['Electronic'],
  ARRAY['Magnetic Fields'],
  'lushlata', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'yung-raj', 'YUNG.RAJ', 'India', 'India',
  'Part of India''s electronic/hip-hop crossover scene. Magnetic Fields, NH7 Weekender.',
  'Part of India''s electronic/hip-hop crossover scene.',
  ARRAY['Electronic','Hip-Hop'],
  ARRAY['Magnetic Fields','NH7 Weekender'],
  'yung.raj', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'spryk', 'SPRYK', 'India', 'India',
  'Part of India''s electronic scene. Magnetic Fields, Lollapalooza 2025.',
  'Part of India''s electronic scene. Lollapalooza 2025.',
  ARRAY['Electronic'],
  ARRAY['Magnetic Fields','Lollapalooza 2025'],
  'spryk', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
(
  'jbabe', 'JBABE', 'India', 'India',
  'Part of India''s electronic community. Magnetic Fields, Lollapalooza 2024.',
  'Part of India''s electronic community. Lollapalooza 2024.',
  ARRAY['Electronic'],
  ARRAY['Magnetic Fields','Lollapalooza 2024'],
  'jbabe', NULL, NULL,
  NULL, NULL, 20000, 50000, 'INR',
  true, 'approved', 'manual', false, 'musician',
  NOW(), NOW()
),
-- CCD residents (not in the original 100 but essential)
(
  'startdawg', 'STARTDAWG', 'Bengaluru', 'Bengaluru',
  'Bangalore staple. House selector with a soft spot for disco edits and the long build. CCD resident DJ. Plays Bar Wild, Social, and underground club nights across the city.',
  'Bangalore staple. House selector with a soft spot for disco edits and the long build. CCD resident.',
  ARRAY['House','Disco','Garage'],
  ARRAY['CCD at Bar Wild','CCDXSOCIAL series'],
  'startdawg', NULL, NULL,
  NULL, NULL, 15000, 40000, 'INR',
  true, 'approved', 'manual', true, 'musician',
  NOW(), NOW()
),
(
  'merman', 'MERMAN', 'Bengaluru', 'Bengaluru',
  'Garage, jungle, and the kind of low-end that fixes posture problems. CCD resident DJ. Plays b2b with Startdawg at all CCD episodes.',
  'Garage, jungle, and the kind of low-end that fixes posture problems. CCD resident.',
  ARRAY['Garage','Jungle','D&B'],
  ARRAY['CCD at Bar Wild','CCDXSOCIAL series'],
  'merman', NULL, NULL,
  NULL, NULL, 15000, 40000, 'INR',
  true, 'approved', 'manual', true, 'musician',
  NOW(), NOW()
)

ON CONFLICT (slug) DO UPDATE SET
  name             = EXCLUDED.name,
  based_city       = EXCLUDED.based_city,
  from_city        = EXCLUDED.from_city,
  bio              = EXCLUDED.bio,
  why              = EXCLUDED.why,
  genres           = EXCLUDED.genres,
  festivals        = EXCLUDED.festivals,
  instagram        = EXCLUDED.instagram,
  website          = EXCLUDED.website,
  booking_email    = EXCLUDED.booking_email,
  labels           = EXCLUDED.labels,
  members          = EXCLUDED.members,
  fee_min_inr      = EXCLUDED.fee_min_inr,
  fee_max_inr      = EXCLUDED.fee_max_inr,
  open_to_bookings = EXCLUDED.open_to_bookings,
  status           = EXCLUDED.status,
  featured         = EXCLUDED.featured,
  kind             = EXCLUDED.kind,
  updated_at       = NOW();

-- Verify
SELECT slug, name, based_city, featured, status FROM artists ORDER BY name;
