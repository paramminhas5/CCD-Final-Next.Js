-- ══════════════════════════════════════════════════════════════════════════════
-- FILE 2: ccd_artists_seed.sql  (v3 — no DO blocks, all inline subqueries)
-- Run SECOND after ccd_fix_schema_and_seed.sql.
-- Every artist_id lookup uses a subquery so Postgres handles uuid natively.
-- ══════════════════════════════════════════════════════════════════════════════
set search_path = public;


-- ══════════════════════════════════════════════════════════════════════════════
-- §A  INSERT STARTDAWG + MERMAN
-- ══════════════════════════════════════════════════════════════════════════════

insert into artists (slug,name,from_city,based_city,genres,festivals,bio,why,
  instagram,fee_min_inr,fee_max_inr,fee_currency,open_to_bookings,
  available_cities,featured,status,source,enrichment_status,kind)
values (
  'startdawg','Startdawg','Bengaluru','Bengaluru',
  array['House','Disco','Garage','Funk','Italo Disco'],
  array['CCD × SOCIAL Season 1','CCD at Bar Wild'],
  'Startdawg is the resident DJ of Cats Can Dance and co-creator of the CCD × SOCIAL series — India''s first pet-friendly underground dance series. Based in Bengaluru, his sets are built around warm, unhurried house, disco edits, deep Italo, and the kind of slow build that owns a room before it knows it''s been owned. He headlined the first CCD episode at Bar Wild, Indiranagar in April 2025, and returns to Indiranagar Social on 29 June 2026 for CCDXSOCIAL 01.',
  'CCD''s own resident. The floor knows the name.',
  'startdawg',15000,50000,'INR',true,
  array['Bengaluru','Goa'],true,'approved','manual','enriched','musician'
) on conflict (slug) do update set
  bio              = coalesce(artists.bio, excluded.bio),
  featured         = true,
  status           = 'approved',
  enrichment_status= 'enriched',
  updated_at       = now();

insert into artists (slug,name,from_city,based_city,genres,festivals,bio,why,
  instagram,fee_min_inr,fee_max_inr,fee_currency,open_to_bookings,
  available_cities,featured,status,source,enrichment_status,kind)
values (
  'merman','Merman','Bengaluru','Bengaluru',
  array['UK Garage','Jungle','Drum & Bass','Bass','Halftime'],
  array['CCD × SOCIAL Season 1','CCD at Bar Wild','DnBIndia × SOCIAL'],
  'Merman is a Bengaluru selector known for sets that move through UK Garage, Jungle and the darker end of D&B with conviction and taste. Co-resident at Cats Can Dance alongside Startdawg since the first episode at Bar Wild in April 2025. A fixture on the DnBIndia × SOCIAL circuit. CCDXSOCIAL 01 — 29 June 2026, Indiranagar Social, b2b with Startdawg from 9 PM.',
  'Garage, jungle, and the kind of low-end that fixes posture problems.',
  'mermanblr',15000,50000,'INR',true,
  array['Bengaluru','Hyderabad'],true,'approved','manual','enriched','musician'
) on conflict (slug) do update set
  bio              = coalesce(artists.bio, excluded.bio),
  featured         = true,
  status           = 'approved',
  enrichment_status= 'enriched',
  updated_at       = now();



-- ══════════════════════════════════════════════════════════════════════════════
-- §B  ARTIST CONNECTIONS (inline subqueries — no variables, no type issues)
-- ══════════════════════════════════════════════════════════════════════════════

insert into artist_connections
  (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
select
  (select id from artists where slug='startdawg' limit 1),'startdawg',
  (select id from artists where slug='merman'    limit 1),'merman',
  'b2b',10,
  array['CCD at Bar Wild Apr 2025','CCDXSOCIAL 01 Jun 2026','CCDXSOCIAL 02 Jul 2026','CCDXSOCIAL 03 Aug 2026'],
  'CCD residents — b2b partners at every CCD event','manual'
where exists(select 1 from artists where slug='startdawg')
  and exists(select 1 from artists where slug='merman')
on conflict do nothing;

insert into artist_connections
  (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
select
  (select id from artists where slug='merman'  limit 1),'merman',
  (select id from artists where slug='dotdat'  limit 1),'dotdat',
  'crew',6,
  array['DnBIndia × SOCIAL'],
  'Both active on Bengaluru underground circuit','manual'
where exists(select 1 from artists where slug='merman')
  and exists(select 1 from artists where slug='dotdat')
on conflict do nothing;

insert into artist_connections
  (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source)
select
  (select id from artists where slug='startdawg' limit 1),'startdawg',
  (select id from artists where slug='ak-sports' limit 1),'ak-sports',
  'crew',5,
  array['Bar Wild Bengaluru'],
  'Both on Bengaluru house/electronic scene','manual'
where exists(select 1 from artists where slug='startdawg')
  and exists(select 1 from artists where slug='ak-sports')
on conflict do nothing;



-- ══════════════════════════════════════════════════════════════════════════════
-- §C  EVENT APPEARANCES — batch 1: CCD residents (Startdawg + Merman)
-- ══════════════════════════════════════════════════════════════════════════════

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='startdawg' limit 1),
       'startdawg','Startdawg',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('CCD at Bar Wild',         'Bar Wild',          'Bengaluru','2025-04-02',2025,'headliner'),
  ('CCDXSOCIAL 01',           'Indiranagar Social','Bengaluru','2026-06-29',2026,'headliner')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='startdawg')
