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
7. [Features In Progress / Broken](#features-in-progress--broken)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Roadmap](#roadmap)
11. [Design System](#design-system)
12. [Contributing](#contributing)

---


## What Is This?

Cats Can Dance (CCD) is a Bengaluru-based underground dance music brand — events, streetwear, culture. This repo is the full-stack platform powering `catscandance.com`.

**Three audiences it serves:**
- 🎧 **Fans / newcomers** — discover the Indian underground scene, find events, learn genres
- 🎛️ **Artists** — self-service profile management, tour dates, booking requests inbox
- 🎪 **Promoters / venues** — submit events, get listed, (coming) sell tickets through the platform

**Vision:** Become the definitive digital home for India's electronic music scene, contextualised within global scenes (Detroit Techno, Chicago House, London Jungle, Goa Trance). The Resident Advisor of India, built by the people who live it.

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── cats-can-dance/        ← Next.js 14 frontend (Pages Router)
│   └── api-server/            ← Express 5 REST API server
├── lib/
│   ├── db/                    ← Drizzle ORM schema + Postgres
│   ├── api-spec/              ← OpenAPI 3.1 YAML + Orval codegen config
│   ├── api-client-react/      ← Auto-generated TanStack Query hooks
│   └── api-zod/               ← Auto-generated Zod schemas
├── scripts/                   ← SQL migrations, seed scripts
├── .migration-backup/         ← Original Vite/React SPA (reference only)
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
YOUTUBE_API_KEY=AIza...
FIRECRAWL_API_KEY=fc-...
OPENAI_API_KEY=sk-...
INSTAGRAM_ACCESS_TOKEN=...
RESEND_API_KEY=re_...           # For email notifications
STRIPE_SECRET_KEY=sk_...        # For ticketing (coming soon)
```

> ⚠️ **Never commit `.env` files.** All secrets must be set in Vercel / Railway env var dashboards.

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
- Self-service for claimed artists
- Edit profile (bio, social links, booking preferences)
- Manage tour dates
- View booking requests inbox (OTP-verified)

### 📊 Other Pages
- `/about` — Brand story
- `/for-venues`, `/for-artists`, `/for-investors` — Partnership pages
- `/care` — Cats Can Care (NGO arm)
- `/ccdxsocial` — CCD × Social (media agency arm)
- `/playlists`, `/videos` — Media content
- `/cat-studio` — AI cat image generator
- `/submit-event` — Community event submission
- `/bengaluru-underground-dance-music`, `/bengaluru-techno-events`, `/bengaluru-house-parties` — SEO landing pages

### 🔍 SEO
- Dynamic `sitemap.xml` (server-rendered, fetches all artist slugs live)
- JSON-LD structured data on all major page types
- `robots.txt`, `rss.xml`, OG images
- Per-page `keywords`, `description`, canonical URLs
- Schema types: Organization, BreadcrumbList, CollectionPage, Place, MusicGenre, FAQPage, ItemList

---


## Features In Progress / Broken

### 🔴 Currently Broken (need fixing before launch)

| Issue | Root Cause | Fix Needed |
|---|---|---|
| **Shop products not visible** | `SHOPIFY_STOREFRONT_TOKEN` may not be valid for current store domain, or Shopify store may have no published products | Verify token in Shopify Admin → Apps → Storefront API. Confirm products are published to Storefront channel |
| **Admin panel not loading** | Admin.tsx uses `/api/[...proxy].ts` which proxies to Supabase REST. Requires `SUPABASE_SERVICE_KEY` env var set in Vercel. If missing, all admin fetches silently fail | Set `SUPABASE_SERVICE_KEY` in Vercel project settings |
| **AdminPanel.tsx ghost routes** | Calls `/api/role-applications` which doesn't exist in Express server — only the old proxy | Either wire these routes in Express server or remove AdminPanel.tsx |
| **Instagram feed empty** | Returns `[]` — Instagram Graph API token not configured | Set `INSTAGRAM_ACCESS_TOKEN` env var with a long-lived token |
| **YouTube videos empty** | Returns `[]` — YouTube Data API key not configured | Set `YOUTUBE_API_KEY` env var |
| **Artist enrichment no-op** | Firecrawl stub returns `{ enriched: 0 }` | Set `FIRECRAWL_API_KEY` + `OPENAI_API_KEY` and implement enrichment logic |

### 🟡 Partially Working

| Feature | Status |
|---|---|
| **Curated events** | API route exists and scores events, but crawler (`curate-events`) isn't scheduled — events only appear if manually seeded via admin |
| **Event RSVP** | Form works, data saved to DB, but no confirmation email sent |
| **Booking OTP flow** | OTP code generation works, but email delivery requires `RESEND_API_KEY` or similar transactional email service configured |
| **Shopify cart** | Cart state logic is complete but depends on valid Shopify token |
| **Artist claiming** | Self-service claiming UI exists but email notification to admin on claim request not wired |
| **Disco Mode audio** | Works in dev, may have CORS issues if audio file moved to external CDN |

### 🟢 Stubbed but ready to wire
- YouTube video sync → set `YOUTUBE_API_KEY`
- Instagram feed → set `INSTAGRAM_ACCESS_TOKEN`
- Artist enrichment → set `FIRECRAWL_API_KEY` + `OPENAI_API_KEY`
- Email notifications → set `RESEND_API_KEY`

---


## Database Schema

21 tables in PostgreSQL (Supabase), managed via Drizzle ORM (`lib/db/src/schema/`).

### Core Tables
| Table | Purpose |
|---|---|
| `artists` | Artist profiles — bio, genres, city, social links, fee range, booking status |
| `events` | CCD own events — title, date, venue, lineup, poster, status |
| `curated_events` | Events crawled/submitted from external promoters |
| `promoters` | Promoter profiles — city, genres, trust status |
| `venue_profiles` | Venue data — capacity, genre focus, tier (basement/club/festival) |
| `bookings` (booking_requests) | OTP-verified artist booking requests |
| `booking_otp_codes` | One-time codes for booking flow anti-spam |
| `artist_submissions` | New artist submissions awaiting admin approval |
| `site_settings` | CMS data — playlists, marquees, theme, homepage content, blog posts |
| `site_videos` | YouTube video IDs + metadata |
| `forms` | Contact messages + early access signups |

### Rich Artist Data (Enrichment Layer)
| Table | Purpose |
|---|---|
| `artist_connections` | B2B/collab connections between artists (strength score 0–10) |
| `artist_dates` | Self-managed tour dates (artist portal) |
| `event_appearances` | Full gigography — artist × event records |
| `artist_milestones` | Career milestones (first gig, festival debut, city debuts) |
| `artist_social_stats` | Follower snapshot history (IG, SC, Spotify) |
| `artist_discography` | Releases/tracks/EPs |
| `artist_press` | Press mention cards |
| `schema_event_artist_lineups` | Event lineup join table |
| `schema_user_event_interactions` | User save/dismiss/click tracking |
| `schema_user_taste_profiles` | User music taste (genres, cities, liked artists) |

---


## API Reference

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

### 🔥 Phase 6 — Fix What's Broken (Critical, do first)
- [ ] Fix shop: verify Shopify token + confirm products published to Storefront channel
- [ ] Fix admin: document all required env vars, add `.env.example`, verify Supabase service key setup
- [ ] Wire YouTube API (`YOUTUBE_API_KEY`) → populate Videos page
- [ ] Wire email delivery (`RESEND_API_KEY`) → booking OTP + RSVP confirmations + early access
- [ ] Remove AdminPanel.tsx ghost routes or wire them properly

### 🎯 Phase 7 — Artist Data Collection Engine
- [ ] **Firecrawl enrichment pipeline** — crawl artist IG bios, SoundCloud profiles, Bandcamp pages
- [ ] **Auto-populate gigography** — parse event listings from promoter websites
- [ ] **Social stats snapshots** — weekly cron to capture IG followers, SC plays, Spotify monthly listeners
- [ ] **Artist submission review flow** — admin gets notified, one-click approve → artist gets welcome email
- [ ] **Discography import** — Spotify API: pull releases for artists with spotify URL set
- [ ] **Press mention scraper** — search Google News for artist name + music keywords

### 🎪 Phase 8 — Live Events Infrastructure
- [ ] **Event crawler scheduler** — cron job running `curate-events` for all trusted promoter URLs
- [ ] **Promoter crawl URLs** — promoters table already has `crawl_urls` field, just need the cron wired
- [ ] **Event poster upload** — admin uploads poster → Supabase storage → poster_url
- [ ] **RSVP confirmation emails** — "You're on the list for [event]" email with event details
- [ ] **Event reminder emails** — 24h before event for RSVPd users
- [ ] **Embedded event widget** — `/embed/upcoming` already exists, needs styling polish

### 🏠 Phase 9 — Artist Marketplace (Airbnb for Artists)
> Venues and promoters browse artists, see availability, send direct booking inquiries

- [ ] **Artist availability calendar** — artists mark available dates in portal
- [ ] **Venue/Promoter browse** — filter artists by genre, city, fee range, availability date
- [ ] **"Request a date" form** — venue submits booking request with event details + budget
- [ ] **Artist response flow** — artist gets notified, can accept/decline/counter-propose
- [ ] **Booking contract** — PDF download of agreed terms (date, fee, venue, performance duration)
- [ ] **Promoter verified accounts** — promoters can claim a profile, get `✓ Verified Promoter` badge
- [ ] **Public availability display** — artist profile shows "Available in [city] on [month]"
- [ ] **Fee transparency** — artists set public fee range (already in DB, just not displayed by default)

### 🎟️ Phase 10 — First-Party Ticketing
> Promoters sell tickets directly through CCD, CCD takes a small commission

- [ ] **Stripe integration** — payment processing for ticket purchases
- [ ] **Event ticketing setup** — promoter creates event → sets ticket tiers (Early Bird / General / VIP)
- [ ] **QR code tickets** — PDF ticket with QR code sent by email (Resend)
- [ ] **Door list management** — promoter dashboard shows RSVPs + paid tickets in one list
- [ ] **Check-in app** — simple `/checkin/:eventSlug` page for door staff with QR scanner
- [ ] **Refund flow** — admin-triggered refund via Stripe API
- [ ] **Sales dashboard** — promoter sees real-time ticket sales, revenue, capacity %

### 👤 Phase 11 — Community & User Profiles
- [ ] **User profile page** (`/profile`) — avatar, saved events, followed artists, cities
- [ ] **Follow an artist** — heart button → persists to `user_taste_profiles.liked_artist_slugs`
- [ ] **"Going" to events** — mark attendance, see who else is going
- [ ] **Activity feed** — "3 artists you follow have upcoming events"
- [ ] **Weekly email digest** — "What's happening in [your cities] this week" (Resend)
- [ ] **Push notifications** (PWA) — new event from followed artist
- [ ] **"Heard at [event]"** — crowd-sourced track ID submissions
- [ ] **Event memories** — post-event photo gallery (moderated)

### 📱 Phase 12 — PWA + Mobile
- [ ] **Service worker** — offline cache for artists page + events
- [ ] **Push notifications** — opt-in for followed artists' upcoming events
- [ ] **Add to Home Screen** — install prompt on mobile
- [ ] **Splash screen** + native-feel transitions

### 💰 Phase 13 — Monetisation
- [ ] **Artist verified badge** — paid annual subscription for verified status + analytics
- [ ] **Featured listings** — promoters pay to feature events in "Editor's Picks" tab
- [ ] **Shop v2** — complete Shopify integration, "Reserve My Drop" pre-registration
- [ ] **CCD × Social media agency** — service pages, portfolio, inquiry form fully built out
- [ ] **Affiliate links** — gear guides, course recommendations (DJ equipment, production tools)

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

This is a private project. All work is done via the `ccdkiroedit` GitHub repo.

### Branch naming
- `feat/[feature-name]` — new features
- `fix/[bug-name]` — bug fixes
- `batch-[n]-[description]` — batch work from AI-assisted sessions

### Commit conventions
```
feat: add similar artists section on artist detail pages
fix: remove duplicate </div> in ArtistDetail stats section
batch-5B: Discover — What's On This Weekend strip + universal search
```

### Before pushing
1. Run `pnpm --filter @workspace/cats-can-dance build` — must pass
2. Run `pnpm --filter @workspace/cats-can-dance exec tsc --noEmit` — must be clean
3. Check new pages render in browser with `pnpm dev`

---

## Known Issues Log

| Date | Issue | Status |
|---|---|---|
| 2026-05 | Shop products not visible — Shopify token needs verification | 🔴 Open |
| 2026-05 | Admin panel not loading — `SUPABASE_SERVICE_KEY` env var likely not set in deployment | 🔴 Open |
| 2026-05 | Instagram feed returns `[]` — no access token | 🟡 Needs env var |
| 2026-05 | YouTube videos empty — no API key | 🟡 Needs env var |
| 2026-05 | Artist enrichment stub — Firecrawl not wired | 🟡 Needs API key + implementation |
| 2026-05 | AdminPanel.tsx calls non-existent routes | 🟡 Needs Express routes wired |
| 2026-05 | Booking OTP emails not delivered | 🟡 Needs `RESEND_API_KEY` |
| 2026-05 | `ArtistGigChart` had duplicate `</div>` breaking build | ✅ Fixed |
| 2026-05 | `public/sitemap.xml` conflicted with dynamic `pages/sitemap.xml.tsx` | ✅ Fixed |

---

*Built with ❤️ by Cats Can Dance — Bengaluru's underground crew.*
*Platform built by Kiro AI in collaboration with the CCD team.*
