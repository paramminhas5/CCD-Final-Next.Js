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
10. [Next Steps](#next-steps)
11. [Design System](#design-system)
12. [Known Issues Log](#known-issues-log)

---

## What Is This?

Cats Can Dance (CCD) is a Bengaluru-based underground dance music brand — events, streetwear, culture. This repo is the full-stack platform powering `catscandance.com`.

**Three audiences it serves:**
- 🎧 **Fans / newcomers** — discover the Indian underground scene, find events, learn genres
- 🎛️ **Artists** — self-service profile management, tour dates, booking requests inbox, shareable EPK
- 🎪 **Promoters / venues** — submit events, get listed, browse and book artists directly

**Vision:** Become the definitive digital home for India's electronic music scene — the Resident Advisor of India, built by the people who live it.

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
| Auth | **Clerk** | OAuth + magic link |
| State | **Zustand** (cart) + **TanStack Query v5** | |
| UI | **shadcn/ui** (Radix primitives) + Tailwind CSS v3 | |
| Animation | **Framer Motion v12** | Hero parallax, section reveals |
| Carousel | **Embla Carousel** | Artist Spotlight homepage carousel |
| Charts | **Recharts** | Artist gig stats + social growth charts |
| Graph | Custom SVG physics engine | Force-directed artist connection graph |
| Forms | **react-hook-form** + Zod | |
| SEO | **react-helmet-async** | JSON-LD, OG tags, structured data |
| Shop | **Shopify Storefront API** | Direct browser calls, cart via Zustand |

### Backend (`artifacts/api-server` + `/api/[...proxy].ts`)
| Layer | Tech | Notes |
|---|---|---|
| Runtime | **Express 5** + Node.js | |
| Proxy | Next.js API route → Supabase REST | All client calls route through `/api/[...proxy].ts` |
| Database | **PostgreSQL** via Supabase | |
| ORM | **Drizzle ORM** | Full typed schema in `lib/db/` |
| Validation | **Zod v4** + drizzle-zod | |
| Auth middleware | **Clerk Express** | |

### Infrastructure
| Layer | Tech |
|---|---|
| Database | Supabase (Postgres + storage) |
| Auth | Clerk |
| Deployment | Vercel (frontend) |
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

# Supabase (anon key is safe to expose — RLS protects data)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase service key — server-side only, used by /api proxy
SUPABASE_SERVICE_KEY=eyJ...

# Admin panel password (gated on x-admin-password header)
ADMIN_PASSWORD=your_secure_password_here

# Optional integrations
YOUTUBE_API_KEY=AIza...
FIRECRAWL_API_KEY=fc-...
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
```

> ⚠️ **Never commit `.env` files.** Set all secrets in Vercel project settings.

---

## Features Built

### 🏠 Homepage
- Full-viewport Hero with parallax DJ cat + animated flanking cats (Framer Motion)
- **CityMarquee** — rolling ticker of Indian cities + global scene names
- **SceneSnapshot** — 6 city tiles with live event count badges
- **GenreWheel** — 6 genre tiles with global origins teaser
- **ArtistSpotlight** — Embla carousel of featured artists (5s autoplay, dots + arrows). Correctly fetches `featured=true` artists only
- Events section, Videos, Playlist, Drops (shop), Instagram feed, Early Access signup
- Disco Mode easter egg 🪩

### 🗺️ Discover Page (`/discover`)
- Universal search — artists + cities + genres in one dropdown
- "What's On This Weekend" — event counts per city for next 7 days
- City tiles → city scene pages · Genre tiles → genre pages · Global scene tiles

### 🏙️ City Pages (`/scene/:city`) + 🎛️ Genre Pages (`/genres/:genre`) + 🌍 Global Scenes (`/scenes/:scene`)
- Full editorial content per city/genre/scene
- Live artist + event data from API
- JSON-LD structured data (Place, MusicGenre)

---

### 🎤 Artist Section *(fully overhauled — PR #12)*

#### `/artists` — Directory
- Grid with search, city filter, genre pills, A-Z/City/Genre sort
- **◉ BOOKINGS OPEN filter toggle** — promoters can instantly filter to available artists
- **Clickable genre tags** on every card — tap a genre to filter the whole directory
- Mosaic layout (every 9th card spans 2×2), accent colour placeholders without photos

#### `/artists/[slug]` — Artist Profile (7-tab magazine layout)
| Tab | What's in it |
|---|---|
| **HOME** | Bio with drop-cap, SoundCloud + Spotify + **Bandcamp** embeds, quick facts, recent gigs preview, connections preview, journey preview, stats preview, upcoming dates ribbon |
| **GIGS** | Full gigography with year filter, role badges |
| **CONNECTIONS** | **Interactive SVG force-directed graph** — spring/repulsion/gravity physics, drag nodes, pan canvas, scroll-to-zoom, edge labels, selected node info panel with profile link. No D3 dependency |
| **JOURNEY** | Vertical milestone timeline with typed icons |
| **STATS** | Stat tiles + gig-per-year bar chart + top cities bars + **social stats growth line chart** (IG/SC/Spotify over time with delta chips) |
| **EPK** | Press quotes blockquotes · Full press coverage list · **Discography grid** (artwork, streaming links) · Booking contact · Fee range · Availability · **"Claim this profile" CTA** for unclaimed artists |
| **BOOK** | Inline booking form, availability calendar, fee range, open slots |

**Hero:** "Are you [Name]? Claim →" badge on unclaimed profiles · Sticky mobile BOOK CTA

#### `/artists/[slug]/epk` — Standalone Shareable EPK *(new)*
- Clean printable page — no nav, minimal chrome
- "Copy link" + "Print / PDF" buttons in top bar
- Sections: masthead (photo + genres + stats), bio + booking hook, press quotes, full press list, discography grid, booking & contact, fee + availability
- Links back to full profile and booking tab
- `<SEO>` meta for sharing (Open Graph title/description)

#### `/artist/dashboard` — Artist Portal *(upgraded from 4 tabs → 7 tabs)*
| Tab | What it does |
|---|---|
| **Profile** | Edit bio, photo URL, genres, links, fee range, cities, booking toggle · **Profile completion progress bar** with missing-field checklist |
| **Dates** | Add/edit/delete tour dates (confirmed / tentative / available open slot) |
| **Journey** | Add/edit/delete career milestones — typed (first_gig, festival_debut, label_signing, release, award…) with date, city, venue, importance score |
| **Press** | Add/edit/delete press clips — publication, type, excerpt, pull quote for EPK, featured flag |
| **Releases** | Add/edit/delete discography — title, type, date, label, artwork URL, Spotify/SC/Bandcamp links |
| **Bookings** | Booking requests inbox (from direct form) |
| **Inquiries** | Marketplace inquiries inbox (from /book) with email + WhatsApp reply |

Portal header shows: artist photo, name, "View public profile ↗", **"Share EPK →"** link, sign out.

#### `SimilarArtists` component *(upgraded)*
- **Why-similar labels** on every card: "B2B · 4 shared gigs", "Same label", "Collab", genre name
- **Credential badges**: ✓ Verified (claimed profile), ⚡ Festival (artist has festival history)
- Sub-heading explains the match logic to users

#### `/for-artists` — Marketing Page *(upgraded)*
- Added "ARTIST PORTAL →" button alongside "PLAY WITH US →"
- New bottom section: "Claim your profile. Manage your bookings." with portal CTA

---

### 🎪 Promoters, 🎟️ Events, 🛍️ Shop, ✍️ Blog, 🎓 Admin
*(unchanged — see previous entries)*

- Promoters directory + detail pages
- Events with tabs (For You / Trending / Editor's Picks / This Weekend)
- Shopify Storefront API shop + cart drawer
- 11 SEO blog articles + author profiles
- Admin panel (14 tabs, password-gated)

---


## Features In Progress / Broken

### 🔴 Currently Broken (fix before launch)

| Issue | Root Cause | Fix Needed |
|---|---|---|
| **Shop products not visible** | Shopify Storefront token may be invalid or products not published to Storefront channel | Verify in Shopify Admin → Apps → Storefront API |
| **Admin panel not loading** | Requires `SUPABASE_SERVICE_KEY` in Vercel env vars — if missing, all admin fetches fail silently | Set `SUPABASE_SERVICE_KEY` in Vercel project settings |
| **Instagram feed empty** | `INSTAGRAM_ACCESS_TOKEN` not configured | Set long-lived token in env vars |
| **YouTube videos empty** | `YOUTUBE_API_KEY` not configured | Set in env vars |
| **Artist enrichment no-op** | Firecrawl + OpenAI stub returns `{ ok: true }` | Set `FIRECRAWL_API_KEY` + `OPENAI_API_KEY` |
| **Booking OTP emails not delivered** | No transactional email provider configured | Set `RESEND_API_KEY` |

### 🟡 Partially Working

| Feature | Status |
|---|---|
| **Curated events** | API + scoring works; crawler not scheduled — events only appear if manually seeded |
| **Event RSVP** | Form saves to DB; no confirmation email (needs Resend) |
| **Artist claiming** | Self-service flow works; no admin notification email on new claim |
| **Discography import** | Spotify endpoint exists at `/api/functions/v1/import-discography`; no portal UI trigger yet |
| **Social stats snapshots** | Schema + history endpoint built; no cron job yet to capture weekly snapshots |

### 🟢 Ready to wire (just needs env vars)
- YouTube video sync → `YOUTUBE_API_KEY`
- Instagram feed → `INSTAGRAM_ACCESS_TOKEN`
- Artist enrichment → `FIRECRAWL_API_KEY` + `OPENAI_API_KEY`
- Email delivery → `RESEND_API_KEY`

---

## Database Schema

21 tables in PostgreSQL (Supabase), managed via Drizzle ORM (`lib/db/src/schema/`).

### Core Tables
| Table | Purpose |
|---|---|
| `artists` | Profiles — bio, genres, city, social links, fee range, booking status, photo |
| `events` | CCD own events — title, date, venue, lineup, poster, status |
| `curated_events` | Events from external promoters |
| `promoters` | Promoter profiles — city, genres, trust status |
| `venue_profiles` | Capacity, genre focus, tier |
| `booking_requests` | Artist booking requests |
| `booking_otp_codes` | Anti-spam OTP codes for booking flow |
| `artist_submissions` | New artist submissions awaiting admin approval |
| `site_settings` | CMS — playlists, marquees, theme, blog posts |
| `site_videos` | YouTube video IDs + metadata |

### Rich Artist Data Layer
| Table | Purpose | Portal UI? |
|---|---|---|
| `artist_connections` | B2B/collab connections with strength 1–10 | Read-only (auto-generated) |
| `artist_dates` | Self-managed tour dates | ✅ Dates tab |
| `event_appearances` | Full gigography — artist × event records | Read-only (admin-seeded) |
| `artist_milestones` | Career milestones (first gig, debut, award…) | ✅ Journey tab |
| `artist_social_stats` | Follower snapshot history (IG/SC/Spotify) | Read-only (cron-seeded) |
| `artist_discography` | Releases, EPs, remixes | ✅ Releases tab |
| `artist_press` | Press clips + EPK pull quotes | ✅ Press tab |
| `event_artist_lineups` | Event lineup join table | Admin only |

---

## API Reference

All calls proxied through `/api/[...proxy].ts` → Supabase REST.

### Artists
| Method | Route | Description |
|---|---|---|
| GET | `/artists` | List approved artists. Supports `featured=true`, `limit=n` |
| GET | `/artists/:slug` | Single artist profile |
| GET | `/artists/:slug/basic` | Artist + appearances + upcoming dates (resilient fallback) |
| GET | `/artists/:slug/full` | Artist + connections + milestones + discography + press + socialStats + socialHistory + stats + facts |
| POST | `/artists/:id/claim` | Claim artist profile (Clerk auth) |
| PATCH | `/artists/:id` | Update artist profile (admin only via x-admin-password) |
| GET | `/artists/by-user` | Artist profile claimed by current Clerk user |

### Artist Portal (Supabase direct via shim)
| Table | Operations |
|---|---|
| `artist_dates` | Full CRUD via Supabase shim in portal |
| `artist_milestones` | Full CRUD via Supabase shim in portal |
| `artist_press` | Full CRUD via Supabase shim in portal |
| `artist_discography` | Full CRUD via Supabase shim in portal |
| `booking_requests` | Read via Supabase shim in portal |

### Events
| Method | Route | Description |
|---|---|---|
| GET | `/events` | CCD events (filter: slug, series, status, event_type) |
| GET | `/curated-events` | Curated/crawled events |
| POST | `/event-rsvp` | RSVP to event |
| GET | `/artist-connections` | Connection graph for an artist (by id or slug) |
| GET | `/event-appearances` | Gigography (filter: artist_id, artist_slug, city, year) |
| GET | `/artist-graph/:slug` | Depth-1 or depth-2 graph traversal |

### Forms & misc
| Method | Route | Description |
|---|---|---|
| POST | `/booking-inquiry` | Direct booking inquiry (no OTP, lower friction) |
| GET | `/booking-inquiries` | Inquiries for an artist slug (portal) |
| POST | `/contact` | Contact form → contact_messages |
| POST | `/early-access` | Email signup |
| GET | `/site-settings` | CMS data |
| GET | `/promoters` | Promoter directory |

---


---

## Next Steps

Ordered by priority. Top three are blockers; everything else is additive.

---

### 🔴 Priority 1 — Wire the Artist Photos

The biggest visual gap right now. The entire artist section looks dramatically better with real photos.

**What to do:**
1. Upload artist photos to `/public/artists/` in the repo (or a Supabase storage bucket)
2. For each artist, set `photo_url` in the `artists` table via the Admin panel → Artists tab
3. Photos will automatically appear in: directory cards, artist hero, EPK page, Similar Artists grid, ArtistSpotlight carousel

**Recommended format:** Square, minimum 800×800px, JPG. The component uses `object-cover` so any crop works.

**Quick path via admin:** `/admin` → Artists → click artist → paste URL into `photo_url` field → Save.

---

### 🔴 Priority 2 — Set Required Env Vars in Vercel

Nothing in the admin panel works without these. Set them in Vercel → Project Settings → Environment Variables:

| Var | Where to get it | Unlocks |
|---|---|---|
| `SUPABASE_SERVICE_KEY` | Supabase dashboard → Settings → API → service_role key | Entire admin panel, artist portal saves |
| `ADMIN_PASSWORD` | Your choice — any strong string | Admin panel access |
| `RESEND_API_KEY` | resend.com | Booking OTP emails, RSVP confirmations |
| `YOUTUBE_API_KEY` | Google Cloud Console | Videos page |
| `INSTAGRAM_ACCESS_TOKEN` | Meta for Developers | Homepage Instagram feed |
| `FIRECRAWL_API_KEY` | firecrawl.dev | Artist auto-enrichment pipeline |
| `OPENAI_API_KEY` | platform.openai.com | Artist bio enrichment, AI features |

---

### 🔴 Priority 3 — Seed Artist Data

The artist section is built for richness — gigography, milestones, connections, discography, press — but it all needs data. The fastest path:

**Option A — Manual via portal (for claimed artists)**
Artists log in at `/artist/dashboard`, claim their profile, and fill in everything themselves. The portal now has full CRUD for milestones, press, releases, and tour dates.

**Option B — Admin seeding (for unclaimed artists)**
Use the admin panel or direct Supabase table editor to bulk-insert:
- `event_appearances` rows → populates Gigs tab and Stats
- `artist_milestones` rows → populates Journey tab
- `artist_connections` rows → populates Connections graph
- `artist_discography` rows → populates EPK Discography section
- `artist_press` rows → populates EPK Press section

**Option C — Run the enrichment pipeline** (once API keys are set)
```
POST /api/functions/v1/enrich-artists
x-admin-password: YOUR_ADMIN_PASSWORD
```
Firecrawl + OpenAI will auto-populate bios, genres, and social links for artists with an Instagram or SoundCloud URL set.

---

### 🟠 Priority 4 — Artist Claiming & Onboarding Email

When an artist claims their profile, they currently get no email confirmation. Wire this:

1. Add a `RESEND_API_KEY` (see Priority 2)
2. In `/api/[...proxy].ts`, find the `artists/:id/claim` handler and add a Resend call after the successful `patch()`
3. Send: "You've claimed your CCD profile. Log in at catscandance.com/artist/dashboard to complete your setup."
4. Also notify the CCD admin email when a new claim comes in

---

### 🟠 Priority 5 — Social Stats Cron Job

The `artist_social_stats` table and growth chart are fully built. They just need data flowing in.

**What to build:** A weekly cron endpoint that:
1. Fetches all approved artists with `instagram` or `soundcloud` set
2. Hits the Instagram Basic Display API / SoundCloud API for follower counts
3. Inserts a row into `artist_social_stats` for each artist

**Quick wins even without the API:**
- Manually insert snapshots via Supabase table editor for key artists
- The chart renders correctly with as few as 2 data points

---

### 🟠 Priority 6 — Spotify Discography Auto-Import

The import endpoint already exists:
```
POST /api/functions/v1/import-discography
x-admin-password: YOUR_ADMIN_PASSWORD
Body: { "artist_slug": "kohra", "spotify_url": "https://open.spotify.com/artist/..." }
```

**What's missing:** A button in the Artist Portal that lets claimed artists trigger this for themselves. Add a "Import from Spotify" button in the Releases tab that calls this endpoint with the artist's stored `spotify` URL.

---

### 🟡 Priority 7 — Connection Graph Data

The interactive force-directed graph is built and renders beautifully — but it needs data to show connections.

**How connections are generated:**
- **Auto:** `POST /api/functions/v1/generate-connections?slug=kohra` — reads `event_appearances` and auto-links artists who played the same event
- **Manual:** Insert rows directly into `artist_connections` with `artist_a_slug`, `artist_b_slug`, `connection_type` (b2b/collab/label/crew), `strength` (1–10), `shared_events` array

Best approach: seed `event_appearances` first (from event lineups), then run `generate-connections` — it does the graph-building automatically.

---

### 🟡 Priority 8 — Promoter Accounts & Verified Badges

Promoters can currently submit events and appear in the directory. To complete the loop:

- [ ] Promoter login (Clerk — same as artist portal pattern)
- [ ] Promoter dashboard: edit their profile, manage submitted events, see RSVP counts
- [ ] `✓ Verified Promoter` badge on artist cards when the event was submitted by a verified promoter
- [ ] Promoter can browse artists and send booking inquiries directly from the platform

---

### 🟡 Priority 9 — Events Infrastructure: Crawler + RSVP Emails

- [ ] Schedule the `curate-events` function to run daily (Vercel Cron: `vercel.json` → `crons`)
- [ ] Add promoter `crawl_urls` to the promoters table via admin panel
- [ ] Wire `RESEND_API_KEY` → send RSVP confirmation email ("You're on the list for Episode 12")
- [ ] Send event reminder 24h before for all RSVPs

---

### 🟢 Priority 10 — First-Party Ticketing (Future)

> Promoters sell tickets through CCD. CCD takes a small commission.

- [ ] Stripe integration — payment processing
- [ ] Ticket tiers per event (Early Bird / General / VIP)
- [ ] QR code PDF ticket emailed via Resend
- [ ] Door list management page for promoters
- [ ] `/checkin/:slug` page for door staff with QR scanner
- [ ] Promoter sales dashboard (real-time capacity %, revenue)

---

### 🟢 Priority 11 — Community & User Profiles (Future)

- [ ] User profile page at `/profile` — saved events, followed artists, cities
- [ ] "Follow" an artist — persists to `user_taste_profiles.liked_artist_slugs`
- [ ] Activity feed — "3 artists you follow have upcoming events this week"
- [ ] Weekly email digest — personalised "what's on" per user's cities
- [ ] "I was at this gig" check-ins on event appearances
- [ ] PWA — install prompt, push notifications for followed artists

---

### 🟢 Priority 12 — Monetisation (Future)

- [ ] Artist verified badge — annual subscription, unlocks analytics dashboard
- [ ] Featured event listings — promoters pay to surface in "Editor's Picks"
- [ ] Shop v2 — complete Shopify integration, pre-registration for drops
- [ ] CCD × Social service pages fully built out (media agency arm)

---


## Design System

CCD uses a custom brutalist design system. All classes are in Tailwind.

### Palette
| Token | Value | Usage |
|---|---|---|
| `cream` | `#F5F0E8` | Primary background |
| `ink` | `#1A1A1A` | Text, borders |
| `magenta` | `#E040FB` | Accent, CTAs, bookings |
| `acid-yellow` | `#F5E642` | Accent, badges, hover states |
| `electric-blue` | `#00BFFF` | Bengaluru, ambient genre |
| `orange` | `#FF6600` | Hyderabad, warnings |
| `lime` | `#AAFF00` | Goa, jungle/DnB, available slots |
| `hot-pink` | `#FF69B4` | Occasional accent |

### Typography
- **Display font:** `font-display` — Bowlby One SC (all-caps, chunky)
- **Body font:** System sans-serif stack

### Signature Utilities
```css
/* Hard offset box shadow */
.chunk-shadow { box-shadow: 4px 4px 0 #1a1a1a; }

/* Hover micro-interaction — shadow "presses in" */
hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none

/* Standard border treatment */
border-4 border-ink
```

### Component Patterns
- All interactive elements: `border-4 border-ink` + `chunk-shadow` + hover press-in
- Cards: cream background, 4px ink border, chunk shadow
- Buttons: solid background, uppercase font-display, 4px border, chunk shadow
- Genre/category tags: `bg-acid-yellow text-ink` or `bg-ink text-cream`
- Section labels: `font-display text-xs uppercase text-ink/50 tracking-[0.3em]` with `/ PREFIX`

---

## Known Issues Log

| Date | Issue | Status |
|---|---|---|
| 2026-05 | `boolean` not imported in `schema_artist_milestones.ts` — DB migration crash | ✅ Fixed PR #12 |
| 2026-05 | `/api/artists?featured=true` param ignored — ArtistSpotlight showed wrong artists | ✅ Fixed PR #12 |
| 2026-05 | ArtistPortal used `compat-router` shim instead of native `next/router` | ✅ Fixed PR #12 |
| 2026-05 | `artist_discography` and `artist_press` fetched in API but never rendered | ✅ Fixed PR #12 |
| 2026-05 | Artist Portal ProfileEditor missing `photo_url`, `genres`, `fee` fields | ✅ Fixed PR #12 |
| 2026-05 | ForArtists page had no link to Artist Portal | ✅ Fixed PR #12 |
| 2026-05 | `SimilarArtists` fetched all artists to filter 6 — no `limit` param respected | ✅ Fixed PR #12 |
| 2026-05 | Genre tags on artist cards were `<span>` — not clickable to filter | ✅ Fixed PR #12 |
| 2026-05 | No Bandcamp embed despite field existing in schema | ✅ Fixed PR #12 |
| 2026-05 | No standalone shareable EPK page for artists | ✅ Fixed PR #12 (new `/artists/[slug]/epk`) |
| 2026-05 | Connection graph was static CSS cards — not interactive | ✅ Fixed PR #12 (SVG physics graph) |
| 2026-05 | Social stats had no growth chart — only a snapshot | ✅ Fixed PR #12 (time-series line chart) |
| 2026-05 | No milestone/press/discography management in Artist Portal | ✅ Fixed PR #12 (3 new CRUD tabs) |
| 2026-05 | Shop products not visible — Shopify token needs verification | 🔴 Open |
| 2026-05 | Admin panel not loading — `SUPABASE_SERVICE_KEY` not set in Vercel | 🔴 Open |
| 2026-05 | Instagram feed returns `[]` — no access token | 🟡 Needs env var |
| 2026-05 | YouTube videos empty — no API key | 🟡 Needs env var |
| 2026-05 | Booking OTP emails not delivered — no Resend key | 🟡 Needs env var |
| 2026-05 | Artist claiming has no notification email | 🟡 Needs Resend + implementation |
| 2026-05 | Social stats growth chart has no data — cron job not built | 🟡 Needs cron job |

---

## Pull Request History

| PR | Branch | Summary |
|---|---|---|
| [#12](https://github.com/paramminhas5/CCD-Final-Next.Js/pull/12) | `feat/artist-section-overhaul` | Complete artist section overhaul — 20 tasks, 13 files, 1937 lines. Phases 1–4: bug fixes, gap filling, portal upgrade, discovery upgrade |

---

*Built with ❤️ by Cats Can Dance — Bengaluru's underground crew.*
*Platform built by Kiro AI in collaboration with the CCD team.*