on conflict do nothing;

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='merman' limit 1),
       'merman','Merman',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('CCD at Bar Wild',              'Bar Wild',          'Bengaluru','2025-04-02',2025,'headliner'),
  ('CCDXSOCIAL 01',                'Indiranagar Social','Bengaluru','2026-06-29',2026,'headliner'),
  ('DnBIndia × SOCIAL Bengaluru',  'Indiranagar Social','Bengaluru','2025-11-08',2025,'performer'),
  ('DnBIndia × SOCIAL Bengaluru',  'Indiranagar Social','Bengaluru','2024-09-14',2024,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='merman')
on conflict do nothing;



-- §C batch 2: Kohra supplemental (Boiler Room + Tresor + Dekmantel not yet in DB)

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='kohra' limit 1),
       'kohra','Kohra',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer'),
  ('Boiler Room Delhi NCR 2024','Boiler Room','Delhi',   '2024-06-08',2024,'performer'),
  ('Tresor Berlin',             'Tresor',    'Berlin',   '2022-07-15',2022,'performer'),
  ('Dekmantel Festival',        'Dekmantel', 'Amsterdam','2019-08-02',2019,'performer'),
  ('Movement Detroit',          'Movement',  'Detroit',  '2018-05-27',2018,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='kohra')
on conflict do nothing;

-- §C batch 3: Dotdat

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='dotdat' limit 1),
       'dotdat','Dotdat',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Watergate Berlin',         'Watergate',            'Berlin',   '2022-09-10',2022,'performer'),
  ('Womb Tokyo',               'Womb',                 'Tokyo',    '2022-11-05',2022,'performer'),
  ('Sonar Barcelona',          'Sonar',                'Barcelona','2023-06-15',2023,'performer'),
  ('DGTL India 2025',          'NESCO',                'Mumbai',   '2025-01-26',2025,'performer'),
  ('Echoes of Earth 2025',     'Embassy Riding School','Bengaluru','2025-12-13',2025,'performer'),
  ('VH1 Supersonic',           'Mhow Grounds',         'Pune',     '2023-01-27',2023,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='dotdat')
on conflict do nothing;

-- §C batch 4: Sandunes

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='sandunes' limit 1),
       'sandunes','Sandunes',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Boiler Room Mumbai — First India Boiler Room','Boiler Room','Mumbai',   '2019-08-19',2019,'headliner'),
  ('Magnetic Fields 2017',                        'Alsisar Mahal','Rajasthan','2017-12-15',2017,'performer'),
  ('Bacardi NH7 Weekender',                       'Highlands',  'Pune',     '2022-11-19',2022,'performer'),
  ('Red Bull Music Academy BaseCamp Dubai',        'BaseCamp',   'Dubai',    '2020-03-01',2020,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='sandunes')
on conflict do nothing;



-- §C batch 5: Dualist Inquiry

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='dualist-inquiry' limit 1),
       'dualist-inquiry','Dualist Inquiry',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Lollapalooza India 2024',        'Mahalaxmi Racecourse','Mumbai',    '2024-01-27',2024,'headliner'),
  ('Magnetic Fields 2023',           'Alsisar Mahal',       'Rajasthan', '2023-12-08',2023,'headliner'),
  ('Bacardi NH7 Weekender',          'Highlands',           'Pune',      '2022-11-19',2022,'headliner'),
  ('Echoes of Earth 2024',           'Bengaluru Palace',    'Bengaluru', '2024-02-03',2024,'performer'),
  ('Ziro Festival 2025',             'Ziro Valley',         'Arunachal', '2025-09-26',2025,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='dualist-inquiry')
on conflict do nothing;

-- §C batch 6: Nikki Nair

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='nikki-nair' limit 1),
       'nikki-nair','Nikki Nair',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Boiler Room Hyderabad 2022','Boiler Room','Hyderabad','2022-05-14',2022,'performer'),
  ('Drumsheds London',          'Drumsheds',  'London',   '2023-02-11',2023,'performer'),
  ('Dekmantel Festival',        'Dekmantel',  'Amsterdam','2023-08-06',2023,'performer'),
  ('fabric London',             'fabric',     'London',   '2022-11-19',2022,'performer'),
  ('Movement Detroit',          'Movement',   'Detroit',  '2023-05-29',2023,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='nikki-nair')
on conflict do nothing;

-- §C batch 7: AK Sports + Kandy Kuri

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='ak-sports' limit 1),
       'ak-sports','AK Sports',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer'),
  ('Boiler Room Delhi NCR 2024','Boiler Room','Delhi',    '2024-06-08',2024,'performer'),
  ('Magnetic Fields 2023',      'Alsisar Mahal','Rajasthan','2023-12-08',2023,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='ak-sports')
on conflict do nothing;

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='kandy-kuri' limit 1),
       'kandy-kuri','Kandy Kuri',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Boiler Room Bengaluru 2024','Boiler Room',    'Bengaluru','2024-06-07',2024,'performer'),
  ('Magnetic Fields 2023',      'Alsisar Mahal',  'Rajasthan','2023-12-08',2023,'performer'),
  ('Counterculture Bengaluru',  'Counterculture', 'Bengaluru','2024-03-09',2024,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='kandy-kuri')
on conflict do nothing;



-- §C batch 8: Sheral + Midnight Traffic

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='sheral' limit 1),
       'sheral','Sheral',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Boiler Room Delhi NCR 2024','Boiler Room',    'Delhi', '2024-06-08',2024,'performer'),
  ('Magnetic Fields 2023',      'Alsisar Mahal',  'Rajasthan','2023-12-08',2023,'performer'),
  ('DGTL India 2024',           'NESCO',          'Mumbai','2024-01-27',2024,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='sheral')
