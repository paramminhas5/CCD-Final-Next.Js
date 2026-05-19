-- ══════════════════════════════════════════════════════════════════════════════
-- CCD Seed Data: Event Appearances + Artist Connections
-- Run AFTER 001_knowledge_graph.sql
-- ══════════════════════════════════════════════════════════════════════════════

-- Get artist IDs first (or replace with actual UUIDs after running)
-- These inserts use slugs — the artist_id will be filled by the app on insert.
-- Use this as reference data to insert via the admin panel or API.

-- EVENT APPEARANCES
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'kohra','Kohra', id, 'Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual' from artists where slug='kohra' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'kohra','Kohra', id, 'Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from artists where slug='kohra' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'kohra','Kohra', id, 'District Festival Bengaluru','Castle Kalwar','Bengaluru','2023-12-02',2023,'performer','manual' from artists where slug='kohra' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'kohra','Kohra', id, 'Far Out Left','Social Offline','Bengaluru','2022-11-12',2022,'performer','manual' from artists where slug='kohra' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'sandunes','Sandunes', id, 'Boiler Room Mumbai — First India Boiler Room','Boiler Room','Mumbai','2019-08-19',2019,'headliner','manual' from artists where slug='sandunes' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'sandunes','Sandunes', id, 'Magnetic Fields Festival','Alsisar Mahal','Rajasthan','2017-12-15',2017,'performer','manual' from artists where slug='sandunes' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'sandunes','Sandunes', id, 'Bacardi NH7 Weekender Kolkata','NH7','Kolkata','2015-12-05',2015,'performer','manual' from artists where slug='sandunes' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'sandunes','Sandunes', id, 'Echoes of Earth 2023','Bengaluru Palace','Bengaluru','2023-12-02',2023,'performer','manual' from artists where slug='sandunes' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'dualist-inquiry','Dualist Inquiry', id, 'Lollapalooza India 2024','Mahalaxmi Racecourse','Mumbai','2024-01-27',2024,'headliner','manual' from artists where slug='dualist-inquiry' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'dualist-inquiry','Dualist Inquiry', id, 'Magnetic Fields 2023','Alsisar Mahal','Rajasthan','2023-12-08',2023,'performer','manual' from artists where slug='dualist-inquiry' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'ak-sports','AK Sports', id, 'Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual' from artists where slug='ak-sports' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'ak-sports','AK Sports', id, 'Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from artists where slug='ak-sports' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'karan-kanchan','Karan Kanchan', id, 'Boiler Room Mumbai 2023','Boiler Room','Mumbai','2023-10-06',2023,'performer','manual' from artists where slug='karan-kanchan' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'kandy-kuri','Kandy Kuri', id, 'Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual' from artists where slug='kandy-kuri' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'girls-night-out','Girls Night Out', id, 'Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from artists where slug='girls-night-out' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'sheral','Sheral', id, 'Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from artists where slug='sheral' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'prismer','Prismer', id, 'Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual' from artists where slug='prismer' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'kiss-nuka','Kiss Nuka', id, 'Boiler Room Mumbai 2024','Boiler Room','Mumbai','2024-09-14',2024,'performer','manual' from artists where slug='kiss-nuka' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'lost-stories','Lost Stories', id, 'Tomorrowland 2018','Tomorrowland Main Stage','Boom Belgium','2018-07-22',2018,'performer','manual' from artists where slug='lost-stories' on conflict do nothing;
insert into event_appearances (artist_slug, artist_name, artist_id, event_name, venue, city, event_date, year, role, source)
select 'lost-stories','Lost Stories', id, 'Sunburn Goa 2022','Vagator Beach','Goa','2022-12-28',2022,'headliner','manual' from artists where slug='lost-stories' on conflict do nothing;

-- ARTIST CONNECTIONS
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'kohra', b.id,'ak-sports','b2b',7,array['Boiler Room Bengaluru 2024'],'manual' from artists a, artists b where a.slug='kohra' and b.slug='ak-sports' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'kohra', b.id,'kandy-kuri','b2b',6,array['Boiler Room Bengaluru 2024'],'manual' from artists a, artists b where a.slug='kohra' and b.slug='kandy-kuri' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'ak-sports', b.id,'kandy-kuri','b2b',6,array['Boiler Room Bengaluru 2024'],'manual' from artists a, artists b where a.slug='ak-sports' and b.slug='kandy-kuri' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'kohra', b.id,'girls-night-out','b2b',6,array['Boiler Room Delhi NCR 2024'],'manual' from artists a, artists b where a.slug='kohra' and b.slug='girls-night-out' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'girls-night-out', b.id,'sheral','b2b',7,array['Boiler Room Delhi NCR 2024'],'manual' from artists a, artists b where a.slug='girls-night-out' and b.slug='sheral' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'kohra', b.id,'bullzeye','label',8,array[]::text[],'manual' from artists a, artists b where a.slug='kohra' and b.slug='bullzeye' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'karan-kanchan', b.id,'prabh-deep','collab',8,array['Boiler Room Mumbai 2023'],'manual' from artists a, artists b where a.slug='karan-kanchan' and b.slug='prabh-deep' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'karan-kanchan', b.id,'kiss-nuka','label',7,array[]::text[],'manual' from artists a, artists b where a.slug='karan-kanchan' and b.slug='kiss-nuka' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'sandunes', b.id,'komorebi','b2b',7,array['Magnetic Fields 2017'],'manual' from artists a, artists b where a.slug='sandunes' and b.slug='komorebi' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'sandunes', b.id,'sid-vashi','collab',8,array['Magnetic Fields 2017'],'manual' from artists a, artists b where a.slug='sandunes' and b.slug='sid-vashi' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'dualist-inquiry', b.id,'sandunes','collab',9,array['NH7 Weekender','Echoes of Earth'],'manual' from artists a, artists b where a.slug='dualist-inquiry' and b.slug='sandunes' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'kohra', b.id,'monophonik','b2b',8,array['NH7 Weekender','Magnetic Fields'],'manual' from artists a, artists b where a.slug='kohra' and b.slug='monophonik' on conflict do nothing;
insert into artist_connections (artist_a_id, artist_a_slug, artist_b_id, artist_b_slug, connection_type, strength, shared_events, source)
select a.id,'lost-stories', b.id,'sickflip','b2b',7,array['Sunburn','VH1 Supersonic'],'manual' from artists a, artists b where a.slug='lost-stories' and b.slug='sickflip' on conflict do nothing;
