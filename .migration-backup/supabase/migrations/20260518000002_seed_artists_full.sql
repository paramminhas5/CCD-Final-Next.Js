-- Full artist data seed with bios, genres, fees, all metadata
-- Inserts new artists, updates existing ones without overwriting user-set data
BEGIN;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('indo-warehouse', 'INDO WAREHOUSE', 'Kahani + Kunal Merchant', 'India', 'New York', ARRAY['Indo House', 'Melodic Techno'], ARRAY['Coachella 2025 (both weekends)', 'Hï Ibiza', 'F1 Singapore'], 'Indo Warehouse is the duo of Kahani and Kunal Merchant, the first South Asian electronic collective to perform at Coachella, appearing on both weekends in 2025. Based between New York and the global festival circuit, they coined the term Indo House — a sonic language fusing Indian classical and folk music with house and techno. They have performed at Hï Ibiza and the Singapore Formula 1 Grand Prix, and appeared on Boiler Room through London''s Dialled In crew. Booking via indowarehouse.com.', 'First South Asian act at Coachella; created the Indo House genre.', 'indowarehouse', 'https://indowarehouse.com', NULL, NULL, 1260000, 4200000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('nikki-nair', 'NIKKI NAIR', NULL, 'India', 'USA (Indian-American)', ARRAY['Breakbeat', 'Techno', 'Electro'], ARRAY['Multiple global bookings'], 'Nikki Nair is an Indian-American producer and DJ widely regarded as the most-booked artist of Indian origin in the global underground. Working entirely outside Bollywood and commercial EDM, his output spans breakbeat, techno, and electro, earning him bookings across Europe and North America. His 2022 Boiler Room set in Hyderabad remains one of the most-viewed from India. He represents a new wave of diaspora artists reshaping global club culture.', 'The most internationally booked underground DJ of Indian origin.', 'nikkinair', NULL, NULL, NULL, 420000, 1260000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('kohra', 'KOHRA', 'Madhav Shorey', 'India', 'New Delhi', ARRAY['Techno', 'House', 'Minimal'], ARRAY['Magnetic Fields (multiple years)', 'DGTL', 'Echoes of Earth'], 'Kohra (Madhav Shorey) is a New Delhi-based DJ and producer who holds the most Boiler Room appearances of any Indian solo electronic artist. As the founder of Qilla Records, he has been central to building India''s credible underground techno and house scene for over a decade. A fixture at Magnetic Fields, DGTL, and Echoes of Earth, his productions demonstrate a mastery of minimal and deep techno informed by both European influences and the particularities of the Indian underground.', 'India''s most Boiler Room-credentialed solo DJ and founder of Qilla Records.', NULL, 'https://artistivity.com', 'booking@artistivity.com', 'Qilla Records (founder)', 80000, 250000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('sheral', 'SHERAL', NULL, 'India', NULL, ARRAY['Electronic', 'Techno'], ARRAY['Magnetic Fields', 'DGTL circuit'], 'Sheral is an emerging DJ and producer who has rapidly become one of the most exciting names in India''s underground electronic circuit. She performed at Boiler Room Delhi NCR in June 2024, placing her among a select group of Indian women commanding international platform exposure. With appearances at Magnetic Fields and across the DGTL circuit, her sets navigate the intersection of driving techno and atmospheric electronics.', 'A rising force in Indian techno with a 2024 Boiler Room credit.', 'sheral', NULL, NULL, NULL, 30000, 80000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('prismer', 'PRISMER', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], 'Prismer is an electronic producer and DJ who gained significant exposure through their 2024 Boiler Room Delhi NCR performance. With a background in melodic and atmospheric electronic music, they represent the forward-thinking generation of Indian producers gaining footholds on international stages. Magnetic Fields is among their key festival credits.', 'Fresh voice from India''s 2024 Boiler Room class.', 'prismer', NULL, NULL, NULL, 25000, 70000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('girls-night-out', 'GIRLS NIGHT OUT', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], 'Girls Night Out is an Indian electronic collective whose 2024 Boiler Room Delhi NCR appearance announced them to the global underground. The project brings together a community-driven ethos with a sound rooted in contemporary club music, challenging the male-dominated landscape of Indian electronic music and carving out space for new voices.', 'Indian collective breaking barriers at Boiler Room Delhi 2024.', NULL, NULL, NULL, NULL, 30000, 80000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('ak-sports', 'AK SPORTS', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], 'AK Sports is an Indian DJ and electronic producer who appeared at Boiler Room Delhi NCR in June 2024, rapidly building a reputation in India''s underground scene. Their Magnetic Fields credit underscores a trajectory oriented towards credible international stages rather than commercial festival circuits.', 'Underground Indian producer with a Boiler Room and Magnetic Fields pedigree.', 'aksports', NULL, NULL, NULL, 25000, 70000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('midnight-traffic', 'MIDNIGHT TRAFFIC', NULL, 'India', 'Hyderabad', ARRAY['Electronic', 'House'], ARRAY['Krunk events', 'Hyderabad scene'], 'Midnight Traffic is a Hyderabad-based electronic duo who appeared at Boiler Room Hyderabad in May 2022, performing for the global livestream that put South Indian electronic music on the international map. Active on Krunk''s event circuit, they are key figures in keeping Hyderabad''s scene alive outside the dominant Mumbai and Delhi markets.', 'Boiler Room Hyderabad veterans keeping South India''s electronic scene alive.', 'midnighttraffic', NULL, NULL, NULL, 20000, 60000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('suchi', 'SUCHI', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Krunk events'], 'Suchi is an Indian electronic artist and DJ who performed at Boiler Room Hyderabad in 2022, among the first wave of artists from the city to gain that platform. Active on the Krunk circuit, she is part of a generation of Indian women DJs steadily claiming space in the country''s underground electronic landscape.', 'Boiler Room Hyderabad pioneer and key figure on South India''s club circuit.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('murthovic', 'MURTHOVIC', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields (multiple years)'], 'Murthovic is an Indian DJ and electronic producer with multiple Boiler Room credits, including Hyderabad 2022, making him one of the longer-standing figures in India''s underground with global platform recognition. A Magnetic Fields regular, his sets draw from a broad palette of electronic club music.', 'Veteran of India''s underground with multiple Boiler Room appearances.', 'murthovic', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('kandy-kuri', 'KANDY KURI', NULL, 'India', 'Bengaluru', ARRAY['Electronic'], ARRAY['Magnetic Fields'], 'Kandy Kuri is a Bengaluru-based DJ and producer who appeared at Boiler Room Bengaluru in 2024, representing South India''s electronic scene at the global livestream platform. A Magnetic Fields credit rounds out a profile built on credible underground bookings rather than commercial shortcuts.', 'Bengaluru''s voice at Boiler Room 2024.', 'kandykuri', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('dj-sartek', 'DJ SARTEK', 'Sarthak Sardana', 'New Delhi', 'New Delhi', ARRAY['Folk House', 'Desi Techno', 'Progressive'], ARRAY['DGTL', 'multiple international'], 'DJ Sartek (Sarthak Sardana) is a New Delhi-based DJ and producer who became the first Indian artist signed to Hardwell''s Revealed Recordings. Multiple releases have placed on the Beatport Top 100, and he has opened for David Guetta, Martin Garrix, Tiësto, Steve Aoki, and Justin Bieber across large-scale events. He bridges Indian folk textures with progressive house, and won the Meta Awards in 2024. Bookings via sartekmusic.in.', 'First Indian on Revealed Recordings; Beatport Top 100 artist who opened for Guetta and Garrix.', 'sartek', 'https://sartekmusic.in', NULL, 'Revealed Recordings (Hardwell) — FIRST Indian on this label', 100000, 300000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('anish-sood', 'ANISH SOOD', 'ANYASA', 'India', 'Goa', ARRAY['Progressive Trance', 'Deep House', 'Anjunadeep'], ARRAY['DGTL', 'Echoes of Earth', 'international'], 'Anish Sood, also performing as Anyasa, is a Goa-based producer signed to Anjunadeep — one of the UK''s most prestigious electronic labels — placing him among a rare cohort of Indian artists with international label representation. His work blends progressive trance and deep house with melodic production, and he performs at DGTL, Echoes of Earth, and international venues across Asia and Europe.', 'Anjunadeep-signed Indian producer bridging subcontinent sound with global melodic house.', NULL, 'https://anyasa.com', 'hello@anyasa.com', 'Anjunadeep (UK) — prestigious UK label', 100000, 300000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('lost-stories', 'LOST STORIES', 'Prayag Mehta & Rishab Joshi', 'Mumbai', 'Mumbai', ARRAY['Indian Folk + Electronic', 'Progressive House'], ARRAY['DGTL', 'Lollapalooza', 'multiple international'], 'Lost Stories are one of India''s longest-running and most successful electronic acts, having released on Spinnin'' Records and headlined Sunburn multiple times. Their production spans progressive house and Indian-influenced electronic music, and they have collaborated with international artists while maintaining a significant domestic fanbase. They represent the link between India''s mainstream festival market and serious electronic production.', 'Spinnin'' Records artists and India''s most consistent festival headliners.', 'loststoriesmusic', NULL, NULL, NULL, 150000, 400000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('dualist-inquiry', 'DUALIST INQUIRY', 'Sahej Bakshi', 'Goa', 'Goa', ARRAY['Indie Electronic', 'Experimental'], ARRAY['Echoes of Earth (Goa 2024', 'Bangalore)', 'Lollapalooza 2024', 'Ziro 2025'], 'Dualist Inquiry (Sahej Bakshi) is a New Delhi-based producer and live performer who has been a defining voice in India''s indie electronic scene since the early 2010s. Known for sophisticated live sets that blend electronic production with live instrumentation and complex arrangements, he has played Magnetic Fields, Echoes of Earth, and international festivals, influencing an entire generation of Indian electronic artists.', 'A foundational figure in Indian indie electronic; one of the country''s most respected live acts.', 'dualistinquiry', 'https://intersect9.in', NULL, 'Field Works (founder)', 40000, 100000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('dj-ravetek', 'DJ RAVETEK', NULL, 'Mumbai', 'Mumbai', ARRAY['EDM', 'Big Room'], ARRAY['Multiple international'], NULL, 'First Indian signed to Tiesto''s Musical Freedom. Shared stage with world''s top DJs. Rare achievement for Indian artist.', 'theartisteco', NULL, NULL, 'Musical Freedom (Tiesto''s label) — FIRST Indian on this label', 40000, 100000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('project-91', 'PROJECT 91', 'Anil & Sunil Sindagi', 'Pune', 'Pune', ARRAY['EDM', 'House'], ARRAY['DGTL', 'multiple international'], NULL, 'India''s most credible electronic duo on international labels. Performed in 8 countries. Revealed Recordings releases.', 'project91music', NULL, NULL, 'Revealed Recordings / Generation Smash', 80000, 200000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('dj-ravator', 'DJ RAVATOR', NULL, 'New Delhi', 'New Delhi', ARRAY['Independent', 'EDM', 'Bass'], ARRAY['DGTL circuit'], NULL, 'Represents India''s independent artist movement. Self-made producer. Delhi underground electronic scene.', 'saprasap', 'https://sapwroks.co', NULL, NULL, 30000, 80000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('monophonik', 'MONOPHONIK', 'Shatrunjai Diwan', 'India', NULL, ARRAY['Analog Synth', 'Electronic'], ARRAY['Magnetic Fields (multiple years)', 'DGTL', 'Lollapalooza'], 'Monophonik is an Indian musician and producer whose work centres on analog synthesis and modular electronics, bringing an experimental, hardware-focused approach to India''s electronic scene. Their live performances and recordings explore the sonic possibilities of vintage gear, making them a distinctive presence on the underground circuit.', 'India''s leading analog synthesist; hardware-focused experimental electronic artist.', NULL, 'https://thewildcity.com', 'info@thewildcity.com', NULL, 30000, 80000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('kaleekarma', 'KALEEKARMA', NULL, 'India', NULL, ARRAY['Electronic', 'House'], ARRAY['Magnetic Fields (multiple years)'], NULL, 'Magnetic Fields regular. Part of India''s forward-thinking electronic community at Alsisar.', 'kaleekarma', NULL, NULL, NULL, 25000, 70000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('sid-vashi', 'SID VASHI', NULL, 'Michigan', 'Mumbai', ARRAY['Jazz', 'Electronic', 'Experimental'], ARRAY['Lollapalooza 2025'], 'Sid Vashi is a Mumbai-based musician and producer whose work sits at the intersection of jazz, ambient music, and electronics. His nuanced, melodic output draws from improvisation and classical harmony, making him one of India''s most distinctive electronic voices for listeners who want depth alongside rhythm.', 'Mumbai jazz-electronics crossover artist with rare harmonic sophistication.', 'sidvashi', NULL, NULL, NULL, 40000, 100000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('sandunes', 'SANDUNES', 'Sanaya Ardeshir', 'India', 'Mumbai', ARRAY['Electronic', 'Experimental', 'Live'], ARRAY['NH7 Weekender', 'multiple festivals'], 'Sandunes (Sanaya Ardeshir) is a Mumbai-based producer, keyboardist, and DJ whose work spans jazz-influenced electronic music, ambient textures, and rhythmic club material. She has released internationally, toured extensively across Asia and Europe, and is among the most critically recognised voices in contemporary Indian electronic music, admired for her compositional intelligence and live keyboard integration.', 'Mumbai''s most internationally acclaimed electronic producer and live keyboardist.', NULL, 'https://gmail.com', 'sandunesmusic@gmail.com', NULL, 50000, 120000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('karan-kanchan', 'KARAN KANCHAN', NULL, 'India', 'Mumbai', ARRAY['Hip-Hop', 'Electronic', 'Beats'], ARRAY['Lollapalooza 2024 (The Karan Kanchan Experience)'], 'Karan Kanchan is a Mumbai-based DJ and producer working across hip-hop, electronic, and bass music, known for genre-fluid sets and productions that reflect the creative mix of India''s commercial music capital. He has built a significant following on the live circuit and has produced for artists across the Indian independent music ecosystem.', 'Mumbai-based genre-fluid DJ straddling hip-hop, bass, and electronic.', NULL, 'https://karankanchan.com', 'contact@karankanchan.com', NULL, 100000, 500000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('komorebi', 'KOMOREBI', 'Tarana Marwah', 'India', NULL, ARRAY['Electronic', 'Indie'], ARRAY['Lollapalooza 2024', 'NH7 Weekender'], 'Komorebi is an Indian electronic producer whose dreamy, layered sound merges indie sensibility with electronic production. Situated in the more melodic and atmospheric wing of India''s electronic scene, their work has found audiences through streaming and the country''s growing indie electronic club events.', 'India''s atmospheric indie-electronic producer for the Bon Iver-meets-Moderat crowd.', 'komorebimind', NULL, NULL, NULL, 30000, 80000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('prabh-deep', 'PRABH DEEP', NULL, 'India', 'New Delhi', ARRAY['Hip-Hop', 'Electronic'], ARRAY['Lollapalooza 2024', 'NH7 Weekender'], 'Prabh Deep is a Delhi-based rapper and producer who has established himself as one of India''s most uncompromising independent hip-hop voices. His bilingual output blends street-level storytelling from Delhi''s working-class neighbourhoods with sophisticated electronic production, earning international critical attention and performances at major Indian festivals.', 'Delhi rapper-producer: India''s most critically acclaimed independent hip-hop artist.', NULL, 'https://azadirecords.com', 'prabhdeepmerch@azadirecords.com', NULL, 50000, 150000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('stalvart-john', 'STALVART JOHN', NULL, 'India', NULL, ARRAY['Electronic', 'House'], ARRAY['Lollapalooza 2024'], 'Stalvart John is an Indian DJ and electronic producer with a focus on house and electronica. Active on India''s underground circuit, he has developed a reputation for tasteful, groove-led sets that draw from the deeper, more functional end of electronic dance music.', 'House and electronica specialist; respected for groove-focused, functional DJ sets.', 'stalvartjohn', NULL, NULL, NULL, 25000, 60000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('chrms', 'CHRMS', NULL, 'India', NULL, ARRAY['Future Bass', 'Electro'], ARRAY['Lollapalooza 2024', 'NH7 Weekender'], 'CHRMS is a Mumbai-based producer and DJ working in future bass, electro, and club-adjacent electronic music. With a Lollapalooza India 2024 credit and bookings through Krunk Live, they sit at the intersection of India''s larger festival circuit and the more curated underground, reaching audiences across both.', 'Lollapalooza India 2024 act; Mumbai-based future bass and electro producer.', NULL, 'https://creatingconversion.com', 'sohail@krunklive.creatingconversion.com', NULL, 25000, 60000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('sickflip', 'SICKFLIP', NULL, 'India', NULL, ARRAY['Bass', 'Electronic'], ARRAY['NH7 Weekender', 'DGTL circuit'], 'Sickflip is a Bengaluru-based DJ and producer known for energetic, bass-heavy sets that span house, jungle, and bass music. He has built a significant South Indian following through relentless gigging and original productions that reflect both global bass culture and his local Bengaluru roots.', 'Bengaluru bass music specialist with a loyal South Indian following.', NULL, 'https://acrossartists.com', 'ayush@acrossartists.com', NULL, 40000, 100000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('dotdat', 'DOTDAT', NULL, 'Pune', 'Goa', ARRAY['Techno'], ARRAY['Echoes of Earth 2025', 'DGTL'], 'Dotdat is an Indian techno DJ and producer with a commitment to the harder, more industrial textures of contemporary techno. Active on India''s growing underground circuit, they bring a European-influenced approach to the Indian dancefloor — tight mixes, uncompromising sound selection, and an increasingly international profile.', 'Indian techno purist bringing European industrial textures to South Asian dancefloors.', NULL, 'https://oddx.in', 'rajat@oddx.in', NULL, 30000, 80000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('aayna', 'AAYNA', NULL, 'India', NULL, ARRAY['Electronic', 'House'], ARRAY['DGTL 2025'], 'Aayna is an Indian DJ and producer working in the house and electronic space, contributing to the growing number of women artists shaping India''s underground. Her approach focuses on groove and texture, and she has steadily built a presence on the live circuit through consistent bookings at credible underground events.', 'Indian house DJ contributing to the rise of women in South Asian underground music.', 'aayna', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('audio-units', 'AUDIO UNITS', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['DGTL 2025'], NULL, 'Part of DGTL India 2025 domestic lineup. New sounds from Indian scene.', 'audiounits', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('bullzeye', 'BULLZEYE', NULL, 'India', NULL, ARRAY['Techno', 'House'], ARRAY['DGTL 2025 (returning)', 'Sunburn', 'Supersonic', 'Awakenings India'], NULL, 'One of the most booked DJs in India. Only Indian DJ to play Ellum Audio showcase in Goa. Owner of Rage Entertainment....', 'bullzeye', NULL, NULL, NULL, 60000, 150000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('dreamstates', 'DREAMSTATES', NULL, 'India', NULL, ARRAY['Electronic', 'Psychedelic'], ARRAY['DGTL 2025', 'Echoes of Earth'], NULL, 'Part of DGTL India 2025. Psychedelic electronic sound.', 'dreamstates', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('mogasu', 'MOGASU', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['DGTL 2025', 'Echoes of Earth 2024'], NULL, 'Part of DGTL India 2025 and Echoes of Earth lineup.', 'mogasu', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('bawra', 'BAWRA', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['DGTL 2025', 'Echoes of Earth 2024'], NULL, 'Part of DGTL India 2025 domestic lineup.', 'bawra', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('hamza-rahimtula', 'HAMZA RAHIMTULA', NULL, 'India', 'Rajasthan', ARRAY['Folk', 'Electronic', 'House'], ARRAY['Echoes of Earth (multiple years)', 'Magnetic Fields'], 'Hamza Rahimtula is an Indian DJ and music curator known for eclectic, genre-spanning sets that reflect a deep knowledge of global dance music history. A fixture in Mumbai''s nightlife scene, his bookings include credible underground events and his approach synthesises influences from disco and house through to contemporary club music.', 'Mumbai nightlife veteran with encyclopaedic knowledge of global dance music.', 'hamzarahimtula', NULL, NULL, NULL, 30000, 80000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('shantam', 'SHANTAM', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Echoes of Earth 2024', 'Magnetic Fields'], NULL, 'Part of India''s electronic scene. Echoes of Earth regular.', 'shantam', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('weird-sounding-dude', 'WEIRD SOUNDING DUDE', NULL, 'India', NULL, ARRAY['Electronic', 'House'], ARRAY['Echoes of Earth 2024'], NULL, 'Part of India''s electronic producer community.', 'weirdsoundingdude', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('reble', 'REBLE', NULL, 'India', NULL, ARRAY['Hip-Hop', 'Electronic'], ARRAY['Echoes of Earth 2024'], NULL, 'Rapper on Echoes of Earth 2024 lineup.', 'reble', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('green-park', 'GREEN PARK', NULL, 'New Delhi', 'New Delhi', ARRAY['Electronic', 'Indie'], ARRAY['Echoes of Earth 2024'], NULL, 'New Delhi band on Echoes of Earth 2024.', 'greenpark', NULL, NULL, NULL, 25000, 60000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('jatayu', 'JATAYU', NULL, 'Chennai', 'Chennai', ARRAY['Carnatic Jazz', 'Funk', 'Electronic'], ARRAY['Echoes of Earth 2025', 'Lollapalooza 2024'], 'Jatayu is an Indian electronic producer whose work draws on mythology, ambient soundscapes, and South Asian musical traditions to create a distinctive atmospheric electronic sound. Their output sits at the more contemplative end of India''s electronic spectrum, connecting with audiences drawn to conceptual and culturally rooted production.', 'Mythologically-inspired atmospheric electronic producer rooted in South Asian traditions.', 'jatayu', NULL, NULL, NULL, 30000, 80000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('long-distances', 'LONG DISTANCES', NULL, 'Mumbai', 'Mumbai', ARRAY['Post-Punk', 'Shoegaze', 'Electronic'], ARRAY['Echoes of Earth 2025', 'Lollapalooza 2024'], NULL, 'Mumbai post-punk/shoegaze band with electronic elements. Lollapalooza 2024. Echoes of Earth 2025.', 'longdistances', NULL, NULL, NULL, 25000, 60000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('the-f16s', 'THE F16s', NULL, 'Chennai', 'Chennai', ARRAY['Rock', 'Electronic'], ARRAY['Echoes of Earth 2025', 'NH7 Weekender'], NULL, 'Chennai rock act. Echoes of Earth 2025. NH7 Weekender regular.', 'thef16s', NULL, NULL, NULL, 40000, 100000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('anish-kumar', 'ANISH KUMAR', NULL, 'India', 'UK (Indian-origin)', ARRAY['Electronic', 'House'], ARRAY['Echoes of Earth 2025'], NULL, 'Indian-origin producer. Echoes of Earth 2025 billing.', 'anishkumar', NULL, NULL, NULL, 2000, 5000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('madame-gandhi', 'MADAME GANDHI', 'Kiran Gandhi', 'India', 'USA', ARRAY['Electronic', 'Percussion', 'Activist'], ARRAY['Echoes of Earth 2025'], 'Madame Gandhi (Kiran Gandhi) is a Los Angeles-based musician, producer, and activist of Indian descent who has performed as the drummer for M.I.A. Her electronic music and public-facing advocacy work bridge global pop, Indian-American identity, and feminist discourse, giving her a profile that extends beyond the club into cultural conversation.', 'Drummer for M.I.A. turned activist electronic producer; one of Indian-American music''s most visible figures.', 'madamegandhi', NULL, NULL, NULL, 420000, 1260000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('aaguu', 'AAGUU', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields (multiple years)'], NULL, 'Magnetic Fields regular. Part of India''s forward-thinking electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('dj-pants', 'DJ PANTS', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields (multiple years)'], NULL, 'Magnetic Fields regular. Underground electronic artist.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('stain', 'STAIN', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('anushka', 'ANUSHKA', 'IN', 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Indian electronic artist on Magnetic Fields lineup.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('shantam', 'SHANTAM', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('dreamstates', 'DREAMSTATES', NULL, 'India', NULL, ARRAY['Electronic', 'Psychedelic'], ARRAY['Magnetic Fields'], NULL, 'Psychedelic electronic. Magnetic Fields regular.', 'dreamstates', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('kaleekarma', 'KALEEKARMA', NULL, 'India', NULL, ARRAY['Electronic', 'House'], ARRAY['Magnetic Fields (multiple years)'], NULL, 'Magnetic Fields regular. Part of Alsisar community.', 'kaleekarma', NULL, NULL, NULL, 25000, 70000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('sodhi', 'SODHI', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('hybrid-protokol', 'HYBRID PROTOKOL', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('spiralynk', 'SPIRALYNK', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('yung-raj', 'YUNG.RAJ', NULL, 'India', NULL, ARRAY['Electronic', 'Hip-Hop'], ARRAY['Magnetic Fields', 'NH7 Weekender'], NULL, 'Part of India''s electronic/hip-hop crossover scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('mc-soopy', 'MC SOOPY', NULL, 'India', NULL, ARRAY['Electronic', 'MC'], ARRAY['Magnetic Fields'], NULL, 'MC on Magnetic Fields lineup.', NULL, NULL, NULL, NULL, 15000, 40000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('shireen', 'SHIREEN', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('shama-anwar', 'SHAMA ANWAR', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('thegreybox', 'THEGREYBOX', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('lush-lata', 'LUSH LATA', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields (multiple years)'], NULL, 'Magnetic Fields regular.', 'lushlata', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('okedo', 'OKEDO', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('pulpy-shilpy', 'PULPY SHILPY', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('chhabb', 'CHHABB', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('abhi-meer', 'ABHI MEER', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('nazira', 'NAZIRA', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', 'nazira', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('asquith', 'ASQUITH', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('photonz', 'PHOTONZ', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('jbabe', 'JBABE', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields', 'Lollapalooza 2024'], NULL, 'Part of India''s electronic community. Lollapalooza 2024.', 'jbabe', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('simo-cell', 'SIMO CELL', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('jael', 'JAEL', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('pariah', 'PARIAH', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('spryk', 'SPRYK', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields', 'Lollapalooza 2025'], NULL, 'Part of India''s electronic scene. Lollapalooza 2025.', 'spryk', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('natasha-diggs', 'NATASHA DIGGS', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('masalo', 'MASALO', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('kamma', 'KAMMA', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('violet', 'VIOLET', 'PT', 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('esa', 'ESA', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('haai', 'HAAi', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('blawan', 'BLAWAN', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('palms-trax', 'PALMS TRAX', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('karenn', 'KARENN', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('hunee', 'HUNEE', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('deena-abdelwahed', 'DEENA ABDELWAHED', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('ross-from-friends', 'ROSS FROM FRIENDS', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('maribou-state', 'MARIBOU STATE', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('sunju-hargun', 'SUNJU HARGUN', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields (multiple years)'], NULL, 'Magnetic Fields regular. Part of India''s forward-thinking scene.', 'sunjuhargun', NULL, NULL, NULL, 25000, 70000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('electroson', 'ELECTROSON', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('dj-fart-in-the-club', 'DJ FART IN THE CLUB', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('onra', 'ONRA', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('nate08', 'NATE08', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', 'nate08', NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('sijya', 'SIJYA', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('chrms', 'CHRMS', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields', 'Lollapalooza 2024'], 'CHRMS is a Mumbai-based producer and DJ working in future bass, electro, and club-adjacent electronic music. With a Lollapalooza India 2024 credit and bookings through Krunk Live, they sit at the intersection of India''s larger festival circuit and the more curated underground, reaching audiences across both.', 'Lollapalooza India 2024 act; Mumbai-based future bass and electro producer.', NULL, 'https://creatingconversion.com', 'sohail@krunklive.creatingconversion.com', NULL, 25000, 60000, 'INR', 'approved', 'seed', 'enriched')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('disco-arabesquo', 'DISCO ARABESQUO', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('kiss-nuka', 'KISS NUKA', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('aaguu', 'AAGUU', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields (multiple years)'], NULL, 'Magnetic Fields regular.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('tao-fu', 'TAO FU', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('alex-kassian', 'ALEX KASSIAN', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic underground.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('gazzi', 'GAZZI', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic community.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

INSERT INTO public.artists (slug, name, members, from_city, based_city, genres, festivals, bio, why, instagram, website, booking_email, labels, fee_min_inr, fee_max_inr, fee_currency, status, source, enrichment_status)
VALUES ('mixtress', 'MIXTRESS', NULL, 'India', NULL, ARRAY['Electronic'], ARRAY['Magnetic Fields'], NULL, 'Part of India''s electronic scene.', NULL, NULL, NULL, NULL, 20000, 50000, 'INR', 'approved', 'seed', 'pending')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  members = COALESCE(EXCLUDED.members, artists.members),
  from_city = COALESCE(EXCLUDED.from_city, artists.from_city),
  based_city = COALESCE(EXCLUDED.based_city, artists.based_city),
  genres = CASE WHEN array_length(artists.genres, 1) IS NULL THEN EXCLUDED.genres ELSE artists.genres END,
  festivals = CASE WHEN array_length(artists.festivals, 1) IS NULL THEN EXCLUDED.festivals ELSE artists.festivals END,
  bio = COALESCE(artists.bio, EXCLUDED.bio),
  why = COALESCE(artists.why, EXCLUDED.why),
  instagram = COALESCE(artists.instagram, EXCLUDED.instagram),
  website = COALESCE(artists.website, EXCLUDED.website),
  booking_email = COALESCE(artists.booking_email, EXCLUDED.booking_email),
  labels = COALESCE(artists.labels, EXCLUDED.labels),
  fee_min_inr = CASE WHEN (artists.fee_min_inr IS NULL OR artists.fee_min_inr = 0) THEN EXCLUDED.fee_min_inr ELSE artists.fee_min_inr END,
  fee_max_inr = CASE WHEN (artists.fee_max_inr IS NULL OR artists.fee_max_inr = 0) THEN EXCLUDED.fee_max_inr ELSE artists.fee_max_inr END,
  status = 'approved',
  enrichment_status = CASE WHEN artists.bio IS NULL AND EXCLUDED.bio IS NOT NULL THEN 'enriched' ELSE artists.enrichment_status END;

COMMIT;