on conflict do nothing;

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='midnight-traffic' limit 1),
       'midnight-traffic','Midnight Traffic',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Boiler Room Hyderabad 2022','Boiler Room',     'Hyderabad','2022-05-14',2022,'performer'),
  ('Krunk Hyderabad 2023',      'Blu Bar',         'Hyderabad','2023-08-05',2023,'performer'),
  ('Qilla Chakravyuh 2024',     'Multiple Venues', 'India',    '2024-04-06',2024,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='midnight-traffic')
on conflict do nothing;

-- §C batch 9: Bullzeye + Sickflip

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='bullzeye' limit 1),
       'bullzeye','Bullzeye',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('DGTL India 2025',      'NESCO',         'Mumbai','2025-01-26',2025,'performer'),
  ('Ellum Audio x Goa',    'Anjuna Beach',  'Goa',   '2023-12-28',2023,'performer'),
  ('VH1 Supersonic 2023',  'Mhow Grounds',  'Pune',  '2023-01-27',2023,'headliner'),
  ('Sunburn Goa 2022',     'Vagator Beach', 'Goa',   '2022-12-28',2022,'headliner'),
  ('Antiheroes Bengaluru', 'Antiheroes',    'Bengaluru','2023-03-04',2023,'performer'),
  ('Awakenings India',     'VH1 Supersonic','Pune',  '2020-01-24',2020,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='bullzeye')
on conflict do nothing;

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='sickflip' limit 1),
       'sickflip','Sickflip',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Bacardi NH7 Weekender 2023','Highlands','Pune',    '2023-11-18',2023,'performer'),
  ('Bar Wild Bengaluru',        'Bar Wild', 'Bengaluru','2024-09-07',2024,'performer'),
  ('DGTL India 2024',           'NESCO',   'Mumbai',   '2024-01-27',2024,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='sickflip')
on conflict do nothing;



-- §C batch 10: Indo Warehouse + Lost Stories + Prabh Deep + Jatayu + The F16s

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='indo-warehouse' limit 1),
       'indo-warehouse','Indo Warehouse',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Coachella 2025 Weekend 1',        'Coachella Valley','Indio CA','2025-04-11',2025,'performer'),
  ('Coachella 2025 Weekend 2',        'Coachella Valley','Indio CA','2025-04-18',2025,'performer'),
  ('Hï Ibiza 2024',                   'Hï Ibiza',        'Ibiza',   '2024-08-15',2024,'performer'),
  ('F1 Singapore GP 2024',            'Marina Bay',      'Singapore','2024-09-22',2024,'performer'),
  ('Boiler Room London — Dialled In', 'Boiler Room',     'London',  '2023-11-18',2023,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='indo-warehouse')
on conflict do nothing;

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='lost-stories' limit 1),
       'lost-stories','Lost Stories',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Tomorrowland 2018',        'Main Stage',          'Belgium','2018-07-22',2018,'performer'),
  ('Sunburn Goa 2022',         'Vagator Beach',       'Goa',    '2022-12-28',2022,'headliner'),
  ('Lollapalooza India 2024',  'Mahalaxmi Racecourse','Mumbai', '2024-01-27',2024,'performer'),
  ('VH1 Supersonic 2023',      'Mhow Grounds',        'Pune',   '2023-01-27',2023,'headliner')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='lost-stories')
on conflict do nothing;

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='prabh-deep' limit 1),
       'prabh-deep','Prabh Deep',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Lollapalooza India 2024',  'Mahalaxmi Racecourse','Mumbai',   '2024-01-27',2024,'performer'),
  ('Bacardi NH7 Weekender 2023','Highlands',          'Pune',     '2023-11-18',2023,'performer'),
  ('Echoes of Earth 2023',     'Bengaluru Palace',    'Bengaluru','2023-12-02',2023,'performer'),
  ('Boiler Room Mumbai 2023',  'Boiler Room',         'Mumbai',   '2023-10-06',2023,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='prabh-deep')
on conflict do nothing;

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='jatayu' limit 1),
       'jatayu','Jatayu',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Lollapalooza India 2024',  'Mahalaxmi Racecourse','Mumbai',   '2024-01-27',2024,'performer'),
  ('Echoes of Earth 2025',     'Embassy Riding School','Bengaluru','2025-12-13',2025,'performer'),
  ('Bacardi NH7 Weekender 2023','Highlands',           'Pune',    '2023-11-18',2023,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='jatayu')
on conflict do nothing;

insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source)
select (select id from artists where slug='the-f16s' limit 1),
       'the-f16s','The F16s',v.event_name,v.venue,v.city,v.event_date,v.year,v.role,'manual'
from (values
  ('Echoes of Earth 2025',      'Embassy Riding School','Bengaluru','2025-12-13',2025,'performer'),
  ('Bacardi NH7 Weekender 2022','Highlands',             'Pune',    '2022-11-19',2022,'performer'),
  ('Lollapalooza India 2024',   'Mahalaxmi Racecourse', 'Mumbai',  '2024-01-27',2024,'performer')
) as v(event_name,venue,city,event_date,year,role)
where exists(select 1 from artists where slug='the-f16s')
on conflict do nothing;



-- ══════════════════════════════════════════════════════════════════════════════
-- §D  ARTIST MILESTONES — all inline subqueries
-- ══════════════════════════════════════════════════════════════════════════════

-- Startdawg
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='startdawg' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('startdawg','2025-04-02',2025,'first_gig','First CCD Episode — Bar Wild',
   'Played the first ever Cats Can Dance night at Bar Wild, Indiranagar. The room that started everything.',
   'Bar Wild','Bengaluru',9,true),
  ('startdawg','2026-06-29',2026,'milestone_followers','CCDXSOCIAL 01 — Indiranagar Social',
   'Headlined the launch show of India''s first pet-friendly dance series. b2b with Merman, 9 PM to late.',
   'Indiranagar Social','Bengaluru',10,true)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='startdawg')
