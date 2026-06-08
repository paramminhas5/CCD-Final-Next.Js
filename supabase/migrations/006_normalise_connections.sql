-- ============================================================
-- 006_normalise_connections.sql
-- Normalise artist_connections to canonical slug-based schema.
--
-- Problem: artist_connections had two schemas coexisting:
--   OLD: artist_id (uuid) + connected_artist_id (uuid)
--   NEW: artist_a_slug (text) + artist_b_slug (text)
--
-- This migration:
--   1. Ensures the new slug columns exist and are indexed
--   2. Backfills artist_a_slug / artist_b_slug from the artists table
--      where the old UUID columns have data but slugs are empty
--   3. Removes the old UUID columns once data is migrated
--      (commented out — run manually after verifying the backfill)
--
-- Safe to re-run: uses IF NOT EXISTS / conditional logic.
-- ============================================================

-- ── 1. Ensure slug columns exist (may already exist) ─────────────────────────

ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS artist_a_slug text NOT NULL DEFAULT '';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS artist_b_slug text NOT NULL DEFAULT '';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS connection_type text NOT NULL DEFAULT 'b2b';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS strength integer NOT NULL DEFAULT 5;
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS shared_events text[] NOT NULL DEFAULT '{}';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS shared_venues text[] NOT NULL DEFAULT '{}';
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE artist_connections ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- ── 2. Backfill slugs from artists table where missing ───────────────────────

-- Backfill artist_a_slug from artist_id (old schema)
UPDATE artist_connections ac
SET    artist_a_slug = a.slug
FROM   artists a
WHERE  ac.artist_a_slug = ''
  AND  ac.artist_id IS NOT NULL
  AND  a.id = ac.artist_id;

-- Backfill artist_b_slug from connected_artist_id (old schema)
UPDATE artist_connections ac
SET    artist_b_slug = a.slug
FROM   artists a
WHERE  ac.artist_b_slug = ''
  AND  ac.connected_artist_id IS NOT NULL
  AND  a.id = ac.connected_artist_id;

-- ── 3. Indexes on the canonical slug columns ──────────────────────────────────

CREATE INDEX IF NOT EXISTS artist_connections_a_slug_idx ON artist_connections(artist_a_slug);
CREATE INDEX IF NOT EXISTS artist_connections_b_slug_idx ON artist_connections(artist_b_slug);
CREATE INDEX IF NOT EXISTS artist_connections_strength_idx ON artist_connections(strength DESC);

-- ── 4. Unique constraint on slug pair (prevents duplicate connections) ────────

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

-- ── 5. Drop old UUID columns (run AFTER verifying backfill above) ─────────────
-- Uncomment and run manually once you've confirmed all rows have slugs:
--
-- ALTER TABLE artist_connections DROP COLUMN IF EXISTS artist_id;
-- ALTER TABLE artist_connections DROP COLUMN IF EXISTS connected_artist_id;
-- ALTER TABLE artist_connections DROP COLUMN IF EXISTS artist_a_id;
-- ALTER TABLE artist_connections DROP COLUMN IF EXISTS artist_b_id;
--
-- Verify first with:
--   SELECT COUNT(*) FROM artist_connections WHERE artist_a_slug = '' OR artist_b_slug = '';
--   -- Should return 0 before dropping columns.

-- ── Done ─────────────────────────────────────────────────────────────────────
SELECT 
  COUNT(*) as total_connections,
  COUNT(CASE WHEN artist_a_slug != '' AND artist_b_slug != '' THEN 1 END) as slug_complete,
  COUNT(CASE WHEN artist_a_slug = '' OR artist_b_slug = '' THEN 1 END) as slug_missing
FROM artist_connections;
