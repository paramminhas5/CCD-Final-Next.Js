-- ══════════════════════════════════════════════════════════════════════════════
-- CCD.SCHOOL — Complete Database Setup
-- Run this once in the correct Supabase SQL Editor
-- Safe to re-run: IF NOT EXISTS + DROP POLICY IF EXISTS throughout
-- ══════════════════════════════════════════════════════════════════════════════

set search_path = public;

-- ── 1. EVENT APPEARANCES ──────────────────────────────────────────────────────
-- Links artists to specific gigs. Powers timeline + connection graph.

create table if not exists event_appearances (
  id               uuid primary key default gen_random_uuid(),
  artist_id        text not null,
  artist_slug      text not null,
  artist_name      text not null,
  event_name       text not null,
  venue            text,
  city             text,
  event_date       text,
  year             integer,
  role             text not null default 'performer', -- performer | headliner | support | b2b
  source           text not null default 'manual',
  curated_event_id text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_ea_artist_slug on event_appearances (artist_slug);
create index if not exists idx_ea_city        on event_appearances (city);
create index if not exists idx_ea_year        on event_appearances (year);

-- ── 2. ARTIST CONNECTIONS ─────────────────────────────────────────────────────
-- Directed graph: b2b | label | crew | booker | collab

create table if not exists artist_connections (
  id               uuid primary key default gen_random_uuid(),
  artist_a_id      text not null,
  artist_a_slug    text not null,
  artist_b_id      text not null,
  artist_b_slug    text not null,
  connection_type  text not null,    -- b2b | label | crew | booker | collab
  strength         integer not null default 1,  -- 1-10
  shared_events    text[]  not null default '{}',
  shared_venues    text[]  not null default '{}',
  notes            text,
  source           text not null default 'manual',
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_ac_artist_a on artist_connections (artist_a_slug);
create index if not exists idx_ac_artist_b on artist_connections (artist_b_slug);
create unique index if not exists idx_ac_unique_edge on artist_connections (
  least(artist_a_slug, artist_b_slug),
  greatest(artist_a_slug, artist_b_slug),
  connection_type
);

-- ── 3. VENUE PROFILES ─────────────────────────────────────────────────────────

create table if not exists venue_profiles (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  city        text not null,
  capacity    integer,
  genre_focus text[]  not null default '{}',
  description text,
  tier        text not null default 'club', -- basement | club | rooftop | festival | cultural | arena
  instagram   text,
  website     text,
  address     text,
  is_verified boolean not null default false,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_vp_city on venue_profiles (city);
create index if not exists idx_vp_tier on venue_profiles (tier);

-- ── 4. EVENT SIGNALS ──────────────────────────────────────────────────────────
-- Click/RSVP/save signals for the recommendation engine. 30-day rolling window.

create table if not exists event_signals (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  event_id    text not null,
  signal_type text not null default 'click', -- click | rsvp | save | dismiss
  city        text,
  genre       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_es_session on event_signals (session_id);
create index if not exists idx_es_event   on event_signals (event_id);
create index if not exists idx_es_created on event_signals (created_at);

-- ── 5. USER ROLES ─────────────────────────────────────────────────────────────
-- Maps Clerk user IDs to roles. Managed from /admin — no Supabase dashboard needed.
-- Roles: user | artist | promoter | venue | admin

create table if not exists user_roles (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null unique,   -- Clerk user ID
  email        text,
  display_name text,
  role         text not null default 'user',
  entity_id    text,                   -- FK to artists.id etc.
  entity_slug  text,                   -- e.g. 'kohra'
  entity_name  text,
  granted_by   text,                   -- admin Clerk user ID
  granted_at   timestamptz default now(),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_ur_user_id on user_roles (user_id);
create index if not exists idx_ur_role    on user_roles (role);

-- ── 6. ROLE APPLICATIONS ──────────────────────────────────────────────────────
-- Artists and promoters apply here. Fans are auto-tiered by XP (no application).
-- Admin approves from /admin panel → auto-grants role in user_roles.

create table if not exists role_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  email          text not null,
  display_name   text not null,
  requested_role text not null,   -- artist | promoter | venue
  entity_id      text,
  entity_slug    text,            -- artist slug they're claiming
  message        text,
  links          jsonb default '{}', -- { instagram, soundcloud, website }
  status         text not null default 'pending', -- pending | approved | rejected
  reviewed_by    text,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_ra_status on role_applications (status);
create index if not exists idx_ra_user   on role_applications (user_id);

-- ── 7. FAN PROFILES ───────────────────────────────────────────────────────────
-- Auto-created on first interaction. Tier promoted automatically by XP.
-- Tier thresholds: lurker(0) → regular(100) → maker(500) → legend(2000)

create table if not exists fan_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text not null unique,
  email              text,
  display_name       text,
  xp                 integer not null default 0,
  ccd_points         integer not null default 0,  -- redeemable for merch + tickets
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
create index if not exists idx_fp_tier    on fan_profiles (tier);

-- ── 8. XP EVENTS ─────────────────────────────────────────────────────────────
-- Full audit log of every XP-earning action.
-- Actions: first_visit(50xp) | event_rsvp(20) | social_share(25) |
--          event_share(15) | event_save(10) | artist_follow(10) |
--          event_click(5)  | artist_view(3)

create table if not exists xp_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  action        text not null,
  xp_earned     integer not null default 0,
  points_earned integer not null default 0,
  ref_id        text,     -- event_id or artist_id
  ref_type      text,     -- 'event' | 'artist'
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists idx_xe_user_id on xp_events (user_id);
create index if not exists idx_xe_action  on xp_events (action);
create index if not exists idx_xe_created on xp_events (created_at);

-- ── 9. ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Public read on everything. Service role has full write access.
-- Drop existing policies first so this is safe to re-run.

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
    execute format('create policy %I on %I for select using (true)',              'public read '||t, t);
    execute format('create policy %I on %I for insert with check (true)', 'service insert '||t, t);
    execute format('create policy %I on %I for update using (true)',              'service update '||t, t);
    execute format('create policy %I on %I for delete using (true)',              'service delete '||t, t);
  end loop;
end $$;

-- ── 10. VENUE PROFILES SEED ───────────────────────────────────────────────────

insert into venue_profiles (slug, name, city, capacity, genre_focus, tier, is_verified) values
  ('counterculture-blr', 'Counterculture',      'Bengaluru', 300,   '{Techno,House,Experimental}', 'basement', true),
  ('echoes-blr',         'Echoes',              'Bengaluru', 200,   '{Techno,House,Ambient}',      'basement', true),
  ('antiheroes-blr',     'Antiheroes',          'Bengaluru', 600,   '{Techno,House}',              'club',     true),
  ('kitty-su-delhi',     'Kitty Su Delhi',      'Delhi',     800,   '{House,Techno,Disco}',        'club',     true),
  ('district-delhi',     'District',            'Delhi',     500,   '{House,Techno}',              'club',     true),
  ('kitty-su-mumbai',    'Kitty Su Mumbai',     'Mumbai',    600,   '{House,Techno}',              'club',     true),
  ('bonobo-mumbai',      'Bonobo',              'Mumbai',    300,   '{House,Disco,Garage}',        'club',     true),
  ('blue-frog-mumbai',   'Blue Frog',           'Mumbai',    400,   '{Electronic,Jazz,Live}',      'club',     true),
  ('aer-mumbai',         'Aer',                 'Mumbai',    250,   '{House,Electronic}',          'rooftop',  true),
  ('magnetic-fields',    'Magnetic Fields',     'Rajasthan', 3000,  '{House,Techno,Ambient}',      'festival', true),
  ('nh7-weekender',      'NH7 Weekender',       'Pune',      8000,  '{Electronic,Live,Indie}',     'festival', true),
  ('vh1-supersonic',     'VH1 Supersonic',      'Pune',      10000, '{Electronic,House,Techno}',   'festival', true),
  ('sunburn-goa',        'Sunburn Festival',    'Goa',       25000, '{House,Techno,EDM}',          'festival', true),
  ('district-festival',  'District Festival',   'Bengaluru', 1500,  '{Techno,House}',              'festival', true),
  ('echoes-of-earth',    'Echoes of Earth',     'Bengaluru', 5000,  '{Electronic,World,Ambient}',  'festival', true),
  ('lollapalooza-india', 'Lollapalooza India',  'Mumbai',    60000, '{Electronic,Rock,Pop,Live}',  'festival', true),
  ('boiler-room-india',  'Boiler Room India',   'Bengaluru', 2000,  '{Techno,House}',              'festival', true)
on conflict (slug) do nothing;

-- ── 11. EVENT APPEARANCES SEED ────────────────────────────────────────────────
-- Hardcoded artist UUIDs fetched from REST API — no SELECT FROM needed.

-- Kohra (a09cb082-46cc-4279-8dae-23f51c8cce91)
insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source) values
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','Kohra','Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','Kohra','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','Kohra','District Festival Bengaluru','Castle Kalwar','Bengaluru','2023-12-02',2023,'performer','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','Kohra','Qilla Alchemy Festival','Multiple Venues','India','2023-06-01',2023,'headliner','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','Kohra','Awakenings India / VH1 Supersonic','VH1 Supersonic','Pune','2020-01-24',2020,'performer','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','Kohra','Dekmantel Festival','Dekmantel','Amsterdam','2019-08-02',2019,'performer','manual')
on conflict do nothing;

-- Sandunes (22c8991b-60dc-411b-a419-69bb12895c4f)
insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source) values
  ('22c8991b-60dc-411b-a419-69bb12895c4f','sandunes','Sandunes','Boiler Room Mumbai — First India Boiler Room','Boiler Room','Mumbai','2019-08-19',2019,'headliner','manual'),
  ('22c8991b-60dc-411b-a419-69bb12895c4f','sandunes','Sandunes','Magnetic Fields Festival 2017','Alsisar Mahal','Rajasthan','2017-12-15',2017,'performer','manual'),
  ('22c8991b-60dc-411b-a419-69bb12895c4f','sandunes','Sandunes','Manchester International Festival — Bonobo support','Castlefield Bowl','Manchester','2017-07-08',2017,'support','manual'),
  ('22c8991b-60dc-411b-a419-69bb12895c4f','sandunes','Sandunes','Barbican Centre — Warp x Boiler Room commission','Barbican','London','2017-10-01',2017,'performer','manual'),
  ('22c8991b-60dc-411b-a419-69bb12895c4f','sandunes','Sandunes','Bacardi NH7 Weekender Kolkata','NH7 Weekender','Kolkata','2015-12-05',2015,'performer','manual')
on conflict do nothing;

-- Dualist Inquiry (e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2)
insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source) values
  ('e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','dualist-inquiry','Dualist Inquiry','Lollapalooza India 2024','Mahalaxmi Racecourse','Mumbai','2024-01-27',2024,'headliner','manual'),
  ('e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','dualist-inquiry','Dualist Inquiry','Magnetic Fields 2023 — When We Get There Premiere','Alsisar Mahal','Rajasthan','2023-12-08',2023,'headliner','manual'),
  ('e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','dualist-inquiry','Dualist Inquiry','Bacardi NH7 Weekender','Highlands','Pune','2022-11-19',2022,'headliner','manual'),
  ('e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','dualist-inquiry','Dualist Inquiry','Echoes of Earth 2023','Bengaluru Palace','Bengaluru','2023-12-02',2023,'performer','manual')
on conflict do nothing;

-- Lost Stories (e7b46c8b-45ce-4f14-ab78-a4688ad9b73d)
insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source) values
  ('e7b46c8b-45ce-4f14-ab78-a4688ad9b73d','lost-stories','Lost Stories','Tomorrowland 2018','Main Stage','Belgium','2018-07-22',2018,'performer','manual'),
  ('e7b46c8b-45ce-4f14-ab78-a4688ad9b73d','lost-stories','Lost Stories','Sunburn Goa 2022','Vagator Beach','Goa','2022-12-28',2022,'headliner','manual'),
  ('e7b46c8b-45ce-4f14-ab78-a4688ad9b73d','lost-stories','Lost Stories','VH1 Supersonic 2023','Mhow Grounds','Pune','2023-01-27',2023,'headliner','manual')
on conflict do nothing;

-- Dotdat (08d97e21-97c7-4cdc-855f-d6be6141a8fe)
insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source) values
  ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','dotdat','Dotdat','Watergate Berlin','Watergate','Berlin','2022-09-10',2022,'performer','manual'),
  ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','dotdat','Dotdat','Womb Tokyo','Womb','Tokyo','2022-11-05',2022,'performer','manual'),
  ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','dotdat','Dotdat','Sonar Barcelona','Sonar','Barcelona','2023-06-15',2023,'performer','manual'),
  ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','dotdat','Dotdat','VH1 Supersonic','VH1 Supersonic','Pune','2023-01-27',2023,'performer','manual'),
  ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','dotdat','Dotdat','RA x Magnetic Fields Club Night','Club Night','Delhi','2022-12-01',2022,'performer','manual')