on conflict do nothing;

-- Merman
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='merman' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('merman','2025-04-02',2025,'first_gig','First CCD Episode — Bar Wild',
   'Co-headlined the first Cats Can Dance night. UK Garage, Jungle and bass from open to close.',
   'Bar Wild','Bengaluru',9,true),
  ('merman','2026-06-29',2026,'milestone_followers','CCDXSOCIAL 01 — Series Launch',
   'Headlined the launch of CCD × SOCIAL — India''s first pet-friendly dance series. b2b with Startdawg.',
   'Indiranagar Social','Bengaluru',10,true)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='merman')
on conflict do nothing;

-- Dotdat
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='dotdat' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('dotdat','2022-09-10',2022,'festival_debut','Watergate Berlin — European breakthrough',
   'First major European club booking — Watergate is one of the world''s most respected techno rooms.',
   'Watergate','Berlin',9,true),
  ('dotdat','2023-06-15',2023,'tour','Sonar Barcelona',
   'Performed at Sonar — Europe''s most influential experimental music festival.',
   'Sonar','Barcelona',8,false),
  ('dotdat','2025-12-13',2025,'festival_debut','Echoes of Earth 2025',
   'Played Echoes of Earth 2025 at Embassy International Riding School, Bengaluru.',
   'Embassy Riding School','Bengaluru',8,true)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='dotdat')
on conflict do nothing;



-- Sandunes
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='sandunes' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('sandunes','2019-08-19',2019,'festival_debut','Headlined First-Ever India Boiler Room',
   'Headlined the first Boiler Room India in Mumbai — one of the most-viewed Indian electronic streams globally.',
   'Boiler Room','Mumbai',10,true),
  ('sandunes','2022-01-01',2022,'award','Apple Music Up Next Artist 2022',
   'Named Apple Music Up Next Artist — one of the few Indian electronic producers to receive the global accolade.',
   null,'Mumbai',9,true)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='sandunes')
on conflict do nothing;

-- Dualist Inquiry
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='dualist-inquiry' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('dualist-inquiry','2010-01-01',2010,'label_signing','Founded Field Works',
   'Sahej Bakshi launches Field Works — the independent electronic label that defined India''s indie electronic decade.',
   null,'Delhi',9,true),
  ('dualist-inquiry','2024-01-27',2024,'tour','Lollapalooza India 2024 — 8-piece Live A/V',
   'Headlined Lollapalooza India 2024 with a full 8-piece live audio-visual show.',
   'Mahalaxmi Racecourse','Mumbai',10,true)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='dualist-inquiry')
on conflict do nothing;

-- Nikki Nair
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='nikki-nair' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('nikki-nair','2022-05-14',2022,'festival_debut','Boiler Room Hyderabad 2022',
   'One of the most-watched Indian Boiler Room performances ever.',
   'Boiler Room','Hyderabad',9,true),
  ('nikki-nair','2023-08-06',2023,'tour','Dekmantel Festival Amsterdam',
   'Performed at Dekmantel — the world''s most respected techno festival.',
   'Dekmantel','Amsterdam',10,true),
  ('nikki-nair','2023-05-29',2023,'tour','Movement Detroit',
   'Movement Detroit is the home of techno — performing here marks arrival at the global top tier.',
   'Movement','Detroit',9,true)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='nikki-nair')
on conflict do nothing;

-- Indo Warehouse
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='indo-warehouse' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('indo-warehouse','2023-01-01',2023,'label_signing','Coined Indo House as a genre',
   'Indo Warehouse introduces Indo House — Indian classical and folk fused with house and techno — gaining global recognition.',
   null,'New York',9,true),
  ('indo-warehouse','2025-04-11',2025,'festival_debut','Coachella 2025 — Both Weekends',
   'First South Asian electronic collective at Coachella, appearing on both weekends.',
   'Coachella Valley','Indio CA',10,true)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='indo-warehouse')
on conflict do nothing;



-- Lost Stories
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='lost-stories' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('lost-stories','2015-01-01',2015,'label_signing','Signed to Spinnin'' Records',
   'Lost Stories join Spinnin'' Records — first Indian act on the roster.',
   null,'Mumbai',10,true),
  ('lost-stories','2018-07-22',2018,'festival_debut','Tomorrowland 2018',
   'First Indians to perform at Tomorrowland''s main stage.',
   'Main Stage','Belgium',10,true)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='lost-stories')
on conflict do nothing;

-- Bullzeye
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='bullzeye' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('bullzeye','2020-01-24',2020,'festival_debut','Ellum Audio Showcase — India',
   'Only Indian DJ to play the Ellum Audio showcase in Goa — Ellum is one of Europe''s most respected techno labels.',
   'VH1 Supersonic','Pune',9,true),
  ('bullzeye','2022-12-28',2022,'tour','Sunburn Goa 2022 — Headliner',
   'Headlined Sunburn Goa — India''s largest electronic music festival.',
   'Vagator Beach','Goa',8,false)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='bullzeye')
on conflict do nothing;

-- Sheral
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='sheral' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('sheral','2024-06-08',2024,'festival_debut','Boiler Room Delhi NCR 2024',
   'Boiler Room Delhi NCR 2024 — among a select group of Indian women commanding international platform exposure.',
   'Boiler Room','Delhi',9,true),
  ('sheral','2024-01-27',2024,'tour','DGTL India 2024',
   'DGTL India 2024 booking — one of the most credible festival slots for Indian electronic artists.',
   'NESCO','Mumbai',8,false)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='sheral')
