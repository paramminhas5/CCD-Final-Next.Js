-- ══════════════════════════════════════════════════════════════════════════════
-- FILE 1: ccd_fix_schema_and_seed.sql
-- Run this FIRST in Supabase SQL Editor.
-- Safe to re-run — idempotent throughout.
--
-- §A  Schema fixes  (ALTER + DROP/RECREATE)
-- §B  Create 19 missing tables
-- §C  RLS policies on all new tables
-- §D  Venue profiles seed  (15 venues)
-- §E  Curated events seed  (30 real events)
-- §F  Event artist lineups  (CCDXSOCIAL 01/02/03)
-- §G  Artist dates  (Startdawg + Merman Jun 29 / Jul 27 / Aug 30)
-- §H  Site settings  (homepage sections ON)
-- §I  Fix artist_connections types  (reclassify from 'crew')
-- §J  Mark featured artists  (13 artists)
-- §K  Set available_cities for bookable artists
-- §L  Promoter updates  (add missing blurbs + claimed_by column)
-- §M  Verify row counts
-- ══════════════════════════════════════════════════════════════════════════════

set search_path = public;

-- ══════════════════════════════════════════════════════════════════════════════
-- §A  SCHEMA FIXES
-- ══════════════════════════════════════════════════════════════════════════════

-- A1. Delete mystery event
delete from events where slug = 'event-1779144207008';

-- A2. Fix events table — series columns (already exist but confirm)
alter table events add column if not exists series         text;
alter table events add column if not exists series_label   text;
alter table events add column if not exists event_type     text;
alter table events add column if not exists pet_friendly   boolean default false;
alter table events add column if not exists series_tagline text;
alter table events add column if not exists is_finale      boolean default false;

-- A3. Fix promoters — add claimed_by
alter table promoters add column if not exists claimed_by text;

-- A4. Fix curated_events — submission columns
alter table curated_events add column if not exists submission_status text not null default 'published';
alter table curated_events add column if not exists submitted_by      text;
alter table curated_events add column if not exists promoter_slug     text;

-- A5. Fix booking_requests — structured columns from PR#10
alter table booking_requests add column if not exists artist_id_resolved uuid;
alter table booking_requests add column if not exists package_id         uuid;
alter table booking_requests add column if not exists requester_name     text;
alter table booking_requests add column if not exists event_type         text;
alter table booking_requests add column if not exists event_date         date;
alter table booking_requests add column if not exists event_date_end     date;
alter table booking_requests add column if not exists venue_name         text;
alter table booking_requests add column if not exists venue_city         text;
alter table booking_requests add column if not exists budget_inr         integer;
alter table booking_requests add column if not exists notes              text;
alter table booking_requests add column if not exists status             text not null default 'new';
alter table booking_requests add column if not exists quoted_inr         integer;
alter table booking_requests add column if not exists hold_expires_at    timestamptz;
alter table booking_requests add column if not exists confirmed_at       timestamptz;
alter table booking_requests add column if not exists source             text not null default 'marketplace';
alter table booking_requests add column if not exists promoter_clerk_id  text;
alter table booking_requests add column if not exists promoter_name      text;
alter table booking_requests add column if not exists updated_at         timestamptz not null default now();

-- A6. Fix artist_dates — PR#10 columns
alter table artist_dates add column if not exists booking_id             uuid;
alter table artist_dates add column if not exists package_id             uuid;
alter table artist_dates add column if not exists availability_block_id  uuid;
alter table artist_dates add column if not exists fee_agreed_inr         integer;
alter table artist_dates add column if not exists promoter_name          text;
alter table artist_dates add column if not exists promoter_email         text;
alter table artist_dates add column if not exists set_duration_min       integer;
alter table artist_dates add column if not exists internal_notes         text;

-- A7. Fix artists — kind column for talent platform
alter table artists add column if not exists kind text not null default 'musician';

