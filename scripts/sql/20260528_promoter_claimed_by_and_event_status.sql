-- ──────────────────────────────────────────────────────────────────────────────
-- Migration: promoter claimed_by + curated_events submission status
-- Run in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS)
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Add claimed_by to promoters (links a Clerk user to their promoter profile)
ALTER TABLE promoters
  ADD COLUMN IF NOT EXISTS claimed_by text;

CREATE INDEX IF NOT EXISTS idx_promoters_claimed_by ON promoters (claimed_by)
  WHERE claimed_by IS NOT NULL;

-- 2. Add submission_status to curated_events
--    Values: 'published' (default, all existing rows) | 'pending' (awaiting admin review)
ALTER TABLE curated_events
  ADD COLUMN IF NOT EXISTS submission_status text NOT NULL DEFAULT 'published';

CREATE INDEX IF NOT EXISTS idx_curated_events_submission_status ON curated_events (submission_status);

-- 3. Mark all existing rows as published (already live, no change)
UPDATE curated_events SET submission_status = 'published'
  WHERE submission_status IS NULL OR submission_status = '';

-- 4. Add submitted_by so we know which Clerk user submitted a promoter event
ALTER TABLE curated_events
  ADD COLUMN IF NOT EXISTS submitted_by text;

ALTER TABLE curated_events
  ADD COLUMN IF NOT EXISTS promoter_slug text;