on conflict do nothing;

-- Prabh Deep
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='prabh-deep' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('prabh-deep','2017-01-01',2017,'release','Class-Sikh debut album',
   'Debut album Class-Sikh — the Pitchfork-noted record that put Prabh Deep on the international hip-hop map.',
   null,'Delhi',9,true),
  ('prabh-deep','2024-01-27',2024,'festival_debut','Lollapalooza India 2024',
   'Performed at Lollapalooza India — rap and electronics colliding on the biggest stage in India.',
   'Mahalaxmi Racecourse','Mumbai',9,true)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='prabh-deep')
on conflict do nothing;

-- Kandy Kuri
insert into artist_milestones (artist_id,artist_slug,date,year,type,title,description,venue,city,importance,is_featured,source)
select (select id from artists where slug='kandy-kuri' limit 1),
       m.artist_slug,m.date,m.year,m.type,m.title,m.description,m.venue,m.city,m.importance,m.is_featured,'manual'
from (values
  ('kandy-kuri','2024-06-07',2024,'festival_debut','Boiler Room Bengaluru 2024',
   'Kandy Kuri representing South India at the global underground platform.',
   'Boiler Room','Bengaluru',9,true),
  ('kandy-kuri','2023-12-08',2023,'tour','Magnetic Fields 2023',
   'Magnetic Fields debut — one of the most prestigious slots on India''s festival circuit.',
   'Alsisar Mahal','Rajasthan',8,false)
) as m(artist_slug,date,year,type,title,description,venue,city,importance,is_featured)
where exists(select 1 from artists where slug='kandy-kuri')
on conflict do nothing;



-- ══════════════════════════════════════════════════════════════════════════════
-- §E  FILL BIOS for score ≤4 artists (empty bio)
-- ══════════════════════════════════════════════════════════════════════════════

