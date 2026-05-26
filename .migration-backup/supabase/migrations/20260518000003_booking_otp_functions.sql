-- Ensure booking_otp_codes and booking_requests exist with all columns
-- These tables exist in the DB but the edge functions were missing

CREATE TABLE IF NOT EXISTS public.booking_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.booking_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  artist_name text NOT NULL,
  requester_email text NOT NULL,
  requester_phone text,
  purpose text,
  verified_at timestamptz,
  revealed_at timestamptz,
  forward_requested boolean NOT NULL DEFAULT false,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Policies: service role only (edge functions use service role key)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'booking_otp_codes' AND policyname = 'Service role only'
  ) THEN
    CREATE POLICY "Service role only" ON public.booking_otp_codes USING (false);
  END IF;
END $$;

-- Artists can read their own booking requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'Artists read own bookings'
  ) THEN
    CREATE POLICY "Artists read own bookings" ON public.booking_requests FOR SELECT
      USING (
        artist_id IN (SELECT id FROM public.artists WHERE claimed_by = auth.uid())
      );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_otp_email ON public.booking_otp_codes (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_requests_artist ON public.booking_requests (artist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_requests_email ON public.booking_requests (requester_email, artist_id);

-- Add attempts column if missing
ALTER TABLE public.booking_otp_codes ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
