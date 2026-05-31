-- ══════════════════════════════════════════════════════════════════════════════
-- CCD Knowledge Graph + Privilege + XP System Migration
-- Safe to re-run: uses IF NOT EXISTS + DROP POLICY IF EXISTS
-- ══════════════════════════════════════════════════════════════════════════════

set search_path = public;

-- ── 1. event_appearances ─────────────────────────────────────────────────────
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
  role             text not null default 'performer',
  source           text not null default 'manual',
  curated_event_id text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_ea_artist_slug on event_appearances (artist_slug);
create index if not exists idx_ea_city        on event_appearances (city);
create index if not exists idx_ea_year        on event_appearances (year);

-- ── 2. artist_connections ────────────────────────────────────────────────────
create table if not exists artist_connections (
  id               uuid primary key default gen_random_uuid(),
  artist_a_id      text not null,
  artist_a_slug    text not null,
  artist_b_id      text not null,
  artist_b_slug    text not null,
  connection_type  text not null,
  strength         integer not null default 1,
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

-- ── 3. venue_profiles ────────────────────────────────────────────────────────
create table if not exists venue_profiles (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  city        text not null,
  capacity    integer,
  genre_focus text[]  not null default '{}',
  description text,
  tier        text not null default 'club',
  instagram   text,
  website     text,
  address     text,
  is_verified boolean not null default false,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_vp_city on venue_profiles (city);

-- ── 4. event_signals ─────────────────────────────────────────────────────────
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

-- ── 5. user_roles ────────────────────────────────────────────────────────────
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

-- ── 6. role_applications ─────────────────────────────────────────────────────
create table if not exists role_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  email          text not null,
  display_name   text not null,
  requested_role text not null,
  entity_id      text,
  entity_slug    text,
  message        text,
  links          jsonb default '{}',
  status         text not null default 'pending',
  reviewed_by    text,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_ra_status on role_applications (status);
create index if not exists idx_ra_user   on role_applications (user_id);

-- ── 7. fan_profiles ──────────────────────────────────────────────────────────
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

-- ── 8. xp_events ─────────────────────────────────────────────────────────────
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
create index if not exists idx_xe_action  on xp_events (action);
create index if not exists idx_xe_created on xp_events (created_at);

-- ── 9. RLS — enable ──────────────────────────────────────────────────────────
alter table event_appearances  enable row level security;
alter table artist_connections enable row level security;
alter table venue_profiles     enable row level security;
alter table event_signals      enable row level security;
alter table user_roles         enable row level security;
alter table role_applications  enable row level security;
alter table fan_profiles       enable row level security;
alter table xp_events          enable row level security;

-- ── 10. RLS — drop all existing policies then recreate ───────────────────────
-- (safe to re-run: DROP IF EXISTS won't error)

do $$ declare t text; p text;
begin
  foreach t in array array[
    'event_appearances','artist_connections','venue_profiles','event_signals',
    'user_roles','role_applications','fan_profiles','xp_events'
  ] loop
    foreach p in array array[
      'public read '||t,
      'service insert '||t,
      'service update '||t,
      'service delete '||t
    ] loop
      execute format('drop policy if exists %I on %I', p, t);
    end loop;
  end loop;
end $$;

-- Public read on all tables
do $$ declare t text; begin
  foreach t in array array[
    'event_appearances','artist_connections','venue_profiles','event_signals',
    'user_roles','role_applications','fan_profiles','xp_events'
  ] loop
    execute format(
      'create policy %I on %I for select using (true)',
      'public read '||t, t
    );
  end loop;
end $$;

-- Service role write on all tables
do $$ declare t text; begin
  foreach t in array array[
    'event_appearances','artist_connections','venue_profiles','event_signals',
    'user_roles','role_applications','fan_profiles','xp_events'
  ] loop
    execute format('create policy %I on %I for insert with check (true)', 'service insert '||t, t);
    execute format('create policy %I on %I for update using (true)',      'service update '||t, t);
    execute format('create policy %I on %I for delete using (true)',      'service delete '||t, t);
  end loop;
end $$;

-- ── 11. Venue seed ────────────────────────────────────────────────────────────
insert into venue_profiles (slug, name, city, capacity, genre_focus, tier, is_verified) values
  ('counterculture-blr',  'Counterculture',      'Bengaluru', 300,  '{Techno,House,Experimental}', 'basement', true),
  ('kitty-su-delhi',      'Kitty Su',            'Delhi',     800,  '{House,Techno,Disco}',        'club',     true),
  ('kitty-su-mumbai',     'Kitty Su Mumbai',     'Mumbai',    600,  '{House,Techno}',              'club',     true),
  ('sunburn-goa',         'Sunburn Festival',    'Goa',       25000,'{House,Techno,EDM}',          'festival', true),
  ('magnetic-fields',     'Magnetic Fields',     'Rajasthan', 3000, '{House,Techno,Ambient}',      'festival', true),
  ('nh7-weekender',       'NH7 Weekender',       'Pune',      8000, '{Electronic,Live,Indie}',     'festival', true),
  ('vh1-supersonic',      'VH1 Supersonic',      'Pune',      10000,'{Electronic,House,Techno}',   'festival', true),
  ('district-festival',   'District Festival',   'Bengaluru', 1500, '{Techno,House}',              'festival', true),
  ('antiheroes-blr',      'Antiheroes',          'Bengaluru', 600,  '{Techno,House}',              'club',     true),
  ('bonobo-mumbai',       'Bonobo',              'Mumbai',    300,  '{House,Disco,Garage}',        'club',     true),
  ('blue-frog-mumbai',    'Blue Frog',           'Mumbai',    400,  '{Electronic,Jazz,Live}',      'club',     true),
  ('echoes-blr',          'Echoes',              'Bengaluru', 200,  '{Techno,House,Ambient}',      'basement', true),
  ('district-delhi',      'District',            'Delhi',     500,  '{House,Techno}',              'club',     true),
  ('aer-mumbai',          'Aer',                 'Mumbai',    250,  '{House,Electronic}',          'rooftop',  true)
on conflict (slug) do nothing;
