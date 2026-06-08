# CCD Database Migrations

Go to **Supabase Dashboard → SQL Editor → New query**.
Paste the contents of **`RUNME.sql`** and click **Run**.
That's it. Everything runs in one shot, in the right order.

---

## What RUNME.sql does

| Step | File source | What it writes |
|------|-------------|----------------|
| 1/5 · Schema | `001_schema.sql` | 16 tables created / extended, all indexes |
| 2/5 · Artists | `002_seed_artists.sql` | 40 approved artists — Tier 1–4 Indian electronic scene + CCD residents |
| 3/5 · Appearances | `003_seed_appearances.sql` | Gig history, B2B connections, featured flags, available cities, homepage sections ON |
| 4/5 · Events | `004_seed_events.sql` | 5 CCD own events (ccdxsocial series) + 20 curated third-party events |
| 5/5 · Promoters | `005_seed_promoters.sql` | 5 trusted promoters (Krunk, DnBIndia, Qilla, Levitate, Subculture BLR) |

**All steps are idempotent** — `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `ON CONFLICT ... DO UPDATE`. Safe to re-run at any time without duplicating data.

---

## Running individual files

If you want to run a single step (e.g. after adding new artists):

1. Open the file in this directory
2. Copy the contents
3. Paste into Supabase SQL Editor → Run

Run order must be respected on a fresh database:
```
001 → 002 → 003 → 004 → 005
```

On an existing database you can run any file independently — the idempotency guards handle it.

---

## After running

Check row counts (the `RUNME.sql` does this automatically at the end):

```sql
SELECT 'artists'          AS t, COUNT(*) FROM artists
UNION ALL
SELECT 'curated_events',         COUNT(*) FROM curated_events
UNION ALL
SELECT 'events',                 COUNT(*) FROM events
UNION ALL
SELECT 'event_appearances',      COUNT(*) FROM event_appearances
UNION ALL
SELECT 'promoters',              COUNT(*) FROM promoters
ORDER BY 1;
```

Expected minimum counts after a fresh run:

| Table | Rows |
|-------|------|
| artists | 40 |
| curated_events | 20 |
| events | 5 |
| event_appearances | 36 |
| promoters | 5 |

---

## Adding a new migration (Phase 1 onwards)

1. Create `006_your_description.sql` in this directory
2. Use the naming pattern: `NNN_description.sql`
3. Always wrap schema changes in `ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`
4. Add an entry to the table above in this README
5. Add the new step to `RUNME.sql` with a matching `\echo '>>> N/N  description …'` header

---

## Schema overview

### Tables created by `001_schema.sql`

```
artists                    core profile + enrichment metadata
  └── artist_social_stats  follower count snapshots (Spotify/YouTube/SC/IG)
  └── artist_milestones    career timeline (first gig, festival debut, etc.)
  └── artist_discography   releases — singles, EPs, albums, remixes
  └── artist_press         press coverage and interviews
  └── artist_packages      booking packages with pricing and set details
  └── artist_availability_blocks  host-side calendar (like Airbnb host)
  └── artist_dates         individual confirmed/tentative/available dates

booking_requests           inquiry → quote → hold → confirm lifecycle
  └── booking_messages     in-thread messaging per booking
  └── booking_shortlist    promoter saved-artists + fan-out

promoter_profiles          Clerk-linked promoter accounts
user_roles                 artist | promoter | admin per Clerk user
user_taste_profiles        users following artists
fan_profiles               XP / tier system
event_artist_lineups       curated_events ↔ artist slug links
```

### Key indexes

```sql
artists(slug)                                    -- profile page lookup
artists(featured, status)                        -- homepage spotlight query
booking_requests(artist_id_resolved, status)     -- artist inbox
event_appearances(artist_slug, event_date)       -- gigography tab
```
