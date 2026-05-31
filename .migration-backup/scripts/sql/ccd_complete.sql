-- ══════════════════════════════════════════════════════════════════════════════
-- CCD.SCHOOL — Complete Database Setup
-- Run this in the correct Supabase project SQL Editor
-- Safe to re-run: IF NOT EXISTS + DROP POLICY IF EXISTS throughout
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. TABLES ─────────────────────────────────────────────────────────────────
-- event_appearances: actual columns confirmed via REST API
-- artist_connections: actual columns confirmed via REST API

-- Drop and recreate with correct columns (tables may exist with wrong schema)
-- We alter to add missing columns rather than drop — preserves any existing data.

-- event_appearances: add missing columns if table exists with old schema
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name='event_appearances' and column_name='venue_name') then
    -- Table exists but may be missing columns — this handles both cases
    null;
  end if;
end $$;

create table if not exists event_appearances (
  id         uuid primary key default gen_random_uuid(),
  artist_id  text not null,
  event_name text not null,
  event_date text,
  venue_name text,
  venue_city text,
  role       text not null default 'performer',
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists idx_ea_artist_id  on event_appearances (artist_id);
create index if not exists idx_ea_event_date on event_appearances (event_date);
create index if not exists idx_ea_venue_city on event_appearances (venue_city);

-- artist_connections: actual schema
create table if not exists artist_connections (
  id                 uuid primary key default gen_random_uuid(),
  artist_id          text not null,
  connected_artist_id text not null,
  connection_type    text not null,
  notes              text,
  created_at         timestamptz not null default now()
);
create index if not exists idx_ac_artist_id   on artist_connections (artist_id);
create index if not exists idx_ac_connected   on artist_connections (connected_artist_id);
create unique index if not exists idx_ac_unique_pair on artist_connections (
  least(artist_id, connected_artist_id),
  greatest(artist_id, connected_artist_id),
  connection_type
);

-- venue_profiles
create table if not exists venue_profiles (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  city        text not null,
  capacity    integer,
  genre_focus text[] not null default '{}',
  description text,
  tier        text not null default 'club',
  instagram   text,
  website     text,
  is_verified boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_vp_city on venue_profiles (city);

-- event_signals (recommendation engine)
create table if not exists event_signals (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  event_id    text not null,
  signal_type text not null default 'click',
  city        text,
  genre       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_es_session on event_signals (session_id);
create index if not exists idx_es_event   on event_signals (event_id);
create index if not exists idx_es_created on event_signals (created_at);

-- user_roles (admin-managed, role: user|artist|promoter|venue|admin)
create table if not exists user_roles (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null unique,
  email        text,
  display_name text,
  role         text not null default 'user',
  entity_id    text,
  entity_slug  text,
  entity_name  text,
  granted_by   text,
  granted_at   timestamptz default now(),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_ur_user_id on user_roles (user_id);
create index if not exists idx_ur_role    on user_roles (role);

-- role_applications (artists + promoters apply; fans are auto-tiered)
create table if not exists role_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  email          text not null,
  display_name   text not null,
  requested_role text not null,
  entity_slug    text,
  message        text,
  links          jsonb default '{}',
  status         text not null default 'pending',
  reviewed_by    text,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_ra_status on role_applications (status);

-- fan_profiles (auto-created; tiered by XP: lurker→regular→maker→legend)
create table if not exists fan_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text not null unique,
  email              text,
  display_name       text,
  xp                 integer not null default 0,
  ccd_points         integer not null default 0,
  tier               text not null default 'lurker',
  total_interactions integer not null default 0,
  events_rsvpd       integer not null default 0,
  events_saved       integer not null default 0,
  shares             integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_fp_user_id on fan_profiles (user_id);
create index if not exists idx_fp_xp      on fan_profiles (xp desc);

-- xp_events (full audit log: first_visit|event_rsvp|event_save|event_share|etc)
create table if not exists xp_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  action        text not null,
  xp_earned     integer not null default 0,
  points_earned integer not null default 0,
  ref_id        text,
  ref_type      text,
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists idx_xe_user_id on xp_events (user_id);
create index if not exists idx_xe_created on xp_events (created_at);

-- ── 2. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

alter table event_appearances  enable row level security;
alter table artist_connections enable row level security;
alter table venue_profiles     enable row level security;
alter table event_signals      enable row level security;
alter table user_roles         enable row level security;
alter table role_applications  enable row level security;
alter table fan_profiles       enable row level security;
alter table xp_events          enable row level security;

do $$ declare t text; p text;
begin
  foreach t in array array[
    'event_appearances','artist_connections','venue_profiles','event_signals',
    'user_roles','role_applications','fan_profiles','xp_events'
  ] loop
    foreach p in array array['public read ','service insert ','service update ','service delete '] loop
      execute format('drop policy if exists %I on %I', p||t, t);
    end loop;
    execute format('create policy %I on %I for select using (true)',           'public read '||t, t);
    execute format('create policy %I on %I for insert with check (true)', 'service insert '||t, t);
    execute format('create policy %I on %I for update using (true)',           'service update '||t, t);
    execute format('create policy %I on %I for delete using (true)',           'service delete '||t, t);
  end loop;
end $$;

-- ── 3. VENUE PROFILES SEED ────────────────────────────────────────────────────

insert into venue_profiles (slug,name,city,capacity,genre_focus,tier,is_verified) values
  ('counterculture-blr','Counterculture','Bengaluru',300,'{Techno,House,Experimental}','basement',true),
  ('echoes-blr','Echoes','Bengaluru',200,'{Techno,House,Ambient}','basement',true),
  ('antiheroes-blr','Antiheroes','Bengaluru',600,'{Techno,House}','club',true),
  ('district-festival','District Festival','Bengaluru',1500,'{Techno,House}','festival',true),
  ('echoes-of-earth','Echoes of Earth','Bengaluru',5000,'{Electronic,World,Ambient}','festival',true),
  ('kitty-su-delhi','Kitty Su Delhi','Delhi',800,'{House,Techno,Disco}','club',true),
  ('district-delhi','District','Delhi',500,'{House,Techno}','club',true),
  ('kitty-su-mumbai','Kitty Su Mumbai','Mumbai',600,'{House,Techno}','club',true),
  ('bonobo-mumbai','Bonobo','Mumbai',300,'{House,Disco,Garage}','club',true),
  ('blue-frog-mumbai','Blue Frog','Mumbai',400,'{Electronic,Jazz,Live}','club',true),
  ('aer-mumbai','Aer','Mumbai',250,'{House,Electronic}','rooftop',true),
  ('lollapalooza-india','Lollapalooza India','Mumbai',60000,'{Electronic,Rock,Pop,Live}','festival',true),
  ('magnetic-fields','Magnetic Fields','Rajasthan',3000,'{House,Techno,Ambient}','festival',true),
  ('nh7-weekender','NH7 Weekender','Pune',8000,'{Electronic,Live,Indie}','festival',true),
  ('vh1-supersonic','VH1 Supersonic','Pune',10000,'{Electronic,House,Techno}','festival',true),
  ('sunburn-goa','Sunburn Festival','Goa',25000,'{House,Techno,EDM}','festival',true)
on conflict (slug) do nothing;

-- ── 4. EVENT APPEARANCES SEED ─────────────────────────────────────────────────
-- Columns: artist_id, event_name, event_date, venue_name, venue_city, role, notes

insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','Boiler Room Bengaluru 2024','2024-06-07','Boiler Room','Bengaluru','performer','Boiler Room India 2024') on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','Boiler Room Delhi NCR 2024','2024-06-08','Boiler Room','Delhi','performer','Boiler Room India 2024') on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','District Festival Bengaluru','2023-12-02','Castle Kalwar','Bengaluru','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','Qilla Alchemy Festival','2023-06-01','Multiple Venues','India','headliner','Qilla Records label festival') on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','Awakenings India / VH1 Supersonic','2020-01-24','VH1 Supersonic','Pune','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','Dekmantel Festival','2019-08-02','Dekmantel','Amsterdam','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('22c8991b-60dc-411b-a419-69bb12895c4f','Boiler Room Mumbai — First India Boiler Room','2019-08-19','Boiler Room','Mumbai','headliner','First ever Boiler Room India') on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('22c8991b-60dc-411b-a419-69bb12895c4f','Magnetic Fields Festival 2017','2017-12-15','Alsisar Mahal','Rajasthan','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('22c8991b-60dc-411b-a419-69bb12895c4f','Manchester International Festival — Bonobo support','2017-07-08','Castlefield Bowl','Manchester','support',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('22c8991b-60dc-411b-a419-69bb12895c4f','Barbican Centre — Warp x Boiler Room commission','2017-10-01','Barbican','London','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('22c8991b-60dc-411b-a419-69bb12895c4f','Bacardi NH7 Weekender Kolkata','2015-12-05','NH7 Weekender','Kolkata','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','Lollapalooza India 2024','2024-01-27','Mahalaxmi Racecourse','Mumbai','headliner','8-piece live A/V show') on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','Magnetic Fields 2023','2023-12-08','Alsisar Mahal','Rajasthan','headliner','When We Get There album premiere') on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','Bacardi NH7 Weekender','2022-11-19','Highlands','Pune','headliner',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','Echoes of Earth 2023','2023-12-02','Bengaluru Palace','Bengaluru','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('e7b46c8b-45ce-4f14-ab78-a4688ad9b73d','Tomorrowland 2018','2018-07-22','Main Stage','Belgium','performer','First Indians at Tomorrowland — 4 appearances total') on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('e7b46c8b-45ce-4f14-ab78-a4688ad9b73d','Sunburn Goa 2022','2022-12-28','Vagator Beach','Goa','headliner',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('e7b46c8b-45ce-4f14-ab78-a4688ad9b73d','VH1 Supersonic 2023','2023-01-27','Mhow Grounds','Pune','headliner',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','Watergate Berlin','2022-09-10','Watergate','Berlin','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','Womb Tokyo','2022-11-05','Womb','Tokyo','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','Sonar Barcelona','2023-06-15','Sonar','Barcelona','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','VH1 Supersonic','2023-01-27','VH1 Supersonic','Pune','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','RA x Magnetic Fields Club Night','2022-12-01','Club Night','Delhi','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('7f287e2a-64a4-4c45-994f-d765b4d2b61b','Boiler Room Bengaluru 2024','2024-06-07','Boiler Room','Bengaluru','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('7f287e2a-64a4-4c45-994f-d765b4d2b61b','Boiler Room Delhi NCR 2024','2024-06-08','Boiler Room','Delhi','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('90fddf07-79f9-4165-b72a-fc9ecd794be1','Boiler Room Bengaluru 2024','2024-06-07','Boiler Room','Bengaluru','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('0f353888-30c3-4e4c-958d-7fe2da77744d','Boiler Room Delhi NCR 2024','2024-06-08','Boiler Room','Delhi','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('5fddab27-f82b-4f52-9016-3f06802b80f0','Boiler Room Delhi NCR 2024','2024-06-08','Boiler Room','Delhi','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('c9418706-8cc4-4b86-b195-2894d1e4c866','Boiler Room Delhi NCR 2024','2024-06-08','Boiler Room','Delhi','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('e16949fa-b14f-47f3-8fe4-40f21fdfc459','Boiler Room Mumbai 2024','2024-09-14','Boiler Room','Mumbai','performer','Presented by Krunk') on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('ad0c7d29-5a62-4c3d-b2f7-c7f3b613bdbf','Boiler Room Mumbai 2023','2023-10-06','Boiler Room','Mumbai','performer','With Seedhe Maut') on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('6c8fdf75-0b8a-4e0a-8836-ee425980c81b','Echoes of Earth 2023','2023-12-02','Bengaluru Palace','Bengaluru','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('6c8fdf75-0b8a-4e0a-8836-ee425980c81b','Bacardi NH7 Weekender','2022-11-19','Highlands','Pune','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('d836fa91-2727-4ed5-b5ef-d839a685d3ee','Echoes of Earth Goa','2024-02-02','Chopdem','Goa','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('d836fa91-2727-4ed5-b5ef-d839a685d3ee','Magnetic Fields Festival','2022-12-09','Alsisar Mahal','Rajasthan','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('ee897acc-f36f-434e-ac50-a4b3f72f7189','Magnetic Fields 2017','2017-12-15','Alsisar Mahal','Rajasthan','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('ee897acc-f36f-434e-ac50-a4b3f72f7189','Bacardi NH7 Weekender','2018-11-23','Highlands','Pune','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('f1ac0f23-5c73-46e1-9ba2-d20c04f32afe','Magnetic Fields 2017','2017-12-15','Alsisar Mahal','Rajasthan','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('c29cdd4d-0f0a-4733-b09c-3ab2c25bb095','Antiheroes Bangalore','2023-03-04','Antiheroes','Bengaluru','performer',null) on conflict do nothing;
insert into event_appearances (artist_id,event_name,event_date,venue_name,venue_city,role,notes) values ('c29cdd4d-0f0a-4733-b09c-3ab2c25bb095','District Festival Bengaluru','2023-12-02','Castle Kalwar','Bengaluru','performer',null) on conflict do nothing;

-- ── 5. ARTIST CONNECTIONS SEED ─────────────────────────────────────────────────
-- Columns: artist_id, connected_artist_id, connection_type, notes

insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','7f287e2a-64a4-4c45-994f-d765b4d2b61b','b2b','Boiler Room India 2024 — Bengaluru and Delhi NCR dates') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','90fddf07-79f9-4165-b72a-fc9ecd794be1','b2b','Boiler Room Bengaluru 2024') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('7f287e2a-64a4-4c45-994f-d765b4d2b61b','90fddf07-79f9-4165-b72a-fc9ecd794be1','b2b','Boiler Room Bengaluru 2024') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','0f353888-30c3-4e4c-958d-7fe2da77744d','b2b','Boiler Room Delhi NCR 2024') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','5fddab27-f82b-4f52-9016-3f06802b80f0','b2b','Boiler Room Delhi NCR 2024') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','c9418706-8cc4-4b86-b195-2894d1e4c866','b2b','Boiler Room Delhi NCR 2024') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('0f353888-30c3-4e4c-958d-7fe2da77744d','5fddab27-f82b-4f52-9016-3f06802b80f0','b2b','Boiler Room Delhi NCR 2024 — Delhi scene regulars') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('0f353888-30c3-4e4c-958d-7fe2da77744d','c9418706-8cc4-4b86-b195-2894d1e4c866','b2b','Boiler Room Delhi NCR 2024') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('5fddab27-f82b-4f52-9016-3f06802b80f0','c9418706-8cc4-4b86-b195-2894d1e4c866','b2b','Boiler Room Delhi NCR 2024') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','08d97e21-97c7-4cdc-855f-d6be6141a8fe','label','Qilla Records — both on Chakravyuh vinyl 2024 (red smoked double LP)') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','0a04f3ae-ad5e-49b4-9d84-54aa916f7cef','label','Qilla Records — Midnight Traffic on Chakravyuh vinyl') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','19686d28-8895-4683-bd53-a75925d5bd93','label','Qilla Records core artist; named by Kohra in Beatportal 2020 interview') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('a09cb082-46cc-4279-8dae-23f51c8cce91','28fd2765-7fbd-45f5-8de9-e9f05b509955','label','Audio Units on Qilla Chakravyuh compilation') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','0a04f3ae-ad5e-49b4-9d84-54aa916f7cef','label','Both Qilla Records — on Chakravyuh vinyl together') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','ef1290a1-058b-4207-bf18-0d1ba091d329','b2b','Both on Goa and festival circuit') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('22c8991b-60dc-411b-a419-69bb12895c4f','e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','collab','Formed the Dualist Inquiry Band together; longtime festival collaborators') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('22c8991b-60dc-411b-a419-69bb12895c4f','f1ac0f23-5c73-46e1-9ba2-d20c04f32afe','b2b','Both at Magnetic Fields 2017 — Mumbai experimental scene') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('ad0c7d29-5a62-4c3d-b2f7-c7f3b613bdbf','e16949fa-b14f-47f3-8fe4-40f21fdfc459','label','Both Krunk — Kiss Nuka presented by Krunk at Boiler Room Mumbai 2024') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('ad0c7d29-5a62-4c3d-b2f7-c7f3b613bdbf','6c8fdf75-0b8a-4e0a-8836-ee425980c81b','collab','Boiler Room Mumbai 2023 alongside Seedhe Maut') on conflict do nothing;
insert into artist_connections (artist_id,connected_artist_id,connection_type,notes) values ('e7b46c8b-45ce-4f14-ab78-a4688ad9b73d','fbc22ec5-f6c9-4d73-bf72-52cc58d6a74f','b2b','Regular co-performers on Sunburn and VH1 Supersonic lineups') on conflict do nothing;

-- ── 6. VERIFY ─────────────────────────────────────────────────────────────────
select 'event_appearances'  as "table", count(*) as rows from event_appearances
union all select 'artist_connections', count(*) from artist_connections
union all select 'venue_profiles',     count(*) from venue_profiles
union all select 'user_roles',         count(*) from user_roles
union all select 'role_applications',  count(*) from role_applications
union all select 'fan_profiles',       count(*) from fan_profiles
union all select 'xp_events',          count(*) from xp_events
union all select 'event_signals',      count(*) from event_signals;