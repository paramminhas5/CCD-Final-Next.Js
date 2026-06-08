# CCD Next.js — Architecture Guide

## Database

**Stack:** Supabase (PostgreSQL) via PostgREST REST API  
**Connection:** `SUPABASE_SERVICE_KEY` (server-side only, never exposed to browser)  
**Schema:** `supabase/migrations/` — run `RUNME.sql` in Supabase SQL Editor

### What we DON'T use (and why)
- ❌ `@supabase/supabase-js` SDK — not installed. Direct `fetch()` to PostgREST is simpler and has no client-state issues in serverless functions.
- ❌ Drizzle ORM — deleted. Schema lives in SQL migrations, not TypeScript.
- ❌ `supabase-shim.ts` for new code — legacy compatibility layer only. New code calls `/api/*` directly.

---

## Code Structure

```
src/lib/db/
  supabase.ts    ← THE single Supabase client. All API routes import from here.
  types.ts       ← TypeScript types for every DB table (derived from SQL schema)
  artists.ts     ← Typed data access functions for the artist domain
  index.ts       ← Barrel export — import { getArtist, sbGet, pq, eqf } from "@/lib/db"

pages/api/
  [...proxy].ts           ← Legacy mega-proxy (routes being migrated out of here)
  artist-calendar.ts      ← ✅ EXTRACTED — GET /api/artist-calendar
  generate-poster.ts      ← AI poster generation
  artists/
    index.ts              ← ✅ EXTRACTED — GET/POST /api/artists
    [slug].ts             ← ✅ EXTRACTED — /api/artists/:slug + sub-resources
  bookings/
    index.ts              ← ✅ EXTRACTED — GET /api/bookings
    mine.ts               ← ✅ EXTRACTED — GET /api/bookings/mine
    [id]/
      status.ts           ← ✅ EXTRACTED — PATCH /api/bookings/:id/status
      thread.ts           ← ✅ EXTRACTED — GET /api/bookings/:id/thread
  admin/
    artists.ts            ← ✅ EXTRACTED — CRUD /api/admin/artists
  events/
    [slug].ts             ← Single event by slug
    recommended.ts        ← Recommended events
  user/
    artist-gigs.ts        ← Upcoming gigs for followed artists
    saved-events.ts       ← User saved events
  promoters/
    submit-event.ts       ← Promoter event submission
```

---

## How to add a new API route

**DO:**
```typescript
// pages/api/my-feature/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbInsert, pq, eqf, ord } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const rows = await sbGet("my_table", pq(ord("created_at", false)));
    return res.json(rows);
  }
}
```

**DON'T:**
- Don't add new routes to `[...proxy].ts` — it's being phased out
- Don't use `supabase-shim.ts` in new code
- Don't construct raw Supabase headers — import from `@/lib/db/supabase.ts`

---

## How to query from a client component

Client components can't use `sbGet` (server-only). Use `fetch`:

```typescript
// In a client component ('use client' or React hook)
const artists = await fetch('/api/artists').then(r => r.json());

// Or use the api-client helper (has 30s caching + deduplication):
import { api } from "@/lib/api-client";
const artists = await api.get<Artist[]>('/artists');
```

---

## Database schema

The canonical schema is in `supabase/migrations/`:
- `001_schema.sql` — table definitions
- `002_seed_artists.sql` — 40 artist seed rows
- `003_seed_appearances.sql` — gig history
- `004_seed_events.sql` — CCD events
- `005_seed_promoters.sql` — promoters
- `006_normalise_connections.sql` — fix artist_connections dual-schema
- `RUNME.sql` — run everything at once (paste into Supabase SQL Editor)

**TypeScript types** for all tables live in `src/lib/db/types.ts`.  
When you add a column to the SQL schema, add it to `types.ts` too.

---

## Environment variables

| Variable | Where used | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All API routes (server + client) | ✅ |
| `SUPABASE_SERVICE_KEY` | Server-side API routes only | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side reads (RLS-protected) | Optional |
| `ADMIN_PASSWORD` | All `/api/admin/*` and `/api/functions/v1/*` | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth | ✅ |
| `CLERK_SECRET_KEY` | Auth | ✅ |
| `RESEND_API_KEY` | Email (RSVPs, booking notifications) | Optional |
| `ANTHROPIC_API_KEY` | Event scoring | Optional |
| `FAL_KEY` | AI poster generation | Optional |

---

## Remaining work (proxy migration)

The `[...proxy].ts` file still contains ~35 route groups that haven't been extracted yet.
Extract them in this order (highest-value first):

1. `/api/booking-inquiry-v2` → `pages/api/booking-inquiry.ts`
2. `/api/booking-messages/*` → `pages/api/booking-messages/`
3. `/api/curated-events` → `pages/api/curated-events/`
4. `/api/promoter/*` → `pages/api/promoter/`
5. `/api/shortlist` → `pages/api/shortlist/`
6. `/api/fan-profiles` + `/api/xp-events` → `pages/api/fan/`
7. `/api/functions/v1/*` admin CMS → `pages/api/admin/`
8. Everything else

When a route is extracted, delete it from `[...proxy].ts`.  
Goal: `[...proxy].ts` becomes empty and is deleted.