on conflict do nothing;

-- Boiler Room India 2024 artists
insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source) values
  ('7f287e2a-64a4-4c45-994f-d765b4d2b61b','ak-sports','AK Sports','Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual'),
  ('7f287e2a-64a4-4c45-994f-d765b4d2b61b','ak-sports','AK Sports','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual'),
  ('90fddf07-79f9-4165-b72a-fc9ecd794be1','kandy-kuri','Kandy Kuri','Boiler Room Bengaluru 2024','Boiler Room','Bengaluru','2024-06-07',2024,'performer','manual'),
  ('0f353888-30c3-4e4c-958d-7fe2da77744d','girls-night-out','Girls Night Out','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual'),
  ('5fddab27-f82b-4f52-9016-3f06802b80f0','sheral','Sheral','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual'),
  ('c9418706-8cc4-4b86-b195-2894d1e4c866','prismer','Prismer','Boiler Room Delhi NCR 2024','Boiler Room','Delhi','2024-06-08',2024,'performer','manual'),
  ('e16949fa-b14f-47f3-8fe4-40f21fdfc459','kiss-nuka','Kiss Nuka','Boiler Room Mumbai 2024','Boiler Room','Mumbai','2024-09-14',2024,'performer','manual'),
  ('ad0c7d29-5a62-4c3d-b2f7-c7f3b613bdbf','karan-kanchan','Karan Kanchan','Boiler Room Mumbai 2023','Boiler Room','Mumbai','2023-10-06',2023,'performer','manual')
