-- ══════════════════════════════════════════════════════════════════════════════
-- CCD Seed Data: Event Appearances + Artist Connections
-- Run AFTER 001_knowledge_graph.sql
-- Uses public.artists (confirmed table name)
-- ══════════════════════════════════════════════════════════════════════════════

set search_path = public;

-- ── EVENT APPEARANCES ─────────────────────────────────────────────────────────
-- Kohra
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'kohra','Kohra','Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual' from public.artists where slug='kohra' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'kohra','Kohra','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from public.artists where slug='kohra' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'kohra','Kohra','District Festival Bengaluru','Castle Kalwar','Bengaluru','2023-12-02',2023,'performer','manual' from public.artists where slug='kohra' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'kohra','Kohra','Qilla Alchemy Festival','Multiple Venues','India','2023-06-01',2023,'headliner','manual' from public.artists where slug='kohra' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'kohra','Kohra','Awakenings India (VH1 Supersonic)','VH1 Supersonic','Pune','2020-01-24',2020,'performer','manual' from public.artists where slug='kohra' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'kohra','Kohra','Dekmantel Festival','Dekmantel','Amsterdam','2019-08-02',2019,'performer','manual' from public.artists where slug='kohra' on conflict do nothing;

-- Sandunes
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'sandunes','Sandunes','Boiler Room Mumbai (First India BR)','Boiler Room','Mumbai','2019-08-19',2019,'headliner','manual' from public.artists where slug='sandunes' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'sandunes','Sandunes','Magnetic Fields Festival 2017','Alsisar Mahal','Rajasthan','2017-12-15',2017,'performer','manual' from public.artists where slug='sandunes' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'sandunes','Sandunes','Manchester International Festival (Bonobo support)','Castlefield Bowl','Manchester','2017-07-08',2017,'support','manual' from public.artists where slug='sandunes' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'sandunes','Sandunes','Barbican Centre commission (Warp/Boiler Room)','Barbican','London','2017-10-01',2017,'performer','manual' from public.artists where slug='sandunes' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'sandunes','Sandunes','Bacardi NH7 Weekender Kolkata','NH7 Weekender','Kolkata','2015-12-05',2015,'performer','manual' from public.artists where slug='sandunes' on conflict do nothing;

-- Dualist Inquiry
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'dualist-inquiry','Dualist Inquiry','Lollapalooza India 2024','Mahalaxmi Racecourse','Mumbai','2024-01-27',2024,'headliner','manual' from public.artists where slug='dualist-inquiry' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'dualist-inquiry','Dualist Inquiry','Magnetic Fields 2023 (Album Premiere)','Alsisar Mahal','Rajasthan','2023-12-08',2023,'headliner','manual' from public.artists where slug='dualist-inquiry' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'dualist-inquiry','Dualist Inquiry','Bacardi NH7 Weekender','Highlands','Pune','2022-11-19',2022,'headliner','manual' from public.artists where slug='dualist-inquiry' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'dualist-inquiry','Dualist Inquiry','Echoes of Earth 2023','Bengaluru Palace','Bengaluru','2023-12-02',2023,'performer','manual' from public.artists where slug='dualist-inquiry' on conflict do nothing;

-- Lost Stories
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'lost-stories','Lost Stories','Tomorrowland 2018','Tomorrowland Main Stage','Belgium','2018-07-22',2018,'performer','manual' from public.artists where slug='lost-stories' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'lost-stories','Lost Stories','Sunburn Goa 2022','Vagator Beach','Goa','2022-12-28',2022,'headliner','manual' from public.artists where slug='lost-stories' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'lost-stories','Lost Stories','VH1 Supersonic 2023','Mhow','Pune','2023-01-27',2023,'headliner','manual' from public.artists where slug='lost-stories' on conflict do nothing;

-- Dotdat
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'dotdat','Dotdat','Watergate Berlin','Watergate','Berlin','2022-09-10',2022,'performer','manual' from public.artists where slug='dotdat' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'dotdat','Dotdat','Womb Tokyo','Womb','Tokyo','2022-11-05',2022,'performer','manual' from public.artists where slug='dotdat' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'dotdat','Dotdat','Sonar Barcelona','Sonar','Barcelona','2023-06-15',2023,'performer','manual' from public.artists where slug='dotdat' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'dotdat','Dotdat','VH1 Supersonic','VH1 Supersonic','Pune','2023-01-27',2023,'performer','manual' from public.artists where slug='dotdat' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'dotdat','Dotdat','RA x Magnetic Fields Club Night','Delhi club','Delhi','2022-12-01',2022,'performer','manual' from public.artists where slug='dotdat' on conflict do nothing;

-- AK Sports, Kandy Kuri, Girls Night Out, Sheral, Prismer (all Boiler Room 2024)
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'ak-sports','AK Sports','Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual' from public.artists where slug='ak-sports' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'ak-sports','AK Sports','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from public.artists where slug='ak-sports' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'kandy-kuri','Kandy Kuri','Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual' from public.artists where slug='kandy-kuri' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'girls-night-out','Girls Night Out','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from public.artists where slug='girls-night-out' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'sheral','Sheral','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from public.artists where slug='sheral' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'prismer','Prismer','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from public.artists where slug='prismer' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'kiss-nuka','Kiss Nuka','Boiler Room Mumbai 2024','Boiler Room','Mumbai','2024-09-14',2024,'performer','manual' from public.artists where slug='kiss-nuka' on conflict do nothing;
insert into event_appearances (artist_id, artist_slug, artist_name, event_name, venue, city, event_date, year, role, source)
select id,'karan-kanchan','Karan Kanchan','Boiler Room Mumbai 2023','Boiler Room','Mumbai','2023-10-06',2023,'performer','manual' from public.artists where slug='karan-kanchan' on conflict do nothing;

