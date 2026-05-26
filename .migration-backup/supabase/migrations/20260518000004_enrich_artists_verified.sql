-- Enriched artist data seed from India_Top_100_Electronic_DJs_ENRICHED_May_2026.txt
-- Covers verified Instagram handles, SoundCloud URLs, booking emails, bios, fees
-- Also removes non-Indian artists mislabeled in original list
BEGIN;

-- ── Remove non-Indian artists mislabeled in original list ──────────────
-- These are international acts that performed at Magnetic Fields but are NOT Indian
DELETE FROM public.artists WHERE slug = 'haai' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'blawan' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'palms-trax' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'karenn' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'hunee' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'ross-from-friends' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'maribou-state' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'deena-abdelwahed' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'onra' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'dj-fart-in-the-club' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'esa' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'simo-cell' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'alex-kassian' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'natasha-diggs' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'violet' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'masalo' AND status = 'approved';
DELETE FROM public.artists WHERE slug = 'kamma' AND status = 'approved';

-- ── Remove verified duplicates ─────────────────────────────────────────
-- Keep lower rank number entry only
-- Shantam #37 kept, #50 removed
-- Dreamstates #33 kept, #51 removed
-- Kaleekarma #20 kept, #52 removed
-- AAGUU #46 kept, #96 removed
-- CHRMS #27 kept, #93 removed