on conflict do nothing;

-- Remaining artists
insert into event_appearances (artist_id,artist_slug,artist_name,event_name,venue,city,event_date,year,role,source) values
  ('6c8fdf75-0b8a-4e0a-8836-ee425980c81b','prabh-deep','Prabh Deep','Echoes of Earth 2023','Bengaluru Palace','Bengaluru','2023-12-02',2023,'performer','manual'),
  ('6c8fdf75-0b8a-4e0a-8836-ee425980c81b','prabh-deep','Prabh Deep','Bacardi NH7 Weekender','Highlands','Pune','2022-11-19',2022,'performer','manual'),
  ('d836fa91-2727-4ed5-b5ef-d839a685d3ee','hamza-rahimtula','Hamza Rahimtula','Echoes of Earth Goa','Chopdem','Goa','2024-02-02',2024,'performer','manual'),
  ('d836fa91-2727-4ed5-b5ef-d839a685d3ee','hamza-rahimtula','Hamza Rahimtula','Magnetic Fields Festival','Alsisar Mahal','Rajasthan','2022-12-09',2022,'performer','manual'),
  ('ee897acc-f36f-434e-ac50-a4b3f72f7189','komorebi','Komorebi','Magnetic Fields 2017','Alsisar Mahal','Rajasthan','2017-12-15',2017,'performer','manual'),
  ('ee897acc-f36f-434e-ac50-a4b3f72f7189','komorebi','Komorebi','Bacardi NH7 Weekender','Highlands','Pune','2018-11-23',2018,'performer','manual'),
  ('f1ac0f23-5c73-46e1-9ba2-d20c04f32afe','sid-vashi','Sid Vashi','Magnetic Fields 2017','Alsisar Mahal','Rajasthan','2017-12-15',2017,'performer','manual'),
  ('c29cdd4d-0f0a-4733-b09c-3ab2c25bb095','bullzeye','Bullzeye','Antiheroes Bangalore','Antiheroes','Bengaluru','2023-03-04',2023,'performer','manual'),
  ('c29cdd4d-0f0a-4733-b09c-3ab2c25bb095','bullzeye','Bullzeye','District Festival Bengaluru','Castle Kalwar','Bengaluru','2023-12-02',2023,'performer','manual')