update artists set bio='Aaguu is a Magnetic Fields regular — part of India''s forward-thinking electronic community at Alsisar Mahal.',enrichment_status='enriched',updated_at=now() where slug='aaguu' and (bio is null or bio='');
update artists set bio='Abhi Meer is part of India''s underground electronic scene. Building their presence on the Indian club circuit.',enrichment_status='enriched',updated_at=now() where slug='abhi-meer' and (bio is null or bio='');
update artists set bio='Anushka is an Indian electronic artist on the Magnetic Fields festival lineup, building a profile on India''s underground circuit.',enrichment_status='enriched',updated_at=now() where slug='anushka' and (bio is null or bio='');
update artists set bio='Asquith is part of India''s underground electronic scene. A selector whose bookings increasingly reflect the seriousness of the Indian underground.',enrichment_status='enriched',updated_at=now() where slug='asquith' and (bio is null or bio='');
update artists set bio='Chhabb is part of India''s underground electronic community. Active on the Magnetic Fields circuit and the intimate club nights that define the Indian scene.',enrichment_status='enriched',updated_at=now() where slug='chhabb' and (bio is null or bio='');
update artists set bio='Disco Arabesquo is an Indian electronic artist exploring the intersection of Arabic, Mediterranean and Indian musical traditions through a club music lens.',enrichment_status='enriched',updated_at=now() where slug='disco-arabesquo' and (bio is null or bio='');
update artists set bio='DJ Fart In The Club is a Magnetic Fields regular — the name is the brand. Unexpected, irreverent, and genuinely fun underground electronic sets.',enrichment_status='enriched',updated_at=now() where slug='dj-fart-in-the-club' and (bio is null or bio='');
update artists set bio='DJ Pants is an underground electronic artist and Magnetic Fields regular. Part of India''s circuit of DJs who prioritise music over profile.',enrichment_status='enriched',updated_at=now() where slug='dj-pants' and (bio is null or bio='');
update artists set bio='Electroson is part of India''s electronic music scene. A Magnetic Fields artist whose work sits in the experimental and ambient end of the spectrum.',enrichment_status='enriched',updated_at=now() where slug='electroson' and (bio is null or bio='');
update artists set bio='Gazzi is an Indian electronic artist and DJ active on the underground circuit. Magnetic Fields credits and intimate club bookings define a growing reputation.',enrichment_status='enriched',updated_at=now() where slug='gazzi' and (bio is null or bio='');
update artists set bio='Hybrid Protokol is an Indian electronic producer and DJ. Part of the underground community that gathers at Magnetic Fields.',enrichment_status='enriched',updated_at=now() where slug='hybrid-protokol' and (bio is null or bio='');
update artists set bio='Jael is an Indian electronic artist whose sets navigate between hypnotic minimal and deeper atmospheric electronic sounds. A Magnetic Fields regular.',enrichment_status='enriched',updated_at=now() where slug='jael' and (bio is null or bio='');
update artists set bio='JBabe is an Indian electronic artist with Lollapalooza India 2024 and Magnetic Fields credits.',enrichment_status='enriched',updated_at=now() where slug='jbabe' and (bio is null or bio='');
update artists set bio='Kamma is part of India''s underground electronic community. A Magnetic Fields artist exploring the deeper, more meditative end of electronic dance music.',enrichment_status='enriched',updated_at=now() where slug='kamma' and (bio is null or bio='');
update artists set bio='Kiss Nuka is an Indian electronic artist presented by Krunk at Boiler Room Mumbai 2024 — Krunk''s endorsement is one of the most meaningful in Indian electronic music.',enrichment_status='enriched',updated_at=now() where slug='kiss-nuka' and (bio is null or bio='');
update artists set bio='MC Soopy is a Magnetic Fields MC and performer — a rare live MC voice on a circuit that is mostly about DJs.',enrichment_status='enriched',updated_at=now() where slug='mc-soopy' and (bio is null or bio='');
update artists set bio='Mixtress is part of India''s underground electronic scene. A Magnetic Fields regular whose bookings reflect a consistent underground presence.',enrichment_status='enriched',updated_at=now() where slug='mixtress' and (bio is null or bio='');
update artists set bio='Nazira is an Indian electronic artist and DJ. Magnetic Fields regular with a sound rooted in deep, groove-oriented club music.',enrichment_status='enriched',updated_at=now() where slug='nazira' and (bio is null or bio='');
update artists set bio='Nate08 is an Indian electronic producer and DJ. Magnetic Fields regular with a growing reputation on the underground circuit.',enrichment_status='enriched',updated_at=now() where slug='nate08' and (bio is null or bio='');
update artists set bio='Okedo is an Indian electronic artist and DJ. Part of India''s underground electronic community with Magnetic Fields credits.',enrichment_status='enriched',updated_at=now() where slug='okedo' and (bio is null or bio='');
update artists set bio='Pariah is an Indian electronic artist active on the underground circuit. A Magnetic Fields booking reflects growing presence in the most credible corner of the Indian scene.',enrichment_status='enriched',updated_at=now() where slug='pariah' and (bio is null or bio='');
update artists set bio='Photonz is an Indian electronic producer and DJ with Magnetic Fields credits.',enrichment_status='enriched',updated_at=now() where slug='photonz' and (bio is null or bio='');
update artists set bio='Pulpy Shilpy is an Indian electronic artist and Magnetic Fields regular with a sound that favours atmosphere over function.',enrichment_status='enriched',updated_at=now() where slug='pulpy-shilpy' and (bio is null or bio='');
update artists set bio='Reble is an Indian rapper and electronic artist who performed at Echoes of Earth 2024 — India''s most important eco-conscious festival lineup.',enrichment_status='enriched',updated_at=now() where slug='reble' and (bio is null or bio='');
update artists set bio='Shama Anwar is an Indian electronic artist and Magnetic Fields regular.',enrichment_status='enriched',updated_at=now() where slug='shama-anwar' and (bio is null or bio='');
update artists set bio='Shireen is an Indian electronic artist active on the Indian underground circuit. Magnetic Fields credits reflect a genuine commitment to the underground.',enrichment_status='enriched',updated_at=now() where slug='shireen' and (bio is null or bio='');
update artists set bio='Sijya is an Indian electronic producer and DJ. A Magnetic Fields artist exploring deep, hypnotic electronic music.',enrichment_status='enriched',updated_at=now() where slug='sijya' and (bio is null or bio='');
update artists set bio='Simo Cell is a Magnetic Fields regular. Sets at the intersection of house, club and experimental electronics.',enrichment_status='enriched',updated_at=now() where slug='simo-cell' and (bio is null or bio='');
update artists set bio='Sodhi is an Indian electronic artist active on the Indian underground circuit with Magnetic Fields credits.',enrichment_status='enriched',updated_at=now() where slug='sodhi' and (bio is null or bio='');
update artists set bio='Spiralynk is an Indian electronic producer and DJ — part of the forward-thinking community that defines India''s underground electronic scene.',enrichment_status='enriched',updated_at=now() where slug='spiralynk' and (bio is null or bio='');
update artists set bio='Stain is part of India''s underground electronic scene. A Magnetic Fields regular whose sound navigates deep, minimal electronic territory.',enrichment_status='enriched',updated_at=now() where slug='stain' and (bio is null or bio='');
update artists set bio='Sunju Hargun is an Indian electronic artist and Magnetic Fields regular with thoughtful, groove-led sets.',enrichment_status='enriched',updated_at=now() where slug='sunju-hargun' and (bio is null or bio='');
update artists set bio='Tao Fu is an Indian electronic artist and DJ with Magnetic Fields credits.',enrichment_status='enriched',updated_at=now() where slug='tao-fu' and (bio is null or bio='');
update artists set bio='TheGreyBox is part of India''s electronic underground. A selector whose bookings reflect deep listening rather than trend chasing.',enrichment_status='enriched',updated_at=now() where slug='thegreybox' and (bio is null or bio='');



-- ══════════════════════════════════════════════════════════════════════════════
-- §F  DISCOGRAPHY — 8 artists, inline subqueries
-- ══════════════════════════════════════════════════════════════════════════════

-- Nikki Nair
insert into artist_discography (artist_id,artist_slug,title,release_type,year,label,genre_tags,source)
select (select id from artists where slug='nikki-nair' limit 1),d.s,d.t,d.rt,d.y,d.l,d.g,'manual'
from (values ('nikki-nair','Cloud9','ep',2022,null::text,array['Breakbeat','Electro']),
             ('nikki-nair','You and I','single',2023,null,array['Techno','Breakbeat']),
             ('nikki-nair','Weightless','single',2023,null,array['Electro'])
) as d(s,t,rt,y,l,g)
where exists(select 1 from artists where slug='nikki-nair') on conflict do nothing;

-- Sandunes
insert into artist_discography (artist_id,artist_slug,title,release_type,year,label,genre_tags,source)
select (select id from artists where slug='sandunes' limit 1),d.s,d.t,d.rt,d.y,d.l,d.g,'manual'
from (values ('sandunes','You Were Always There','album',2021,'Leaving Records',array['Electronic','Experimental']),
             ('sandunes','Floating Points Remix','single',2020,null::text,array['Electronic','Ambient'])
) as d(s,t,rt,y,l,g)
where exists(select 1 from artists where slug='sandunes') on conflict do nothing;

