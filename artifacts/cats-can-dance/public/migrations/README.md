# CCD Database Migrations

Run these in order in the **Supabase SQL Editor** (Dashboard → SQL Editor → New query → paste → Run).

All scripts are **idempotent** — safe to re-run. `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` mean nothing breaks on a second run.

---

## Order of execution

| File | What it does | Run when |
|------|-------------|----------|
| `000_master_migration.sql` | Creates all missing tables, adds all missing columns, adds all indexes | **First — run once on a fresh Supabase project** |
| `../01_artists_seed.sql` | Seeds the 100 Indian electronic artists | After `000` |
| `../02_artist_detail_seed.sql` | Adds appearances / milestones for seeded artists | After `01` |
| `../03_curated_events_seed.sql` | Seeds curated event examples | After `02` |

---

## Tables created / extended by `000_master_migration.sql`

### New tables (created fresh)
- `artist_social_stats` — follower count snapshots per artist per platform
- `artist_milestones` — career timeline events (first gig, festival debut, etc.)
- `artist_discography` — releases: singles, EPs, albums, remixes
- `artist_press` — press coverage and interviews
- `artist_packages` — booking packages with pricing and set details
- `artist_availability_blocks` — host-side calendar (tour legs, blocks, open slots)
- `booking_messages` — in-thread messages between artist and promoter
- `promoter_profiles` — Clerk-linked promoter accounts
- `booking_shortlist` — promoter saved-artists shortlist with fan-out
- `user_roles` — clerk_user_id → artist | promoter | admin
- `user_taste_profiles` — users following artists
- `fan_profiles` — XP / tier system
- `event_artist_lineups` — links curated events to artist slugs

### Extended tables (columns added)
- `artists` — added: `kind`, `why`, `members`, `festivals`, `fee_currency`, `fee_min_inr`, `fee_max_inr`, `available_cities`, `open_to_bookings`, `source`, `enriched_at`, `spotify_id`, `youtube_channel_id`, `ra_id`
- `booking_requests` — added: `artist_id_resolved`, `package_id`, `requester_name`, `event_type`, `event_date`, `event_date_end`, `venue_name`, `venue_city`, `budget_inr`, `notes`, `status`, `quoted_inr`, `hold_expires_at`, `confirmed_at`, `source`, `promoter_clerk_id`, `promoter_name`, `updated_at`
- `artist_dates` — added: `booking_id`, `package_id`, `availability_block_id`, `fee_agreed_inr`, `promoter_name`, `promoter_email`, `set_duration_min`, `internal_notes`, `is_public`

---

## How to check what tables already exist

Run this in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## After running migrations

1. Go to **Authentication → Row Level Security** in the Supabase Dashboard
2. Enable RLS on all new tables (the migration does NOT set up RLS policies — service-role key bypasses them anyway, but enabling RLS is good practice for Phase 4)
3. Verify the `artists` table has data: `SELECT count(*) FROM artists;`
4. If count is 0, run `01_artists_seed.sql`

---

## Phase 1 additions (run when Phase 1 is complete)

```sql
-- Add enrichment tracking columns (already included in 000 via enriched_at, spotify_id, etc.)
-- No separate migration needed for Phase 1 schema — 000 covers it.
```