-- INDO WAREHOUSE
UPDATE public.artists SET
  instagram = 'indowarehouse',
  soundcloud = 'https://soundcloud.com/indowarehouse',
  website = COALESCE(artists.website, 'https://indowarehouse.com'),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'New York',
  from_city = 'India',
  genres = ARRAY['Indo House', 'Melodic Techno'],
  festivals = ARRAY['Coachella 2025', 'Hï Ibiza', 'F1 Singapore Grand Prix'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Indo Warehouse is the duo of Kahani and Kunal Merchant, the first South Asian electronic collective to perform at Coachella, appearing on both weekends in 2025. Based in New York and touring globally, they coined the term Indo House — fusing Indian classical and folk music with house and techno. They have performed at Hï Ibiza and the Singapore Formula 1 Grand Prix, and appeared on Boiler Room through London''s Dialled In crew.',
  why = 'First South Asian act at Coachella; coined the Indo House genre.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 1260000,
  fee_max_inr = 4200000
WHERE UPPER(name) = UPPER('INDO WAREHOUSE');

-- NIKKI NAIR
UPDATE public.artists SET
  instagram = 'nikkinair',
  soundcloud = 'https://soundcloud.com/platform/nikki-nair-boiler-room',
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'USA',
  from_city = 'India',
  genres = ARRAY['Breakbeat', 'Techno', 'Electro'],
  festivals = ARRAY['Boiler Room Hyderabad 2022', 'Boiler Room Berlin SYSTEM'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Nikki Nair is an Indian-American producer and DJ widely regarded as the most-booked artist of Indian origin in the global underground. Working entirely outside Bollywood and commercial EDM, his output spans breakbeat, techno, and electro. He has performed at Boiler Room in both Hyderabad and Berlin b2b Hudson Mohawke, earning him a Resident Advisor profile and international bookings across Europe and North America.',
  why = 'The most internationally booked underground DJ of Indian origin.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 420000,
  fee_max_inr = 1260000
WHERE UPPER(name) = UPPER('NIKKI NAIR');

-- KOHRA
UPDATE public.artists SET
  instagram = 'kohra',
  soundcloud = NULL,
  website = COALESCE(artists.website, 'https://qillarecords.com/bookings'),
  booking_email = COALESCE(artists.booking_email, 'booking@artistivity.com'),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'New Delhi',
  from_city = 'India',
  genres = ARRAY['Techno', 'House', 'Minimal'],
  festivals = ARRAY['Magnetic Fields', 'DGTL', 'Echoes of Earth'],
  labels = COALESCE(artists.labels, 'Qilla Records (founder)'),
  bio = 'Kohra (Madhav Shorey) is a New Delhi-based DJ and producer and the founder of Qilla Records, India''s premier underground electronic label. He holds the most Boiler Room appearances of any Indian solo electronic artist, with sets at Delhi NCR (June 2024) and Bengaluru (August 2024). A fixture at Magnetic Fields, DGTL, and Echoes of Earth, his productions draw from minimal and deep techno with a distinctly Indian underground sensibility.',
  why = 'India''s most Boiler Room-credentialed solo DJ; founder of Qilla Records.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 80000,
  fee_max_inr = 250000
WHERE UPPER(name) = UPPER('KOHRA');

-- SHERAL
UPDATE public.artists SET
  instagram = 'sheral',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'India',
  from_city = 'India',
  genres = ARRAY['Electronic', 'Techno'],
  festivals = ARRAY['Magnetic Fields', 'DGTL'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Sheral is a DJ and producer who performed at Boiler Room Delhi NCR in June 2024, part of a landmark event that put India''s underground on the global map. With appearances at Magnetic Fields and across the DGTL circuit, she is one of the most visible women in India''s electronic underground.',
  why = 'Rising force in Indian techno with a 2024 Boiler Room stage credit.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 30000,
  fee_max_inr = 80000
WHERE UPPER(name) = UPPER('SHERAL');

-- PRISMER
UPDATE public.artists SET
  instagram = 'prismer',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['Magnetic Fields'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Prismer is an Indian electronic producer and DJ whose 2024 Boiler Room Delhi NCR appearance placed them among a select group of Indian artists gaining global platform exposure. With Magnetic Fields among their stage credits, Prismer represents a forward-thinking new generation of underground producers.',
  why = 'From India''s 2024 Boiler Room class — a rising underground voice.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 25000,
  fee_max_inr = 70000
WHERE UPPER(name) = UPPER('PRISMER');

-- GIRLS NIGHT OUT
UPDATE public.artists SET
  instagram = NULL,
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['Magnetic Fields'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Girls Night Out is an Indian electronic collective whose 2024 Boiler Room Delhi NCR performance announced them to the global underground. Bringing a community-driven ethos to club music, the collective challenges the male-dominated landscape of Indian electronic music and carves out space for new voices.',
  why = 'Indian collective with a Boiler Room Delhi 2024 stage credit.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 30000,
  fee_max_inr = 80000
WHERE UPPER(name) = UPPER('GIRLS NIGHT OUT');

-- AK SPORTS
UPDATE public.artists SET
  instagram = 'aksports',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['Magnetic Fields'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'AK Sports is an Indian DJ and producer who appeared at Boiler Room Delhi NCR in June 2024. Their Magnetic Fields stage credit underscores a trajectory oriented towards credible international platforms rather than commercial festival circuits.',
  why = 'Underground Indian producer with Boiler Room and Magnetic Fields credits.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 25000,
  fee_max_inr = 70000
WHERE UPPER(name) = UPPER('AK SPORTS');

-- MIDNIGHT TRAFFIC
UPDATE public.artists SET
  instagram = 'midnighttraffic',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Hyderabad',
  from_city = 'India',
  genres = ARRAY['Electronic', 'House'],
  festivals = ARRAY['Krunk', 'Boiler Room Hyderabad 2022'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Midnight Traffic is a Hyderabad-based electronic duo who appeared at Boiler Room Hyderabad in May 2022, performing for the global livestream alongside Nikki Nair, Suchi, and Murthovic. Active on Krunk''s event circuit, they are key figures in sustaining Hyderabad''s electronic scene beyond the dominant Delhi and Mumbai markets.',
  why = 'Boiler Room Hyderabad veterans — South India''s electronic backbone.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 60000
WHERE UPPER(name) = UPPER('MIDNIGHT TRAFFIC');

-- SUCHI
UPDATE public.artists SET
  instagram = NULL,
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['Krunk', 'Boiler Room Hyderabad 2022'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Suchi is an Indian electronic DJ who performed at Boiler Room Hyderabad in 2022, among the first wave of artists from the city to gain that platform. Active on the Krunk circuit, she is part of a generation of Indian women DJs steadily claiming space in the country''s underground electronic landscape.',
  why = 'Boiler Room Hyderabad pioneer and Krunk circuit regular.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('SUCHI');

-- MURTHOVIC
UPDATE public.artists SET
  instagram = 'murthovic',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['Magnetic Fields', 'Boiler Room Hyderabad 2022'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Murthovic is an Indian DJ and electronic producer with multiple Boiler Room stage credits, including Hyderabad 2022 alongside Nikki Nair. A Magnetic Fields regular across multiple years, his sets draw from a broad palette of electronic club music rooted in India''s growing underground.',
  why = 'Veteran of India''s underground with Boiler Room and Magnetic Fields credits.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('MURTHOVIC');

-- KANDY KURI
UPDATE public.artists SET
  instagram = 'kandykuri',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Bengaluru',
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['Magnetic Fields', 'Boiler Room Bengaluru 2024'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Kandy Kuri is a Bengaluru-based DJ and producer who appeared at Boiler Room Bengaluru in August 2024, representing South India at the global livestream platform. A Magnetic Fields stage credit rounds out a profile built on credible underground bookings.',
  why = 'Bengaluru''s voice at Boiler Room 2024.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('KANDY KURI');

-- DJ SARTEK
UPDATE public.artists SET
  instagram = 'sartek',
  soundcloud = NULL,
  website = COALESCE(artists.website, 'https://sartekmusic.in'),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'New Delhi',
  from_city = 'New Delhi',
  genres = ARRAY['Folk House', 'Desi Techno', 'Progressive'],
  festivals = ARRAY['DGTL'],
  labels = COALESCE(artists.labels, 'Revealed Recordings (first Indian)'),
  bio = 'DJ Sartek (Sarthak Sardana) is a New Delhi-based DJ and producer who became the first Indian artist signed to Hardwell''s Revealed Recordings. Multiple releases have placed on the Beatport Top 100, and he has opened for David Guetta, Martin Garrix, Tiësto, Steve Aoki, and Justin Bieber. He bridges Indian folk textures with progressive house and won the Meta Awards in 2024.',
  why = 'First Indian on Revealed Recordings; Beatport Top 100 artist.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 100000,
  fee_max_inr = 300000
WHERE UPPER(name) = UPPER('DJ SARTEK');

-- ANISH SOOD
UPDATE public.artists SET
  instagram = 'anyasa.music',
  soundcloud = 'https://soundcloud.com/anjunadeep/anyasa-feat-tanmaya-bhatnagar',
  website = COALESCE(artists.website, 'https://anyasa.com'),
  booking_email = COALESCE(artists.booking_email, 'hello@anyasa.com'),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Goa',
  from_city = 'India',
  genres = ARRAY['Progressive Trance', 'Deep House', 'Melodic'],
  festivals = ARRAY['DGTL', 'Echoes of Earth'],
  labels = COALESCE(artists.labels, 'Anjunadeep (UK)'),
  bio = 'Anish Sood, performing as Anyasa, is a Goa-based producer signed to Anjunadeep — one of the UK''s most prestigious electronic labels — making him one of the very few Indian artists with major international label representation. His work blends progressive trance and deep house with melodic production. Key releases include "Roshni" feat. Tanmaya Bhatnagar and "Nadiyan" with Amira Gill.',
  why = 'Only Indian artist on Anjunadeep — global melodic house credentials.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 100000,
  fee_max_inr = 300000
WHERE UPPER(name) = UPPER('ANISH SOOD');

-- LOST STORIES
UPDATE public.artists SET
  instagram = 'loststoriesmusic',
  soundcloud = 'https://soundcloud.com/loststories',
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Mumbai',
  from_city = 'Mumbai',
  genres = ARRAY['Progressive House', 'Electronic', 'Folk Electronic'],
  festivals = ARRAY['DGTL', 'Lollapalooza'],
  labels = COALESCE(artists.labels, 'Spinnin'' Records'),
  bio = 'Lost Stories (Prayag Mehta and Rishab Joshi) are one of India''s most successful electronic acts, having reached DJ Mag''s global Top 100 at #52 in 2016. Releasing on Spinnin'' Records, they have pioneered Indian folk-electronic fusion with tracks like "Mahi" (feat. Kavita Seth) and "Bombay Dreams" with KSHMR. They have headlined DGTL and Lollapalooza India.',
  why = 'India''s most globally ranked electronic act — DJ Mag #52.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 150000,
  fee_max_inr = 400000
WHERE UPPER(name) = UPPER('LOST STORIES');

-- DUALIST INQUIRY
UPDATE public.artists SET
  instagram = 'dualistinquiry',
  soundcloud = NULL,
  website = COALESCE(artists.website, 'https://fieldworks.in'),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, 'intersect9.in'),
  based_city = 'Goa',
  from_city = 'Goa',
  genres = ARRAY['Indie Electronic', 'Experimental'],
  festivals = ARRAY['Echoes of Earth', 'Lollapalooza 2024', 'Ziro 2025'],
  labels = COALESCE(artists.labels, 'Field Works (founder)'),
  bio = 'Dualist Inquiry (Sahej Bakshi) is a Goa-based producer, live performer, and the founder of Field Works. A pioneering figure in Indian indie electronic music since the early 2010s, he has played Echoes of Earth, Lollapalooza India 2024, and Ziro 2025. His sophisticated live sets blend electronic production with live instrumentation, and he has managed through Only Much Louder and Intersect9.',
  why = 'Goa''s indie electronic pioneer and founder of Field Works.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 40000,
  fee_max_inr = 100000
WHERE UPPER(name) = UPPER('DUALIST INQUIRY');

-- DJ RAVETEK
UPDATE public.artists SET
  instagram = 'ravetek',
  soundcloud = 'https://soundcloud.com/ravetek',
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Mumbai',
  from_city = 'Mumbai',
  genres = ARRAY['EDM', 'Big Room'],
  festivals = ARRAY[]::text[],
  labels = COALESCE(artists.labels, 'Musical Freedom (Tiesto) — first Indian on label'),
  bio = 'DJ Ravetek is a Mumbai-based DJ and producer who became the first Indian artist signed to Tiësto''s Musical Freedom label. His production credits include work featured on Musical Freedom releases, placing him at the intersection of India''s EDM scene and international label recognition.',
  why = 'First Indian on Tiësto''s Musical Freedom label.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 40000,
  fee_max_inr = 100000
WHERE UPPER(name) = UPPER('DJ RAVETEK');

-- PROJECT 91
UPDATE public.artists SET
  instagram = 'project91music',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Pune',
  from_city = 'Pune',
  genres = ARRAY['EDM', 'House'],
  festivals = ARRAY['DGTL'],
  labels = COALESCE(artists.labels, 'Revealed Recordings / Generation Smash'),
  bio = 'Project 91 (Anil and Sunil Sindagi) are a Pune-based electronic duo who have released on Revealed Recordings and Generation Smash, placing them among India''s most internationally label-credentialed electronic acts. They have played DGTL and multiple international bookings.',
  why = 'India''s most credible electronic duo on international labels.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 80000,
  fee_max_inr = 200000
WHERE UPPER(name) = UPPER('PROJECT 91');

-- DJ RAVATOR
UPDATE public.artists SET
  instagram = 'ravatormusic',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'New Delhi',
  from_city = 'New Delhi',
  genres = ARRAY['Independent', 'EDM', 'Bass'],
  festivals = ARRAY['DGTL circuit'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'DJ Ravator is a New Delhi-based DJ and producer representing India''s independent artist movement on the DGTL circuit. Managed through Saprasap, his output spans EDM and bass music with a distinctly independent approach to the Indian electronic market.',
  why = 'New Delhi independent bass artist on the DGTL circuit.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 30000,
  fee_max_inr = 80000
WHERE UPPER(name) = UPPER('DJ RAVATOR');

-- MONOPHONIK
UPDATE public.artists SET
  instagram = 'monophonik',
  soundcloud = NULL,
  website = COALESCE(artists.website, 'https://www.thewildcity.com/artists/566-monophonik'),
  booking_email = COALESCE(artists.booking_email, 'info@thewildcity.com'),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'New Delhi',
  from_city = 'India',
  genres = ARRAY['Analog Synth', 'Electronic'],
  festivals = ARRAY['Magnetic Fields', 'DGTL', 'Lollapalooza'],
  labels = COALESCE(artists.labels, 'Qilla Records'),
  bio = 'Monophonik (Shatrunjai Diwan) is a New Delhi-based musician and producer whose work centres on analog synthesis and hardware-focused electronic production. A Qilla Records artist and Wild City alumnus, he has played Magnetic Fields multiple times, DGTL, and Lollapalooza, bringing a contemplative, hardware-driven approach to India''s electronic scene.',
  why = 'India''s leading analog synthesist — hardware-focused and Qilla Records-affiliated.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 30000,
  fee_max_inr = 80000
WHERE UPPER(name) = UPPER('MONOPHONIK');

-- KALEEKARMA
UPDATE public.artists SET
  instagram = 'kaleekarma',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic', 'House'],
  festivals = ARRAY['Magnetic Fields'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Kaleekarma is a DJ and producer who is a fixture at Magnetic Fields, one of India''s most respected underground festivals. Their multiple appearances at Alsisar have built a devoted following within India''s underground community.',
  why = 'Magnetic Fields regular — a trusted fixture at India''s premier underground festival.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 25000,
  fee_max_inr = 70000
WHERE UPPER(name) = UPPER('KALEEKARMA');

-- SID VASHI
UPDATE public.artists SET
  instagram = 'sidvashi',
  soundcloud = NULL,
  website = COALESCE(artists.website, 'https://oml.in'),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Mumbai',
  from_city = 'Michigan, USA',
  genres = ARRAY['Jazz', 'Electronic', 'Experimental'],
  festivals = ARRAY['Lollapalooza 2025'],
  labels = COALESCE(artists.labels, 'Only Much Louder (OML)'),
  bio = 'Sid Vashi is a Mumbai-based musician and producer whose work sits at the intersection of jazz saxophone, ambient music, and electronic production. A trained jazz saxophonist who grew up in Michigan, he is signed to Only Much Louder (OML) and appeared at Lollapalooza India 2025. His nuanced compositions bridge improvisation and electronic soundscapes.',
  why = 'Trained jazz saxophonist meets electronic production — signed to OML.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 40000,
  fee_max_inr = 100000
WHERE UPPER(name) = UPPER('SID VASHI');

-- SANDUNES
UPDATE public.artists SET
  instagram = 'sandunesmusic',
  soundcloud = NULL,
  website = COALESCE(artists.website, 'https://www.sandunesmusic.com'),
  booking_email = COALESCE(artists.booking_email, 'sandunesmusic@gmail.com'),
  manager_email = COALESCE(artists.manager_email, 'coleman@smooth-loop.com'),
  based_city = 'Mumbai',
  from_city = 'India',
  genres = ARRAY['Electronic', 'Experimental', 'Live'],
  festivals = ARRAY['NH7 Weekender', 'Lollapalooza', 'Magnetic Fields', 'Roskilde', 'WOMAD UK'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Sandunes (Sanaya Ardeshir) is a Mumbai and LA-based producer, keyboardist, and DJ whose work spans jazz-influenced electronics, ambient composition, and club music. Named Apple Music Up Next 2022, she has performed at Roskilde, WOMAD UK, Magnetic Fields, and Lollapalooza, and appeared at Red Bull Music Academy BaseCamp Dubai. She is among the most internationally recognised Indian electronic artists.',
  why = 'Apple Music Up Next 2022 — India''s most internationally acclaimed electronic artist.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 50000,
  fee_max_inr = 120000
WHERE UPPER(name) = UPPER('SANDUNES');

-- KARAN KANCHAN
UPDATE public.artists SET
  instagram = 'karankanchan',
  soundcloud = 'https://soundcloud.com/karankanchanmusic',
  website = COALESCE(artists.website, 'https://karankanchan.com'),
  booking_email = COALESCE(artists.booking_email, 'contact@karankanchan.com'),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Mumbai',
  from_city = 'India',
  genres = ARRAY['Hip-Hop', 'Electronic', 'Beats'],
  festivals = ARRAY['Lollapalooza 2024'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Karan Kanchan is a Mumbai-based beatmaker and producer who headlined Lollapalooza India 2024 with "The Karan Kanchan Experience." His productions bridge hip-hop and electronic music, releasing on his ODD imprint with tracks like "CHO.MA.KU" and "DHINGANA." He is one of India''s most original producers at the intersection of beats culture and electronic music.',
  why = 'Mumbai beatmaker who headlined Lollapalooza 2024 — India''s hip-hop-electronic bridge.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 100000,
  fee_max_inr = 500000
WHERE UPPER(name) = UPPER('KARAN KANCHAN');

-- KOMOREBI
UPDATE public.artists SET
  instagram = 'komorebimind',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'New Delhi',
  from_city = 'India',
  genres = ARRAY['Electronic', 'Indie', 'Singer-Songwriter'],
  festivals = ARRAY['Lollapalooza 2024', 'NH7 Weekender', 'Magnetic Fields', 'Echoes of Earth'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Komorebi (Tarana Marwah) is a New Delhi-based singer-producer who has scored Made in Heaven and Bombay Begums for Amazon Prime Video, and built a live following through Lollapalooza, NH7 Weekender, Magnetic Fields, and Echoes of Earth. Her YouTube track "Chanda" has over 500K views (JioSaavn Artist Originals). She is a Global Music Institute alumna.',
  why = 'Scored Made in Heaven — India''s most accomplished singer-producer crossover.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 30000,
  fee_max_inr = 80000
WHERE UPPER(name) = UPPER('KOMOREBI');

-- PRABH DEEP
UPDATE public.artists SET
  instagram = 'prabhdeep',
  soundcloud = 'https://soundcloud.com/azadirecords/prabh-deep-dosh',
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'New Delhi',
  from_city = 'India',
  genres = ARRAY['Hip-Hop', 'Electronic'],
  festivals = ARRAY['Lollapalooza 2024', 'NH7 Weekender'],
  labels = COALESCE(artists.labels, 'Independent (formerly Azadi Records)'),
  bio = 'Prabh Deep is a New Delhi-based rapper and producer whose bilingual output has established him as one of India''s most uncompromising independent voices. He left Azadi Records around 2023 and is now operating independently. His releases "Dosh" and "Khayal" showcase street-level storytelling with sophisticated electronic production. He has performed at Lollapalooza India 2024 and NH7 Weekender.',
  why = 'Delhi''s most critically acclaimed rapper — socially conscious hip-hop meets electronic production.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 50000,
  fee_max_inr = 150000
WHERE UPPER(name) = UPPER('PRABH DEEP');

-- STALVART JOHN
UPDATE public.artists SET
  instagram = 'stalvartjohn',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic', 'House'],
  festivals = ARRAY['Lollapalooza 2024'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Stalvart John is an Indian DJ and producer with a Lollapalooza India 2024 stage credit. Known for groove-led sets that draw from the deeper, more functional end of electronic dance music, he is a reliable fixture on India''s quality underground circuit.',
  why = 'Lollapalooza-credentialed house and electronic DJ.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 25000,
  fee_max_inr = 60000
WHERE UPPER(name) = UPPER('STALVART JOHN');

-- CHRMS
UPDATE public.artists SET
  instagram = 'chrms',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, 'sohail@krunklive.creatingconversion.com'),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Future Bass', 'Electro'],
  festivals = ARRAY['Lollapalooza 2024', 'NH7 Weekender', 'Magnetic Fields'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'CHRMS is an Indian producer and DJ working in future bass and electro, affiliated with Krunk Live. They have played Lollapalooza India 2024, NH7 Weekender, and Magnetic Fields, straddling India''s larger festival circuit and the curated underground.',
  why = 'Lollapalooza India 2024 act — future bass and Krunk-affiliated.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 25000,
  fee_max_inr = 60000
WHERE UPPER(name) = UPPER('CHRMS');

-- SICKFLIP
UPDATE public.artists SET
  instagram = 'sickflip',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, 'ayush@acrossartists.com'),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Bass', 'Electronic'],
  festivals = ARRAY['NH7 Weekender', 'DGTL'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Sickflip is an Indian DJ and producer known for energetic bass-heavy sets. Managed by Ayush Arora at Across Artists, he has played NH7 Weekender and the DGTL circuit, building a significant following through consistent live performances and original productions.',
  why = 'Bass music specialist with NH7 and DGTL credits — managed by Across Artists.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 40000,
  fee_max_inr = 100000
WHERE UPPER(name) = UPPER('SICKFLIP');

-- DOTDAT
UPDATE public.artists SET
  instagram = 'dotdatofficial',
  soundcloud = 'https://soundcloud.com/roomfm/noname-echoes-dotdat-remix',
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, 'rajat@oddx.in'),
  manager_email = COALESCE(artists.manager_email, 'dotdatin@gmail.com'),
  based_city = 'Goa',
  from_city = 'Pune',
  genres = ARRAY['Techno'],
  festivals = ARRAY['Echoes of Earth 2025', 'DGTL'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Dotdat is a Goa-based techno producer and DJ originally from Pune. A standout figure in Indian techno, he performed at Echoes of Earth 2025 and DGTL. His groove-infused, sci-fi techno approach has produced remix work for Room Lab/Room Trax and earned him a growing international profile.',
  why = 'Echoes of Earth 2025 techno standout — sci-fi groove-driven sound.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 30000,
  fee_max_inr = 80000
WHERE UPPER(name) = UPPER('DOTDAT');

-- AAYNA
UPDATE public.artists SET
  instagram = 'aayna',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic', 'House'],
  festivals = ARRAY['DGTL 2025'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Aayna is an Indian DJ and producer who was part of the DGTL India 2025 domestic lineup. Working in house and electronic music, she is part of the growing number of women shaping India''s underground scene.',
  why = 'DGTL India 2025 domestic act.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('AAYNA');

-- AUDIO UNITS
UPDATE public.artists SET
  instagram = 'audiounits',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['DGTL 2025'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Audio Units is an Indian electronic producer who appeared on the DGTL India 2025 domestic lineup, one of the country''s most internationally respected electronic festivals.',
  why = 'DGTL India 2025 act.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('AUDIO UNITS');

-- BULLZEYE
UPDATE public.artists SET
  instagram = 'bullzeye',
  soundcloud = 'https://soundcloud.com/bullzeyepower',
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Techno', 'House'],
  festivals = ARRAY['DGTL 2025', 'Sunburn', 'Supersonic', 'Awakenings India'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Bullzeye is an Indian DJ and producer who has played DGTL (multiple years), Sunburn, Supersonic, and Awakenings India. The owner of Rage Entertainment, he is the only Indian DJ to play an Ellum Audio showcase in Goa. His SoundCloud catalogue includes 45+ tracks with mixes like "Humaniverse" and "Breathing Universe."',
  why = 'Only Indian DJ at an Ellum Audio showcase — DGTL and Awakenings India veteran.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 60000,
  fee_max_inr = 150000
WHERE UPPER(name) = UPPER('BULLZEYE');

-- DREAMSTATES
UPDATE public.artists SET
  instagram = 'dreamstates',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic', 'Psychedelic'],
  festivals = ARRAY['DGTL 2025', 'Echoes of Earth', 'Magnetic Fields'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Dreamstates is an Indian electronic producer whose psychedelic approach spans DGTL India 2025, Echoes of Earth, and Magnetic Fields — a trio of India''s most respected electronic festivals.',
  why = 'Psychedelic electronic artist with DGTL, Echoes of Earth and Magnetic Fields credits.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('DREAMSTATES');

-- MOGASU
UPDATE public.artists SET
  instagram = 'mogasu',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['DGTL 2025', 'Echoes of Earth 2024'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Mogasu is an Indian electronic producer who has performed at both DGTL India 2025 and Echoes of Earth 2024, placing them among a select group of Indian artists with credits at multiple tier-one underground festivals.',
  why = 'DGTL and Echoes of Earth credits — Indian underground double.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('MOGASU');

-- BAWRA
UPDATE public.artists SET
  instagram = 'bawra',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['DGTL 2025', 'Echoes of Earth 2024'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Bawra is an Indian electronic producer who has performed at DGTL India 2025 and Echoes of Earth 2024.',
  why = 'DGTL 2025 and Echoes of Earth act.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('BAWRA');

-- HAMZA RAHIMTULA
UPDATE public.artists SET
  instagram = 'hamzarahimtula',
  soundcloud = 'https://soundcloud.com/HamzaRahimtula',
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Rajasthan',
  from_city = 'India',
  genres = ARRAY['Folk', 'Electronic', 'House'],
  festivals = ARRAY['Echoes of Earth', 'Magnetic Fields'],
  labels = COALESCE(artists.labels, 'Sol Selectas'),
  bio = 'Hamza Rahimtula is a Rajasthan-based DJ and producer who has released on Sol Selectas, the respected world-music-meets-electronic label, in collaboration with Rajasthan Folkstars. Tracks like "Gypsy Trail" and "Morchang Love" blend Rajasthani folk traditions with organic house, earning him performances at Echoes of Earth and Magnetic Fields.',
  why = 'Rajasthan folk meets Sol Selectas — India''s most internationally-distributed world-electronic artist.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 30000,
  fee_max_inr = 80000
WHERE UPPER(name) = UPPER('HAMZA RAHIMTULA');

-- SHANTAM
UPDATE public.artists SET
  instagram = 'shantam',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['Echoes of Earth 2024', 'Magnetic Fields'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Shantam is an Indian electronic producer who has performed at Echoes of Earth 2024 and Magnetic Fields.',
  why = 'Echoes of Earth and Magnetic Fields stage credits.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('SHANTAM');

-- WEIRD SOUNDING DUDE
UPDATE public.artists SET
  instagram = 'weirdsoundingdude',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic', 'House'],
  festivals = ARRAY['Echoes of Earth 2024'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Weird Sounding Dude is an Indian electronic and house producer who performed at Echoes of Earth 2024, one of India''s premier outdoor music festivals.',
  why = 'Echoes of Earth 2024 stage credit.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('WEIRD SOUNDING DUDE');

-- JATAYU
UPDATE public.artists SET
  instagram = 'jatayu',
  soundcloud = NULL,
  website = COALESCE(artists.website, 'https://www.jatayumusic.com'),
  booking_email = COALESCE(artists.booking_email, 'jatayutheband@gmail.com'),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Chennai',
  from_city = 'Chennai',
  genres = ARRAY['Carnatic Jazz', 'Funk', 'Electronic'],
  festivals = ARRAY['Echoes of Earth 2025', 'Lollapalooza 2024'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Jatayu is a Chennai-based six-piece band whose Carnatic foundations meet funk, rock, and jazz in electrifying live performances. They performed at Echoes of Earth 2025 and Lollapalooza India 2024, and their YouTube channel features music videos including "Thoppai Vibes." Named after the mythological eagle from the Ramayana, the band weaves South Indian classical traditions with contemporary grooves.',
  why = 'Chennai''s six-piece Carnatic-funk powerhouse — Echoes of Earth and Lollapalooza credited.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 30000,
  fee_max_inr = 80000
WHERE UPPER(name) = UPPER('JATAYU');

-- LONG DISTANCES
UPDATE public.artists SET
  instagram = 'longdistances',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Mumbai',
  from_city = 'Mumbai',
  genres = ARRAY['Post-Punk', 'Shoegaze', 'Electronic'],
  festivals = ARRAY['Echoes of Earth 2025', 'Lollapalooza 2024'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Long Distances are a Mumbai post-punk and shoegaze band who incorporate electronic elements into their dense, layered sound. Reviewed in Rolling Stone India at Echoes of Earth 2025, they also played Lollapalooza India 2024.',
  why = 'Mumbai post-punk/shoegaze with Echoes of Earth and Lollapalooza credits.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 25000,
  fee_max_inr = 60000
WHERE UPPER(name) = UPPER('LONG DISTANCES');

-- THE F16S
UPDATE public.artists SET
  instagram = 'thef16s',
  soundcloud = 'https://soundcloud.com/so_extra/the-f16s-jacuzzi',
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'Chennai',
  from_city = 'Chennai',
  genres = ARRAY['Rock', 'Electronic', 'Indie'],
  festivals = ARRAY['Echoes of Earth 2025', 'NH7 Weekender'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'The F16s are a Chennai indie-rock band who incorporate electronic elements into their guitar-driven sound. They performed at Echoes of Earth 2025 (reviewed in Rolling Stone India) and NH7 Weekender, and have released a new album titled "All Dogs Go to Heaven."',
  why = 'Chennai indie-rock with Echoes of Earth 2025 and NH7 Weekender credits.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 40000,
  fee_max_inr = 100000
WHERE UPPER(name) = UPPER('THE F16S');

-- ANISH KUMAR
UPDATE public.artists SET
  instagram = 'anishkumar',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'UK',
  from_city = 'UK',
  genres = ARRAY['Electronic', 'Disco', 'Funk'],
  festivals = ARRAY['Echoes of Earth 2025'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Anish Kumar is a UK-based Indian-origin producer whose indefatigable disco and funk sets have earned him festival billing in India. At Echoes of Earth 2025, Rolling Stone India noted that his Orb stage set "had everyone moving." He bridges UK underground club culture with Indian festival audiences.',
  why = 'UK-based Indian-origin producer — Rolling Stone India-praised at Echoes of Earth 2025.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 168000,
  fee_max_inr = 420000
WHERE UPPER(name) = UPPER('ANISH KUMAR');

-- MADAME GANDHI
UPDATE public.artists SET
  instagram = 'madamegandhi',
  soundcloud = 'https://soundcloud.com/madamegandhi',
  website = COALESCE(artists.website, 'https://www.madamegandhi.com'),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = 'USA',
  from_city = 'India',
  genres = ARRAY['Electronic', 'Percussion', 'Activist'],
  festivals = ARRAY['Echoes of Earth 2025'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Madame Gandhi (Kiran Gandhi) is an Indian-American musician, producer, and activist based in the USA. A former drummer for M.I.A., she is also a TED Fellow. Her SoundCloud catalogue includes "Yellow Sea" (92.4K plays) and "The Future is Female." She performed at Echoes of Earth 2025 with Krantinaari and is reviewed in Rolling Stone India. Her blog madamegandhi.blog covers music and feminist advocacy.',
  why = 'Former M.I.A. drummer turned activist producer — TED Fellow with Echoes of Earth credit.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 420000,
  fee_max_inr = 1260000
WHERE UPPER(name) = UPPER('MADAME GANDHI');

-- LUSH LATA
UPDATE public.artists SET
  instagram = 'lushlata',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic'],
  festivals = ARRAY['Magnetic Fields'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Lush Lata is an Indian DJ and producer who has appeared at Magnetic Fields multiple times, making her a trusted fixture at India''s premier underground festival in Rajasthan.',
  why = 'Magnetic Fields multi-year regular.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('LUSH LATA');

-- YUNG.RAJ
UPDATE public.artists SET
  instagram = 'yung.raj',
  soundcloud = NULL,
  website = COALESCE(artists.website, NULL),
  booking_email = COALESCE(artists.booking_email, NULL),
  manager_email = COALESCE(artists.manager_email, NULL),
  based_city = NULL,
  from_city = 'India',
  genres = ARRAY['Electronic', 'Hip-Hop'],
  festivals = ARRAY['Magnetic Fields', 'NH7 Weekender'],
  labels = COALESCE(artists.labels, NULL),
  bio = 'Yung.Raj is an Indian producer working at the crossover of electronic and hip-hop, with stage credits at Magnetic Fields and NH7 Weekender.',
  why = 'Electronic/hip-hop crossover with Magnetic Fields and NH7 credits.',
  enrichment_status = 'enriched',
  status = 'approved',
  fee_min_inr = 20000,
  fee_max_inr = 50000
WHERE UPPER(name) = UPPER('YUNG.RAJ');

COMMIT;