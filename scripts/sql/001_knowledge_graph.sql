-- ══════════════════════════════════════════════════════════════════════════════
-- CCD Knowledge Graph + Privilege + XP System Migration
-- Run in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

set search_path = public;

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
  shared_events    text[]   not null default '{}',
  shared_venues    text[]   not null default '{}',
  notes            text,
  source           text not null default 'manual',
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_ac_artist_a on artist_connections (artist_a_slug);
create index if not exists idx_ac_artist_b on artist_connections (artist_b_slug);
create unique index if not exists idx_ac_unique_edge
  on artist_connections (
    least(artist_a_slug, artist_b_slug),
    greatest(artist_a_slug, artist_b_slug),
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

-- ── 5. user_roles ─────────────────────────────────────────────────────────────
-- Roles: user | artist | promoter | venue | admin
create table if not exists user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null unique,
  email       text,
  display_name text,
  role        text not null default 'user',
  entity_id   text,
  entity_slug text,
  entity_name text,
  granted_by  text,
  granted_at  timestamptz default now(),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_ur_user_id on user_roles (user_id);
create index if not exists idx_ur_role    on user_roles (role);

-- ── 6. role_applications (artists + promoters only — fans are auto-tiered) ──
create table if not exists role_applications (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  email           text not null,
  display_name    text not null,
  requested_role  text not null,
  entity_id       text,
  entity_slug     text,
  message         text,
  links           jsonb default '{}',
  status          text not null default 'pending',
  reviewed_by     text,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_ra_status on role_applications (status);
create index if not exists idx_ra_user   on role_applications (user_id);

-- ── 7. fan_profiles (XP + CCD Points + auto-tier) ────────────────────────────
create table if not exists fan_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            text not null unique,
  email              text,
  display_name       text,
  xp                 integer not null default 0,
  ccd_points         integer not null default 0,
  tier               text not null default 'lurker',
  -- Tier levels: lurker(0) | regular(100) | maker(500) | legend(2000)
  total_interactions integer not null default 0,
  events_rsvpd       integer not null default 0,
  events_saved       integer not null default 0,
  shares             integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_fp_user_id on fan_profiles (user_id);
create index if not exists idx_fp_tier    on fan_profiles (tier);
create index if not exists idx_fp_xp      on fan_profiles (xp desc);

-- ── 8. xp_events (log every XP-earning action) ───────────────────────────────
create table if not exists xp_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  action      text not null,
  -- action types: first_visit | event_click | event_rsvp | event_save |
  --               event_share | artist_view | social_share | redemption
  xp_earned   integer not null default 0,
  points_earned integer not null default 0,
  ref_id      text,   -- event_id or artist_id
  ref_type    text,   -- event | artist
  metadata    jsonb default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists idx_xe_user_id  on xp_events (user_id);
create index if not exists idx_xe_action   on xp_events (action);
create index if not exists idx_xe_created  on xp_events (created_at);

-- ── 9. RLS ───────────────────────────────────────────────────────────────────
alter table event_appearances   enable row level security;
alter table artist_connections  enable row level security;
alter table venue_profiles      enable row level security;
alter table event_signals       enable row level security;
alter table user_roles          enable row level security;
alter table role_applications   enable row level security;
alter table fan_profiles        enable row level security;
alter table xp_events           enable row level security;

-- Public read
create policy "public read event_appearances"  on event_appearances  for select using (true);
create policy "public read artist_connections" on artist_connections  for select using (true);
create policy "public read venue_profiles"     on venue_profiles      for select using (true);
create policy "public read event_signals"      on event_signals       for select using (true);
create policy "public read user_roles"         on user_roles          for select using (true);
create policy "public read role_applications"  on role_applications   for select using (true);
create policy "public read fan_profiles"       on fan_profiles        for select using (true);
create policy "public read xp_events"          on xp_events           for select using (true);

-- Service role write (all tables)
do $$ declare t text; begin
  foreach t in array array['event_appearances','artist_connections','venue_profiles',
    'event_signals','user_roles','role_applications','fan_profiles','xp_events'] loop
    execute format('create policy "service insert %I" on %I for insert with check (true)', t, t);
    execute format('create policy "service update %I" on %I for update using (true)', t, t);
    execute format('create policy "service delete %I" on %I for delete using (true)', t, t);
  end loop;
end $$;

-- ── 10. Venue seed data ────────────────────────────────────────────────────────
insert into venue_profiles (slug, name, city, capacity, genre_focus, tier, is_verified) values
  ('counterculture-blr',    'Counterculture',        'Bengaluru',  300,  '{Techno,House,Experimental}', 'basement', true),
  ('kitty-su-delhi',        'Kitty Su',              'Delhi',      800,  '{House,Techno,Disco}',        'club',     true),
  ('kitty-su-mumbai',       'Kitty Su Mumbai',       'Mumbai',     600,  '{House,Techno}',              'club',     true),
  ('sunburn-goa',           'Sunburn Festival',      'Goa',        25000,'{House,Techno,EDM}',          'festival', true),
  ('magnetic-fields',       'Magnetic Fields',       'Rajasthan',  3000, '{House,Techno,Ambient}',      'festival', true),
  ('nh7-weekender',         'NH7 Weekender',         'Pune',       8000, '{Electronic,Live,Indie}',     'festival', true),
  ('vh1-supersonic',        'VH1 Supersonic',        'Pune',       10000,'{Electronic,House,Techno}',   'festival', true),
  ('district-festival',     'District Festival',     'Bengaluru',  1500, '{Techno,House}',              'festival', true),
  ('antiheroes-blr',        'Antiheroes',            'Bengaluru',  600,  '{Techno,House}',              'club',     true),
  ('bonobo-mumbai',         'Bonobo',                'Mumbai',     300,  '{House,Disco,Garage}',        'club',     true),
  ('blue-frog-mumbai',      'Blue Frog',             'Mumbai',     400,  '{Electronic,Jazz,Live}',      'club',     true),
  ('aero-mumbai',           'Aer',                   'Mumbai',     250,  '{House,Electronic}',          'rooftop',  true),
  ('echoes-blr',            'Echoes',                'Bengaluru',  200,  '{Techno,House,Ambient}',      'basement', true),
  ('district-delhi',        'District',              'Delhi',      500,  '{House,Techno}',              'club',     true)
on conflict (slug) do nothing;

