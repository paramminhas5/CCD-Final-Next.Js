-- ============================================================
-- 006_normalise_connections.sql
-- Normalise artist_connections to canonical slug-based schema.
--
-- Run this in Supabase SQL Editor. Safe to re-run multiple times.
--
-- What it does:
--   1. Adds slug columns if they don't exist yet
--   2. Backfills slugs from whatever UUID columns your table has
--      (handles both old naming conventions safely)
--   3. Creates indexes and unique constraint
-- ============================================================

-- ── Step 1: Add slug + metadata columns if missing ───────────────────────────

ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS artist_a_slug  text NOT NULL DEFAULT '';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS artist_b_slug  text NOT NULL DEFAULT '';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS connection_type text NOT NULL DEFAULT 'b2b';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS strength        integer NOT NULL DEFAULT 5;
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS shared_events   text[] NOT NULL DEFAULT '{}';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS shared_venues   text[] NOT NULL DEFAULT '{}';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS notes           text;
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

-- ── Step 2: Backfill artist_a_slug ───────────────────────────────────────────
-- Tries artist_a_id first (newer naming), then artist_id (older naming).
-- Uses DO block so we can check which columns actually exist.

DO $$
BEGIN
  -- Try artist_a_id column (newer schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_connections' AND column_name = 'artist_a_id'
  ) THEN
    UPDATE artist_connections ac
    SET    artist_a_slug = a.slug
    FROM   artists a
    WHERE  ac.artist_a_slug = ''
      AND  ac.artist_a_id IS NOT NULL
      AND  a.id = ac.artist_a_id;
  END IF;

  -- Try artist_id column (older schema fallback)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_connections' AND column_name = 'artist_id'
  ) THEN
    UPDATE artist_connections ac
    SET    artist_a_slug = a.slug
    FROM   artists a
    WHERE  ac.artist_a_slug = ''
      AND  ac.artist_id IS NOT NULL
      AND  a.id = ac.artist_id;
  END IF;
END $$;

-- ── Step 3: Backfill artist_b_slug ───────────────────────────────────────────

DO $$
BEGIN
  -- Try artist_b_id column (newer schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_connections' AND column_name = 'artist_b_id'
  ) THEN
    UPDATE artist_connections ac
    SET    artist_b_slug = a.slug
    FROM   artists a
    WHERE  ac.artist_b_slug = ''
      AND  ac.artist_b_id IS NOT NULL
      AND  a.id = ac.artist_b_id;
  END IF;

  -- Try connected_artist_id column (older schema fallback)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artist_connections' AND column_name = 'connected_artist_id'
  ) THEN
    UPDATE artist_connections ac
    SET    artist_b_slug = a.slug
    FROM   artists a
    WHERE  ac.artist_b_slug = ''
      AND  ac.connected_artist_id IS NOT NULL
      AND  a.id = ac.connected_artist_id;
  END IF;
END $$;

-- ── Step 4: Indexes ───────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS artist_connections_a_slug_idx   ON artist_connections(artist_a_slug);
CREATE INDEX IF NOT EXISTS artist_connections_b_slug_idx   ON artist_connections(artist_b_slug);
CREATE INDEX IF NOT EXISTS artist_connections_strength_idx ON artist_connections(strength DESC);

-- ── Step 5: Unique constraint on slug pair ────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'artist_connections_slug_pair_key'
  ) THEN
    ALTER TABLE artist_connections
      ADD CONSTRAINT artist_connections_slug_pair_key
      UNIQUE (artist_a_slug, artist_b_slug);
  END IF;
END $$;

-- ── Step 6: Verify ────────────────────────────────────────────────────────────
-- Shows how many rows have slugs filled vs missing.
-- Run this separately after the migration to check results:
--
-- SELECT
--   COUNT(*)                                                              AS total,
--   COUNT(CASE WHEN artist_a_slug != '' AND artist_b_slug != '' THEN 1 END) AS slug_complete,
--   COUNT(CASE WHEN artist_a_slug = '' OR  artist_b_slug = '' THEN 1 END)   AS slug_missing
-- FROM artist_connections;

-- ── Step 7 (optional): Drop old UUID columns after confirming slugs ───────────
-- Only run this AFTER verifying slug_missing = 0 above.
--
-- ALTER TABLE artist_connections DROP COLUMN IF EXISTS artist_id;
-- ALTER TABLE artist_connections DROP COLUMN IF EXISTS connected_artist_id;
-- ALTER TABLE artist_connections DROP COLUMN IF EXISTS artist_a_id;
-- ALTER TABLE artist_connections DROP COLUMN IF EXISTS artist_b_id;

SELECT 'Migration 006 complete — artist_connections slug columns ready.' AS status;