on conflict do nothing;

-- ── 12. ARTIST CONNECTIONS SEED ───────────────────────────────────────────────

-- Boiler Room Bengaluru 2024 co-performers
insert into artist_connections (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source) values
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','7f287e2a-64a4-4c45-994f-d765b4d2b61b','ak-sports','b2b',7,'{"Boiler Room Bengaluru 2024","Boiler Room Delhi NCR 2024"}','Both on Boiler Room India 2024 — Bengaluru and Delhi NCR dates','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','90fddf07-79f9-4165-b72a-fc9ecd794be1','kandy-kuri','b2b',6,'{"Boiler Room Bengaluru 2024"}','Shared Boiler Room Bengaluru 2024 stage','manual'),
  ('7f287e2a-64a4-4c45-994f-d765b4d2b61b','ak-sports','90fddf07-79f9-4165-b72a-fc9ecd794be1','kandy-kuri','b2b',6,'{"Boiler Room Bengaluru 2024"}','Shared Boiler Room Bengaluru 2024 stage','manual')
on conflict do nothing;

-- Boiler Room Delhi NCR 2024 co-performers
insert into artist_connections (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source) values
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','0f353888-30c3-4e4c-958d-7fe2da77744d','girls-night-out','b2b',6,'{"Boiler Room Delhi NCR 2024"}','Shared Boiler Room Delhi NCR 2024 stage','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','5fddab27-f82b-4f52-9016-3f06802b80f0','sheral','b2b',6,'{"Boiler Room Delhi NCR 2024"}','Shared Boiler Room Delhi NCR 2024 stage','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','c9418706-8cc4-4b86-b195-2894d1e4c866','prismer','b2b',6,'{"Boiler Room Delhi NCR 2024"}','Shared Boiler Room Delhi NCR 2024 stage','manual'),
  ('0f353888-30c3-4e4c-958d-7fe2da77744d','girls-night-out','5fddab27-f82b-4f52-9016-3f06802b80f0','sheral','b2b',7,'{"Boiler Room Delhi NCR 2024"}','Shared Boiler Room Delhi NCR 2024 — Delhi scene regulars','manual'),
  ('0f353888-30c3-4e4c-958d-7fe2da77744d','girls-night-out','c9418706-8cc4-4b86-b195-2894d1e4c866','prismer','b2b',6,'{"Boiler Room Delhi NCR 2024"}','Shared Boiler Room Delhi NCR 2024 stage','manual'),
  ('5fddab27-f82b-4f52-9016-3f06802b80f0','sheral','c9418706-8cc4-4b86-b195-2894d1e4c866','prismer','b2b',7,'{"Boiler Room Delhi NCR 2024"}','Shared Boiler Room Delhi NCR 2024 stage','manual')
