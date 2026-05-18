-- RLS policies for direct artist portal (no edge function needed)

-- Allow any authenticated user to claim an UNCLAIMED artist profile
-- (claimed_by IS NULL → they can set claimed_by to their own uid)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'artists' AND policyname = 'Auth users can claim unclaimed profiles'
  ) THEN
    CREATE POLICY "Auth users can claim unclaimed profiles"
      ON public.artists FOR UPDATE
      USING (claimed_by IS NULL AND auth.uid() IS NOT NULL)
      WITH CHECK (claimed_by = auth.uid());
  END IF;
END $$;

-- Artists can read their own profile (including private fields)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'artists' AND policyname = 'Artists can read own full profile'
  ) THEN
    CREATE POLICY "Artists can read own full profile"
      ON public.artists FOR SELECT
      USING (claimed_by = auth.uid() OR status = 'approved');
  END IF;
END $$;

-- Artists can insert their own dates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'artist_dates' AND policyname = 'Artists can insert own dates'
  ) THEN
    CREATE POLICY "Artists can insert own dates"
      ON public.artist_dates FOR INSERT
      WITH CHECK (
        artist_id IN (SELECT id FROM public.artists WHERE claimed_by = auth.uid())
      );
  END IF;
END $$;

-- Artists can update their own dates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'artist_dates' AND policyname = 'Artists can update own dates'
  ) THEN
    CREATE POLICY "Artists can update own dates"
      ON public.artist_dates FOR UPDATE
      USING (
        artist_id IN (SELECT id FROM public.artists WHERE claimed_by = auth.uid())
      );
  END IF;
END $$;

-- Artists can delete their own dates
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'artist_dates' AND policyname = 'Artists can delete own dates'
  ) THEN
    CREATE POLICY "Artists can delete own dates"
      ON public.artist_dates FOR DELETE
      USING (
        artist_id IN (SELECT id FROM public.artists WHERE claimed_by = auth.uid())
      );
  END IF;
END $$;

-- Artists can also read ALL their dates (public and private)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'artist_dates' AND policyname = 'Artists can read all own dates'
  ) THEN
    CREATE POLICY "Artists can read all own dates"
      ON public.artist_dates FOR SELECT
      USING (
        is_public = true
        OR artist_id IN (SELECT id FROM public.artists WHERE claimed_by = auth.uid())
      );
  END IF;
END $$;
