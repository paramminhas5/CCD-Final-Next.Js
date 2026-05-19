-- ═══════════════════════════════════════════════════════════════════════════════
-- CCD Artist Knowledge Graph Migration
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. event_appearances ─────────────────────────────────────────────────────
create table if not exists event_appearances (
  id                 uuid primary key default gen_random_uuid(),
  artist_id          text not null,
  artist_slug        text not null,
  artist_name        text not null,
  event_name         text not null,
  venue              text,
  city               text,
  event_date         text,
  year               integer,
  role               text not null default 'performer',
  source             text not null default 'manual',
  curated_event_id   text,
  created_at         timestamptz not null default now()
);

create index if not exists idx_ea_artist_id   on event_appearances (artist_id);
create index if not exists idx_ea_artist_slug on event_appearances (artist_slug);
create index if not exists idx_ea_city        on event_appearances (city);
create index if not exists idx_ea_year        on event_appearances (year);
create index if not exists idx_ea_event_name  on event_appearances (event_name);

-- ── 2. artist_connections ────────────────────────────────────────────────────
create table if not exists artist_connections (
  id               uuid primary key default gen_random_uuid(),
  artist_a_id      text not null,
  artist_a_slug    text not null,
  artist_b_id      text not null,
  artist_b_slug    text not null,
  connection_type  text not null,   -- b2b | label | crew | booker | collab
  strength         integer not null default 1,
  shared_events    text[]   not null default '{}',
  shared_venues    text[]   not null default '{}',
  notes            text,
  source           text not null default 'manual',
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_ac_artist_a on artist_connections (artist_a_id);
create index if not exists idx_ac_artist_b on artist_connections (artist_b_id);
create index if not exists idx_ac_type     on artist_connections (connection_type);

-- Unique edge (undirected) — prevent duplicates both ways
create unique index if not exists idx_ac_unique_edge
  on artist_connections (
    least(artist_a_id, artist_b_id),
    greatest(artist_a_id, artist_b_id),
    connection_type
  );

-- ── 3. venue_profiles ────────────────────────────────────────────────────────
create table if not exists venue_profiles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  city         text not null,
  capacity     integer,
  genre_focus  text[] not null default '{}',
  description  text,
  tier         text not null default 'club',
  instagram    text,
  website      text,
  address      text,
  is_verified  boolean not null default false,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_vp_city on venue_profiles (city);
create index if not exists idx_vp_tier on venue_profiles (tier);

-- ── 4. event_signals (click / RSVP tracking for rec engine) ─────────────────
create table if not exists event_signals (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  event_id    text not null,
  signal_type text not null default 'click',  -- click | rsvp | save | dismiss
  city        text,
  genre       text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_es_session   on event_signals (session_id);
create index if not exists idx_es_event     on event_signals (event_id);
create index if not exists idx_es_genre     on event_signals (genre);
create index if not exists idx_es_created   on event_signals (created_at);

-- TTL cleanup — run periodically (or set up pg_cron)
-- delete from event_signals where created_at < now() - interval '30 days';

-- ── 5. Row Level Security (open read, service-role write) ────────────────────
alter table event_appearances   enable row level security;
alter table artist_connections  enable row level security;
alter table venue_profiles      enable row level security;
alter table event_signals       enable row level security;

-- Public read access
create policy "public read event_appearances"  on event_appearances  for select using (true);
create policy "public read artist_connections" on artist_connections  for select using (true);
create policy "public read venue_profiles"     on venue_profiles      for select using (true);
create policy "public read event_signals"      on event_signals       for select using (true);

-- Service role write access (backend only)
create policy "service write event_appearances"  on event_appearances  for insert with check (true);
create policy "service write artist_connections" on artist_connections  for insert with check (true);
create policy "service write venue_profiles"     on venue_profiles      for insert with check (true);
create policy "service write event_signals"      on event_signals       for insert with check (true);

-- ── 6. Seed — India venue profiles ──────────────────────────────────────────
insert into venue_profiles (slug, name, city, capacity, genre_focus, tier, is_verified) values
  ('kitty-su-delhi',        'Kitty Su',              'Delhi',     800,  '{House,Techno,Disco}',      'club',     true),
  ('kitty-su-mumbai',       'Kitty Su Mumbai',       'Mumbai',    600,  '{House,Techno}',            'club',     true),
  ('counterculture-blr',    'Counterculture',        'Bangalore', 300,  '{Techno,House,Experimental}','basement', true),
  ('bhavani-island',        'Bhavani Island',        'Hyderabad', 5000, '{Electronic,Live}',         'festival', true),
  ('vh1-supersonic',        'VH1 Supersonic',        'Pune',      10000,'{Electronic,House,Techno}', 'festival', true),
  ('sunburn-goa',           'Sunburn Festival',      'Goa',       25000,'{House,Techno,EDM}',        'festival', true),
  ('magnetic-fields',       'Magnetic Fields',       'Rajasthan', 3000, '{House,Techno,Ambient}',    'festival', true),
  ('nh7-weekender',         'NH7 Weekender',         'Pune',      8000, '{Electronic,Live,Indie}',   'festival', true),
  ('blue-frog-mumbai',      'Blue Frog',             'Mumbai',    400,  '{Electronic,Jazz,Live}',    'club',     true),
  ('social-blr',            'Social',                'Bangalore', 250,  '{House,Indie,Electronic}',  'club',     true),
  ('antiheroes-blr',        'Antiheroes',            'Bangalore', 600,  '{Techno,House}',            'club',     true),
  ('district-delhi',        'District',              'Delhi',     500,  '{House,Techno}',            'club',     true),
  ('hauz-khas-social',      'Hauz Khas Social',      'Delhi',     350,  '{Electronic,Hip-Hop}',      'club',     true),
  ('bonobo-mumbai',         'Bonobo',                'Mumbai',    300,  '{House,Disco,Garage}',      'club',     true),
  ('aer-mumbai',            'Aer',                   'Mumbai',    250,  '{House,Electronic}',        'rooftop',  true),
  ('lil-flea-mumbai',       'Lil Flea',              'Mumbai',    2000, '{Electronic,Art,Live}',     'cultural', true),
  ('echoes-blr',            'Echoes',                'Bangalore', 200,  '{Techno,House,Ambient}',    'basement', true),
  ('the-stamp-blr',         'The Stamp',             'Bangalore', 400,  '{House,Disco,Electronic}',  'club',     true)
on conflict (slug) do nothing;
