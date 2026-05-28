# CCD Database Migrations

Run these in order against your Supabase project via the SQL Editor
(**Database → SQL Editor → New query**) or using the Supabase CLI:

```bash
supabase db push  # if using supabase CLI linked project
# or paste each file manually in order
```

| File | Description |
|------|-------------|
| `001_artist_packages.sql` | New `artist_packages` table — pricing tiers per artist |
| `002_artist_availability_blocks.sql` | New `artist_availability_blocks` table — tour legs, unavailable blocks, open slots |
| `003_extend_artist_dates_and_booking_requests.sql` | Adds structured columns to `artist_dates` & `booking_requests`; adds `kind` column to `artists` |

## Key design decisions

- **`artist_availability_blocks`** is the host-side calendar (Airbnb host model). Artists manage blocks (ranges, tour legs, recurring rules). `artist_dates` remains for individual confirmed gig records and is now linkable to a booking.
- **`booking_requests.status`** introduces a state machine: `new → quoted → held → confirmed → declined / cancelled / completed`. Old flat rows default to `new`.
- **`artists.kind`** seeds the Phase 4 talent platform. All existing rows default to `musician`.
- All migrations are **idempotent** — safe to run multiple times (`IF NOT EXISTS`, `DO $$ … $$` guards).