on conflict do nothing;

-- Qilla Records family
insert into artist_connections (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source) values
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','08d97e21-97c7-4cdc-855f-d6be6141a8fe','dotdat','label',8,'{"Qilla Chakravyuh 2024","District Festival"}','Qilla Records — both on Chakravyuh vinyl 2024 (red smoked double LP)','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','0a04f3ae-ad5e-49b4-9d84-54aa916f7cef','midnight-traffic','label',8,'{"Qilla Chakravyuh 2024"}','Qilla Records — Midnight Traffic on Chakravyuh vinyl','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','19686d28-8895-4683-bd53-a75925d5bd93','monophonik','label',9,'{"Qilla Chakravyuh 2024"}','Qilla Records core artist — named by Kohra in Beatportal 2020 interview as a favourite','manual'),
  ('a09cb082-46cc-4279-8dae-23f51c8cce91','kohra','28fd2765-7fbd-45f5-8de9-e9f05b509955','audio-units','label',7,'{"Qilla Chakravyuh 2024"}','Audio Units on Qilla Chakravyuh compilation','manual'),
  ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','dotdat','0a04f3ae-ad5e-49b4-9d84-54aa916f7cef','midnight-traffic','label',7,'{"Qilla Chakravyuh 2024"}','Both Qilla Records — on Chakravyuh vinyl together','manual'),
  ('08d97e21-97c7-4cdc-855f-d6be6141a8fe','dotdat','ef1290a1-058b-4207-bf18-0d1ba091d329','anyasa','b2b',6,'{"Sunburn"}','Both on Goa and festival circuit — RA page lists them together','manual')
