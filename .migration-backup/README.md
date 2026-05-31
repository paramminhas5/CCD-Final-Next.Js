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
10. [Next Steps & Roadmap](#next-steps--roadmap)
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
| Language | TypeScript 5.x |
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
| Cron | Vercel cron (nightly scraper + weekly digest + hold expiry) |
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
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...   # ★
CLERK_SECRET_KEY=sk_live_...                    # ★
CLERK_PROXY_URL=                                # Optional

# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://nrzgyippztzenoyrtszr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...                        # Used by catbot proxy
SUPABASE_SERVICE_KEY=eyJ...                     # ★ Server-only

# ── Admin ─────────────────────────────────────────────────────────────────────
ADMIN_PASSWORD=choose_a_strong_password         # ★

# ── Cron / Scraper ────────────────────────────────────────────────────────────
CRON_SECRET=...                                 # ★ openssl rand -base64 32
ANTHROPIC_API_KEY=sk-ant-...                    # Recommended (Haiku scoring)

# ── Email ─────────────────────────────────────────────────────────────────────
RESEND_API_KEY=re_...                           # ★ Recommended
EMAIL_FROM=hello@catscandance.com
NEXT_PUBLIC_SITE_URL=https://catscandance.com

# ── Shopify ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SHOPIFY_API_VERSION=2025-10
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ccd-final-bv8ld.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=...        # ★ (no hardcoded fallback)

# ── AI features ───────────────────────────────────────────────────────────────
CATBOT_EDGE_URL=                                # Optional: custom edge function URL
FAL_KEY=                                        # Optional: AI poster generation

# ── Optional integrations ─────────────────────────────────────────────────────
BEHOLD_FEED_URL=https://feeds.behold.so/...    # Instagram feed (Behold.so)
YOUTUBE_API_KEY=AIza...
```

> Set all vars in **Vercel → Project → Settings → Environment Variables**. Never commit `.env.local`.

---

## Features Built

### ✅ Audit Phases Completed (May 2026)

All items below were implemented and verified building clean (`pnpm run build` → 78 pages, 0 TypeScript errors).

**Phase 1 — Security & Critical Fixes**
- Removed hardcoded admin password from frontend code; replaced with ownership-verified `/api/artists/:id/self-update`
- Fixed Catbot: empty Bearer token removed, server-side proxy via `SUPABASE_ANON_KEY`
- Hero CTAs now scroll to correct targets (`#early-access`, `#drops`)
- `useSearchParams` shim is reactive via `router.query`
- `About` component has fallback copy when CMS is down
- Duplicate font `@import` removed (was loading twice)

**Phase 2 — UX & Navigation**
- `EarlyAccess` email capture moved to position 3 on homepage
- Identity strip added below hero
- Nav reduced to 6 primary items; Talent/partners → "Work With Us" dropdown
- Events ↔ Discover cross-links
- DiscoButton in mobile hamburger
- Shop `ProductCard` shows ₹ price prominently in grid

**Phase 3 — Performance**
- Hero images → `next/image priority` (LCP improvement)
- NavLink hydration mismatch fixed
- Duplicate Tailwind glob removed; `vite-env.d.ts` deleted
- `next.config.mjs` image domains locked to known CDN hosts

**Phase 4 — Features**
- `/ccdxsocial` → public series landing page; internal proposal at `/ccdxsocial/proposal`
- Instagram feed proxied server-side (avoids CORS/ad-blockers)
- RSVP toasts say "Check your inbox for confirmation"
- Scene city pages render YouTube playlists when set

**Batch A — Data & Route Fixes**
- `/api/user-role` added to proxy (role-based portals now work)
- `/api/booking-inquiry` added (artist BOOK tab saves requests)
- `expire-holds` cron registered in `vercel.json` (hourly)
- Cross-browser safe date parser (`src/lib/parse-date.ts`)
- Events page countdown is dynamic from DB, not hardcoded
- Homepage Events shows static fallback when Supabase is empty
- Admin UI password hint removed
- Shopify hardcoded token removed
- Artist search in Discover: 5 → 100 results
- `.next/` added to `.gitignore`

**AAA Improvements (June 2026)**
- **SSR/Static generation** for `/events/[slug]` and `/artists/[slug]` — full `getStaticProps` + `getStaticPaths` + ISR (60s revalidation). Artist and event pages are now crawlable by Google, generate correct OG/Twitter preview cards, and load with content on first paint.
- **Social proof counters** — RSVP count on event detail ("X people RSVP'd"), follower count on artist profile, list size on EarlyAccess form, platform stats on homepage.
- **Hero urgency strip** — live countdown to next event visible above the fold on homepage inside the hero section.
- **RSVP dialog enhancements** — WhatsApp opt-in field, "Add to Google Calendar" one-click link after successful RSVP.
- **Mobile nav overhaul** — compressed to 5+1 items, grouped sections, account as avatar dropdown.
- **Artist inline audio** — SoundCloud iframe renders directly in the HOME tab, no external redirect needed.
- **Product page: size guide** — modal with S/M/L/XL measurements; inventory urgency ("Only X left") from Shopify `availableForSale`.
- **Blog reading time** — estimated reading time displayed on posts and blog index cards.
- **Footer newsletter** — email capture in footer; same early-access endpoint.
- **Global search in nav** — search icon in desktop nav opens UniversalSearch overlay.
- **Accessibility** — `aria-expanded` on all nav dropdowns, `aria-label` improvements, focus management in modals.

---

### 🏠 Homepage
- Full-viewport hero with parallax DJ cat + animated flanking cats
- Live urgency strip: countdown to next event with RSVP CTA
- CityMarquee rolling ticker, SceneSnapshot city tiles with live event counts
- ArtistSpotlight carousel, GenreWheel, Videos, Playlist, Shop drops
- Instagram feed (Behold.so, server-proxied), Early Access signup with social proof
- Disco Mode easter egg 🪩

### 🗺️ Discover (`/discover`)
- **Hero** ("WHAT'S ON TONIGHT") + full `<CuratedEvents>` grid
- Universal search (artists + cities + genres + scenes), 100-result live lookup
- "What's On This Weekend" live city strip with working scroll button
- Cities, Genres, Global Scenes explorer; cross-link to CCD Events

### 🎟️ Events (`/events`, `/events/[slug]`)
- Own events: featured card, series strip, upcoming list, past episodes
- Dynamic countdown to next show from DB
- Event detail: fully SSR'd via `getStaticProps` + ISR — crawlable, preview-card ready
- Static fallback for all CcdxSocial events when DB empty

### 🎤 Artists (`/artists`, `/artists/[slug]`)
- Directory: search, city/genre filters, mosaic grid
- Detail: fully SSR'd via `getStaticProps` + ISR
- 7-tab layout: Home · Gigs · Connections · Journey · Stats · EPK · Book
- Inline SoundCloud audio player in Home tab
- 6-month availability calendar, direct booking form
- Social proof: follower count displayed when available

### 🛍️ Shop (`/shop`, `/product/:handle`)
- Shopify Storefront API headless; full cart via Zustand
- Product page: size guide modal, inventory urgency badge ("Only X left")
- WhatsApp/X/copy share links

### ✍️ Blog (`/blog`, `/blog/:slug`)
- 14 SEO-optimised articles; reading time on all cards and post headers
- Author profiles, related posts, category-specific FAQ schema
- Footer newsletter capture

### 🎓 Admin Panel (`/admin-cms`)
- 14-tab password-gated CMS covering all site content

### 👤 User Dashboard (`/dashboard`)
- Fan: XP/tier, "Your Events" panel, XP history, role application
- Artist: profile editing (ownership-verified), EPK, booking inbox
- Promoter: event management, submit form

### 🤖 Personalised Recommendations (`/api/events/recommended`)
- Genre/artist/city affinity scoring
- Four tabs: For You · Trending · Editor's Picks · This Weekend

### 🔄 Cron Jobs (Vercel)
| Cron | Schedule | Purpose |
|---|---|---|
| `/api/cron/scrape-events` | Nightly 2am IST | Scrape Skillbox/District/Insider/HighApe + Haiku scoring |
| `/api/cron/weekly-digest` | Monday 6:30am IST | Personalised event email to users |
| `/api/cron/expire-holds` | Hourly | Expire 48h artist booking holds |

---

## Curated Events Module

```
  ┌─────────────────────────────────────────────────────────┐
  │               curated_events (Supabase)                 │
  │  source · city · genre · submission_status · score      │
  └─────────────────────────────────────────────────────────┘
        ▲              ▲              ▲              ▲
  Vercel cron    Admin CRUD      Promoter submit  JSON import
  Skillbox       /admin-cms      /submit-event/   Admin panel
  District       add/edit/del    event (Clerk)    District paste
  Insider        🎛 LINEUP       trusted→publish
  HighApe        modal           untrusted→queue
  + Haiku ≥6

              ▼
  /api/events/recommended
  reads: user_taste_profiles + user_event_interactions + event_artist_lineups

  Surfaces: /discover  /events  /dashboard  weekly email
```

### Source badges
| Key | Origin | Badge |
|---|---|---|
| `skillboxes` | Skillbox.in | Lime |
| `district` | District.in | Magenta |
| `insider` | Insider.in | Electric blue |
| `highape` | HighApe | Orange |
| `editorial` | Admin pick | Acid yellow |
| `manual` | Admin entry | Ink/cream |
| `promoter:<slug>` | Verified promoter | Hot pink |

---

## Database Schema

24 tables in PostgreSQL (Supabase).

| Table | Purpose |
|---|---|
| `events` | CCD own events |
| `curated_events` | Scraped/submitted events |
| `promoters` | Promoter profiles |
| `artists` | Artist profiles |
| `artist_connections` | B2B/collab connections |
| `artist_dates` | Self-managed tour dates |
| `event_appearances` | Full gigography |
| `artist_milestones` | Career milestones |
| `artist_social_stats` | Follower snapshots |
| `artist_discography` | Releases |
| `artist_press` | Press mentions |
| `artist_packages` | Bookable packages |
| `artist_availability_blocks` | Availability calendar blocks |
| `user_event_interactions` | view/save/rsvp/share per user |
| `user_taste_profiles` | liked genres/artists/cities |
| `user_roles` | Fan/artist/promoter/venue/admin |
| `role_applications` | Applications pending review |
| `fan_profiles` | XP, tier, CCD points |
| `xp_events` | XP earn history |
| `booking_requests` | Artist booking requests |
| `booking_messages` | Booking thread messages |
| `booking_shortlist` | Promoter artist shortlist |
| `site_settings` | CMS data (playlists, theme, etc.) |
| `site_videos` | YouTube video IDs |

---

## API Reference

All routes via `pages/api/[...proxy].ts` → Supabase REST.

### Public
| Method | Route | Notes |
|---|---|---|
| GET | `/artists` | List (filter: genre, city, featured, limit) |
| GET | `/artists/:slug` | Profile |
| GET | `/artists/:slug/full` | Enriched profile (gigs, connections, stats) |
| GET | `/artists/:slug/basic` | Basic fallback |
| GET | `/artist-calendar?slug=` | Merged availability calendar |
| GET | `/events` | CCD events list |
| GET | `/events/:slug` | Single event |
| GET | `/curated-events` | Published curated events |
| GET | `/events/recommended` | Personalised recs (tab, city, genre, limit) |
| GET | `/instagram-feed` | Behold.so feed proxy |
| GET | `/user-role?user_id=` | User role info |

### Authenticated
| Method | Route | Notes |
|---|---|---|
| POST | `/event-rsvp` | RSVP + Resend confirmation email |
| POST | `/early-access` | Email list signup |
| POST | `/contact` | Contact form |
| POST | `/user/follow` | Follow/unfollow artist |
| POST | `/artists/:id/self-update` | Artist edits own profile (ownership-verified) |
| POST | `/booking-inquiry` | Artist booking request |
| POST | `/booking-inquiry-v2` | Structured booking request |

### Admin (`x-admin-password` header)
| Method | Route | Notes |
|---|---|---|
| GET/POST | `/functions/v1/admin-curated-events` | Full CRUD |
| GET/POST | `/functions/v1/admin-artists` | Artist CRUD |
| GET/POST | `/functions/v1/admin-videos` | Video CRUD |
| GET/POST | `/functions/v1/admin-content` | Settings CRUD |
| GET | `/functions/v1/admin-signups` | Signups export |
| GET/POST | `/user-role` | Role management |

---

## Next Steps & Roadmap

### 🔴 Required in Vercel before first event

```
SUPABASE_SERVICE_KEY  = <service role JWT>
ADMIN_PASSWORD        = <strong password, 20+ chars>
CRON_SECRET           = <openssl rand -base64 32>
ANTHROPIC_API_KEY     = <Claude API key — enables smart event scoring>
RESEND_API_KEY        = <Resend — enables RSVP emails + weekly digest>
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN = <Shopify token>
```

### 🟡 This week — high leverage, low effort

**A — Seed event lineups (~1 hour)**
Go to `/admin-cms` → Curated Events → click `🎛 LINEUP` per event → add artists by slug.
This activates "Artists You Love" in Discover + dashboard recommendations.

**B — Link first trusted promoter to Clerk user (~5 min)**
```sql
UPDATE promoters
SET claimed_by = 'user_<clerk_id>', trusted = true
WHERE slug = 'your-promoter-slug';
```

**C — Behold.so Instagram feed**
Sign up at behold.so, connect Instagram, copy the feed URL.
Set `BEHOLD_FEED_URL=https://feeds.behold.so/<your-key>` in Vercel.

**D — Verify Shopify storefront channel**
Shopify Admin → Apps → Storefront API → confirm token + products published to Storefront channel.

### 🟢 Next sprint — new features

**E — CCD Points Redemption** *(highest business impact, ~2 days)*
Close the loyalty loop: users accumulate points with every RSVP/share/follow, but have no way to spend them.
- Shopify Discount Codes API: generate a `CCD10` (10% off) code when user reaches 100 points
- Surface in `/dashboard` → "Redeem your X CCD Points"
- Track redemptions in a new `point_redemptions` table
- Users with points currently see "redemption launching soon" — this is a broken promise

**F — Promoter Analytics Panel** *(~1 day)*
Add a Stats panel to PromoterPortal showing per-event: views, saves, RSVPs.
Source: `user_event_interactions` grouped by `event_id`.
No new DB table needed.

**G — 24h Pre-Event WhatsApp Reminder**
Users who opt-in at RSVP get a WhatsApp message the day before.
RSVP dialog already has the phone number field — wire it to a 24h cron.

**H — Attended / Check-In Flow**
Post-event pages are currently dead. Add:
- "Were you there?" CTA on past event pages
- One-click attendance mark → +25 XP + social proof counter increment
- Source: `user_event_interactions` action = `attended`

**I — Per-Event SEO Pages for Curated Events** *(~half day)*
Currently curated events always link offsite. Add `/events/curated/:id` — shareable page with JSON-LD `MusicEvent`.
Massive SEO surface area for electronic music queries.

### 🔵 Medium-term roadmap

**First-Party Ticketing v2**
- Stripe payment intent integration (replace Razorpay placeholder)
- QR code PDF tickets via Resend + `qrcode` library
- `/checkin/:eventSlug` door-staff scanner page
- Promoter real-time sales dashboard

**Blog CMS Migration**
- Current posts live in `src/content/posts.ts` (TypeScript file = code deploy per post)
- Migrate to Supabase `blog_posts` table with rich JSON body
- Admin `/admin-cms` Blog tab already has publish/generate endpoints ready
- Unblocks editorial velocity without architecture changes

**Community Layer**
- Activity feed: "3 artists you follow have upcoming events"
- PWA push notifications for followed artist events
- Post-event crowd-sourced track IDs ("heard at [event]")
- Photo gallery (moderated upload)

**SEO Expansion**
- More city pages: Kolkata, Ahmedabad, Jaipur, Kochi
- More genre pages: Afrobeats, Baile Funk, Footwork
- Programmatic pages: one page per artist × city combination

---

## Design System

### Palette
| Token | Value | Usage |
|---|---|---|
| `cream` | `#F5F0E8` | Primary background |
| `ink` | `#1A1A1A` | Text, borders |
| `magenta` | `hsl(0 72% 51%)` | Primary CTAs |
| `acid-yellow` | `hsl(84 81% 56%)` | Secondary accent |
| `electric-blue` | `hsl(221 83% 53%)` | Bengaluru |
| `orange` | `hsl(21 90% 53%)` | Hyderabad |
| `lime` | `hsl(142 76% 73%)` | Goa |

### Typography
- **Display:** `font-display` → Bowlby One (all-caps, chunky)
- **Body:** Space Grotesk

### Signature utilities
```css
.chunk-shadow     { box-shadow: 8px 8px 0 hsl(var(--ink)); }
.chunk-shadow-lg  { box-shadow: 14px 14px 0 hsl(var(--ink)); }
/* Hover pattern: hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none */
/* All interactive elements: border-4 border-ink */
```

---

## Known Issues Log

| Date | Issue | Status |
|---|---|---|
| 2026-06 | CCD Points redemption not yet live | 🟡 Planned (next sprint) |
| 2026-06 | Blog posts in TypeScript file — deploy required per post | 🟡 Planned (CMS migration) |
| 2026-06 | Ticketing Express server not in repo | 🟡 Planned (Ticketing v2) |
| 2026-05 | Shop offline — Shopify token needs Vercel env var | 🟡 Needs env var |
| 2026-05 | Admin panel empty — `SUPABASE_SERVICE_KEY` needed | 🟡 Needs env var |
| 2026-05 | Instagram feed — needs `BEHOLD_FEED_URL` | 🟡 Needs env var |
| 2026-05 | RSVP emails — needs `RESEND_API_KEY` | 🟡 Needs env var |
| 2026-05 | Hardcoded admin password in proxy + AdminPanel | ✅ Fixed |
| 2026-05 | Hardcoded Shopify storefront token in source | ✅ Fixed |
| 2026-05 | Artist BOOK tab — `/api/booking-inquiry` 404 | ✅ Fixed |
| 2026-05 | Role portals broken — `/api/user-role` missing | ✅ Fixed |
| 2026-05 | `expire-holds` cron not in `vercel.json` | ✅ Fixed |
| 2026-05 | Bengaluru scene page showed "Mumbai" | ✅ Fixed |
| 2026-05 | Build error: `patch` variable shadowed outer function | ✅ Fixed |
| 2026-05 | `@types/react` 18.3.28 broke `NextComponentType` JSX | ✅ Fixed |
| 2026-05 | Hero CTAs scrolled to wrong targets | ✅ Fixed |
| 2026-05 | `useSearchParams` shim not reactive | ✅ Fixed |
| 2026-05 | Double font loading (CSS @import + `_document`) | ✅ Fixed |
| 2026-05 | `SectionReveal` wrapped every section — SEO opacity-0 | ✅ Fixed |
| 2026-05 | Artist search fetched only 5 results | ✅ Fixed |
| 2026-05 | `submit-event/event.tsx` SSR'd Clerk hooks — build crash | ✅ Fixed |

---

*Built with ❤️ by Cats Can Dance — Bengaluru's underground crew.*
*Platform engineered by Kiro AI in collaboration with the CCD team.*