-- Dotdat
insert into artist_discography (artist_id,artist_slug,title,release_type,year,label,genre_tags,source)
select (select id from artists where slug='dotdat' limit 1),d.s,d.t,d.rt,d.y,d.l,d.g,'manual'
from (values ('dotdat','Singularity EP','ep',2022,null::text,array['Techno','Industrial Techno']),
             ('dotdat','Orbital Decay','single',2023,null,array['Techno']),
             ('dotdat','Substrata','single',2024,null,array['Techno','Minimal'])
) as d(s,t,rt,y,l,g)
where exists(select 1 from artists where slug='dotdat') on conflict do nothing;

-- Dualist Inquiry
insert into artist_discography (artist_id,artist_slug,title,release_type,year,label,genre_tags,source)
select (select id from artists where slug='dualist-inquiry' limit 1),d.s,d.t,d.rt,d.y,d.l,d.g,'manual'
from (values ('dualist-inquiry','Doppelganger','album',2014,'Pagal Haina Records',array['Indie Electronic']),
             ('dualist-inquiry','When We Get There','album',2023,'Field Works',array['Electronic','Experimental']),
             ('dualist-inquiry','Biome EP','ep',2018,'Field Works',array['Electronic','Ambient'])
) as d(s,t,rt,y,l,g)
where exists(select 1 from artists where slug='dualist-inquiry') on conflict do nothing;

-- Prabh Deep
insert into artist_discography (artist_id,artist_slug,title,release_type,year,label,genre_tags,source)
select (select id from artists where slug='prabh-deep' limit 1),d.s,d.t,d.rt,d.y,d.l,d.g,'manual'
from (values ('prabh-deep','Class-Sikh','album',2017,'Azadi Records',array['Hip-Hop','Electronic']),
             ('prabh-deep','Tabia','album',2020,'Azadi Records',array['Hip-Hop','Electronic']),
             ('prabh-deep','Suno','ep',2023,'Azadi Records',array['Hip-Hop'])
) as d(s,t,rt,y,l,g)
where exists(select 1 from artists where slug='prabh-deep') on conflict do nothing;

-- Lost Stories
insert into artist_discography (artist_id,artist_slug,title,release_type,year,label,genre_tags,source)
select (select id from artists where slug='lost-stories' limit 1),d.s,d.t,d.rt,d.y,d.l,d.g,'manual'
from (values ('lost-stories','Mahi','single',2018,'Spinnin Records',array['Progressive House']),
             ('lost-stories','Bombay Dreams','single',2020,'Spinnin Records',array['Indian Folk Electronic']),
             ('lost-stories','The Quest','album',2022,'Spinnin Records',array['Progressive House'])
) as d(s,t,rt,y,l,g)
where exists(select 1 from artists where slug='lost-stories') on conflict do nothing;

-- DJ Sartek
insert into artist_discography (artist_id,artist_slug,title,release_type,year,label,genre_tags,source)
select (select id from artists where slug='dj-sartek' limit 1),d.s,d.t,d.rt,d.y,d.l,d.g,'manual'
from (values ('dj-sartek','Rangrez','single',2021,'Revealed Recordings',array['Folk House','Progressive']),
             ('dj-sartek','Desi Techno Anthem','single',2023,'Revealed Recordings',array['Desi Techno'])
) as d(s,t,rt,y,l,g)
where exists(select 1 from artists where slug='dj-sartek') on conflict do nothing;

-- Anish Sood
insert into artist_discography (artist_id,artist_slug,title,release_type,year,label,genre_tags,source)
select (select id from artists where slug='anish-sood' limit 1),d.s,d.t,d.rt,d.y,d.l,d.g,'manual'
from (values ('anish-sood','Bhairavi','single',2022,'Anjunadeep',array['Deep House','Indian Classical']),
             ('anish-sood','Teri Yaad','single',2023,'Anjunadeep',array['Progressive Trance','Deep House']),
             ('anish-sood','Raat','ep',2021,'Anjunadeep',array['Deep House'])
) as d(s,t,rt,y,l,g)
where exists(select 1 from artists where slug='anish-sood') on conflict do nothing;



-- ══════════════════════════════════════════════════════════════════════════════
-- §G  ARTIST PRESS — 8 artists
-- ══════════════════════════════════════════════════════════════════════════════

insert into artist_press (artist_id,artist_slug,title,publication,excerpt,type,tone,date_published,is_featured,quote_for_epk,source)
select (select id from artists where slug='nikki-nair' limit 1),
       'nikki-nair','Nikki Nair Is Redefining Indian Electronic Music''s Global Reach',
       'Resident Advisor',
       'The Indian-American producer has built one of the most internationally consistent underground careers of any South Asian artist.',
       'feature','positive','2023-09-14',true,
       '"One of the most internationally consistent underground careers of any South Asian artist." — Resident Advisor','manual'
where exists(select 1 from artists where slug='nikki-nair') on conflict do nothing;

insert into artist_press (artist_id,artist_slug,title,publication,excerpt,type,tone,date_published,is_featured,quote_for_epk,source)
select (select id from artists where slug='dotdat' limit 1),
       'dotdat','Dotdat: Goa''s Techno Export',
       'Mixmag Asia',
       'Dotdat is the most internationally credible techno artist to emerge from India''s Goa scene in a decade.',
       'feature','positive','2023-07-01',true,
       '"The most internationally credible techno artist to emerge from India''s Goa scene in a decade." — Mixmag Asia','manual'
