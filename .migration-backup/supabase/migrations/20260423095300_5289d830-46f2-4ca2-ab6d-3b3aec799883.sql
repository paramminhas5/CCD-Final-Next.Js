
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table public.curated_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text,
  event_date date,
  event_time text,
  url text not null,
  source text not null,
  blurb text,
  genre jsonb not null default '[]'::jsonb,
  image_url text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index curated_events_url_unique on public.curated_events (url);
create index curated_events_event_date_idx on public.curated_events (event_date);

alter table public.curated_events enable row level security;

create policy "Anyone can read curated events"
  on public.curated_events
  for select
  using (true);

create trigger update_curated_events_updated_at
  before update on public.curated_events
  for each row execute function public.update_updated_at_column();
