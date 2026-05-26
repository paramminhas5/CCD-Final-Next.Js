
-- Promoters table
CREATE TABLE public.promoters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text,
  cities text[] NOT NULL DEFAULT '{}',
  blurb text,
  genres text[] NOT NULL DEFAULT '{}',
  instagram text,
  website text,
  booking_email text,
  logo_url text,
  trusted boolean NOT NULL DEFAULT false,
  crawl_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promoters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved promoters"
  ON public.promoters FOR SELECT
  USING (status = 'approved');

CREATE TRIGGER update_promoters_updated_at
  BEFORE UPDATE ON public.promoters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Artist additions
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS fee_min_inr integer,
  ADD COLUMN IF NOT EXISTS fee_max_inr integer,
  ADD COLUMN IF NOT EXISTS fee_currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS why text,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Storage bucket for promoter logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('promoter-logos', 'promoter-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read promoter logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'promoter-logos');