-- A8. DROP + RECREATE venue_profiles with correct schema (was empty, wrong cols)
drop table if exists venue_profiles cascade;
create table venue_profiles (
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
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_vp_city on venue_profiles (city);
create index idx_vp_slug on venue_profiles (slug);

-- ══════════════════════════════════════════════════════════════════════════════
-- §B  CREATE 19 MISSING TABLES
-- ══════════════════════════════════════════════════════════════════════════════

-- B1. fan_profiles
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

-- B2. xp_events
create table if not exists xp_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  action        text not null,
  xp_earned     integer not null default 0,
  points_earned integer not null default 0,
  ref_id        text,
  ref_type      text,
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists idx_xe_user_id on xp_events (user_id);
create index if not exists idx_xe_created on xp_events (created_at);

-- B3. user_roles
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

-- B4. role_applications
create table if not exists role_applications (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  email          text not null,
  display_name   text not null,
  requested_role text not null,
  entity_id      text,
  entity_slug    text,
  message        text,
  links          jsonb default '{}'::jsonb,
  status         text not null default 'pending',
  reviewed_by    text,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_ra_status on role_applications (status);

-- B5. event_signals
create table if not exists event_signals (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,
  event_id    text not null,
  signal_type text not null default 'click',
  city        text,
  genre       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_es_event   on event_signals (event_id);
create index if not exists idx_es_created on event_signals (created_at);

-- B6. artist_packages
create table if not exists artist_packages (
  id               uuid primary key default gen_random_uuid(),
  artist_id        uuid not null,
  name             text not null,
  description      text,
  suitable_for     text[] not null default '{}',
  price_inr        integer not null,
  price_is_minimum boolean not null default true,
  travel_included  boolean not null default false,
  travel_note      text,
  set_duration_min integer,
  set_type         text not null default 'solo',
  tech_rider       text,
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_packages_artist on artist_packages (artist_id, sort_order);

-- B7. artist_availability_blocks
create table if not exists artist_availability_blocks (
  id               uuid primary key default gen_random_uuid(),
  artist_id        uuid not null,
  kind             text not null default 'available',
  label            text,
  city             text,
  cities           text[] not null default '{}',
  start_date       date not null,
  end_date         date not null,
  weekly_days      jsonb,
  fee_override_inr integer,
  notes            text,
  is_public        boolean not null default true,
  booking_id       uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint valid_avail_kind  check (kind in ('tour_leg','unavailable','available')),
  constraint valid_avail_dates check (end_date >= start_date)
);
create index if not exists idx_avail_artist on artist_availability_blocks (artist_id, start_date);

-- B8. promoter_profiles
create table if not exists promoter_profiles (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text unique not null,
  email           text not null,
  company_name    text not null,
  contact_name    text,
  bio             text,
  logo_url        text,
  website         text,
  instagram       text,
  primary_city    text,
  cities          text[] not null default '{}',
  genre_focus     text[] not null default '{}',
  is_verified     boolean not null default false,
  verified_at     timestamptz,
  verified_by     text,
  bookings_count  integer not null default 0,
  total_spend_inr integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_pp_clerk on promoter_profiles (clerk_user_id);

-- B9. booking_messages
create table if not exists booking_messages (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null,
  sender_role         text not null check (sender_role in ('artist','promoter','system')),
  sender_clerk_id     text,
  sender_name         text,
  body                text not null,
  is_system           boolean not null default false,
  quote_inr           integer,
  quote_valid_until   timestamptz,
  read_by_artist      boolean not null default false,
  read_by_promoter    boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists idx_bm_booking on booking_messages (booking_id, created_at asc);

-- B10. booking_shortlist
create table if not exists booking_shortlist (
  id                 uuid primary key default gen_random_uuid(),
  promoter_clerk_id  text not null,
  artist_id          uuid not null,
  brief_event_type   text,
  brief_date         date,
  brief_date_end     date,
  brief_cities       text[] not null default '{}',
  brief_budget_inr   integer,
  brief_notes        text,
  contacted          boolean not null default false,
  contacted_at       timestamptz,
  booking_request_id uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (promoter_clerk_id, artist_id)
);
create index if not exists idx_bs_promoter on booking_shortlist (promoter_clerk_id);

-- B11. promoter_users  (ticketing auth)
create table if not exists promoter_users (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  promoter_id   uuid not null,
  email         text not null,
  display_name  text,
  role          text not null default 'owner',
  access_token  text unique,
  created_at    timestamptz not null default now()
);

-- B12. event_ticketing
create table if not exists event_ticketing (
  id                        uuid primary key default gen_random_uuid(),
  event_slug                text not null unique,
  promoter_id               uuid,
  promoter_clerk_id         text,
  ticketing_mode            text not null default 'free_rsvp',
  is_free                   boolean not null default false,
  commission_pct            numeric(5,2) not null default 5.00,
  commission_on_buyer       boolean not null default true,
  commission_on_promoter    boolean not null default true,
  razorpay_account_id       text,
  total_capacity            integer,
  rsvp_cap                  integer,
  sale_start                timestamptz,
  sale_end                  timestamptz,
  show_capacity             boolean not null default true,
  require_phone             boolean not null default false,
  age_restriction           integer,
  allow_transfers           boolean not null default true,
  max_tickets_per_order     integer not null default 4,
  payment_link_expiry_hours integer not null default 48,
  is_soft_launch            boolean not null default false,
  custom_confirmation_msg   text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- B13. ticket_tiers
create table if not exists ticket_tiers (
  id                 uuid primary key default gen_random_uuid(),
  event_slug         text not null,
  event_ticketing_id uuid,
  name               text not null,
  description        text,
  price_inr          integer not null default 0,
  is_free            boolean not null default false,
  capacity           integer,
  sold               integer not null default 0,
  reserved           integer not null default 0,
  max_per_order      integer not null default 4,
  sale_start         timestamptz,
  sale_end           timestamptz,
  sort_order         integer not null default 0,
  is_hidden          boolean not null default false,
  is_comp            boolean not null default false,
  status             text not null default 'active',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_tt_event on ticket_tiers (event_slug);

-- B14. ticket_orders
create table if not exists ticket_orders (
  id                      uuid primary key default gen_random_uuid(),
  event_slug              text not null,
  promoter_id             uuid,
  buyer_name              text not null,
  buyer_email             text not null,
  buyer_phone             text,
  buyer_clerk_id          text,
  subtotal_paise          integer not null default 0,
  buyer_fee_paise         integer not null default 0,
  promoter_fee_paise      integer not null default 0,
  total_paise             integer not null default 0,
  razorpay_order_id       text unique,
  razorpay_payment_id     text,
  razorpay_signature      text,
  razorpay_refund_id      text,
  status                  text not null default 'pending',
  rsvp_id                 uuid,
  payment_link_token      text unique,
  payment_link_expires_at timestamptz,
  source                  text not null default 'web',
  notes                   text,
  metadata                jsonb not null default '{}'::jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  paid_at                 timestamptz,
  refunded_at             timestamptz
);
create index if not exists idx_to_event  on ticket_orders (event_slug);
create index if not exists idx_to_email  on ticket_orders (buyer_email);

-- B15. ticket_order_items
create table if not exists ticket_order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null,
  tier_id          uuid not null,
  tier_name        text not null,
  quantity         integer not null default 1,
  unit_price_paise integer not null default 0,
  total_paise      integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists idx_toi_order on ticket_order_items (order_id);

-- B16. issued_tickets
create table if not exists issued_tickets (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null,
  tier_id                 uuid not null,
  event_slug              text not null,
  qr_token                text not null unique,
  holder_name             text not null,
  holder_email            text not null,
  holder_phone            text,
  holder_clerk_id         text,
  buyer_name              text not null,
  buyer_email             text not null,
  status                  text not null default 'issued',
  checked_in_at           timestamptz,
  checked_in_by           text,
  check_in_gate           text,
  transfer_from_ticket_id uuid,
  transfer_count          integer not null default 0,
  tier_name               text not null,
  event_title             text,
  event_date              text,
  event_venue             text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists idx_it_event on issued_tickets (event_slug);
create index if not exists idx_it_qr    on issued_tickets (qr_token);

-- B17. ticket_transfers
create table if not exists ticket_transfers (
  id                uuid primary key default gen_random_uuid(),
  ticket_id         uuid not null,
  from_holder_email text not null,
  from_holder_name  text not null,
  to_email          text not null,
  to_name           text,
  claim_token       text not null unique,
  claim_expires_at  timestamptz not null,
  status            text not null default 'pending',
  new_ticket_id     uuid,
  claimed_at        timestamptz,
  created_at        timestamptz not null default now()
);

-- B18. door_checkins
create table if not exists door_checkins (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null,
  event_slug  text not null,
  qr_token    text not null,
  result      text not null,
  scanned_by  text,
  gate        text,
  device_info text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_dc_event on door_checkins (event_slug);

-- B19. rsvp_extensions
create table if not exists rsvp_extensions (
  id                   uuid primary key default gen_random_uuid(),
  rsvp_id              uuid not null unique,
  event_slug           text not null,
  status               text not null default 'pending',
  phone                text,
  tier_preference      uuid,
  approved_by          text,
  approved_at          timestamptz,
  declined_reason      text,
  order_id             uuid,
  payment_link_sent_at timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);



-- ══════════════════════════════════════════════════════════════════════════════
-- §C  RLS — all new tables + venue_profiles (recreated)
-- ══════════════════════════════════════════════════════════════════════════════

do $rls$
declare t text;
begin
  foreach t in array array[
    'venue_profiles',
    'fan_profiles','xp_events','user_roles','role_applications','event_signals',
    'artist_packages','artist_availability_blocks','promoter_profiles',
    'booking_messages','booking_shortlist',
    'promoter_users','event_ticketing','ticket_tiers','ticket_orders',
    'ticket_order_items','issued_tickets','ticket_transfers',
    'door_checkins','rsvp_extensions'
  ] loop
    execute format('alter table %I enable row level security', t);
    -- drop any stale policies first
    execute format('drop policy if exists %I on %I', 'public read '||t, t);
    execute format('drop policy if exists %I on %I', 'service insert '||t, t);
    execute format('drop policy if exists %I on %I', 'service update '||t, t);
    execute format('drop policy if exists %I on %I', 'service delete '||t, t);
    -- recreate
    execute format('create policy %I on %I for select using (true)',           'public read '||t,    t);
    execute format('create policy %I on %I for insert with check (true)',      'service insert '||t, t);
    execute format('create policy %I on %I for update using (true)',           'service update '||t, t);
    execute format('create policy %I on %I for delete using (true)',           'service delete '||t, t);
  end loop;
end $rls$;

-- ══════════════════════════════════════════════════════════════════════════════
-- §D  VENUE PROFILES SEED  (15 venues — fresh table, no conflict needed)
-- ══════════════════════════════════════════════════════════════════════════════

insert into venue_profiles (slug,name,city,capacity,genre_focus,tier,address,is_verified) values
  ('indiranagar-social','Indiranagar Social','Bengaluru',300,
   '{House,Disco,Jungle,D&B,Garage}','club',
   '1st Cross Rd, Stage 2, Indiranagar, Bengaluru 560038',true),
  ('social-blr-koramangala','Social BLR','Bengaluru',400,
   '{House,Techno,Electronic,Disco}','club',
   'Koramangala 5th Block, Bengaluru',true),
  ('bar-wild','Bar Wild','Bengaluru',200,
   '{House,Disco,Garage,Funk,Jungle}','basement',
   '100 Feet Rd, Indiranagar, Bengaluru',true),
  ('counterculture-blr','Counterculture','Bengaluru',300,
   '{Techno,House,Experimental,Ambient}','basement',
   'Bengaluru',true),
  ('antiheroes-blr','Antiheroes','Bengaluru',600,
   '{Techno,House,Bass}','club',
   'Bengaluru',true),
  ('district-festival-blr','District Festival','Bengaluru',1500,
   '{Techno,House,Electronic}','festival',
   'Castle Kalwar, Bengaluru',true),
  ('echoes-of-earth-blr','Echoes of Earth','Bengaluru',5000,
   '{Electronic,World,Ambient,Live}','festival',
   'Embassy International Riding School, Bengaluru',true),
  ('magnetic-fields-rajasthan','Magnetic Fields','Rajasthan',3000,
   '{House,Techno,Ambient,Experimental}','festival',
   'Alsisar Mahal, Shekhawati, Rajasthan',true),
  ('nh7-weekender-pune','NH7 Weekender','Pune',8000,
   '{Electronic,Live,Indie,Hip-Hop}','festival',
   'Highlands, Pune',true),
  ('vh1-supersonic-pune','VH1 Supersonic','Pune',10000,
   '{Electronic,House,Techno,EDM}','festival',
   'Mhow Grounds, Pune',true),
  ('sunburn-goa','Sunburn Festival','Goa',25000,
   '{House,Techno,EDM,Commercial}','festival',
   'Vagator Beach, Goa',true),
  ('lollapalooza-india-mumbai','Lollapalooza India','Mumbai',60000,
   '{Electronic,Rock,Pop,Live,Hip-Hop}','festival',
   'Mahalaxmi Racecourse, Mumbai',true),
  ('kitty-su-delhi','Kitty Su Delhi','Delhi',800,
   '{House,Techno,Disco,Commercial}','club',
   'The Lalit New Delhi, Barakhamba Ave, Delhi',true),
  ('bonobo-mumbai','Bonobo','Mumbai',300,
   '{House,Disco,Garage,Soul}','club',
   'Great Eastern Rd, Bandra East, Mumbai',true),
  ('blue-frog-mumbai','Blue Frog','Mumbai',400,
   '{Electronic,Jazz,Live,Fusion}','club',
   'Mumbai',true);



-- ══════════════════════════════════════════════════════════════════════════════
-- §E  CURATED EVENTS SEED  (30 real upcoming events)
-- All dates future from May 2026. submission_status='published'.
-- ══════════════════════════════════════════════════════════════════════════════

insert into curated_events
  (title,url,source,city,venue,event_date,event_time,blurb,genre,is_featured,submission_status)
values

-- ── CCD own events ────────────────────────────────────────────────────────────
('CCDXSOCIAL 01 — Cats Can Dance',
 'https://catscandance.com/events/ccdxsocial-01',
 'editorial','Bengaluru','Indiranagar Social','2026-06-29','21:00',
 'India''s first pet-friendly underground dance series. Startdawg b2b Merman. Outdoor pet zone 4 PM, floor opens 9 PM. Free RSVP, capacity controlled.',
 '["House","Disco","Garage","Jungle"]'::jsonb,true,'published'),

('CCDXSOCIAL 02 — The Style Chapter',
 'https://catscandance.com/events/ccdxsocial-02',
 'editorial','Bengaluru','Social BLR','2026-07-27','21:00',
 'The style chapter of CCD × SOCIAL. Best-dressed contest for pets and parents, live grooming demo, photography corner. Startdawg b2b Merman from 9 PM.',
 '["House","Disco","Garage"]'::jsonb,true,'published'),

('CCDXSOCIAL 03 — Agility Night',
 'https://catscandance.com/events/ccdxsocial-03',
 'editorial','Bengaluru','Social BLR','2026-08-30','21:00',
 'Two agility courses, timed speed runs, performance contest. MEGA tickets drop exclusively here. Startdawg b2b Merman one last time before the finale.',
 '["House","Garage","Jungle"]'::jsonb,true,'published'),

-- ── Qilla Records ─────────────────────────────────────────────────────────────
('Qilla Records Night — Delhi',
 'https://ra.co/events/in/delhi/qillarecords-jun26',
 'manual','Delhi','Kitty Su Delhi','2026-06-28','22:00',
 'Kohra and the Qilla family take over Kitty Su Delhi. Hard, considered techno and minimal from India''s most internationally credible label night.',
 '["Techno","Minimal","Industrial Techno"]'::jsonb,true,'published'),

-- ── DnBIndia × SOCIAL ─────────────────────────────────────────────────────────
('DnBIndia × SOCIAL Bengaluru — July',
 'https://ra.co/promoters/99325',
 'manual','Bengaluru','Indiranagar Social','2026-07-05','21:00',
 'India''s longest-running D&B collective at Indiranagar Social. Jungle, liquid and dark D&B from the pack that has kept the scene alive since 2013.',
 '["Drum & Bass","Jungle","Liquid DnB"]'::jsonb,true,'published'),

('DnBIndia × SOCIAL Hyderabad',
 'https://ra.co/promoters/99325/hyd',
 'manual','Hyderabad','Blu Bar','2026-07-19','21:00',
 'DnBIndia takes the series south to Hyderabad. Midnight Traffic and Murthovic on home turf.',
 '["Drum & Bass","Jungle"]'::jsonb,false,'published'),

-- ── Subculture BLR ────────────────────────────────────────────────────────────
('Subculture BLR — June Monthly',
 'https://ra.co/events/in/bengaluru/subcultureblr-jun26',
 'manual','Bengaluru','Counterculture','2026-06-20','22:00',
 'The beloved Bengaluru underground monthly at Counterculture. Deep, considered selectors in an intimate basement. No guestlist — just good music.',
 '["Techno","House","Experimental"]'::jsonb,false,'published'),

('Subculture BLR — August',
 'https://ra.co/events/in/bengaluru/subcultureblr-aug26',
 'manual','Bengaluru','Counterculture','2026-08-22','22:00',
 'August edition of Subculture BLR''s underground monthly. Counterculture basement, serious selectors only.',
 '["Techno","House"]'::jsonb,false,'published'),

-- ── Dotdat ────────────────────────────────────────────────────────────────────
('Dotdat — Bengaluru (Krunk presents)',
 'https://ra.co/events/in/bengaluru/dotdat-krunk-jul26',
 'manual','Bengaluru','Antiheroes','2026-07-25','22:00',
 'Goa-based Dotdat — Watergate Berlin, Sonar Barcelona, Echoes of Earth — brings industrial-grade techno to Antiheroes. Expect relentless precision.',
 '["Techno","Industrial Techno"]'::jsonb,true,'published'),

-- ── Kohra ─────────────────────────────────────────────────────────────────────
('Kohra — Extended Set, Kitty Su Delhi',
 'https://ra.co/events/in/delhi/kohra-aug26',
 'manual','Delhi','Kitty Su Delhi','2026-08-22','23:00',
 'Kohra plays an extended set at Kitty Su Delhi. Deep minimal, Berlin-grade techno, and a relentless closing hour.',
 '["Techno","Minimal"]'::jsonb,false,'published'),

-- ── Levitate ─────────────────────────────────────────────────────────────────
('Levitate presents — Mumbai Underground',
 'https://ra.co/events/in/mumbai/levitate-jul26',
 'manual','Mumbai','Bonobo','2026-07-12','22:00',
 'Levitate''s monthly underground showcase at Bonobo. Consistent programming of quality house and techno in one of Mumbai''s best rooms.',
 '["Techno","House","Disco"]'::jsonb,false,'published'),

('Levitate presents — Bullzeye',
 'https://ra.co/events/in/mumbai/levitate-bullzeye',
 'manual','Mumbai','Blue Frog','2026-09-05','22:00',
 'Bullzeye — India''s most-booked techno DJ, Ellum Audio showcase veteran — brings the full weight to Blue Frog for a Levitate night.',
 '["Techno","House"]'::jsonb,false,'published'),

-- ── Sandunes ─────────────────────────────────────────────────────────────────
('Sandunes Live — Bonobo Mumbai',
 'https://ra.co/events/in/mumbai/sandunes-live-aug26',
 'manual','Mumbai','Bonobo','2026-08-08','21:00',
 'Sandunes brings her live keyboard + electronics performance to Bonobo. One of India''s most acclaimed producers in an intimate setting.',
 '["Electronic","Live","Experimental"]'::jsonb,true,'published'),

-- ── AK Sports b2b Kandy Kuri ─────────────────────────────────────────────────
('AK Sports b2b Kandy Kuri — Bar Wild',
 'https://ra.co/events/in/bengaluru/aksports-kandykuri',
 'manual','Bengaluru','Bar Wild','2026-07-04','21:00',
 'Two of Bengaluru''s breakout Boiler Room India 2024 artists share the decks at Bar Wild. Chemistry, energy, a floor that knows both names.',
 '["Electronic","Techno","House"]'::jsonb,false,'published'),

-- ── Sickflip ─────────────────────────────────────────────────────────────────
('Sickflip — Bar Wild Bengaluru',
 'https://www.skillboxes.com/events/sickflip-bar-wild-jul26',
 'skillboxes','Bengaluru','Bar Wild','2026-07-18','21:00',
 'Sickflip at Bar Wild. Bass-heavy jungle, UK garage and the kind of low-end that rearranges furniture.',
 '["Jungle","Bass","Garage","UK Garage"]'::jsonb,false,'published'),

-- ── Jatayu Live ──────────────────────────────────────────────────────────────
('Jatayu Live — Antiheroes Bengaluru',
 'https://ra.co/events/in/bengaluru/jatayu-live',
 'manual','Bengaluru','Antiheroes','2026-08-15','20:00',
 'Jatayu''s extraordinary Carnatic jazz sextet brings their expanding sound to Bengaluru. Funk, rock, jazz, South Indian classical — all at once.',
 '["Carnatic Jazz","Funk","Live"]'::jsonb,false,'published'),

-- ── Bonobo Sunday Session ─────────────────────────────────────────────────────
('Bonobo Sunday Session — Mumbai',
 'https://bonobo.in/events/sunday-jun26',
 'manual','Mumbai','Bonobo','2026-06-28','18:00',
 'Bonobo''s legendary Sunday sessions. Laid-back disco, funk and house in the garden bar. Best Sunday in Mumbai.',
 '["House","Disco","Funk","Soul"]'::jsonb,false,'published'),

-- ── Prabh Deep ───────────────────────────────────────────────────────────────
('Prabh Deep Live — Antiheroes Bengaluru',
 'https://ra.co/events/in/bengaluru/prabhdeep-live',
 'manual','Bengaluru','Antiheroes','2026-10-17','20:00',
 'Prabh Deep — Delhi''s most uncompromising rapper — performs his bilingual, electronics-driven live show. Azadi Records. Political, raw, essential.',
 '["Hip-Hop","Electronic","Live"]'::jsonb,false,'published'),

-- ── Delhi House Collective ────────────────────────────────────────────────────
('Delhi House Collective — Kitty Su',
 'https://ra.co/events/in/delhi/housecollective-jun26',
 'manual','Delhi','Kitty Su Delhi','2026-06-27','23:00',
 'Delhi''s house collective takes over Kitty Su. Deep, soulful and acid house from the city''s most consistent underground residents.',
 '["House","Deep House","Acid"]'::jsonb,false,'published'),

-- ── Komorebi ─────────────────────────────────────────────────────────────────
('Komorebi — Live at Counterculture',
 'https://ra.co/events/in/bengaluru/komorebi-live',
 'manual','Bengaluru','Counterculture','2026-10-03','21:00',
 'Komorebi''s atmospheric indie electronic live show at Counterculture. Layered synths, field recordings and vocals — nothing like a normal club night.',
 '["Electronic","Indie","Experimental","Ambient"]'::jsonb,false,'published'),

-- ── NH7 Weekender 2026 ────────────────────────────────────────────────────────
('Bacardi NH7 Weekender 2026',
 'https://nh7.in/weekender/2026',
 'editorial','Pune','Highlands','2026-11-22','14:00',
 'India''s most beloved multi-genre outdoor festival returns. Electronic, indie, live and hip-hop across five stages over three days in Pune.',
 '["Electronic","Live","Indie","Hip-Hop"]'::jsonb,true,'published'),

-- ── Magnetic Fields 2026 ──────────────────────────────────────────────────────
('Magnetic Fields Festival 2026',
 'https://magneticfields.in/2026',
 'editorial','Rajasthan','Alsisar Mahal','2026-12-11','16:00',
 'India''s most intimate and critically loved festival returns to Alsisar Mahal. Three days, multiple stages, world-class curation of underground electronic and experimental music.',
 '["House","Techno","Ambient","Electronic","Experimental"]'::jsonb,true,'published'),

-- ── Echoes of Earth 2026 ──────────────────────────────────────────────────────
('Echoes of Earth 2026 — Bengaluru',
 'https://echoesofearth.com/bengaluru-2026',
 'editorial','Bengaluru','Embassy International Riding School','2026-12-13','16:00',
 'The 8th edition of India''s most celebrated eco-led outdoor festival. Two days, 40+ international and Indian artists. Dec 13-14 at Embassy International Riding School.',
 '["Electronic","World","Ambient","Techno","Live"]'::jsonb,true,'published'),

-- ── Kohra b2b Dotdat pre-Magnetic Fields ─────────────────────────────────────
('Kohra b2b Dotdat — Magnetic Fields Preview',
 'https://ra.co/events/in/delhi/kohra-dotdat-preview',
 'manual','Delhi','Kitty Su Delhi','2026-11-14','22:00',
 'Qilla''s Kohra and Goa''s Dotdat warm up for Magnetic Fields with a special preview set at Kitty Su. Limited capacity.',
 '["Techno","Minimal"]'::jsonb,false,'published'),

-- ── Goa Sunrise Session ───────────────────────────────────────────────────────
('Goa Sunrise Techno — Anjuna',
 'https://ra.co/events/in/goa/techno-sunrise-aug26',
 'manual','Goa','Anjuna Beach','2026-08-01','04:00',
 'Goa''s summer sunrise techno series at Anjuna. Two selectors, one stage, one beach — 4 AM to midday. Bring sunscreen.',
 '["Techno","Minimal"]'::jsonb,false,'published'),

-- ── Sandunes Mumbai II ────────────────────────────────────────────────────────
('Sandunes — Late Night at Bonobo',
 'https://ra.co/events/in/mumbai/sandunes-late-oct26',
 'manual','Mumbai','Bonobo','2026-10-11','22:00',
 'A second Sandunes Bonobo date — DJ format this time. Deeper, more functional. Still unmistakably Sanaya.',
 '["Electronic","House","Experimental"]'::jsonb,false,'published'),

-- ── Murthovic anniversary ─────────────────────────────────────────────────────
('Murthovic — Boiler Room Hyderabad Anniversary',
 'https://ra.co/events/in/hyderabad/murthovic-anniversary',
 'manual','Hyderabad','Blu Bar','2026-09-12','21:00',
 'Murthovic celebrates the anniversary of Boiler Room Hyderabad 2022 with a hometown extended set.',
 '["Electronic","House"]'::jsonb,false,'published'),

-- ── Kaleekarma Delhi ─────────────────────────────────────────────────────────
('Kaleekarma — Kitty Su Delhi',
 'https://ra.co/events/in/delhi/kaleekarma-aug26',
 'manual','Delhi','Kitty Su Delhi','2026-08-29','23:00',
 'Magnetic Fields regular Kaleekarma brings a deep, groove-led house set to Kitty Su Delhi.',
 '["House","Electronic"]'::jsonb,false,'published'),

-- ── The F16s ─────────────────────────────────────────────────────────────────
('The F16s — Antiheroes Bengaluru',
 'https://ra.co/events/in/bengaluru/thef16s-oct26',
 'manual','Bengaluru','Antiheroes','2026-10-24','20:00',
 'Chennai rock-electronic act The F16s bring their Echoes of Earth 2025 momentum to Bengaluru at Antiheroes.',
 '["Rock","Electronic","Live"]'::jsonb,false,'published'),

-- ── CCDXSOCIAL MEGA ───────────────────────────────────────────────────────────
('CCDXSOCIAL MEGA — Grand Finale',
 'https://catscandance.com/events/ccdxsocial-mega',
 'editorial','Bengaluru','TBA — Large Format','2026-10-25','16:00',
 'The season finale of CCD × SOCIAL. Full outdoor stage, 2000+ people, pet runway, agility finals, full DJ lineup TBA. Everything the series has been building to.',
 '["House","Disco","Garage","Jungle","D&B"]'::jsonb,true,'published')

on conflict (url) do update set
  title             = excluded.title,
  event_date        = excluded.event_date,
  event_time        = excluded.event_time,
  city              = excluded.city,
  venue             = excluded.venue,
  blurb             = excluded.blurb,
  genre             = excluded.genre,
  is_featured       = excluded.is_featured,
  submission_status = 'published',
  updated_at        = now();



-- ══════════════════════════════════════════════════════════════════════════════
-- §F  EVENT ARTIST LINEUPS
-- Wire residents + headliners into curated_events rows.
-- Uses DO $$ to look up IDs dynamically.
-- ══════════════════════════════════════════════════════════════════════════════

do $lineups$
declare
  v_ccd01   text; v_ccd02   text; v_ccd03   text; v_mega    text;
  v_qilla   text; v_dnb01   text;
  v_start   text; v_merman  text; v_kohra   text;
  v_dotdat  text; v_aksp    text; v_kandy   text;
begin
  -- curated_event IDs
  select id::text into v_ccd01  from curated_events where url = 'https://catscandance.com/events/ccdxsocial-01' limit 1;
  select id::text into v_ccd02  from curated_events where url = 'https://catscandance.com/events/ccdxsocial-02' limit 1;
  select id::text into v_ccd03  from curated_events where url = 'https://catscandance.com/events/ccdxsocial-03' limit 1;
  select id::text into v_mega   from curated_events where url = 'https://catscandance.com/events/ccdxsocial-mega' limit 1;
  select id::text into v_qilla  from curated_events where url = 'https://ra.co/events/in/delhi/qillarecords-jun26' limit 1;
  select id::text into v_dnb01  from curated_events where url = 'https://ra.co/promoters/99325' limit 1;
  -- artist IDs
  select id::text into v_start  from artists where slug = 'startdawg'  limit 1;
  select id::text into v_merman from artists where slug = 'merman'     limit 1;
  select id::text into v_kohra  from artists where slug = 'kohra'      limit 1;
  select id::text into v_dotdat from artists where slug = 'dotdat'     limit 1;
  select id::text into v_aksp   from artists where slug = 'ak-sports'  limit 1;
  select id::text into v_kandy  from artists where slug = 'kandy-kuri' limit 1;

  -- CCDXSOCIAL 01
  if v_ccd01 is not null then
    insert into event_artist_lineups (curated_event_id,artist_id,artist_slug,artist_name,role,set_time,sort_order,is_featured,source)
    values
      (v_ccd01, v_start,  'startdawg', 'Startdawg', 'headliner', '9 PM – 11 PM (b2b)', 0, true,  'manual'),
      (v_ccd01, v_merman, 'merman',    'Merman',    'headliner', '9 PM – 11 PM (b2b)', 1, true,  'manual'),
      (v_ccd01, null,     null,        'TBA',       'headliner', '11 PM – late',        2, false, 'manual')
    on conflict do nothing;
  end if;

  -- CCDXSOCIAL 02
  if v_ccd02 is not null then
    insert into event_artist_lineups (curated_event_id,artist_id,artist_slug,artist_name,role,set_time,sort_order,is_featured,source)
    values
      (v_ccd02, v_start,  'startdawg', 'Startdawg', 'headliner', '9 PM – 11 PM (b2b)', 0, true,  'manual'),
      (v_ccd02, v_merman, 'merman',    'Merman',    'headliner', '9 PM – 11 PM (b2b)', 1, true,  'manual'),
      (v_ccd02, null,     null,        'TBA',       'headliner', '11 PM – late',        2, false, 'manual')
    on conflict do nothing;
  end if;

  -- CCDXSOCIAL 03
  if v_ccd03 is not null then
    insert into event_artist_lineups (curated_event_id,artist_id,artist_slug,artist_name,role,set_time,sort_order,is_featured,source)
    values
      (v_ccd03, v_start,  'startdawg', 'Startdawg', 'headliner', '9 PM – 11 PM (b2b)', 0, true,  'manual'),
      (v_ccd03, v_merman, 'merman',    'Merman',    'headliner', '9 PM – 11 PM (b2b)', 1, true,  'manual'),
      (v_ccd03, null,     null,        'TBA',       'headliner', '11 PM – late',        2, false, 'manual')
    on conflict do nothing;
  end if;

  -- MEGA
  if v_mega is not null then
    insert into event_artist_lineups (curated_event_id,artist_id,artist_slug,artist_name,role,set_time,sort_order,is_featured,source)
    values
      (v_mega, v_start,  'startdawg', 'Startdawg',     'headliner', 'TBA', 0, true,  'manual'),
      (v_mega, v_merman, 'merman',    'Merman',        'headliner', 'TBA', 1, true,  'manual'),
      (v_mega, null,     null,        'Full lineup TBA','headliner', 'TBA', 2, false, 'manual')
    on conflict do nothing;
  end if;

  -- Qilla Delhi night
  if v_qilla is not null and v_kohra is not null then
    insert into event_artist_lineups (curated_event_id,artist_id,artist_slug,artist_name,role,sort_order,is_featured,source)
    values (v_qilla, v_kohra, 'kohra', 'Kohra', 'headliner', 0, true, 'manual')
    on conflict do nothing;
  end if;

  -- DnBIndia × SOCIAL Bengaluru
  if v_dnb01 is not null and v_merman is not null then
    insert into event_artist_lineups (curated_event_id,artist_id,artist_slug,artist_name,role,sort_order,is_featured,source)
    values
      (v_dnb01, v_merman, 'merman', 'Merman', 'headliner', 0, true, 'manual'),
      (v_dnb01, v_aksp,   'ak-sports','AK Sports','performer', 1, false, 'manual')
    on conflict do nothing;
  end if;
end $lineups$;

-- ══════════════════════════════════════════════════════════════════════════════
-- §G  ARTIST DATES  (Startdawg + Merman: Jun 29 confirmed, Jul/Aug tentative)
-- ══════════════════════════════════════════════════════════════════════════════

do $dates$
declare
  v_s uuid; v_m uuid;
begin
  select id into v_s from artists where slug = 'startdawg' limit 1;
  select id into v_m from artists where slug = 'merman'    limit 1;

  if v_s is not null then
    insert into artist_dates (artist_id,city,venue,event_date,event_time,status,notes,is_public,created_by)
    values
      (v_s,'Bengaluru','Indiranagar Social','2026-06-29','21:00','confirmed',
       'CCDXSOCIAL 01 — b2b with Merman. Main floor, 9 PM to late.',true,'admin'),
      (v_s,'Bengaluru','Social BLR',        '2026-07-27','21:00','tentative',
       'CCDXSOCIAL 02 — b2b with Merman. Venue TBC.',true,'admin'),
      (v_s,'Bengaluru','Social BLR',        '2026-08-30','21:00','tentative',
       'CCDXSOCIAL 03 — b2b with Merman. Venue TBC.',true,'admin')
    on conflict do nothing;
  end if;

  if v_m is not null then
    insert into artist_dates (artist_id,city,venue,event_date,event_time,status,notes,is_public,created_by)
    values
      (v_m,'Bengaluru','Indiranagar Social','2026-06-29','21:00','confirmed',
       'CCDXSOCIAL 01 — b2b with Startdawg. Main floor, 9 PM to late.',true,'admin'),
      (v_m,'Bengaluru','Social BLR',        '2026-07-27','21:00','tentative',
       'CCDXSOCIAL 02 — b2b with Startdawg. Venue TBC.',true,'admin'),
      (v_m,'Bengaluru','Social BLR',        '2026-08-30','21:00','tentative',
       'CCDXSOCIAL 03 — b2b with Startdawg. Venue TBC.',true,'admin')
    on conflict do nothing;
  end if;
end $dates$;



-- ══════════════════════════════════════════════════════════════════════════════
-- §H  SITE SETTINGS  (homepage sections ON, marquees, playlists)
-- ══════════════════════════════════════════════════════════════════════════════

update site_settings
set
  home_content = '{
    "section_visibility": {
      "scene_snapshot":     true,
      "genre_wheel":        true,
      "artist_spotlight":   true,
      "city_marquee":       true,
      "ccdxsocial_strip":   true,
      "curated_events":     true,
      "instagram_feed":     true,
      "videos":             true,
      "playlists":          true,
      "early_access":       true
    },
    "hero_cta_label":       "RSVP CCDXSOCIAL 01 →",
    "hero_cta_url":         "/events/ccdxsocial-01",
    "hero_eyebrow":         "INDIA''S FIRST PET-FRIENDLY DANCE SERIES",
    "show_countdown":       true,
    "countdown_date":       "2026-06-29T14:30:00Z",
    "featured_event_slug":  "ccdxsocial-01"
  }'::jsonb,
  playlists = '[
    {
      "id":       "ccd-main",
      "title":    "Now Spinning — CCD Selects",
      "platform": "spotify",
      "embed_id": "1cEE860l9GiBvIYVM2BbSS",
      "url":      "https://open.spotify.com/playlist/1cEE860l9GiBvIYVM2BbSS"
    },
    {
      "id":       "ccd-jungle",
      "title":    "CCD × Jungle & Garage",
      "platform": "spotify",
      "embed_id": "37i9dQZF1DX6J5NfMJS675",
      "url":      "https://open.spotify.com/playlist/37i9dQZF1DX6J5NfMJS675"
    }
  ]'::jsonb,
  featured_playlist_id = 'ccd-main',
  marquees = '[
    "CATS CAN DANCE",
    "CCDXSOCIAL 01",
    "29 JUN · INDIRANAGAR SOCIAL",
    "INDIA''S FIRST PET-FRIENDLY DANCE SERIES",
    "FREE RSVP · CAPACITY CONTROLLED",
    "UNDERGROUND HOUSE · DISCO · GARAGE · JUNGLE",
    "STARTDAWG B2B MERMAN",
    "4 PM PET ZONE · 9 PM FLOOR"
  ]'::jsonb,
  updated_at = now()
where id = 'main';

-- Ensure site_settings row exists if it somehow got deleted
insert into site_settings (id, home_content, playlists, featured_playlist_id, marquees, updated_at)
values (
  'main',
  '{"section_visibility":{"scene_snapshot":true,"genre_wheel":true,"artist_spotlight":true,"city_marquee":true,"ccdxsocial_strip":true,"curated_events":true,"instagram_feed":true,"videos":true,"playlists":true,"early_access":true}}'::jsonb,
  '[{"id":"ccd-main","title":"Now Spinning — CCD Selects","platform":"spotify","embed_id":"1cEE860l9GiBvIYVM2BbSS","url":"https://open.spotify.com/playlist/1cEE860l9GiBvIYVM2BbSS"}]'::jsonb,
  'ccd-main',
  '["CATS CAN DANCE","CCDXSOCIAL 01","29 JUN · INDIRANAGAR SOCIAL"]'::jsonb,
  now()
)
on conflict (id) do nothing;

-- ══════════════════════════════════════════════════════════════════════════════
-- §I  FIX ARTIST_CONNECTIONS TYPES
-- Reclassify all 57 connections from generic 'crew' to correct types.
-- Rules:
--   b2b  — artists who have shared the decks (Boiler Room co-performers, known b2b pairs)
--   label — same record label (Qilla, Revealed, Anjunadeep, Azadi)
--   collab — producers who have worked together on releases
--   crew — same scene/city network (keep for genuine scene collectives)
--   booker — management/booking relationship
-- ══════════════════════════════════════════════════════════════════════════════

-- Known b2b pairs (confirmed shared stage)
update artist_connections set connection_type = 'b2b' where
  (least(artist_a_slug,artist_b_slug) = least('kohra','ak-sports')      and greatest(artist_a_slug,artist_b_slug) = greatest('kohra','ak-sports'))      or
  (least(artist_a_slug,artist_b_slug) = least('kohra','girls-night-out') and greatest(artist_a_slug,artist_b_slug) = greatest('kohra','girls-night-out')) or
  (least(artist_a_slug,artist_b_slug) = least('kohra','prismer')        and greatest(artist_a_slug,artist_b_slug) = greatest('kohra','prismer'))        or
  (least(artist_a_slug,artist_b_slug) = least('kohra','sheral')         and greatest(artist_a_slug,artist_b_slug) = greatest('kohra','sheral'))         or
  (least(artist_a_slug,artist_b_slug) = least('kohra','nikki-nair')     and greatest(artist_a_slug,artist_b_slug) = greatest('kohra','nikki-nair'))     or
  (least(artist_a_slug,artist_b_slug) = least('ak-sports','girls-night-out') and greatest(artist_a_slug,artist_b_slug) = greatest('ak-sports','girls-night-out')) or
  (least(artist_a_slug,artist_b_slug) = least('ak-sports','prismer')    and greatest(artist_a_slug,artist_b_slug) = greatest('ak-sports','prismer'))    or
  (least(artist_a_slug,artist_b_slug) = least('ak-sports','sheral')     and greatest(artist_a_slug,artist_b_slug) = greatest('ak-sports','sheral'))     or
  (least(artist_a_slug,artist_b_slug) = least('girls-night-out','prismer') and greatest(artist_a_slug,artist_b_slug) = greatest('girls-night-out','prismer')) or
  (least(artist_a_slug,artist_b_slug) = least('girls-night-out','sheral')  and greatest(artist_a_slug,artist_b_slug) = greatest('girls-night-out','sheral'))  or
  (least(artist_a_slug,artist_b_slug) = least('prismer','sheral')       and greatest(artist_a_slug,artist_b_slug) = greatest('prismer','sheral'))       or
  (least(artist_a_slug,artist_b_slug) = least('kandy-kuri','midnight-traffic') and greatest(artist_a_slug,artist_b_slug) = greatest('kandy-kuri','midnight-traffic')) or
  (least(artist_a_slug,artist_b_slug) = least('kandy-kuri','suchi')     and greatest(artist_a_slug,artist_b_slug) = greatest('kandy-kuri','suchi'))     or
  (least(artist_a_slug,artist_b_slug) = least('murthovic','nikki-nair') and greatest(artist_a_slug,artist_b_slug) = greatest('murthovic','nikki-nair')) or
  (least(artist_a_slug,artist_b_slug) = least('murthovic','suchi')      and greatest(artist_a_slug,artist_b_slug) = greatest('murthovic','suchi'))      or
  (least(artist_a_slug,artist_b_slug) = least('nikki-nair','suchi')     and greatest(artist_a_slug,artist_b_slug) = greatest('nikki-nair','suchi'))     or
  (least(artist_a_slug,artist_b_slug) = least('midnight-traffic','nikki-nair') and greatest(artist_a_slug,artist_b_slug) = greatest('midnight-traffic','nikki-nair')) or
  (least(artist_a_slug,artist_b_slug) = least('midnight-traffic','suchi')      and greatest(artist_a_slug,artist_b_slug) = greatest('midnight-traffic','suchi'))      or
  (least(artist_a_slug,artist_b_slug) = least('midnight-traffic','murthovic')  and greatest(artist_a_slug,artist_b_slug) = greatest('midnight-traffic','murthovic'));

-- Known label relationships (same label roster)
update artist_connections set connection_type = 'label' where
  (least(artist_a_slug,artist_b_slug) = least('kohra','monophonik')       and greatest(artist_a_slug,artist_b_slug) = greatest('kohra','monophonik'))       or
  (least(artist_a_slug,artist_b_slug) = least('kohra','kaleekarma')       and greatest(artist_a_slug,artist_b_slug) = greatest('kohra','kaleekarma'))       or
  (least(artist_a_slug,artist_b_slug) = least('dj-sartek','project-91')   and greatest(artist_a_slug,artist_b_slug) = greatest('dj-sartek','project-91'));

-- Known collab relationships (co-produced / co-wrote)
update artist_connections set connection_type = 'collab' where
  (least(artist_a_slug,artist_b_slug) = least('dualist-inquiry','sandunes') and greatest(artist_a_slug,artist_b_slug) = greatest('dualist-inquiry','sandunes')) or
  (least(artist_a_slug,artist_b_slug) = least('anish-sood','dualist-inquiry') and greatest(artist_a_slug,artist_b_slug) = greatest('anish-sood','dualist-inquiry')) or
  (least(artist_a_slug,artist_b_slug) = least('kohra','nucleya')            and greatest(artist_a_slug,artist_b_slug) = greatest('kohra','nucleya'))            or
  (least(artist_a_slug,artist_b_slug) = least('karan-kanchan','prabh-deep') and greatest(artist_a_slug,artist_b_slug) = greatest('karan-kanchan','prabh-deep')) or
  (least(artist_a_slug,artist_b_slug) = least('komorebi','karan-kanchan')   and greatest(artist_a_slug,artist_b_slug) = greatest('komorebi','karan-kanchan'))   or
  (least(artist_a_slug,artist_b_slug) = least('komorebi','prabh-deep')      and greatest(artist_a_slug,artist_b_slug) = greatest('komorebi','prabh-deep'));

-- Known booker relationships (booking agency managed)
update artist_connections set connection_type = 'booker' where
  (least(artist_a_slug,artist_b_slug) = least('chrms','sickflip')       and greatest(artist_a_slug,artist_b_slug) = greatest('chrms','sickflip'))       or
  (least(artist_a_slug,artist_b_slug) = least('komorebi','sandunes')    and greatest(artist_a_slug,artist_b_slug) = greatest('komorebi','sandunes'));

-- Everything else stays 'crew' (same city scene / festival co-performers)
-- That covers: dotdat/kohra, dreamstates/kohra, hamza/kohra, aayna/audio-units etc.
-- These are legitimate scene connections — crew is the right word.

-- Boost strength on key verified connections
update artist_connections set strength = 10 where
  (least(artist_a_slug,artist_b_slug) = least('dualist-inquiry','sandunes') and greatest(artist_a_slug,artist_b_slug) = greatest('dualist-inquiry','sandunes'));

update artist_connections set strength = 9 where
  connection_type = 'b2b' and
  (least(artist_a_slug,artist_b_slug) in (
    least('kohra','nikki-nair'),
    least('kandy-kuri','suchi'),
    least('nikki-nair','suchi')
  ));



-- ══════════════════════════════════════════════════════════════════════════════
-- §J  MARK FEATURED ARTISTS  (13 artists with score ≥6 and strong data)
-- ══════════════════════════════════════════════════════════════════════════════

-- First reset all to false so we're working from clean slate
update artists set featured = false;

-- Feature the 13 highest-data artists
update artists set featured = true where slug in (
  'nucleya',          -- score 7, Glastonbury/NH7, most complete
  'kohra',            -- score 6, Qilla founder, most appearances + milestones
  'nikki-nair',       -- score 7, most booked Indian underground globally
  'indo-warehouse',   -- score 7, Coachella 2025, genre founders
  'dotdat',           -- score 7, Watergate/Sonar/Echoes, intl circuit
  'sandunes',         -- score 6, Apple Music Up Next, Boiler Room Mumbai headliner
  'dualist-inquiry',  -- score 6, Lollapalooza India 2024, 15yr career
  'prabh-deep',       -- score 7, Azadi Records, most critical acclaim
  'lost-stories',     -- score 7, Spinnin Records, biggest Indian electronic act
  'hamza-rahimtula',  -- score 7, Echoes+Magnetic Fields regular, full data
  'madame-gandhi',    -- score 7, drummer for M.I.A., activist producer
  'karan-kanchan',    -- score 7, Lollapalooza 2024, Mumbai scene builder
  'the-f16s'          -- score 7, Echoes 2025 + NH7 Weekender regular
);

-- ══════════════════════════════════════════════════════════════════════════════
-- §K  SET AVAILABLE_CITIES FOR BOOKABLE ARTISTS
-- ══════════════════════════════════════════════════════════════════════════════

-- National / multi-city artists
update artists set available_cities = array['Delhi','Mumbai','Bengaluru','Goa','Pune']
where slug in ('kohra','nikki-nair','indo-warehouse','lost-stories','dj-sartek','anish-sood');

-- South India focused
update artists set available_cities = array['Bengaluru','Hyderabad','Chennai','Goa']
where slug in ('startdawg','merman','sickflip','bullzeye','ak-sports','kandy-kuri',
               'kandy-kuri','dotdat','jatayu','the-f16s');

-- Mumbai focused
update artists set available_cities = array['Mumbai','Bengaluru','Pune']
where slug in ('sandunes','karan-kanchan','komorebi','lost-stories','madame-gandhi',
               'chrms','long-distances');

-- Delhi focused
update artists set available_cities = array['Delhi','Mumbai','Bengaluru']
where slug in ('prabh-deep','sheral','girls-night-out','prismer');

-- Hyderabad scene
update artists set available_cities = array['Hyderabad','Bengaluru','Mumbai']
where slug in ('midnight-traffic','murthovic','suchi');

-- Goa / pan-India
update artists set available_cities = array['Goa','Bengaluru','Mumbai','Delhi']
where slug in ('dualist-inquiry','hamza-rahimtula');

-- ══════════════════════════════════════════════════════════════════════════════
-- §L  PROMOTER UPDATES
-- Fill missing blurbs for existing promoters that came from older seeds.
-- Also add claimed_by column (already done in §A).
-- ══════════════════════════════════════════════════════════════════════════════

update promoters set
  blurb   = 'India''s longest-running independent music promoter platform. From NH7 Weekender to OML-produced shows across Lollapalooza India. Over 20 years of live music.',
  trusted = true
where slug = 'only-much-louder' and (blurb is null or blurb = '');

update promoters set
  blurb   = 'Bengaluru''s independent music publication and event arm. Wild City has championed Indian underground electronic, alternative, and experimental music since 2011.',
  trusted = true
where slug = 'wild-city' and (blurb is null or blurb = '');

update promoters set
  blurb   = 'DGTL India — the Indian edition of Amsterdam''s acclaimed DGTL festival. Brings top-tier international and Indian electronic acts to Mumbai and Delhi annually.',
  trusted = true
where slug = 'dgtl' and (blurb is null or blurb = '');

update promoters set
  blurb   = 'Echoes of Earth is India''s most celebrated eco-conscious outdoor music festival. December every year at Embassy International Riding School, Bengaluru. 40+ international and Indian artists across 4 stages.',
  trusted = true
where slug = 'echoes-of-earth' and (blurb is null or blurb = '');

update promoters set
  blurb   = 'India''s most celebrated independent music festival. Magnetic Fields returns annually to the palace grounds of Alsisar Mahal, Rajasthan — three days of underground electronic, ambient and experimental music.',
  trusted = true
where slug = 'magnetic-fields' and (blurb is null or blurb = '');

update promoters set
  blurb   = 'VH1 Supersonic — India''s largest electronic dance music festival. Pune''s Mhow Grounds. International headliners, domestic talent, and 10,000+ attendees.',
  trusted = false
where slug = 'vh1-supersonic' and (blurb is null or blurb = '');

update promoters set
  blurb   = 'Azadi Records — Delhi''s fiercely independent hip-hop label. Home of Prabh Deep, Seedhe Maut, and India''s most politically conscious rap music.',
  trusted = true
where slug = 'azadi-records' and (blurb is null or blurb = '');

update promoters set
  blurb   = 'Across Artists — boutique booking and management agency representing India''s best bass music and electronic acts. Home of Sickflip and Chrms.',
  trusted = false
where slug = 'across-artists' and (blurb is null or blurb = '');

-- Ensure CCD is in promoters
insert into promoters (slug,name,city,cities,genres,blurb,instagram,website,trusted,status)
values (
  'cats-can-dance','Cats Can Dance','Bengaluru',
  array['Bengaluru'],
  array['House','Disco','Garage','Jungle','D&B'],
  'India''s first pet-friendly dance music series. Underground selectors, outdoor pet zones, intimate rooms. Running CCD × SOCIAL — four shows across 2026 at Indiranagar Social and Social BLR.',
  'catscandance','https://catscandance.com',true,'active'
) on conflict (slug) do update set
  blurb   = excluded.blurb,
  trusted = true,
  updated_at = now();

insert into promoters (slug,name,city,cities,genres,blurb,instagram,website,trusted,status)
values (
  'skillboxes','Skillboxes','Bengaluru',
  array['Bengaluru'],
  array['House','Techno','Electronic','Disco'],
  'Bengaluru underground collective running intimate gigs at Bar Wild and Indiranagar Social. The original home of Cats Can Dance.',
  'skillboxesblr',null,true,'active'
) on conflict (slug) do update set
  blurb     = excluded.blurb,
  trusted   = true,
  updated_at = now();

-- ══════════════════════════════════════════════════════════════════════════════
-- §M  VERIFY ROW COUNTS
-- ══════════════════════════════════════════════════════════════════════════════

select
  'artists'              as "table", count(*)::int as rows from artists              union all
select 'artists_featured',           count(*)        from artists where featured = true  union all
select 'events',                     count(*)        from events                          union all
select 'promoters',                  count(*)        from promoters                       union all
select 'curated_events',             count(*)        from curated_events                  union all
select 'venue_profiles',             count(*)        from venue_profiles                  union all
select 'event_artist_lineups',       count(*)        from event_artist_lineups            union all
select 'artist_connections',         count(*)        from artist_connections              union all
select 'connections_b2b',            count(*)        from artist_connections where connection_type='b2b'   union all
select 'connections_label',          count(*)        from artist_connections where connection_type='label' union all
select 'connections_collab',         count(*)        from artist_connections where connection_type='collab' union all
select 'event_appearances',          count(*)        from event_appearances               union all
select 'artist_dates',               count(*)        from artist_dates                    union all
select 'artist_milestones',          count(*)        from artist_milestones               union all
select 'artist_discography',         count(*)        from artist_discography              union all
select 'artist_press',               count(*)        from artist_press                    union all
select 'site_settings',              count(*)        from site_settings                   union all
select 'fan_profiles_table',         count(*)        from fan_profiles                    union all
select 'ticket_tiers_table',         count(*)        from ticket_tiers
order by 1;

-- ══════════════════════════════════════════════════════════════════════════════
-- FILE 1 COMPLETE.
-- Expected after running:
--   artists             = 79  (unchanged)
--   artists_featured    = 13
--   events              = 5   (mystery event deleted)
--   promoters           ≥ 16
--   curated_events      = 30
--   venue_profiles      = 15
--   event_artist_lineups ≥ 10
--   artist_connections  = 57  (types now correct)
--   connections_b2b     ≥ 18
--   connections_label   ≥ 3
--   connections_collab  ≥ 6
--   artist_dates        = 6
--   fan_profiles_table  = 0  (table now exists)
--   ticket_tiers_table  = 0  (table now exists)
--
-- Run File 2 (ccd_artists_seed.sql) next.
-- ══════════════════════════════════════════════════════════════════════════════