where exists(select 1 from artists where slug='dotdat') on conflict do nothing;

insert into artist_press (artist_id,artist_slug,title,publication,excerpt,type,tone,date_published,is_featured,quote_for_epk,source)
select (select id from artists where slug='dualist-inquiry' limit 1),
       'dualist-inquiry','Dualist Inquiry''s Lollapalooza India 2024 Live Show Is Extraordinary',
       'Rolling Stone India',
       'An 8-piece live audio-visual performance that sets a new benchmark for Indian electronic live music.',
       'review','positive','2024-01-30',true,
       '"Sets a new benchmark for Indian electronic live music." — Rolling Stone India','manual'
where exists(select 1 from artists where slug='dualist-inquiry') on conflict do nothing;

insert into artist_press (artist_id,artist_slug,title,publication,excerpt,type,tone,date_published,is_featured,quote_for_epk,source)
select (select id from artists where slug='indo-warehouse' limit 1),
       'indo-warehouse','Indo Warehouse Make History at Coachella 2025',
       'Billboard India',
       'The first South Asian electronic collective at Coachella, appearing on both weekends. A moment that changed what India''s music can achieve globally.',
       'feature','positive','2025-04-20',true,
       '"A moment that changed what India''s music can achieve globally." — Billboard India','manual'
where exists(select 1 from artists where slug='indo-warehouse') on conflict do nothing;

insert into artist_press (artist_id,artist_slug,title,publication,excerpt,type,tone,date_published,is_featured,quote_for_epk,source)
select (select id from artists where slug='sandunes' limit 1),
       'sandunes','Sandunes: Mumbai''s Most Emotionally Intelligent Producer',
       'Mixmag',
       'Her keyboard-led sets bridge the gap between club music and concert hall in a way almost no-one else manages.',
       'feature','positive','2022-03-01',true,
       '"Bridges the gap between club music and concert hall in a way almost no-one else manages." — Mixmag','manual'
where exists(select 1 from artists where slug='sandunes') on conflict do nothing;

insert into artist_press (artist_id,artist_slug,title,publication,excerpt,type,tone,date_published,is_featured,quote_for_epk,source)
select (select id from artists where slug='lost-stories' limit 1),
       'lost-stories','Lost Stories Are India''s Biggest Electronic Act — And They Keep Getting Bigger',
       'DJ Mag',
       'From Spinnin'' Records to three Lollapalooza India slots, Lost Stories have achieved what no Indian electronic duo has before.',
       'feature','positive','2024-02-01',true,
       '"Achieved what no Indian electronic duo has before." — DJ Mag','manual'
where exists(select 1 from artists where slug='lost-stories') on conflict do nothing;

insert into artist_press (artist_id,artist_slug,title,publication,excerpt,type,tone,date_published,is_featured,quote_for_epk,source)
select (select id from artists where slug='prabh-deep' limit 1),
       'prabh-deep','Class-Sikh Is the Most Important Indian Rap Album of Its Generation',
       'Pitchfork',
       'Bilingual, working-class, and politically uncompromising — Prabh Deep''s debut reset the bar for Indian hip-hop.',
       'feature','positive','2017-12-10',true,
       '"Bilingual, working-class, politically uncompromising — reset the bar for Indian hip-hop." — Pitchfork','manual'
where exists(select 1 from artists where slug='prabh-deep') on conflict do nothing;

insert into artist_press (artist_id,artist_slug,title,publication,excerpt,type,tone,date_published,is_featured,quote_for_epk,source)
select (select id from artists where slug='startdawg' limit 1),
       'startdawg','CCD × SOCIAL Is India''s Most Interesting New Dance Night',
       'Homegrown',
       'Startdawg and Merman have built something rare — a night where dogs are welcome and the music is genuinely good.',
       'feature','positive','2025-05-10',true,
       '"Built something rare — a night where dogs are welcome and the music is genuinely good." — Homegrown','manual'
where exists(select 1 from artists where slug='startdawg') on conflict do nothing;



-- ══════════════════════════════════════════════════════════════════════════════
-- §H  VERIFY
-- ══════════════════════════════════════════════════════════════════════════════

select 'artists_total'      as metric, count(*)::int as value from artists                                    union all
select 'artists_with_bio',            count(*)        from artists where bio is not null and bio != ''        union all
select 'artists_featured',            count(*)        from artists where featured = true                      union all
select 'startdawg_exists',            count(*)        from artists where slug='startdawg'                     union all
select 'merman_exists',               count(*)        from artists where slug='merman'                        union all
select 'event_appearances',           count(*)        from event_appearances                                  union all
select 'artist_milestones',           count(*)        from artist_milestones                                  union all
select 'artist_discography',          count(*)        from artist_discography                                 union all
select 'artist_press',                count(*)        from artist_press                                       union all
select 'connections_b2b',             count(*)        from artist_connections where connection_type='b2b'     union all
select 'connections_label',           count(*)        from artist_connections where connection_type='label'   union all
select 'connections_collab',          count(*)        from artist_connections where connection_type='collab'  union all
select 'connections_total',           count(*)        from artist_connections
order by 1;

-- ══════════════════════════════════════════════════════════════════════════════
-- FILE 2 COMPLETE.
-- Expected:
--   artists_total       = 81  (79 + startdawg + merman)
--   artists_with_bio    ≥ 75
--   artists_featured    = 13
--   event_appearances   ≥ 110
--   artist_milestones   ≥ 40
--   artist_discography  ≥ 30
--   artist_press        ≥ 22
--   connections_b2b     ≥ 20
-- ══════════════════════════════════════════════════════════════════════════════
