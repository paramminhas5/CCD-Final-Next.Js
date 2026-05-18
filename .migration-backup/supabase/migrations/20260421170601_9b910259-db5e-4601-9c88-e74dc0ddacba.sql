ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS seo_verifications jsonb NOT NULL DEFAULT '{}'::jsonb;