-- ── ARTIST CONNECTIONS ────────────────────────────────────────────────────────
-- Boiler Room Bengaluru 2024 co-performers
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'kohra',b.id,'ak-sports','b2b',7,array['Boiler Room Bengaluru 2024','Boiler Room Delhi NCR 2024'],'manual' from public.artists a, public.artists b where a.slug='kohra' and b.slug='ak-sports' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'kohra',b.id,'kandy-kuri','b2b',6,array['Boiler Room Bengaluru 2024'],'manual' from public.artists a, public.artists b where a.slug='kohra' and b.slug='kandy-kuri' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'ak-sports',b.id,'kandy-kuri','b2b',6,array['Boiler Room Bengaluru 2024'],'manual' from public.artists a, public.artists b where a.slug='ak-sports' and b.slug='kandy-kuri' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'kohra',b.id,'girls-night-out','b2b',6,array['Boiler Room Delhi NCR 2024'],'manual' from public.artists a, public.artists b where a.slug='kohra' and b.slug='girls-night-out' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'girls-night-out',b.id,'sheral','b2b',7,array['Boiler Room Delhi NCR 2024'],'manual' from public.artists a, public.artists b where a.slug='girls-night-out' and b.slug='sheral' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'girls-night-out',b.id,'prismer','b2b',6,array['Boiler Room Delhi NCR 2024'],'manual' from public.artists a, public.artists b where a.slug='girls-night-out' and b.slug='prismer' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'sheral',b.id,'prismer','b2b',7,array['Boiler Room Delhi NCR 2024'],'manual' from public.artists a, public.artists b where a.slug='sheral' and b.slug='prismer' on conflict do nothing;

-- Qilla Records family
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'kohra',b.id,'dotdat','label',8,array['Qilla Chakravyuh 2024','District Festival'],'Qilla Records label mates; both on Chakravyuh vinyl compilation','manual' from public.artists a, public.artists b where a.slug='kohra' and b.slug='dotdat' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'kohra',b.id,'midnight-traffic','label',8,array['Qilla Chakravyuh 2024'],'Both on Qilla Chakravyuh vinyl; Midnight Traffic is a core Qilla artist','manual' from public.artists a, public.artists b where a.slug='kohra' and b.slug='midnight-traffic' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'kohra',b.id,'monophonik','label',9,array['Qilla Chakravyuh 2024','NH7 Weekender'],'Longtime Qilla Records artist; Monophonik was name-checked by Kohra in Beatportal interview','manual' from public.artists a, public.artists b where a.slug='kohra' and b.slug='monophonik' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'kohra',b.id,'audio-units','label',7,array['Qilla Chakravyuh 2024'],'Audio Units on Chakravyuh compilation','manual' from public.artists a, public.artists b where a.slug='kohra' and b.slug='audio-units' on conflict do nothing;

-- Sandunes connections
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'sandunes',b.id,'dualist-inquiry','collab',9,array['NH7 Weekender','Echoes of Earth'],'Formed Dualist Inquiry Band together; longtime collaborators; both on Indian electronica festival circuit','manual' from public.artists a, public.artists b where a.slug='sandunes' and b.slug='dualist-inquiry' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'sandunes',b.id,'sid-vashi','b2b',8,array['Magnetic Fields 2017'],'Both performed Magnetic Fields 2017; Mumbai-adjacent experimental scene','manual' from public.artists a, public.artists b where a.slug='sandunes' and b.slug='sid-vashi' on conflict do nothing;

-- Mumbai/Krunk connections
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'karan-kanchan',b.id,'kiss-nuka','label',8,array[],'Both in Krunk network; Kiss Nuka presented by Krunk at Boiler Room Mumbai 2024','manual' from public.artists a, public.artists b where a.slug='karan-kanchan' and b.slug='kiss-nuka' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'karan-kanchan',b.id,'prabh-deep','collab',8,array['Boiler Room Mumbai 2023'],'Shared Boiler Room Mumbai 2023 stage alongside Seedhe Maut; Mumbai hip-hop/electronic crossover','manual' from public.artists a, public.artists b where a.slug='karan-kanchan' and b.slug='prabh-deep' on conflict do nothing;

-- Lost Stories connections
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'lost-stories',b.id,'sickflip','b2b',7,array['Sunburn','VH1 Supersonic'],'Regular co-performers on Sunburn and VH1 Supersonic lineup','manual' from public.artists a, public.artists b where a.slug='lost-stories' and b.slug='sickflip' on conflict do nothing;

-- Dotdat connections
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'dotdat',b.id,'midnight-traffic','label',8,array['Qilla Chakravyuh 2024'],'Both on Qilla Chakravyuh compilation; Dotdat based Goa / Midnight Traffic Hyderabad','manual' from public.artists a, public.artists b where a.slug='dotdat' and b.slug='midnight-traffic' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, notes, source)
select a.id,'dotdat',b.id,'anyasa','b2b',6,array['Sunburn'],'Both on Goa / festival circuit; RA page shows them together','manual' from public.artists a, public.artists b where a.slug='dotdat' and b.slug='anyasa' on conflict do nothing;

