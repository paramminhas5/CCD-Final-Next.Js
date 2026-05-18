-- ─────────────────────────────────────────────────────────────────────────────
-- Artist portal: dates, claimed profiles, auth support
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add claimed_by to artists (links to auth.users)
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claim_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS soundcloud text,
  ADD COLUMN IF NOT EXISTS available_cities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_to_bookings boolean NOT NULL DEFAULT true;

-- 2. Tour dates / availability
CREATE TABLE IF NOT EXISTS public.artist_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  city text NOT NULL,
  venue text,
  event_date date NOT NULL,
  event_time text,
  status text NOT NULL DEFAULT 'confirmed', -- confirmed | tentative | available
  ticket_url text,
  notes text,
  is_public boolean NOT NULL DEFAULT true,
  created_by text NOT NULL DEFAULT 'admin', -- 'admin' | 'artist'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public artist dates"
  ON public.artist_dates FOR SELECT
  USING (is_public = true);

CREATE POLICY "Artists can manage their own dates"
  ON public.artist_dates FOR ALL
  USING (
    artist_id IN (
      SELECT id FROM public.artists WHERE claimed_by = auth.uid()
    )
  );

CREATE TRIGGER update_artist_dates_updated_at
  BEFORE UPDATE ON public.artist_dates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_artist_dates_artist ON public.artist_dates (artist_id, event_date);
CREATE INDEX idx_artist_dates_city ON public.artist_dates (city, event_date);

-- 3. RLS: artists can update their own claimed profile
CREATE POLICY "Artists can update their own profile"
  ON public.artists FOR UPDATE
  USING (claimed_by = auth.uid())
  WITH CHECK (claimed_by = auth.uid());

-- 4. Seed fee ranges from content/artists.ts (only fills missing rows)
UPDATE public.artists SET fee_min_inr = 1260000, fee_max_inr = 4200000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('INDO WAREHOUSE') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 420000, fee_max_inr = 1260000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('NIKKI NAIR') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 80000, fee_max_inr = 250000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('KOHRA') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 30000, fee_max_inr = 80000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SHERAL') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 25000, fee_max_inr = 70000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('PRISMER') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 30000, fee_max_inr = 80000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('GIRLS NIGHT OUT') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 25000, fee_max_inr = 70000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('AK SPORTS') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 60000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('MIDNIGHT TRAFFIC') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SUCHI') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('MURTHOVIC') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('KANDY KURI') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 100000, fee_max_inr = 300000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('DJ SARTEK') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 100000, fee_max_inr = 300000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('ANISH SOOD') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 150000, fee_max_inr = 400000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('LOST STORIES') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 40000, fee_max_inr = 100000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('DUALIST INQUIRY') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 40000, fee_max_inr = 100000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('DJ RAVETEK') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 80000, fee_max_inr = 200000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('PROJECT 91') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 30000, fee_max_inr = 80000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('DJ RAVATOR') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 30000, fee_max_inr = 80000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('MONOPHONIK') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 25000, fee_max_inr = 70000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('KALEEKARMA') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 40000, fee_max_inr = 100000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SID VASHI') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 50000, fee_max_inr = 120000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SANDUNES') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 100000, fee_max_inr = 500000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('KARAN KANCHAN') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 30000, fee_max_inr = 80000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('KOMOREBI') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 50000, fee_max_inr = 150000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('PRABH DEEP') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 25000, fee_max_inr = 60000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('STALVART JOHN') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 25000, fee_max_inr = 60000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('CHRMS') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 40000, fee_max_inr = 100000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SICKFLIP') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 30000, fee_max_inr = 80000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('DOTDAT') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('AAYNA') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('AUDIO UNITS') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 60000, fee_max_inr = 150000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('BULLZEYE') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('DREAMSTATES') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('MOGASU') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('BAWRA') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 30000, fee_max_inr = 80000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('HAMZA RAHIMTULA') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SHANTAM') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('WEIRD SOUNDING DUDE') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('REBLE') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 25000, fee_max_inr = 60000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('GREEN PARK') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 30000, fee_max_inr = 80000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('JATAYU') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 25000, fee_max_inr = 60000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('LONG DISTANCES') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 40000, fee_max_inr = 100000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('THE F16s') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 420000, fee_max_inr = 1260000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('MADAME GANDHI') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('AAGUU') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SODHI') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('HYBRID PROTOKOL') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SPIRALYNK') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('YUNG.RAJ') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 15000, fee_max_inr = 40000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('MC SOOPY') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SHIREEN') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SUNJU HARGUN') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('ELECTROSON') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('DJ FART IN THE CLUB') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('ONRA') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('NATE08') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('SIJYA') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('DISCO ARABESQUO') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('KISS NUKA') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('TAO FU') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('ALEX KASSIAN') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('GAZZI') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
UPDATE public.artists SET fee_min_inr = 20000, fee_max_inr = 50000, fee_currency = 'INR' WHERE UPPER(name) = UPPER('MIXTRESS') AND (fee_min_inr IS NULL OR fee_min_inr = 0);
