# 🐱 Cats Can Dance — Platform

> **India's definitive underground electronic music platform.**
> Events · Artists · Scenes · Culture · Shop · Ticketing

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io)

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Monorepo Structure](#monorepo-structure)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Features Built](#features-built)
7. [Curated Events Module](#curated-events-module)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Next Steps](#next-steps)
11. [Design System](#design-system)
12. [Known Issues Log](#known-issues-log)

---

## What Is This?

Cats Can Dance (CCD) is a Bengaluru-based underground dance music brand — events, streetwear, culture. This repo is the full-stack platform powering `catscandance.com`.

**Three audiences:**
- 🎧 **Fans** — discover events, follow artists, get personalised recommendations
- 🎛️ **Artists** — self-service profile management, tour dates, booking requests
- 🎪 **Promoters** — submit events to the Discover feed, manage your listings

**Vision:** The Resident Advisor of India, built by the people who live it.

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── cats-can-dance/        ← Next.js 14 frontend (Pages Router) — the live site
│   └── api-server/            ← Express 5 REST API (optional, not live)
├── lib/
│   ├── db/                    ← Drizzle ORM schema + Postgres
│   ├── api-spec/              ← OpenAPI 3.1 YAML
│   ├── api-client-react/      ← Auto-generated TanStack Query hooks
│   └── api-zod/               ← Auto-generated Zod schemas
├── scripts/
│   └── sql/                   ← Migrations — run in Supabase SQL Editor
├── .migration-backup/         ← Original Vite/React SPA (reference only)
└── pnpm-workspace.yaml
```

---

## Tech Stack

### Frontend (`artifacts/cats-can-dance`)
| Layer | Tech |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| Language | TypeScript 5.x strict |
| Auth | Clerk |
| UI | shadcn/ui + Tailwind CSS v3 |
| Animation | Framer Motion v12 |
| Forms | react-hook-form + Zod |
| State | Zustand (cart) + TanStack Query v5 |
| SEO | react-helmet-async + JSON-LD |
| Shop | Shopify Storefront API |

### Infrastructure
| Layer | Tech |
|---|---|
| Database | Supabase (Postgres + storage) |
| Auth | Clerk |
| Deployment | Vercel |
| Cron | Vercel cron (nightly scraper + weekly digest) |
| Email | Resend |
| Packages | pnpm workspaces |

---

## Getting Started

```bash
git clone https://github.com/paramminhas5/CCD-Final-Next.Js.git
cd CCD-Final-Next.Js
pnpm install
pnpm --filter @workspace/cats-can-dance dev   # → http://localhost:3000
```

### Build
```bash
pnpm --filter @workspace/cats-can-dance build
```

---

## Environment Variables

Copy `.env.example` to `.env.local`. Required vars marked ★.

```bash
# ── Clerk ─────────────────────────────────────────────────────────────────────
# ★ Both required — without them Sign-In is disabled
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_PROXY_URL=                    # Optional — only for proxied custom domains

# ── Supabase ──────────────────────────────────────────────────────────────────
# ★ SUPABASE_SERVICE_KEY required — admin panel, scraper, and all proxy routes fail without it
NEXT_PUBLIC_SUPABASE_URL=https://nrzgyippztzenoyrtszr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...         # ★ Server-only. Never expose in client code.

# ── Admin ─────────────────────────────────────────────────────────────────────
# ★ Required — gates /admin-cms and /admin-panel. No default, returns 401 if unset.
ADMIN_PASSWORD=choose_a_strong_password

# ── Event scraper ─────────────────────────────────────────────────────────────
# ★ CRON_SECRET — Vercel passes this to cron routes. Without it the scraper is publicly triggerable.
CRON_SECRET=generate_with_openssl_rand_base64_32
# Recommended — Claude Haiku scoring. Without it, all scraped events get score=7 (no filtering).
ANTHROPIC_API_KEY=sk-ant-...

# ── Email (Resend) ────────────────────────────────────────────────────────────
# ★ Recommended — RSVP confirmations + weekly digest go silent without this.
RESEND_API_KEY=re_...
EMAIL_FROM=hello@catscandance.com
NEXT_PUBLIC_SITE_URL=https://catscandance.com

# ── Shopify ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SHOPIFY_API_VERSION=2025-10
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ccd-final-bv8ld.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=...

# ── Optional integrations ─────────────────────────────────────────────────────
INSTAGRAM_ACCESS_TOKEN=             # Homepage Instagram feed
YOUTUBE_API_KEY=AIza...             # Videos page
FIRECRAWL_API_KEY=fc-...            # Artist enrichment (Express server only)
OPENAI_API_KEY=sk-...               # Artist enrichment (Express server only)
```

> Set all vars in **Vercel → Project → Settings → Environment Variables**. Never commit `.env.local`.

---

## Features Built

### 🏠 Homepage
- Full-viewport hero with parallax DJ cat + animated flanking cats
- CityMarquee rolling ticker, SceneSnapshot city tiles with live event counts
- ArtistSpotlight carousel, GenreWheel, Videos, Playlist, Shop drops
- Instagram feed, Early Access signup, Disco Mode easter egg 🪩

### 🗺️ Discover (`/discover`) — *Curated events home*
- **Hero** ("WHAT'S ON TONIGHT") + full `<CuratedEvents>` grid
- Tabs: For You · Trending · Editor's Picks · This Weekend
- Filters: city + genre pills, infinite scroll, save/share
- Universal search (artists + cities + genres + scenes)
- "What's On This Weekend" city strip
- Cities, Genres, Global Scenes explorer below

### 🎟️ Events (`/events`)
- CCD own events: featured card, series strip, upcoming list, past episodes
- Countdown to next show
- 4-card curated teaser → "See all on Discover →" CTA

### 🏙️ City + Genre + Scene Pages
- `/scene/:city` — artists, events, promoters, venues per city
- `/genres/:genre` — BPM, origin story, Indian scene, starter tracks
- `/scenes/:scene` — Detroit Techno, Chicago House, London Jungle, Berlin Techno, UK Garage, NYC House, Goa Trance

### 🎤 Artists (`/artists`, `/artists/:slug`)
- Directory: search, city/genre filters, mosaic grid
- Detail: 6-tab layout (Overview · Gigs · Connections · Journey · Stats · EPK)
- SoundCloud oEmbed, Spotify embed, connection graph, gig stats chart
- Follow button → persists to `user_taste_profiles`

### 🎪 Promoters (`/promoters`, `/promoters/:slug`)
- Directory with trusted-only filter
- Detail page with **claim button** — signed-in users can claim unclaimed profiles to unlock event submission

### 🛍️ Shop (`/shop`, `/product/:handle`)
- Shopify Storefront API, cart via Zustand

### ✍️ Blog (`/blog`, `/blog/:slug`)
- 11 SEO-optimised articles, author profiles

### 🎓 Admin Panel (`/admin-cms`)
- 14-tab password-gated CMS
- **Curated Events tab:**
  - Add/edit/delete events manually
  - `🎛 LINEUP` button per event → modal to add/remove/toggle artists (populates `event_artist_lineups`)
  - Run Nightly Scraper → triggers actual Vercel cron handler (Skillbox/District/Insider/HighApe + Haiku scoring)
  - District JSON Import → paste/upload array, bulk-upsert with dedup
  - Pending Submissions queue → approve/reject promoter-submitted events
- All other tabs: signups, playlists, videos, events, blog, promoters, artists, RSVPs, marquees, theme

### 👤 User Dashboard (`/dashboard`)
- **Fan:** XP/tier progress, **Your Events** panel (For You / Artist Gigs / Saved strips), XP history, role application
- **Artist:** Edit profile, manage tour dates, EPK download
- **Promoter:** Full event list with status badges (✓ Live / ⏳ Pending), submit form, delete own events
- **Profile (`/profile`):** Followed artists grid, city + genre preferences → powers personalised recommendations

### 🤖 Personalised Recommendations (`/api/events/recommended`)
- Reads Clerk userId → loads `user_taste_profiles` + `user_event_interactions` + `event_artist_lineups`
- Scoring: genre affinity (+15/match), liked artist in lineup (+20), city (+10), venue (+8), featured (+25), recency
- Sections: **Artists You Love / Your Vibe / Worth the Trip** + fallback strips
- Tabs: for_you · trending · editors_picks · this_weekend
- Filters: city, genre, date range, limit, offset

### 📧 RSVP Confirmation Email
- On RSVP: branded Resend HTML email with event name, date, venue, "name on door" confirmation
- Fire-and-forget — RSVP saves to DB regardless; email is silent no-op without `RESEND_API_KEY`

### 🔄 Nightly Scraper (`/api/cron/scrape-events`)
- Sources: **Skillbox** (`skillbox.in/events`), **District** (`district.in/sitemap.xml`), **Insider.in**, **HighApe**
- JSON-LD extraction, genre/city pre-filter, dedup by URL
- Claude Haiku scoring (relevance 1–10, blurb generation) — publishes events scoring ≥ 6
- Vercel cron: 2am IST daily, maxDuration 300s. Falls back to score=7 if no `ANTHROPIC_API_KEY`.

### 📧 Weekly Digest (`/api/cron/weekly-digest`)
- Reads `user_taste_profiles` → personalised upcoming-events email per user
- Vercel cron: Monday 6:30am IST. Dormant until `RESEND_API_KEY` set.

---

## Curated Events Module

> Complete flow: scrape → score → store → recommend → display → submit → moderate

### Architecture

```
  ┌─────────────────────────────────────────────────────────┐
  │               curated_events (Supabase)                 │
  │  source · city · genre · submission_status · score      │
  └─────────────────────────────────────────────────────────┘
        ▲              ▲              ▲              ▲
  Vercel cron    Admin CRUD      Promoter submit  JSON import
  Skillbox       /admin-cms      /submit-event/   Admin panel
  District       add/edit/del    event (Clerk)    District paste
  Insider        🎛 LINEUP       trusted→publish  up to 500 rows
  HighApe        modal           untrusted→queue
  + Haiku ≥6

                          │
                          ▼
        /api/events/recommended (smart scoring)
        reads: user_taste_profiles
               user_event_interactions
               event_artist_lineups ← populated via 🎛 LINEUP in admin

       ┌──────────────┬──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼              ▼
  /discover       /events        /dashboard    /promoters     weekly email
  Full grid       4-card         Fan: For You  :slug claim    Resend digest
  tabs/filters    teaser         Artist Gigs   button
                                 Saved events
                                 Promoter: list
```

### Source keys + badge colours
| Key | Origin | Badge |
|---|---|---|
| `skillboxes` | Skillbox.in (nightly cron) | Lime |
| `district` | District.in sitemap (nightly cron) | Magenta |
| `insider` | Insider.in per city (nightly cron) | Electric blue |
| `highape` | HighApe (nightly cron) | Orange |
| `editorial` | Admin manual pick | Acid yellow |
| `manual` | Admin manual entry | Ink/cream |
| `promoter:<slug>` | Verified promoter submit form | Hot pink |
| `import:district` | Admin District JSON import | Magenta |

### Promoter event submission flow
1. Promoter applies at `/submit-event`
2. Admin approves → go to Supabase and set `promoters.claimed_by = '<clerk_user_id>'` (or user self-claims via the button on their promoter page)
3. Promoter logs in → Dashboard → Promoter Portal → Submit New Event
4. `/submit-event/event` submits to `POST /api/promoters/submit-event`
5. `trusted = true` → auto-published. `trusted = false` → `submission_status = pending`
6. Admin approves/rejects from `/admin-cms` Curated Events → Pending Submissions

### One-time Supabase migration
Run `scripts/sql/20260528_promoter_claimed_by_and_event_status.sql` in Supabase SQL Editor. Safe to re-run (uses `IF NOT EXISTS`).

---

## Database Schema

24 tables in PostgreSQL (Supabase), managed via Drizzle ORM (`lib/db/src/schema/`).

### Core Tables
| Table | Purpose |
|---|---|
| `events` | CCD own events — title, date, venue, lineup, poster, series |
| `curated_events` | Scraped/submitted/imported events — source, genre, `submission_status`, `promoter_slug`, `submitted_by` |
| `promoters` | Promoter profiles — trusted flag, `claimed_by` (Clerk user ID), crawl_urls |
| `artists` | Artist profiles — bio, genres, city, social links, `claimed_by` |
| `venue_profiles` | Venue data — capacity, genre focus, tier |
| `event_artist_lineups` | Artist↔curated_event join — powers "artist you follow is playing" recommendations |
| `user_event_interactions` | view / save / rsvp / share / attended / dismissed — powers scoring + Saved strip |
| `user_taste_profiles` | liked_genres[], liked_artist_slugs[], liked_cities[], travel_willingness |
| `user_roles` | Fan / artist / promoter / venue / admin role assignments |
| `role_applications` | Artist + promoter applications pending admin review |
| `fan_profiles` | XP, tier, CCD points per user |
| `xp_events` | XP event log (earn history) |
| `bookings` | OTP-verified artist booking requests |
| `booking_otp_codes` | One-time codes for booking anti-spam |
| `artist_submissions` | New artist submissions awaiting admin approval |
| `site_settings` | CMS data — playlists, marquees, theme, blog posts |
| `site_videos` | YouTube video IDs + metadata |
| `forms` | Contact messages + early access signups + RSVPs |

### Rich Artist Data
| Table | Purpose |
|---|---|
| `artist_connections` | B2B/collab connections (strength 0–10) |
| `artist_dates` | Self-managed tour dates |
| `event_appearances` | Full gigography |
| `artist_milestones` | Career milestones |
| `artist_social_stats` | Follower snapshots (IG, SC, Spotify) |
| `artist_discography` | Releases/EPs/tracks |
| `artist_press` | Press mentions |

---

## API Reference

All routes proxied through `pages/api/[...proxy].ts` → Supabase REST.

### Public
| Method | Route | Notes |
|---|---|---|
| GET | `/curated-events` | Published events only (filter: city, featured, limit) |
| GET | `/curated-events/by-promoter?promoter_slug=` | All events for a promoter (any status) |
| GET | `/events/recommended` | Personalised recs (tab, city, genre, date range, limit, offset) |
| GET | `/artists` | List (filter: genre, city, featured, limit, offset) |
| GET | `/artists/:slug` | Artist profile |
| GET | `/promoters` | Directory |
| GET | `/promoters/by-user?user_id=` | Promoter linked to a Clerk user |
| GET | `/event-artist-lineups?curated_event_id=` | Lineup for an event |
| GET | `/user/profile?userId=` | Taste profile |
| GET | `/user/saved-events?user_id=` | User's saved events |
| GET | `/user/artist-gigs?user_id=` | Upcoming gigs for followed artists |

### Authenticated
| Method | Route | Notes |
|---|---|---|
| POST | `/event-rsvp` | RSVP + sends Resend confirmation email |
| POST | `/artist-submissions` | Submit new artist |
| POST | `/contact` | Contact form |
| POST | `/early-access` | Early access signup |
| POST | `/user/profile` | Save taste profile (cities, genres, followed artists) |
| POST | `/user/follow` | Follow/unfollow artist |
| POST | `/promoters/:slug/claim` | Claim promoter profile (one per user, 409 if taken) |
| POST | `/promoters/submit-event` | Submit event as verified promoter |
| DELETE | `/curated-events/:id` | Delete own event (promoter) or any (admin) |

### Admin (x-admin-password header)
| Method | Route | Notes |
|---|---|---|
| GET/POST | `/functions/v1/admin-curated-events` | Full CRUD |
| GET/POST/PATCH/DELETE | `/event-artist-lineups` | Lineup CRUD |
| GET/POST | `/admin/pending-events` | List + approve/reject promoter submissions |
| POST | `/admin/import-district-json` | Bulk import up to 500 events |
| POST | `/cron/scrape-events` | Trigger nightly scraper manually |
| POST | `/functions/v1/admin-promoters` | Promoter CRUD |
| GET/POST | `/user-role` | Read/assign user roles |
| GET | `/admin-roles` | List all role assignments |
| GET/PATCH | `/role-applications/:id` | Review + approve role applications |

---

## Next Steps

### 🔴 Do immediately (nothing works in production without these)

```
1. Vercel → Project → Settings → Environment Variables:
   SUPABASE_SERVICE_KEY = <service role JWT from Supabase Settings → API>
   ADMIN_PASSWORD       = <strong password, at least 20 chars>
   CRON_SECRET          = <run: openssl rand -base64 32>
   ANTHROPIC_API_KEY    = <Claude API key>
   RESEND_API_KEY       = <Resend API key>

2. Supabase SQL Editor → run:
   scripts/sql/20260528_promoter_claimed_by_and_event_status.sql

3. Redeploy in Vercel after setting env vars (they don't hot-reload).
```

### 🟡 This week (makes the platform feel real)

**A — Seed lineups for upcoming events** *(highest leverage, ~1 hour)*
- Go to `/admin-cms` → Curated Events tab
- Find each upcoming curated event → click `🎛 LINEUP`
- Add the artists playing (use their slug from `/artists/` if they're in the directory)
- This single action activates:
  - "Artists You Love" section in Discover For You tab
  - "Artists You Follow" strip in user dashboard
  - Artist-based recommendations for every user who follows those artists

**B — Link first trusted promoter to a Clerk user** *(5 min)*
```sql
UPDATE promoters
SET claimed_by = 'user_<clerk_id_here>', trusted = true
WHERE slug = 'your-promoter-slug';
```
Then that user can go to `/dashboard` → Promoter Portal → submit events directly.

**C — Set YouTube + Instagram env vars**
```
YOUTUBE_API_KEY=AIza...
INSTAGRAM_ACCESS_TOKEN=...
```
Videos page and homepage Instagram feed go live immediately.

**D — Fix the Shopify token**
- Shopify Admin → Apps → Storefront API → create or verify the token
- Set `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` in Vercel
- Confirm products are published to the Storefront channel

### 🟢 Next sprint — new features

**E — Promoter self-service analytics** *(~1 day)*
- Add a "Stats" panel to PromoterPortal showing per-event: views, saves, RSVPs
- Source: `user_event_interactions` grouped by `event_id`
- No new DB table needed

**F — RSVP reminder email** *(~2 hours)*
- 24h before event: query upcoming RSVPs, send reminder via Resend
- Add a Vercel cron at `0 12 * * *` (6pm IST) to check for events tomorrow
- Template already built (RSVP confirmation template is in proxy, just adapt it)

**G — Artist availability calendar** *(~1 day)*
- Artists set available/tentative/confirmed dates in `/artist/dashboard`
- `artist_dates` table already exists and has a portal tab
- Surface on artist detail page → enables venue browse-and-book flow

**H — Per-event SEO pages for curated events** *(~half day)*
- `/events/curated/:id` — shareable URL with JSON-LD `MusicEvent` instead of always linking offsite
- Increases organic search surface area significantly for electronic music queries

**I — "Going" attendance count** *(~1 hour)*
- Show RSVP count on curated event cards using `user_event_interactions` where `action = rsvp`
- No schema change needed — just aggregate query in the recommended API

### 🔵 Medium-term roadmap

**Phase: Artist Marketplace**
- Artist availability calendar (artist sets open dates)
- Venue/promoter browse: filter by genre, city, fee range, availability
- Booking inquiry form → artist inbox in portal
- Booking PDF (date, fee, venue, duration)

**Phase: First-Party Ticketing**
- Stripe: `STRIPE_SECRET_KEY` env var + Stripe Elements checkout
- Promoter sets ticket tiers (Early Bird / General / VIP with quantities)
- QR code PDF tickets via Resend + `qrcode` library
- `/checkin/:eventSlug` door-staff scanner page
- Promoter real-time sales dashboard

**Phase: Community Layer**
- Activity feed in dashboard: "3 artists you follow have upcoming events"
- Push notifications (PWA) for followed artist events
- "Heard at [event]" crowd-sourced track IDs
- Post-event photo gallery (moderated)

**Phase: Content + SEO**
- More city pages: Kolkata, Ahmedabad, Jaipur, Kochi
- More genre pages: Afrobeats, Baile Funk, Footwork
- Blog editorial calendar (admin generate+publish is already built)
- Programmatic SEO: one page per artist × city combination

---

## Design System

CCD brutalist design — all utilities in Tailwind.

### Palette
| Token | Hex | Usage |
|---|---|---|
| `cream` | `#F5F0E8` | Primary background |
| `ink` | `#1A1A1A` | Text, borders |
| `magenta` | `#E040FB` | Primary accent, CTAs, District badge |
| `acid-yellow` | `#F5E642` | Secondary accent, featured badges |
| `electric-blue` | `#00BFFF` | Bengaluru, Insider badge |
| `orange` | `#FF6600` | Hyderabad, HighApe badge |
| `lime` | `#AAFF00` | Goa, Skillbox badge |
| `hot-pink` | `#FF69B4` | Promoter badge |

### Typography
- **Display:** `font-display` — Bowlby One SC (all-caps, chunky)
- **Body:** system sans-serif

### Signature utilities
```css
.chunk-shadow { box-shadow: 4px 4px 0 #1a1a1a; }
/* Hover: translate-x-[2px] translate-y-[2px] shadow-none */
/* All interactive: border-4 border-ink */
```

---

## Known Issues Log

| Date | Issue | Status |
|---|---|---|
| 2026-05 | Shop products not visible — Shopify token needs verification | 🔴 Open |
| 2026-05 | Admin panel empty — `SUPABASE_SERVICE_KEY` not set in Vercel | 🔴 Open |
| 2026-05 | Instagram feed empty — no `INSTAGRAM_ACCESS_TOKEN` | 🟡 Needs env var |
| 2026-05 | YouTube videos empty — no `YOUTUBE_API_KEY` | 🟡 Needs env var |
| 2026-05 | Artist enrichment no-op — Firecrawl not wired | 🟡 Needs API keys |
| 2026-05 | RSVP emails not sent — no `RESEND_API_KEY` | 🟡 Needs env var |
| 2026-05 | Recommendations heuristic only — no lineups seeded yet | 🟡 Needs lineup data |
| 2026-05 | `ArtistGigChart` duplicate `</div>` | ✅ Fixed |
| 2026-05 | `public/sitemap.xml` conflicted with dynamic sitemap | ✅ Fixed |
| 2026-05 | "Run Nightly Now" button was a no-op stub | ✅ Fixed |
| 2026-05 | `/discover` had no curated events grid | ✅ Fixed |
| 2026-05 | Recommendations didn't read taste profiles | ✅ Fixed |
| 2026-05 | No promoter event submission path | ✅ Fixed |
| 2026-05 | Dashboard had no events panel | ✅ Fixed |
| 2026-05 | Hardcoded service-role JWT in proxy | ✅ Fixed |
| 2026-05 | Hardcoded admin password `84838281` in proxy + AdminPanel | ✅ Fixed |
| 2026-05 | AdminPanel fetches all 401'd after entering password | ✅ Fixed |
| 2026-05 | No lineup tool → recommendations fell back to heuristics | ✅ Fixed (🎛 LINEUP in admin) |
| 2026-05 | Promoters couldn't claim their profile without SQL access | ✅ Fixed (claim button on profile page) |
| 2026-05 | PromoterPortal showed no event list | ✅ Fixed |

---

*Built with ❤️ by Cats Can Dance — Bengaluru's underground crew.*
*Platform built by Kiro AI in collaboration with the CCD team.*
