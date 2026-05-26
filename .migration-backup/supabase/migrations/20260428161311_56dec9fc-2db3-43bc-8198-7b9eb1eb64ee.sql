ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS theme jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS home_content jsonb NOT NULL DEFAULT '{}'::jsonb;