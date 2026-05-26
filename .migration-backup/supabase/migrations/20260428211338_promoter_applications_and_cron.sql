-- promoter_applications table
CREATE TABLE IF NOT EXISTS public.promoter_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL,
  instagram     text,
  website       text,
  city          text NOT NULL,
  genres        text[] DEFAULT '{}',
  bio           text NOT NULL,
  sample_event  text,
  status        text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promoter_applications_email_unique UNIQUE (email)
);

ALTER TABLE public.promoter_applications ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (admin only via edge function)
CREATE POLICY "service_role_all" ON public.promoter_applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow anon INSERT (public application form)
CREATE POLICY "anon_insert" ON public.promoter_applications
  FOR INSERT TO anon WITH CHECK (true);

-- Add city column to curated_events if missing
ALTER TABLE public.curated_events ADD COLUMN IF NOT EXISTS city text;

-- pg_cron: nightly scraper at 2am IST (8:30pm UTC)
-- Requires pg_cron extension (enabled in Supabase dashboard under Extensions)
-- Scrapes Bangalore + Mumbai + Delhi from all sources once per night
SELECT cron.schedule(
  'nightly-curate-events',
  '30 20 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/curate-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := '{"source":"skillboxes","city":"all","mode":"all","limit":6}'::jsonb
  );
  $$
) ON CONFLICT (jobname) DO UPDATE SET schedule = '30 20 * * *';
