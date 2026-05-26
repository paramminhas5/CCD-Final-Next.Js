-- Early access signups table
create table public.early_access_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index early_access_signups_created_at_idx on public.early_access_signups (created_at desc);
create index early_access_signups_email_idx on public.early_access_signups (lower(email));

alter table public.early_access_signups enable row level security;

-- Public can insert (signup form). No SELECT/UPDATE/DELETE policy = locked down by default.
create policy "Anyone can sign up for early access"
on public.early_access_signups
for insert
to anon, authenticated
with check (true);

-- No SELECT policy: reads happen only via edge function using the service role,
-- gated by an admin password verified server-side.