on conflict do nothing;

-- Sandunes connections
insert into artist_connections (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source) values
  ('22c8991b-60dc-411b-a419-69bb12895c4f','sandunes','e7fd48d1-53ba-47e9-9c8b-1d28ed6ad1f2','dualist-inquiry','collab',9,'{"NH7 Weekender","Echoes of Earth"}','Formed the Dualist Inquiry Band together; longtime collaborators across festival circuit','manual'),
  ('22c8991b-60dc-411b-a419-69bb12895c4f','sandunes','f1ac0f23-5c73-46e1-9ba2-d20c04f32afe','sid-vashi','b2b',8,'{"Magnetic Fields 2017"}','Both performed Magnetic Fields 2017 — Mumbai experimental/jazz-electronic scene','manual')
on conflict do nothing;

-- Mumbai / Krunk network
insert into artist_connections (artist_a_id,artist_a_slug,artist_b_id,artist_b_slug,connection_type,strength,shared_events,notes,source) values
  ('ad0c7d29-5a62-4c3d-b2f7-c7f3b613bdbf','karan-kanchan','e16949fa-b14f-47f3-8fe4-40f21fdfc459','kiss-nuka','label',8,'{}','Both in Krunk network — Kiss Nuka presented by Krunk at Boiler Room Mumbai 2024','manual'),
  ('ad0c7d29-5a62-4c3d-b2f7-c7f3b613bdbf','karan-kanchan','6c8fdf75-0b8a-4e0a-8836-ee425980c81b','prabh-deep','collab',8,'{"Boiler Room Mumbai 2023"}','Shared Boiler Room Mumbai 2023 stage alongside Seedhe Maut — Mumbai hip-hop/electronic crossover','manual'),
  ('e7b46c8b-45ce-4f14-ab78-a4688ad9b73d','lost-stories','fbc22ec5-f6c9-4d73-bf72-52cc58d6a74f','sickflip','b2b',7,'{"Sunburn","VH1 Supersonic"}','Regular co-performers on Sunburn and VH1 Supersonic lineups','manual')
on conflict do nothing;

-- ── 13. VERIFY ────────────────────────────────────────────────────────────────
select 'event_appearances'  as "table", count(*) as rows from event_appearances
union all
select 'artist_connections' as "table", count(*) as rows from artist_connections
union all
select 'venue_profiles'     as "table", count(*) as rows from venue_profiles
union all
select 'user_roles'         as "table", count(*) as rows from user_roles
union all
select 'role_applications'  as "table", count(*) as rows from role_applications
union all
select 'fan_profiles'       as "table", count(*) as rows from fan_profiles
union all
select 'xp_events'          as "table", count(*) as rows from xp_events
union all
select 'event_signals'      as "table", count(*) as rows from event_signals;
