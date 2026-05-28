# 🐱 Cats Can Dance — Platform

> **India's definitive underground electronic music platform.**
> Events · Artists · Scenes · Culture · Booking · Shop · Ticketing

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)](https://supabase.com)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple)](https://clerk.com)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io)
[![PR](https://img.shields.io/badge/PR%20%2310-Booking%20Module-blue)](https://github.com/paramminhas5/CCD-Final-Next.Js/pull/10)

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Current State](#current-state)
3. [Monorepo Structure](#monorepo-structure)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Features Built](#features-built)
8. [Known Issues / Broken](#known-issues--broken)
9. [Database Schema](#database-schema)
10. [Running Migrations](#running-migrations)
11. [API Reference](#api-reference)
12. [Roadmap](#roadmap)
13. [Design System](#design-system)
14. [Contributing](#contributing)

---


## What Is This?

Cats Can Dance (CCD) is a Bengaluru-based underground dance music brand — events, streetwear, culture. This repo is the full-stack platform powering `catscandance.com`.

**Four audiences it serves:**
- 🎧 **Fans / newcomers** — discover the Indian underground scene, find events, learn genres
- 🎛️ **Artists & Talent** — self-service profiles, availability calendars, booking packages, inbox
- 🎪 **Promoters / venues** — shortlist talent, send briefs, manage bookings, in-app messaging
- 🛠️ **Admins** — CMS for all platform content, event curation, artist approvals

**Vision:** The Resident Advisor of India — the definitive digital home for India's electronic music scene, built by the people who live it.

---

## Current State

> As of May 2026 — `feature/booking-phase1` branch, [PR #10](https://github.com/paramminhas5/CCD-Final-Next.Js/pull/10)

| Module | Status | Notes |
|--------|--------|-------|
| Homepage, Discover, Scene/Genre pages | ✅ Live | Full editorial content |
| Artists directory + detail pages | ✅ Live | Gigography, connections, stats, EPK |
| Events (CCD own + curated) | ✅ Live | Cron scraper needs scheduling |
| Shop (Shopify) | 🔴 Broken | Storefront token needs verification |
| Admin CMS | 🟡 Partial | Needs `SUPABASE_SERVICE_KEY` in Vercel |
| Artist Portal — profile + dates | ✅ Live | |
| Artist Portal — Calendar (Airbnb-style) | ✅ Live | **PR #10** |
| Artist Portal — Packages | ✅ Live | **PR #10** |
| Artist Portal — Booking Inbox (state machine) | ✅ Live | **PR #10** |
| Booking Marketplace `/book` (date+city search) | ✅ Live | **PR #10** |
| Promoter Dashboard `/promoter/dashboard` | ✅ Live | **PR #10** |
| Talent Directory `/talent` | ✅ Live | **PR #10** |
| Transactional emails (booking events) | 🟡 Ready | Set `RESEND_API_KEY` to activate |
| Hold expiry cron | 🟡 Ready | Add to `vercel.json` (see below) |
| First-party ticketing | 🔜 Phase 7 | |
| Community profiles | 🔜 Phase 8 | |



---

## Monorepo Structure

```
/
├── artifacts/
│   ├── cats-can-dance/              ← Next.js 14 frontend (Pages Router)
│   │   ├── pages/
│   │   │   ├── api/[...proxy].ts    ← All API routes (Supabase proxy)
│   │   │   ├── api/cron/            ← Vercel cron jobs
│   │   │   ├── artist/dashboard.tsx ← Artist portal
│   │   │   ├── promoter/dashboard.tsx ← Promoter dashboard  ← NEW
│   │   │   └── talent/              ← Talent directory + profiles  ← NEW
│   │   └── src/
│   │       ├── components/
│   │       │   ├── booking/         ← BookingForm (shared)  ← NEW
│   │       │   └── portal/          ← CalendarManager, PackagesManager  ← NEW
│   │       ├── lib/
│   │       │   ├── booking-email.ts ← Resend email helper  ← NEW
│   │       │   └── talent-config.ts ← Talent kinds + package templates  ← NEW
│   │       └── pages/               ← Page components
│   └── api-server/                  ← Express 5 REST API server
├── lib/
│   ├── db/
│   │   ├── src/schema/              ← Drizzle ORM schema
│   │   └── migrations/              ← SQL migration files  ← NEW (001–006)
│   ├── api-spec/                    ← OpenAPI 3.1 YAML
│   ├── api-client-react/            ← Auto-generated TanStack Query hooks
│   └── api-zod/                     ← Auto-generated Zod schemas
├── scripts/                         ← Seed scripts
├── .migration-backup/               ← Original Vite/React SPA (reference only)
└── pnpm-workspace.yaml
```

**Package names:**
| Package | Name |
|---|---|
| `artifacts/cats-can-dance` | `@workspace/cats-can-dance` |
| `artifacts/api-server` | `@workspace/api-server` |
| `lib/db` | `@workspace/db` |
| `lib/api-client-react` | `@workspace/api-client-react` |

---


## Tech Stack

### Frontend (`artifacts/cats-can-dance`)
| Layer | Tech | Notes |
|---|---|---|
| Framework | **Next.js 14** (Pages Router) | Migrated from Vite/React SPA |
| Language | TypeScript 5.x (strict) | |
| Auth | **Clerk** | Magic link replaced by Clerk OAuth |
| State | **Zustand** (cart) + **TanStack Query v5** | |
| UI | **shadcn/ui** (Radix primitives) + Tailwind CSS v3 | |
| Animation | **Framer Motion v12** | Hero parallax, section reveals |
| Carousel | **Embla Carousel** | Artist Spotlight |
| Charts | **Recharts** | Artist gig stats |
| Forms | **react-hook-form** + Zod | |
| SEO | **react-helmet-async** | JSON-LD, OG tags, structured data |
| Shop | **Shopify Storefront API** | Direct browser calls, cart via Zustand |

### Backend (`artifacts/api-server`)
| Layer | Tech | Notes |
|---|---|---|
| Runtime | **Express 5** + Node.js | |
| Database | **PostgreSQL** via Supabase | |
| ORM | **Drizzle ORM** | Full typed schema |
| Validation | **Zod v4** + drizzle-zod | |
| Auth middleware | **Clerk Express** | |
| API contract | **OpenAPI 3.1** YAML | Orval → TanStack Query hooks |
| Logging | **Pino** | |

### Infrastructure
| Layer | Tech |
|---|---|
| Database | Supabase (Postgres + storage) |
| Auth | Clerk (with proxy URL support) |
| Deployment | Vercel (frontend) + Railway/Render (API server) |
| Package manager | pnpm workspaces |

---


## Getting Started

### Prerequisites
- Node.js 22+
- pnpm 10+ (`npm install -g pnpm`)
- A Supabase project
- A Clerk application

### Install
```bash
git clone https://github.com/paramminhas5/ccdkiroedit.git
cd ccdkiroedit
pnpm install
```

### Run the frontend
```bash
pnpm --filter @workspace/cats-can-dance dev
# → http://localhost:3000
```

### Run the API server
```bash
pnpm --filter @workspace/api-server dev
# → http://localhost:3001
```

### Run both together
```bash
# Terminal 1
pnpm --filter @workspace/api-server dev

# Terminal 2
pnpm --filter @workspace/cats-can-dance dev
```

### Build (production)
```bash
pnpm --filter @workspace/cats-can-dance build
```

### Activate hold expiry cron (Vercel)
Add to `vercel.json` in the repo root:
```json
{
  "crons": [
    { "path": "/api/cron/expire-holds", "schedule": "0 * * * *" }
  ]
}
```
This expires 48h booking holds hourly and posts a system message to the thread.

---


## Environment Variables

### Frontend (`artifacts/cats-can-dance/.env.local`)
```bash
# Clerk auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_PROXY_URL=                          # Optional: for Replit/custom domain proxy

# Supabase (anon key is safe to expose — RLS protects data)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# API server URL (used by SSR pages)
NEXT_PUBLIC_API_URL=http://localhost:3001/api   # or production URL

# Admin panel password
ADMIN_PASSWORD=your_secure_password_here

# Supabase service key (for /api proxy routes — server-side only)
SUPABASE_SERVICE_KEY=eyJ...
```

### API Server (`artifacts/api-server/.env`)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Clerk
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Admin password (matches frontend)
ADMIN_PASSWORD=your_secure_password_here

# Optional integrations
YOUTUBE_API_KEY=AIza...          # Wire YouTube video sync
FIRECRAWL_API_KEY=fc-...         # Wire artist profile enrichment
OPENAI_API_KEY=sk-...            # Wire AI enrichment logic
INSTAGRAM_ACCESS_TOKEN=...       # Wire Instagram feed
RESEND_API_KEY=re_...            # Transactional emails — booking events, OTP, RSVP, digests
STRIPE_SECRET_KEY=sk_...         # First-party ticketing (Phase 7)
FAL_KEY=...                      # AI poster generation (already wired)
```

> ⚠️ **Never commit `.env` files.** All secrets must be set in Vercel / Railway env var dashboards.
>
> 🔑 **Minimum to go live:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_SERVICE_KEY`, `ADMIN_PASSWORD`
>
> 📧 **To activate booking emails:** add `RESEND_API_KEY` — all templates are already built, emails fire automatically on booking status changes.

---


## Features Built

### 🏠 Homepage
- Full-viewport Hero with parallax DJ cat + animated flanking cats (Framer Motion)
- **CityMarquee** — acid-yellow rolling ticker of Indian cities + global scene names
- **SceneSnapshot** — 6 Indian city tiles with **live event count badges** from API
- **GenreWheel** — 6 genre tiles (ink bg) with global origins teaser strip
- **ArtistSpotlight** — Embla carousel of up to 5 featured artists, 5s autoplay, dots + arrows
- Events section (upcoming CCD episodes + curated events)
- Videos, Playlist, Drops (shop), Instagram feed, Early Access signup
- Disco Mode easter egg 🪩 (disco ball, lasers, audio, beat pulse)

### 🗺️ Discover Page (`/discover`)
- **Universal search** — artists + cities + genres + global scenes in one dropdown
- **"What's On This Weekend"** — live strip showing event counts per city for next 7 days
- 6 Indian city tiles → city scene pages
- 6 genre tiles → genre education pages
- 7 global scene tiles → origin story pages

### 🏙️ City Scene Pages (`/scene/:city`)
- Available: Bengaluru, Mumbai, Delhi, Goa, Hyderabad, Pune
- Live artists from that city (API)
- Live upcoming events in that city (API)
- Promoters active in that city
- Key venues + active genres
- Related genre links
- JSON-LD: `Place` schema

### 🎛️ Genre Pages (`/genres/:genre`)
- Available: Techno, House, Jungle/D&B, UK Garage, Disco, Ambient
- BPM range, origin, decade
- "What is this genre?" origin story
- "The Indian Scene" — key Indian artists + scene description
- Starter tracks (YouTube embeds, no API key needed)
- Key global landmarks (clubs, labels, events)
- Link to parent global scene
- Live Indian artists from API filtered by genre
- JSON-LD: `MusicGenre` schema

### 🌍 Global Scene Pages (`/scenes/:scene`)
- Available: Detroit Techno, Chicago House, London Jungle/D&B, Berlin Techno, UK Garage, NYC House, Goa Trance
- Origin story editorial
- India connection (how it reached India, who carries it)
- Key artists who built the scene
- Starter tracks (YouTube embeds)
- Related genres + Indian cities where it's heard
- "More global scenes" section
- JSON-LD: `Place` schema

### 🎤 Artists Directory (`/artists`)
- Grid with search, city filter, genre pills, sort (A-Z / City / Genre)
- Mosaic layout (every 9th card spans 2 columns)
- Accent colour placeholders for artists without photos
- Fetches from `/api/artists` (migrated from Supabase direct)

### 🎤 Artist Detail Pages (`/artists/:slug`)
- **6-tab layout:** Overview · Gigs · Connections · Journey · Stats · EPK
- **Overview:** Bio, SoundCloud oEmbed player, Spotify embed, Quick Facts, Recent Gigs, Connections preview
- **Gigs:** Full gigography with year filter
- **Connections:** `ArtistConnectionGraph` — strength-bar visual cards with connection type badges
- **Journey:** Vertical milestone timeline (first gig, festival debut, city debuts)
- **Stats:** Stat tiles + `ArtistGigChart` (Recharts bar chart per year + city bars)
- **EPK:** Electronic Press Kit — bio, photo, booking info, fee range, availability
- **Similar Artists** section below tabs — connections-first, genre fallback, 6-wide grid
- Blurred hero background with artist photo

### 🎪 Promoters (`/promoters`, `/promoters/:slug`)
- Directory with search, city filter, trusted-only toggle
- Promoter names link to detail pages
- Detail page: bio, genre tags, links, recent events, submit-your-night CTA
- Fetches from `/api/promoters` (migrated from Supabase direct)

### 🎟️ Events (`/events`)
- CCD own events + curated events from trusted promoters
- Tabs: For You · Trending · Editor's Picks · This Weekend
- Infinite scroll, save/share events
- Redesigned to match CCD brutalist design system (cream/ink/chunk-shadow)
- Filter: city + genre pills

### 🛍️ Shop (`/shop`, `/product/:handle`)
- Shopify Storefront API integration
- Filter: All / Streetwear / Pets
- Cart managed via Zustand + Shopify cart mutations
- Cart drawer (slide-out)

### ✍️ Blog (`/blog`, `/blog/:slug`)
- 11 SEO-optimised articles (Bengaluru scene guides, genre primers)
- Author profiles (`/authors/:slug`)

### 🎓 Admin Panel (`/admin`)
- Password-gated CMS (14 tabs)
- Manages: signups, playlists, videos, events, messages, blog posts, curated events, promoters, artists, SEO, marquees, theme, homepage content, RSVPs

### 🎛️ Artist Portal (`/artist/dashboard`)
- Sign-in gated via Clerk; claimed artists only
- **Profile tab** — edit bio, social links, booking email, available cities, open-to-bookings toggle
- **📅 Calendar tab** *(Phase 1)* — Airbnb-host month grid; drag across days to select a range; block sheet with kind (Tour Leg / Unavailable / Open Slot), cities, weekly recurrence pattern (Fri+Sat only), fee override; upcoming block list; colour-coded grid
- **💰 Packages tab** *(Phase 1)* — create bookable packages (name, price from/flat, set duration, set type, tech rider, travel included, suitable-for tags); drag-to-reorder; active/pause toggle; live promoter-preview badge bar; **auto-seeds role-specific starter packages on first visit** based on `artists.kind`
- **Booking Inbox** *(Phase 1)* — status filter tabs (new / quoted / held / confirmed / completed); quote-amount input field; state machine action buttons (Send Quote → Place Hold → Confirm → Complete); reply by email / WhatsApp

### 🎟️ Booking Marketplace (`/book`)
*(Phase 1)*
- **Airbnb-style date + city search bar** in the hero — when both set, switches to `/api/marketplace/artists-v2` for date-aware results
- Per-artist **availability signal badges**: ✓ Open slot / ◎ Tour leg / ✗ Busy / Check
- Signal legend strip in the sticky filter bar
- Artist cards show "Shortlist" bookmark button (Clerk-gated; redirects to `/promoter/dashboard` if no account)
- Shared `BookingForm` modal: package selector cards, 3-month mini-calendar with colour-coded availability, click-to-set date range, busy-day warning banner, numeric INR budget, WhatsApp phone field

### 🧑‍🎤 Artist Profile — BOOK Tab (`/artists/:slug`)
*(Phase 1)*
- Shared `BookingForm` component loaded inline (same as `/book` modal)
- `AvailabilityStrip v2` — fetches `/api/artist-calendar` merging blocks + individual gigs; shows tour-leg block summaries below the calendar grid; loading skeleton; backward-compatible fallback to old `upcomingDates` prop

### 🏢 Promoter Dashboard (`/promoter/dashboard`)
*(Phase 2)*
- **Registration gate** — first-time Clerk sign-in creates a promoter profile (company name, city, genres)
- **Shortlist tab** — save artists from `/book` or `/talent`; edit per-artist brief (event type, dates, cities, budget, notes); contacted badge once messaged; quick-link to artist profile
- **Bookings tab** — all booking requests with status badges, hold expiry timers, quoted fee; click to open message thread
- **Messages tab** — list view; click any booking to open the full threaded chat overlay
- **⚡ Fan-out tab** — fill one shared brief, click one button → sends a separate booking request to every un-contacted artist on the shortlist simultaneously; tracks which artists have been contacted
- **Profile tab** — company name, contact name, cities, genre focus, website, Instagram; verification status badge

### 🎭 Talent Directory (`/talent`, `/talent/:slug`)
*(Phase 3)*
- All 7 talent kinds in one directory: Musician, Photographer, Videographer, Lighting Designer, Mix Engineer, Production Crew, MC
- **Kind selector strip** — horizontal tabs, each colour-coded to its palette role; count per category
- Same Airbnb-style date + city search as `/book`; activates `artists-v2` with availability signals
- Kind badge (emoji + label) on every card; role-specific "Book / Hire / Commission" CTA copy
- Shortlist bookmark button on every card
- `/talent/[slug]` routes to the same magazine-style `ArtistDetail` page (unified profile)
- **Role-specific package defaults** — auto-seeded on first portal visit per `artists.kind` (e.g. photographers get "Event Coverage 4h", "Full Night", "Portrait Session" templates)

### 📧 Transactional Booking Emails
*(Phase 2 — activate with `RESEND_API_KEY`)*
- Branded CCD HTML email templates for all 7 booking events:
  - `new_inquiry` → artist (new request from promoter)
  - `quoted` → promoter (artist sent a quote)
  - `hold_placed` → promoter (hold placed, expiry timer)
  - `confirmed` → both parties
  - `declined` → promoter
  - `cancelled` → artist
  - `message_received` → opposite party (new thread message)
- Non-blocking fire-and-forget; graceful no-op when key not set

### ⏰ Hold Expiry Cron (`/api/cron/expire-holds`)
*(Phase 2 — add to `vercel.json`)*
- Runs hourly via Vercel Cron
- Finds `status = 'held'` bookings whose `hold_expires_at` has passed
- Transitions them back to `new`; posts a system message to the thread

### 📊 Other Pages
- `/about` — Brand story
- `/for-venues`, `/for-artists`, `/for-investors` — Partnership landing pages
- `/care` — Cats Can Care (NGO arm)
- `/ccdxsocial` — CCD × Social (media agency arm with full proposal/event model)
- `/playlists`, `/videos` — Media content
- `/cat-studio` — AI cat image generator (FAL.ai)
- `/submit-event` — Community event submission form
- `/bengaluru-underground-dance-music`, `/bengaluru-techno-events`, `/bengaluru-house-parties` — SEO landing pages

### 🔍 SEO
- Dynamic `sitemap.xml` (server-rendered, fetches all artist slugs live)
- JSON-LD structured data on all major page types
- `robots.txt`, `rss.xml`, OG images
- Per-page `keywords`, `description`, canonical URLs
- Schema types: Organization, BreadcrumbList, CollectionPage, Place, MusicGenre, FAQPage, ItemList

---


---


## Known Issues / Broken

### 🔴 Broken — fix before launch

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| **Shop products not visible** | Shopify Storefront token may be invalid or products not published to Storefront channel | Shopify Admin → Apps → Storefront API → verify token; confirm products are published |
| **Admin panel not loading** | Requires `SUPABASE_SERVICE_KEY` in Vercel env vars — if missing, all admin fetches silently fail | Set `SUPABASE_SERVICE_KEY` in Vercel project settings |
| **AdminPanel.tsx ghost routes** | Calls `/api/role-applications` which doesn't exist | Wire route in Express server or remove the tab from AdminPanel.tsx |

### 🟡 Working but incomplete — just needs an env var or wiring

| Feature | What's needed |
|---------|--------------|
| Transactional booking emails | Set `RESEND_API_KEY` — all templates + triggers already built |
| Booking OTP emails | Same `RESEND_API_KEY` |
| RSVP confirmation emails | Same `RESEND_API_KEY` |
| Hold expiry cron | Add `{ "path": "/api/cron/expire-holds", "schedule": "0 * * * *" }` to `vercel.json` |
| YouTube videos page | Set `YOUTUBE_API_KEY` |
| Instagram feed | Set `INSTAGRAM_ACCESS_TOKEN` |
| Artist enrichment pipeline | Set `FIRECRAWL_API_KEY` + `OPENAI_API_KEY` + implement logic |
| Curated events auto-scraping | Cron job `curate-events` exists but not scheduled in Vercel |
| Artist claim notifications | Claiming UI works; email to admin on claim not wired |

### ✅ Previously broken — now fixed

| Issue | Fixed |
|-------|-------|
| `ArtistGigChart` duplicate `</div>` breaking build | ✅ |
| `public/sitemap.xml` conflicting with dynamic `pages/sitemap.xml.tsx` | ✅ |
| Booking inbox showed raw blob text | ✅ — structured columns + status machine |
| Availability strip only read individual gig dates | ✅ — now reads merged calendar API (blocks + gigs) |

---


---


## Database Schema

26 tables total in PostgreSQL (Supabase). Core tables managed via Drizzle ORM (`lib/db/src/schema/`). Booking module tables added via idempotent SQL migrations in `lib/db/migrations/`.

### Core Tables
| Table | Purpose |
|---|---|
| `artists` | Artist profiles — bio, genres, city, social links, fee range, booking status, `kind` |
| `events` | CCD own events — title, date, venue, lineup, poster, status |
| `curated_events` | Events crawled/submitted from external promoters |
| `promoters` | Legacy promoter directory entries (pre-booking-module) |
| `venue_profiles` | Venue data — capacity, genre focus, tier |
| `booking_requests` | All booking inquiries — structured fields + status state machine |
| `booking_otp_codes` | One-time codes for anti-spam on booking flow |
| `artist_submissions` | New artist submissions awaiting admin approval |
| `site_settings` | CMS data — playlists, marquees, theme, homepage content, blog posts |
| `site_videos` | YouTube video IDs + metadata |
| `forms` | Contact messages + early access signups |

### Artist Enrichment Layer
| Table | Purpose |
|---|---|
| `artist_connections` | B2B/collab connections between artists (strength score 0–10) |
| `artist_dates` | Individual confirmed gig dates (artist portal) |
| `event_appearances` | Full gigography — artist × event records |
| `artist_milestones` | Career milestones (first gig, festival debut, city debuts) |
| `artist_social_stats` | Follower snapshot history (IG, SC, Spotify) |
| `artist_discography` | Releases/tracks/EPs |
| `artist_press` | Press mention cards |
| `schema_event_artist_lineups` | Event lineup join table |
| `schema_user_event_interactions` | User save/dismiss/click tracking |
| `schema_user_taste_profiles` | User music taste (genres, cities, liked artists) |

### Booking Module Tables (`lib/db/migrations/`)
| File | Table(s) | Purpose |
|------|---------|---------|
| `001_artist_packages.sql` | `artist_packages` | Pricing tiers per artist — name, price, set type, duration, tech rider, travel included, suitable-for tags |
| `002_artist_availability_blocks.sql` | `artist_availability_blocks` | Host-side calendar — tour legs, unavailable blocks, open slots; date ranges; optional weekly recurrence; multi-city array |
| `003_extend_*.sql` | (extends existing) | Structured columns on `booking_requests` (status machine, event details, package FK); `artists.kind` column |
| `004_promoter_profiles.sql` | `promoter_profiles` | Clerk-linked promoter accounts — company, verified badge, city, genres, booking stats |
| `005_booking_messages.sql` | `booking_messages` | In-app message thread per booking — sender role, body, quote attachment, read receipts |
| `006_booking_shortlist.sql` | `booking_shortlist` | Promoter shortlist — artist × promoter; brief storage; contacted flag; fan-out tracking |

### `artists.kind` column
Allows the platform to serve all creative roles. Existing rows default to `musician`.

```
musician | photographer | lighting | mix_engineer | production | videographer | mc
```

---


## Running Migrations

All migration files are **idempotent** — safe to run multiple times (`IF NOT EXISTS` guards throughout).

**Option A — Supabase SQL Editor (recommended)**
1. Open your Supabase project → Database → SQL Editor → New query
2. Paste each file from `lib/db/migrations/` in numeric order
3. Execute each one

**Option B — Supabase CLI**
```bash
supabase db push
```

**Order:**
```
001_artist_packages.sql
002_artist_availability_blocks.sql
003_extend_artist_dates_and_booking_requests.sql
004_promoter_profiles.sql
005_booking_messages.sql
006_booking_shortlist.sql
```

> **After running migrations**, add `RESEND_API_KEY` to Vercel env vars and the hold-expiry cron to `vercel.json` — the booking module is then fully live.



Base URL: `/api` (proxied through Next.js → Express 5 server)

### Artists
| Method | Route | Description |
|---|---|---|
| GET | `/artists` | List approved artists (filter: genre, city, featured, limit, offset) |
| GET | `/artists/:slug` | Artist profile |
| GET | `/artists/:slug/basic` | Artist + appearances + upcoming dates (resilient) |
| GET | `/artists/:slug/full` | Artist + all enriched data in one request |
| GET | `/artists/:slug/gigography` | Full gig history (filter: year, city, venue) |
| GET | `/artists/:slug/milestones` | Career milestones |
| GET | `/artists/:slug/stats` | Gig stats (by year, city, venue) |
| GET | `/artists/:slug/connections` | Artist connections network |
| PATCH | `/artists/:id/profile` | Update artist profile (auth: claimed artist) |
| POST | `/artists/:id/claim` | Claim artist profile (auth: Clerk) |

### Events
| Method | Route | Description |
|---|---|---|
| GET | `/events` | List CCD events |
| GET | `/events/:slug` | Event detail |
| GET | `/curated-events` | Curated/crawled events (filter: city, featured, limit) |
| GET | `/events/recommended` | Personalised event recommendations (tabs: for_you/trending/editors_picks/this_weekend) |

### Artist Portal
| Method | Route | Description |
|---|---|---|
| GET | `/artists/by-user` | Get artist profile claimed by current user |
| GET | `/artist-dates/:artistId` | List tour dates |
| POST | `/artist-dates/:artistId` | Add tour date |
| PATCH | `/artist-dates/entry/:id` | Update tour date |
| DELETE | `/artist-dates/entry/:id` | Delete tour date |
| GET | `/booking-requests/:artistId` | Booking requests for artist |

### Booking Module (Phase 1–2)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/artist-packages?artist_slug=` | Public | List active packages for artist |
| POST | `/artist-packages` | Artist | Create package |
| PATCH | `/artist-packages/:id` | Artist | Update package |
| DELETE | `/artist-packages/:id` | Artist | Soft-delete package |
| POST | `/artist-packages/reorder` | Artist | Reorder packages `{ order: [{id, sort_order}] }` |
| GET | `/availability-blocks?artist_slug=&from=&to=` | Public | Public calendar blocks in range |
| GET | `/availability-blocks/mine?from=&to=` | Artist | All own blocks (incl. private) |
| POST | `/availability-blocks` | Artist | Create block (tour_leg / unavailable / available) |
| PATCH | `/availability-blocks/:id` | Artist | Update block |
| DELETE | `/availability-blocks/:id` | Artist | Delete block |
| GET | `/artist-calendar?slug=&from=&to=` | Public | Merged day-map (blocks + gigs) → `{days, blocks, gigs}` |
| POST | `/booking-inquiry-v2` | Public | Structured inquiry (v1 fallback built-in) |
| PATCH | `/booking-requests/:id/status` | Artist | State machine: new→quoted→held→confirmed→completed |
| GET | `/booking-requests/mine?status=` | Artist | Artist's inbox with optional status filter |
| GET | `/marketplace/artists-v2?city=&date=&genre=&fee_max=` | Public | Date+city-aware artist search with `availability_signal` |
| POST | `/promoter/register` | Promoter | Create promoter profile (Clerk-linked) |
| GET | `/promoter/me` | Promoter | Get own promoter profile |
| PATCH | `/promoter/me` | Promoter | Update promoter profile |
| GET | `/shortlist` | Promoter | Get own shortlist with artist details |
| POST | `/shortlist` | Promoter | Add artist to shortlist `{ artist_slug, brief?, target_date?, cities? }` |
| DELETE | `/shortlist/:artist_slug` | Promoter | Remove artist from shortlist |
| POST | `/shortlist/fan-out` | Promoter | Send brief to all shortlisted artists simultaneously |
| GET | `/booking-messages/:booking_id` | Artist/Promoter | Message thread for a booking |
| POST | `/booking-messages/:booking_id` | Artist/Promoter | Post message to thread |

### Forms
| Method | Route | Description |
|---|---|---|
| POST | `/booking-otp/start` | Start booking OTP flow |
| POST | `/booking-otp/verify` | Verify OTP → create booking request |
| POST | `/event-rsvp` | RSVP to event |
| POST | `/artist-submissions` | Submit new artist |
| POST | `/contact` | Contact form |
| POST | `/early-access` | Early access signup |

### Content
| Method | Route | Description |
|---|---|---|
| GET | `/site-settings` | CMS settings (playlists, marquees, theme) |
| GET | `/videos` | YouTube videos |
| GET | `/promoters` | Promoter directory |

### Integrations (currently stubbed)
| Method | Route | Description |
|---|---|---|
| GET | `/instagram-feed` | Instagram posts (requires `INSTAGRAM_ACCESS_TOKEN`) |
| GET | `/youtube-videos` | YouTube sync (requires `YOUTUBE_API_KEY`) |
| POST | `/cat-generate` | AI cat image generation |

---


## Roadmap

### ✅ Phase 1 — Artist Booking Module (SHIPPED — [`feature/booking-phase1` → PR #10](https://github.com/paramminhas5/CCD-Final-Next.Js/pull/10))
- [x] `artist_packages` table + full CRUD API + portal Packages tab (drag-reorder, active/pause, promoter preview)
- [x] `artist_availability_blocks` table + full CRUD API + Airbnb-host Calendar tab (drag-select ranges, tour legs, weekly recurrence, multi-city)
- [x] `/api/artist-calendar` — merged day-map endpoint (blocks + individual gigs)
- [x] `/api/booking-inquiry-v2` — structured inquiry with automatic v1 fallback
- [x] Booking state machine: `new → quoted → held → confirmed → completed`
- [x] Artist Booking Inbox — status filter tabs, quote-amount input, Send Quote / Place Hold / Confirm actions
- [x] Shared `BookingForm` component (package selector cards, live mini-calendar, date-range picker, availability warnings)
- [x] `AvailabilityStrip v2` — reads merged calendar API, shows tour-leg block summaries, loading skeleton
- [x] `/book` marketplace — date+city Airbnb search hero, availability signal badges per card
- [x] `artists.kind` column seeded for talent platform

### ✅ Phase 2 — Promoter Accounts + Messaging (SHIPPED — same PR)
- [x] `promoter_profiles` table — Clerk-linked, company name, verified badge, city, genre focus
- [x] `booking_messages` table — in-app thread per booking, sender roles, read receipts, quote attachments
- [x] `booking_shortlist` table — promoter ↔ artist; brief per entry; contacted flag
- [x] Full promoter CRUD API (`/api/promoter/*`)
- [x] Shortlist CRUD + `/api/shortlist/fan-out` — one click sends brief to all un-contacted artists simultaneously
- [x] Message thread API — read thread, post message, auto mark-read
- [x] Transactional emails (Resend) — 7 templates wired to all status changes and message events
- [x] `/api/cron/expire-holds` — hourly Vercel Cron job expires stale 48h holds
- [x] Promoter Dashboard `/promoter/dashboard` — registration gate, Shortlist, Bookings, Messages, Fan-out, Profile tabs

### ✅ Phase 3 — Talent Platform (SHIPPED — same PR)
- [x] `src/lib/talent-config.ts` — central config for all 7 kinds: display labels, colours, booking verbs, role-specific package templates
- [x] Talent Directory `/talent` — kind selector strip, date+city search, availability signals, shortlist buttons, kind badges
- [x] `/talent/[slug]` route aliasing to unified `ArtistDetail` profile page
- [x] Role-specific starter packages auto-seeded on first portal visit (musicians, photographers, videographers, lighting, mix engineers, production, MCs all get relevant defaults)
- [x] Kind badge on `/artists` directory grid cards for non-musicians
- [x] "Talent" link added to primary Nav

---

### 🔥 Next Up — Phase 4: Ops & Polish

These are the highest-leverage remaining items. No new features — make everything that exists work perfectly.

**4a — Activate what's already built (hours, not days)**
- [ ] Set `RESEND_API_KEY` in Vercel → booking emails go live instantly
- [ ] Add hold-expiry cron to `vercel.json` → holds expire automatically
- [ ] Set `SUPABASE_SERVICE_KEY` in Vercel → admin panel fully operational
- [ ] Run `lib/db/migrations/001–006` in Supabase → booking module fully live
- [ ] Verify Shopify Storefront token → shop goes live

**4b — Admin experience**
- [ ] Remove or wire the ghost routes in `AdminPanel.tsx` (`/api/role-applications` doesn't exist)
- [ ] Add "Booking Requests" tab to admin panel — view all pending inquiries across all artists
- [ ] Add "Promoter Verifications" tab — one-click verify promoter accounts
- [ ] Booking revenue summary in admin (confirmed bookings count + total quoted INR)

**4c — Artist onboarding**
- [ ] Email to admin when an artist submits a claim request
- [ ] Welcome email to artist when their profile is approved
- [ ] "Complete your profile" nudge in portal if packages = 0 or calendar has no blocks

**4d — Quality of life**
- [ ] `.env.example` file documenting every variable (currently only in README)
- [ ] Schedule `curate-events` cron in `vercel.json` — events auto-populate without manual admin seeding

---

### 🎯 Phase 5 — Artist Data Collection Engine
*Makes the artist profiles richer without manual data entry*

- [ ] **Firecrawl enrichment pipeline** — crawl artist IG bios, SoundCloud profiles, Bandcamp pages → auto-populate bio, labels, genre tags
- [ ] **Auto-populate gigography** — parse event listings from promoter crawl URLs → create `event_appearances` rows
- [ ] **Social stats snapshots** — weekly cron: capture IG followers, SC plays, Spotify monthly listeners → `artist_social_stats`
- [ ] **Discography import** — Spotify API pull releases for artists with `spotify` URL set → `artist_discography`
- [ ] **Artist submission review flow** — admin gets email on new submission; one-click approve sends welcome email to artist
- [ ] **Press mention scraper** — Google News search for artist name + music keywords → `artist_press`

---

### 🎪 Phase 6 — Live Events Infrastructure
*Close the loop between events, promoters, and artists*

- [ ] **Event crawler scheduler** — schedule `curate-events` cron for all trusted promoter `crawl_urls`
- [ ] **Event poster upload** — admin/promoter uploads poster → Supabase storage → `poster_url`
- [ ] **RSVP confirmation email** — "You're on the list for [event]" with event details (Resend template already patterned)
- [ ] **Event reminder email** — 24h before event for all RSVPd users
- [ ] **Promoter event creation** — promoters in `/promoter/dashboard` can submit their own events for admin approval
- [ ] **Artist ↔ event linking** — when a booking is confirmed, offer to create a gig record in `event_appearances`

---

### 🎟️ Phase 7 — First-Party Ticketing
*Promoters sell tickets through CCD, CCD takes a small commission*

- [ ] **Stripe integration** — payment processing, webhook handling
- [ ] **Event ticketing setup** — promoter creates tiers (Early Bird / General / VIP) with capacity limits
- [ ] **QR code tickets** — PDF ticket with unique QR code; delivered via Resend
- [ ] **Door list view** — promoter dashboard shows RSVPs + paid tickets merged, filterable
- [ ] **Check-in app** — `/checkin/:eventSlug` with QR scanner for door staff (camera API)
- [ ] **Refund flow** — admin-triggered Stripe refund; guest notified
- [ ] **Sales dashboard** — real-time ticket sales, revenue, capacity %, conversion funnel

---

### 👤 Phase 8 — Community & User Profiles
*Give fans a reason to stay logged in*

- [ ] **User profile page** (`/profile`) — avatar, saved events, followed artists, home cities
- [ ] **Follow an artist** — persists to `user_taste_profiles.liked_artist_slugs`; shows on artist card
- [ ] **"Going" to events** — mark attendance; promoter sees count; "X people going" on event card
- [ ] **Activity feed** — "3 artists you follow have upcoming shows"
- [ ] **Weekly digest email** — "What's happening in [your cities] this week" (Resend; Monday morning)
- [ ] **"Heard at [event]"** — crowd-sourced track ID submissions; curated into event setlists
- [ ] **Event memories** — post-event photo gallery with moderation queue

---

### 📱 Phase 9 — PWA + Mobile
- [ ] **Service worker** — offline cache for `/artists` and `/events`
- [ ] **Push notifications** — opt-in for new events from followed artists
- [ ] **Add to Home Screen** — install prompt on mobile Safari / Chrome
- [ ] **Splash screen** + swipe navigation on mobile

---

### 💰 Phase 10 — Monetisation
- [ ] **Artist verified badge** — paid annual subscription; unlocks analytics dashboard
- [ ] **Featured listings** — promoters pay to feature events in "Editor's Picks"
- [ ] **Shop v2** — complete Shopify integration; "Reserve My Drop" pre-registration
- [ ] **CCD × Social** — agency service pages, portfolio CMS, inquiry form
- [ ] **Affiliate links** — gear guides and course recommendations (DJ equipment, production tools)

---


## Design System

CCD uses a custom brutalist design system. All classes are in Tailwind.

### Palette
| Token | Value | Usage |
|---|---|---|
| `cream` | `#F5F0E8` | Primary background |
| `ink` | `#1A1A1A` | Text, borders |
| `magenta` | `#E040FB` | Accent, CTAs |
| `acid-yellow` | `#F5E642` | Accent, badges |
| `electric-blue` | `#00BFFF` | Bengaluru, ambient |
| `orange` | `#FF6600` | Hyderabad, warnings |
| `lime` | `#AAFF00` | Goa, jungle/DnB |
| `hot-pink` | `#FF69B4` | Occasional accent |

### Typography
- **Display font:** `font-display` — Bowlby One SC (all-caps, chunky)
- **Body font:** system sans-serif

### Signature Utilities
```css
/* Hard offset box shadow — the CCD "chunk shadow" */
.chunk-shadow { box-shadow: 4px 4px 0 #1a1a1a; }

/* Hover micro-interaction — shadow "presses in" */
.hover:translate-x-[2px] .hover:translate-y-[2px] .hover:shadow-none

/* Everything has border-4 border-ink */
```

### Component Patterns
- All interactive elements: `border-4 border-ink` + `chunk-shadow` + hover press-in
- Cards: cream background, 4px ink border, chunk shadow
- Buttons: solid background, uppercase font-display, 4px border
- Genre/category tags: `bg-acid-yellow text-ink` or `bg-ink text-cream`

---


## Contributing

This is a private project. All work is done via the `CCD-Final-Next.Js` GitHub repo.

### Branch naming
```
feat/[feature-name]       — new features
fix/[bug-name]            — bug fixes
feature/booking-phase1    — current active branch (Phases 1–3)
```

### Commit conventions
```
feat(booking): add availability calendar to artist portal
fix(artists): remove duplicate </div> in stats section
chore(readme): update roadmap and known issues
```

### Before pushing
1. `pnpm --filter @workspace/cats-can-dance build` — must pass
2. `npx tsc --noEmit --skipLibCheck` inside `artifacts/cats-can-dance` — check for new errors
3. Verify the pages you changed render correctly in browser (`pnpm dev`)
4. Run relevant SQL migrations in Supabase if schema changed

---

## Known Issues Log

| Date | Issue | Status |
|------|-------|--------|
| 2026-05 | Shop products not visible — Shopify token needs verification | 🔴 Open |
| 2026-05 | Admin panel not loading — `SUPABASE_SERVICE_KEY` not set in Vercel | 🔴 Open |
| 2026-05 | AdminPanel.tsx calls `/api/role-applications` (doesn't exist) | 🟡 Needs wiring or removal |
| 2026-05 | Instagram feed returns `[]` — no access token | 🟡 Needs `INSTAGRAM_ACCESS_TOKEN` |
| 2026-05 | YouTube videos empty — no API key | 🟡 Needs `YOUTUBE_API_KEY` |
| 2026-05 | Artist enrichment stub — Firecrawl not wired | 🟡 Needs keys + implementation |
| 2026-05 | Booking emails silent — `RESEND_API_KEY` not set | 🟡 Just needs env var |
| 2026-05 | Hold expiry not running — cron not added to `vercel.json` | 🟡 Just needs config |
| 2026-05 | Curated events only appear when manually seeded | 🟡 Cron not scheduled |
| 2026-05 | `ArtistGigChart` duplicate `</div>` breaking build | ✅ Fixed |
| 2026-05 | `public/sitemap.xml` conflicting with `pages/sitemap.xml.tsx` | ✅ Fixed |
| 2026-05 | Booking inbox showed raw purpose blob | ✅ Fixed — structured fields + state machine |
| 2026-05 | AvailabilityStrip only read individual gig dates | ✅ Fixed — now reads merged calendar API |

---

*Built with ❤️ by Cats Can Dance — Bengaluru's underground crew.*  
*Platform built by Kiro AI in collaboration with the CCD team.*  
*Active branch: [`feature/booking-phase1`](https://github.com/paramminhas5/CCD-Final-Next.Js/tree/feature/booking-phase1) · [PR #10](https://github.com/paramminhas5/CCD-Final-Next.Js/pull/10)*
