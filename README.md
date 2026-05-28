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
8. [Features In Progress / Broken](#features-in-progress--broken)
9. [Database Schema](#database-schema)
10. [API Reference](#api-reference)
11. [Roadmap & Next Steps](#roadmap--next-steps)
12. [Design System](#design-system)
13. [Contributing](#contributing)

---

## What Is This?

Cats Can Dance (CCD) is a Bengaluru-based underground dance music brand — events, streetwear, culture. This repo is the full-stack platform powering `catscandance.com`.

**Three audiences it serves:**
- 🎧 **Fans / newcomers** — discover the Indian underground scene, find events, learn genres
- 🎛️ **Artists** — self-service profile management, tour dates, booking requests inbox
- 🎪 **Promoters / venues** — submit events directly to the Discover feed, get listed

**Vision:** Become the definitive digital home for India's electronic music scene. The Resident Advisor of India, built by the people who live it.

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── cats-can-dance/        ← Next.js 14 frontend (Pages Router)
│   └── api-server/            ← Express 5 REST API server (optional, not live)
├── lib/
│   ├── db/                    ← Drizzle ORM schema + Postgres
│   ├── api-spec/              ← OpenAPI 3.1 YAML + Orval codegen config
│   ├── api-client-react/      ← Auto-generated TanStack Query hooks
│   └── api-zod/               ← Auto-generated Zod schemas
├── scripts/
│   └── sql/                   ← SQL migrations (run in Supabase SQL Editor)
├── .migration-backup/         ← Original Vite/React SPA (reference only)
└── pnpm-workspace.yaml
```

---

## Tech Stack

### Frontend (`artifacts/cats-can-dance`)
| Layer | Tech | Notes |
|---|---|---|
| Framework | **Next.js 14** (Pages Router) | Migrated from Vite/React SPA |
| Language | TypeScript 5.x (strict) | |
| Auth | **Clerk** | OAuth + magic link |
| State | **Zustand** (cart) + **TanStack Query v5** | |
| UI | **shadcn/ui** (Radix primitives) + Tailwind CSS v3 | |
| Animation | **Framer Motion v12** | Hero parallax, section reveals |
| Carousel | **Embla Carousel** | Artist Spotlight |
| Charts | **Recharts** | Artist gig stats |
| Forms | **react-hook-form** + Zod | |
| SEO | **react-helmet-async** | JSON-LD, OG tags, structured data |
| Shop | **Shopify Storefront API** | Direct browser calls, cart via Zustand |

### Infrastructure
| Layer | Tech |
|---|---|
| Database | Supabase (Postgres + storage) |
| Auth | Clerk (with proxy URL support) |
| Deployment | Vercel (frontend) |
| Cron | Vercel cron (nightly scraper + weekly digest) |
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
git clone https://github.com/paramminhas5/CCD-Final-Next.Js.git
cd CCD-Final-Next.Js
pnpm install
```

### Run the frontend
```bash
pnpm --filter @workspace/cats-can-dance dev
# → http://localhost:3000
```

### Build (production)
```bash
pnpm --filter @workspace/cats-can-dance build
```

---

## Environment Variables

### Frontend (`artifacts/cats-can-dance/.env.local`)
```bash
# Clerk auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_PROXY_URL=                          # Optional: for proxied custom domains

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...               # Server-side only — used by /api proxy

# Admin panel
ADMIN_PASSWORD=your_secure_password_here  # Falls back to "84838281" if unset

# Event scraper
ANTHROPIC_API_KEY=sk-ant-...              # Claude Haiku scoring (optional — falls back to score=7)
CRON_SECRET=...                           # Vercel cron auth header

# Email
RESEND_API_KEY=re_...                     # Weekly digest + RSVP emails

# Shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ccd-final-bv8ld.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=...
NEXT_PUBLIC_SHOPIFY_API_VERSION=2025-10

# Optional integrations
YOUTUBE_API_KEY=AIza...
INSTAGRAM_ACCESS_TOKEN=...
```

> ⚠️ **Never commit `.env` files.** Set all secrets in Vercel project settings.

---

## Features Built

### 🏠 Homepage
- Full-viewport Hero with parallax DJ cat + animated flanking cats (Framer Motion)
- **CityMarquee** — acid-yellow rolling ticker of Indian cities + global scene names
- **SceneSnapshot** — 6 Indian city tiles with live event count badges
- **GenreWheel** — 6 genre tiles with global origins teaser strip
- **ArtistSpotlight** — Embla carousel, 5s autoplay
- Events section, Videos, Playlist, Shop drops, Instagram feed, Early Access signup
- Disco Mode easter egg 🪩

### 🗺️ Discover Page (`/discover`) ← *Curated events home*
- **Curated Events grid** — full tabbed, filtered, infinite-scroll event feed (For You / Trending / Editor's Picks / This Weekend)
- **Universal search** — artists + cities + genres + global scenes in one dropdown
- **"What's On This Weekend"** — live city event count strip
- 6 Indian city tiles → city scene pages
- 6 genre tiles → genre education pages
- 7 global scene tiles → origin story pages
- Promoter application CTA

### 🎟️ Events (`/events`)
- CCD own events: featured card, series strip, upcoming list, past episodes
- **4-card curated teaser** — city-relevant events with "See all on Discover →" CTA
- Countdown timer to next CCD show

### 🏙️ City Scene Pages (`/scene/:city`)
- Live artists, upcoming events, promoters, key venues
- JSON-LD: `Place` schema

### 🎛️ Genre Pages (`/genres/:genre`)
- Origin story, BPM, Indian scene, starter tracks (YouTube embeds)
- JSON-LD: `MusicGenre` schema

### 🌍 Global Scene Pages (`/scenes/:scene`)
- Detroit Techno, Chicago House, London Jungle/D&B, Berlin Techno, UK Garage, NYC House, Goa Trance

### 🎤 Artists Directory + Detail (`/artists`, `/artists/:slug`)
- Grid with search, city + genre filters
- 6-tab detail: Overview · Gigs · Connections · Journey · Stats · EPK
- SoundCloud oEmbed, Spotify embed, artist connection graph, gig stats chart
- Follow button → persists to `user_taste_profiles.liked_artist_slugs`

### 🎪 Promoters (`/promoters`, `/promoters/:slug`)
- Directory with trusted-only filter
- Detail page: bio, genres, links, recent events

### 🛍️ Shop (`/shop`, `/product/:handle`)
- Shopify Storefront API, cart via Zustand

### ✍️ Blog (`/blog`, `/blog/:slug`)
- 11 SEO-optimised articles, author profiles

### 🎓 Admin Panel (`/admin-cms`)
- Password-gated CMS — signups, playlists, videos, events, messages, blog, curated events, promoters, artists, RSVPs, marquees, theme, homepage content
- **Run Nightly Scraper** — triggers actual cron handler (Skillbox/District/Insider/HighApe + Claude Haiku scoring)
- **District JSON Import** — paste/upload JSON array of District events, bulk-upsert with dedup
- **Pending Submissions queue** — approve/reject promoter-submitted events

### 👤 User Dashboard + Profile (`/dashboard`, `/profile`)
- **Fan:** XP/tier progress, **Your Events panel** (For You / Artist Gigs / Saved), XP history, role application
- **Artist:** Edit profile, manage EPK, download press kit
- **Promoter:** Submit events directly to Discover feed
- **Profile:** Followed artists grid, city + genre preferences → powers recommendations

### 🤖 Personalised Recommendations (`/api/events/recommended`)
- Reads Clerk userId → loads `user_taste_profiles` + `user_event_interactions` + `event_artist_lineups`
- Scoring: genre affinity (+15/match), liked artist in lineup (+20), city (+10), venue (+8), featured (+25), recency, travel willingness
- Sections: **Artists You Love / Your Vibe / Worth The Trip** + fallback strips
- Tabs: for_you · trending · editors_picks · this_weekend
- Filters: city, genre, date_from, date_to, limit, offset

### 🔄 Nightly Event Scraper (`/api/cron/scrape-events`)
- Sources: **Skillbox** (`skillbox.in/events`), **District** (`district.in/sitemap.xml`), **Insider.in** (per city), **HighApe**
- JSON-LD extraction, genre/city pre-filter, dedup by URL
- Claude Haiku scoring (relevance 1–10, blurb generation) — threshold ≥6 to publish
- Vercel cron: `30 20 * * *` (2am IST daily), `maxDuration: 300`
- Falls back to score=7 if `ANTHROPIC_API_KEY` is unset

### 📧 Weekly Digest (`/api/cron/weekly-digest`)
- Reads `user_taste_profiles` → matches upcoming events by city + genre
- Personalised HTML email via Resend
- Vercel cron: `0 1 * * 1` (Monday 6:30am IST), `maxDuration: 300`
- Dormant until `RESEND_API_KEY` is set

### 🔍 SEO
- Dynamic `sitemap.xml`, `robots.txt`, `rss.xml`
- JSON-LD: Organization, BreadcrumbList, CollectionPage, Place, MusicGenre, FAQPage, ItemList, MusicEvent

---

## Curated Events Module

> Complete flow: scrape → score → store → recommend → display → submit → moderate

### Architecture

```
  ┌──────────────────────────────────────────────────────┐
  │              curated_events (Supabase)               │
  │  source · city · genre · submission_status · score   │
  └──────────────────────────────────────────────────────┘
          ▲               ▲               ▲              ▲
   Vercel cron       Admin CRUD      Promoter submit   JSON import
  Skillbox/District  /admin-cms tab  /submit-event/    Admin panel
  Insider/HighApe    add/edit/delete event (Clerk auth) District paste
  + Haiku score ≥6   mark featured   trusted→publish   up to 500 events
                                     untrusted→pending

                           │
                           ▼
          /api/events/recommended (smart scoring)
          reads: user_taste_profiles + user_event_interactions
                 + event_artist_lineups (lineup → artist match)

         ┌──────────────────┬─────────────────┬──────────────────┐
         ▼                  ▼                 ▼                  ▼
   /discover            /events          /dashboard         weekly email
   Full grid +        4-card teaser     Your Events panel   Resend digest
   tabs/filters        → /discover      For You / Saved     per taste profile
                                        Artist Gigs
```

### Source keys
| Key | Origin | Badge colour |
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
1. Promoter applies at `/submit-event` (fills application form)
2. Admin approves → sets `promoters.claimed_by = <clerk_user_id>` in Supabase
3. Promoter goes to `/dashboard` → Promoter Portal → **Submit New Event**
4. Form at `/submit-event/event` submits to `POST /api/promoters/submit-event`
5. Trusted promoters (`promoters.trusted = true`) → auto-published
6. Non-trusted → `submission_status = pending` → visible in admin Pending Submissions tab
7. Admin approves/rejects from `/admin-cms` Curated Events tab

### One-time Supabase migration
Run `scripts/sql/20260528_promoter_claimed_by_and_event_status.sql` in the Supabase SQL Editor. Safe to re-run (uses `IF NOT EXISTS`).

---

## Features In Progress / Broken

### 🔴 Currently Broken

| Issue | Root Cause | Fix |
|---|---|---|
| **Shop products not visible** | Shopify token invalid or products not published to Storefront channel | Verify token in Shopify Admin → Apps → Storefront API |
| **Admin panel not loading** | `SUPABASE_SERVICE_KEY` not set in Vercel | Set env var in Vercel project settings |
| **AdminPanel.tsx ghost routes** | Calls `/api/role-applications` — not implemented in proxy | Wire route or remove AdminPanel.tsx |
| **Instagram feed empty** | No `INSTAGRAM_ACCESS_TOKEN` | Set long-lived token |
| **YouTube videos empty** | No `YOUTUBE_API_KEY` | Set API key |

### 🟡 Partially Working

| Feature | Status |
|---|---|
| **Recommendations "For You"** | Scoring works; needs `user_taste_profiles` rows (populated when users save cities/genres in `/profile`) |
| **Artist Gigs strip in dashboard** | Works once `event_artist_lineups` rows are populated for events |
| **Event RSVP emails** | Form + DB works; no email until `RESEND_API_KEY` is set |
| **Booking OTP emails** | OTP generation works; email delivery needs `RESEND_API_KEY` |
| **Weekly digest** | Fully built; dormant until `RESEND_API_KEY` + user profiles exist |
| **Artist enrichment** | Endpoint built; needs `FIRECRAWL_API_KEY` + `OPENAI_API_KEY` |
| **Disco Mode audio** | Works in dev; may have CORS issues if audio moves to external CDN |

### 🟢 Ready to wire (just needs env var)
- YouTube video sync → `YOUTUBE_API_KEY`
- Instagram feed → `INSTAGRAM_ACCESS_TOKEN`
- Weekly digest emails → `RESEND_API_KEY`
- Artist enrichment → `FIRECRAWL_API_KEY` + `OPENAI_API_KEY`
- Skillbox/District scoring → `ANTHROPIC_API_KEY`

---

## Database Schema

24 tables in PostgreSQL (Supabase), managed via Drizzle ORM (`lib/db/src/schema/`).

### Core Tables
| Table | Purpose |
|---|---|
| `events` | CCD own events — title, date, venue, lineup, poster, series fields |
| `curated_events` | Scraped/submitted/imported events — source, genre, submission_status, promoter_slug |
| `promoters` | Promoter profiles — trusted flag, claimed_by (Clerk user ID), crawl_urls |
| `artists` | Artist profiles — bio, genres, city, social links, fee range |
| `venue_profiles` | Venue data — capacity, genre focus, tier |
| `bookings` | OTP-verified artist booking requests |
| `booking_otp_codes` | One-time codes for booking anti-spam |
| `artist_submissions` | New artist submissions awaiting admin approval |
| `site_settings` | CMS data — playlists, marquees, theme, blog posts |
| `site_videos` | YouTube video IDs + metadata |
| `forms` | Contact messages + early access signups |

### Events + Recommendations Layer
| Table | Purpose |
|---|---|
| `event_artist_lineups` | Artist↔curated_event join — powers "artist you follow is playing" recommendations |
| `user_event_interactions` | view / save / rsvp / share / attended / dismissed — powers scoring + Saved Events strip |
| `user_taste_profiles` | liked_genres[], liked_artist_slugs[], liked_cities[], liked_venues[], travel_willingness |

### Rich Artist Data
| Table | Purpose |
|---|---|
| `artist_connections` | B2B/collab connections (strength score 0–10) |
| `artist_dates` | Self-managed tour dates |
| `event_appearances` | Full gigography |
| `artist_milestones` | Career milestones |
| `artist_social_stats` | Follower snapshot history |
| `artist_discography` | Releases/tracks/EPs |
| `artist_press` | Press mention cards |

### New columns (migration: `20260528_promoter_claimed_by_and_event_status.sql`)
- `promoters.claimed_by` — Clerk user ID of the promoter who owns the profile
- `curated_events.submission_status` — `published` (default/live) | `pending` (awaiting review)
- `curated_events.submitted_by` — Clerk user ID of submitter
- `curated_events.promoter_slug` — slug of the submitting promoter

---

## API Reference

### Events
| Method | Route | Description |
|---|---|---|
| GET | `/curated-events` | Published curated events (filter: city, featured, limit) |
| GET | `/events/recommended` | Personalised recommendations (tabs: for_you/trending/editors_picks/this_weekend; filters: city, genre, date_from, date_to, limit, offset) |
| POST | `/promoters/submit-event` | Submit event as verified promoter (auth: Clerk Bearer token) |

### User
| Method | Route | Description |
|---|---|---|
| GET | `/user/saved-events?user_id=` | Events saved via interactions |
| GET | `/user/artist-gigs?user_id=` | Upcoming gigs for followed artists |
| GET | `/user/profile?userId=` | Taste profile (cities, genres, followed artists) |
| POST | `/user/profile` | Save taste profile |
| POST | `/user/follow` | Follow/unfollow artist |

### Admin (password-gated)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/functions/v1/admin-curated-events` | CRUD for curated events |
| POST | `/admin/import-district-json` | Bulk import up to 500 events from JSON array |
| GET | `/admin/pending-events` | List pending promoter submissions |
| POST | `/admin/pending-events` | Approve or reject a pending submission |
| POST | `/cron/scrape-events` | Manually trigger nightly scraper |

### Artists
| Method | Route | Description |
|---|---|---|
| GET | `/artists` | List (filter: genre, city, featured, limit, offset) |
| GET | `/artists/:slug` | Artist profile |
| GET | `/artists/:slug/full` | Artist + all enriched data |
| GET | `/artists/:slug/gigography` | Full gig history |
| PATCH | `/artists/:id` | Update profile (admin or claimed artist) |
| POST | `/artists/:id/claim` | Claim profile (auth: Clerk) |

### Forms
| Method | Route | Description |
|---|---|---|
| POST | `/event-rsvp` | RSVP to event |
| POST | `/artist-submissions` | Submit new artist |
| POST | `/contact` | Contact form |
| POST | `/early-access` | Early access signup |
| POST | `/booking-otp/start` | Start booking OTP |
| POST | `/booking-otp/verify` | Verify OTP → create booking |

---

## Roadmap & Next Steps

### 🔥 Immediate (before next event)

- [ ] **Run the Supabase migration** — `scripts/sql/20260528_promoter_claimed_by_and_event_status.sql`
- [ ] **Set `ANTHROPIC_API_KEY`** in Vercel — unlocks real Haiku scoring on the nightly scraper
- [ ] **Set `RESEND_API_KEY`** in Vercel — activates weekly digest + RSVP confirmation emails
- [ ] **Set `SUPABASE_SERVICE_KEY`** in Vercel — fixes admin panel loading
- [ ] **Link the first trusted promoter** — `UPDATE promoters SET claimed_by='<clerk_id>', trusted=true WHERE slug='...'`
- [ ] **Seed `user_taste_profiles`** — encourage early users to set cities/genres in `/profile` so For You recommendations have signal
- [ ] Fix Shopify token → `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN`

### 🎯 Near-term (next 2–4 weeks)

- [ ] **Populate `event_artist_lineups`** for upcoming events (admin CRUD or JSON seed) — this is what powers "Artists You Follow are playing" in the dashboard and in For You recommendations
- [ ] **Promoter claiming UX** — add a self-service "Claim this promoter profile" button on `/promoters/:slug` (mirrors artists claiming — `claimed_by` column is already there)
- [ ] **Scraper quality review** — trigger "Run Nightly Now" in admin, review what District/Skillbox/Insider/HighApe are returning, adjust `SCENE_KEYWORDS` / `REJECT_KEYWORDS` in `scrape-events.ts` if needed
- [ ] **Wire YouTube API** — `YOUTUBE_API_KEY` → Videos page stops being empty
- [ ] **Wire Instagram feed** — `INSTAGRAM_ACCESS_TOKEN` → homepage feed live
- [ ] **RSVP confirmation email** — simple Resend template when `event_rsvps` row is inserted
- [ ] **AdminPanel.tsx** — either wire the `/api/role-applications` route or delete the file to clean up ghost routes

### 🎪 Next major feature: Promoter Self-Service Dashboard

Currently the PromoterPortal in `/dashboard` links to the submit form. The next step is a full event management view:

- [ ] **My submitted events list** — query `curated_events WHERE promoter_slug = <slug>`, show status (published / pending)
- [ ] **Edit submitted event** — allow promoter to update title, URL, date, blurb until 24h before event
- [ ] **Delete / cancel event** — soft-delete with `status = cancelled`
- [ ] **Analytics tile** — views, saves, RSVPs on each event (from `user_event_interactions`)
- [ ] **Promoter profile editor** — edit bio, genres, cities, website (same UX as artist portal)

### 🏠 Artist Marketplace (booking infrastructure)

- [ ] **Availability calendar** — artists mark available dates in `/artist/dashboard`
- [ ] **Browse & filter artists by availability** — venue/promoter use case
- [ ] **"Request a date" form** — `POST /booking-inquiry` (not the same as current OTP booking)
- [ ] **Artist response flow** — accept / counter-propose / decline
- [ ] **Booking contract PDF** — agreed terms download

### 🎟️ First-Party Ticketing

- [ ] **Stripe integration** — `STRIPE_SECRET_KEY` env var, Stripe Elements on ticket purchase
- [ ] **Ticket tiers** — promoter sets Early Bird / General / VIP with quantities
- [ ] **QR code ticket emails** — Resend + `qrcode` library, PDF attachment
- [ ] **Door list** — `/checkin/:eventSlug` for door staff, QR scanner
- [ ] **Promoter sales dashboard** — real-time revenue + capacity %

### 👤 Community Layer

- [ ] **"Going" to events** — `user_event_interactions action=rsvp` → show attendee count on event cards
- [ ] **Activity feed in dashboard** — "3 artists you follow have upcoming events" (already have the data, just need the UI strip)
- [ ] **Push notifications (PWA)** — service worker + Web Push for followed artist events
- [ ] **"Heard at [event]"** — crowd-sourced track ID submissions → creates content + backlinks

### 🔍 SEO & Content

- [ ] **Per-event SEO pages** for curated events — `/events/curated/:id` with JSON-LD `MusicEvent`, shareable URL instead of external redirect
- [ ] **More city scene pages** — Kolkata, Ahmedabad, Jaipur, Kochi (data exists in `CITY_SCENES` content file)
- [ ] **More genre pages** — Afrobeats, Baile Funk, Footwork (India adjacency angle)
- [ ] **Blog pipeline** — admin generate + publish already built; need editorial calendar

---

## Design System

CCD uses a custom brutalist design system. All classes are in Tailwind.

### Palette
| Token | Value | Usage |
|---|---|---|
| `cream` | `#F5F0E8` | Primary background |
| `ink` | `#1A1A1A` | Text, borders |
| `magenta` | `#E040FB` | Accent, CTAs, District badge |
| `acid-yellow` | `#F5E642` | Accent, editorial badges, "What's On" strip |
| `electric-blue` | `#00BFFF` | Bengaluru, ambient, Insider badge |
| `orange` | `#FF6600` | Hyderabad, warnings, HighApe badge |
| `lime` | `#AAFF00` | Goa, jungle/DnB, Skillbox badge |
| `hot-pink` | `#FF69B4` | Occasional accent, Promoter badge |

### Typography
- **Display font:** `font-display` — Bowlby One SC (all-caps, chunky)
- **Body font:** system sans-serif

### Signature Utilities
```css
.chunk-shadow { box-shadow: 4px 4px 0 #1a1a1a; }
/* Hover: translate-x-[2px] translate-y-[2px] shadow-none */
/* Everything has border-4 border-ink */
```

---

## Contributing

### Branch naming
- `feat/[feature-name]` — new features
- `fix/[bug-name]` — bug fixes
- `batch-[n]-[description]` — batch AI-assisted sessions

### Commit conventions
```
feat: add curated events grid to /discover
fix: filter pending events from public API response
batch-6: curated events module — discover/recommendations/dashboard/promoter submit
```

### Before pushing
1. `pnpm --filter @workspace/cats-can-dance build` — must pass
2. `pnpm --filter @workspace/cats-can-dance exec tsc --noEmit` — check for new errors
3. Verify new pages render: `pnpm --filter @workspace/cats-can-dance dev`

---

## Known Issues Log

| Date | Issue | Status |
|---|---|---|
| 2026-05 | Shop products not visible — Shopify token needs verification | 🔴 Open |
| 2026-05 | Admin panel not loading — `SUPABASE_SERVICE_KEY` not set in Vercel | 🔴 Open |
| 2026-05 | AdminPanel.tsx calls non-existent `/api/role-applications` route | 🟡 Wire or delete |
| 2026-05 | Instagram feed returns `[]` — no access token | 🟡 Needs env var |
| 2026-05 | YouTube videos empty — no API key | 🟡 Needs env var |
| 2026-05 | Artist enrichment stub — Firecrawl not wired | 🟡 Needs API keys |
| 2026-05 | Booking OTP emails not delivered — no Resend key | 🟡 Needs env var |
| 2026-05 | `ArtistGigChart` duplicate `</div>` breaking build | ✅ Fixed |
| 2026-05 | `public/sitemap.xml` conflicting with dynamic sitemap | ✅ Fixed |
| 2026-05 | "Run Nightly Now" button was a no-op stub | ✅ Fixed — now calls actual cron |
| 2026-05 | `/discover` had no curated events grid | ✅ Fixed — now the events home |
| 2026-05 | Recommendations didn't read taste profiles | ✅ Fixed — full scoring engine live |
| 2026-05 | No promoter event submission path | ✅ Fixed — `/submit-event/event` |
| 2026-05 | Dashboard had no events panel | ✅ Fixed — For You / Artist Gigs / Saved |

---

*Built with ❤️ by Cats Can Dance — Bengaluru's underground crew.*
*Platform built by Kiro AI in collaboration with the CCD team.*
