# 🐱 Cats Can Dance — Platform

> **India's definitive underground electronic music platform.**
> Events · Artists · Scenes · Ticketing · Culture · Shop

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io)

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Monorepo Structure](#monorepo-structure)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Environment Variables — Layered Setup](#environment-variables--layered-setup)
6. [Ticketing Module](#ticketing-module)
7. [Features Built](#features-built)
8. [Known Issues](#known-issues)
9. [Database Schema](#database-schema)
10. [API Reference](#api-reference)
11. [Design System](#design-system)
12. [Roadmap](#roadmap)

---

## What Is This?

Cats Can Dance (CCD) is a Bengaluru-based underground dance music brand — events, streetwear, culture. This repo is the full-stack platform powering `catscandance.com`.

**Three audiences:**
- 🎧 **Fans** — discover the Indian underground scene, find events, buy tickets, view your QR passes
- 🎛️ **Artists** — self-service profile management, tour dates, booking requests
- 🎪 **Promoters** — submit events, manage RSVPs, sell tickets, scan QR codes at the door

**Vision:** The Resident Advisor of India — built by the people who live it.

---

## Monorepo Structure

```
/
├── artifacts/
│   ├── cats-can-dance/        ← Next.js 14 frontend (Pages Router)
│   └── api-server/            ← Express 5 REST API
├── lib/
│   ├── db/                    ← Drizzle ORM schema + Postgres client
│   ├── api-spec/              ← OpenAPI 3.1 YAML + Orval codegen config
│   ├── api-client-react/      ← Auto-generated TanStack Query hooks
│   └── api-zod/               ← Auto-generated Zod schemas
├── scripts/                   ← SQL migrations, seed scripts
└── pnpm-workspace.yaml
```

---

## Tech Stack

### Frontend (`artifacts/cats-can-dance`)
| Layer | Tech |
|---|---|
| Framework | **Next.js 14** (Pages Router) |
| Language | TypeScript 5.x strict |
| Auth | **Clerk** (optional — everything works without it) |
| State | **Zustand** + **TanStack Query v5** |
| UI | **shadcn/ui** (Radix) + Tailwind CSS v3 |
| Animation | **Framer Motion v12** |
| Charts | **Recharts** |
| Forms | **react-hook-form** + Zod |
| Shop | **Shopify Storefront API** |

### Backend (`artifacts/api-server`)
| Layer | Tech |
|---|---|
| Runtime | **Express 5** + Node.js |
| Database | **PostgreSQL** via Supabase |
| ORM | **Drizzle ORM** |
| Validation | **Zod v4** + drizzle-zod |
| Auth middleware | **Clerk Express** (optional) |
| Logging | **Pino** |

---

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm 10+ (`npm install -g pnpm`)
- A Supabase project (get one free at supabase.com)

> **Clerk, Razorpay, and Resend are completely optional.** The platform runs fully without them — see the [layered env var setup](#environment-variables--layered-setup) below.

### Install
```bash
git clone https://github.com/paramminhas5/CCD-Final-Next.Js.git
cd CCD-Final-Next.Js
pnpm install
```

### Database setup
```bash
# Push schema to Supabase (run once, or after schema changes)
pnpm --filter @workspace/db push
```

### Run locally
```bash
# Terminal 1 — API server (port 3001)
pnpm --filter @workspace/api-server dev

# Terminal 2 — Frontend (port 3000)
pnpm --filter @workspace/cats-can-dance dev
```

### Build
```bash
pnpm --filter @workspace/cats-can-dance build
```

---

## Environment Variables — Layered Setup

**Nothing is required to start.** Add each layer when you're ready.

```
Layer 0 — Zero config      Site loads, events show, legacy RSVP works
Layer 1 — DATABASE_URL     Full DB, RSVPs saved, ticketing active
Layer 2 — RESEND_API_KEY   Confirmation emails sent (otherwise logged to console)
Layer 3 — RAZORPAY keys    Paid ticket purchases enabled
Layer 4 — CLERK keys       User accounts, signed-in My Tickets view
Layer 5 — ADMIN_PASSWORD   Admin panel (defaults to "84838281" if unset)
```

### Frontend (`artifacts/cats-can-dance/.env.local`)

```bash
# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...         # server-side only, used by /api proxy

# ── Admin panel ───────────────────────────────────────────────────────────────
# Defaults to "84838281" if unset — change this in production
ADMIN_PASSWORD=your_secure_password

# ── API server URL ────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# ── Razorpay (Layer 3 — enables paid tickets) ─────────────────────────────────
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...

# ── Clerk (Layer 4 — enables user accounts) ───────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# ── Shopify (optional — enables merch store) ──────────────────────────────────
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ccd-final-bv8ld.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your_storefront_token
NEXT_PUBLIC_SHOPIFY_API_VERSION=2025-10
```

### API Server (`artifacts/api-server/.env`)

```bash
# ── Database (Layer 1) ────────────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# ── Admin ─────────────────────────────────────────────────────────────────────
ADMIN_PASSWORD=your_secure_password   # must match frontend

# ── Email (Layer 2) ───────────────────────────────────────────────────────────
# Without this: ticket confirmations are logged to console, links shown in UI
RESEND_API_KEY=re_...
EMAIL_FROM=tickets@catscandance.com

# ── Razorpay (Layer 3) ────────────────────────────────────────────────────────
# Get from: dashboard.razorpay.com → Settings → API Keys
# Test keys (rzp_test_...) for dev, live keys (rzp_live_...) for production
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...          # set in Razorpay Dashboard → Webhooks

# ── Clerk (Layer 4) ───────────────────────────────────────────────────────────
# Without these: Clerk auth is disabled; token-based promoter login still works
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# ── Site URL (for ticket link generation) ─────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://catscandance.com

# ── Optional integrations ─────────────────────────────────────────────────────
YOUTUBE_API_KEY=AIza...
INSTAGRAM_ACCESS_TOKEN=IGQ...
FIRECRAWL_API_KEY=fc-...
OPENAI_API_KEY=sk-...
```

> ⚠️ **Never commit `.env` or `.env.local` files.** Set all secrets in Vercel / Railway env dashboards.

---

## Ticketing Module

The full ticketing system is built and production-ready. It works across three modes and requires **zero mandatory configuration** — just a running database.

### How it works — zero to paid

```
Fan visits /events/your-event
  ↓
If ticketing is enabled for the event:
  TicketTierPicker shows available tiers + prices
  ↓
  MODE A — Direct Sale:    Fan picks tier → enters name+email → pays via Razorpay → QR ticket
  MODE B — RSVP → Invite:  Fan RSVPs free → Promoter approves in dashboard → payment link emailed
  MODE C — Free RSVP:      Fan RSVPs → immediately gets QR ticket (no payment ever)
  ↓
QR ticket sent by email (or shown inline if RESEND_API_KEY not set)
  ↓
Fan views ticket at /my-tickets (email lookup, no account needed)
  ↓
Door staff scans QR at /promoter/events/[slug] → Check-in tab
```

### Commission model
CCD takes **5% from the buyer** (added on top) + **5% from the promoter** (deducted from payout). Both sides toggled per-event. Free events have no commission.

### Auth — three tiers, all optional

| Who | How to access | What's needed |
|---|---|---|
| **Fans** | RSVP, buy, view ticket | Nothing — just name + email |
| **Promoters** | Paste token at `/promoter` | Token from Admin panel (generated on approval) |
| **Promoters (alt)** | Sign in with Clerk | `CLERK_*` env vars set |
| **Door staff** | Use admin password | `ADMIN_PASSWORD` env var |
| **Admin** | `/admin` with password | `ADMIN_PASSWORD` env var |

### Promoter onboarding (no Clerk required)

1. Promoter fills in `/promoter/apply`
2. Admin opens `/admin` → **🎟 Ticketing** → **Applications** tab
3. Admin clicks **✓ APPROVE** — a UUID token is generated and displayed
4. Admin copies the token and sends it to the promoter (email / WhatsApp)
5. Promoter visits `/promoter`, pastes the token → instantly in their dashboard
6. Promoter creates event ticketing config → adds tiers → shares event link

To regenerate a lost token: Admin → Ticketing → Applications → **🔑 GET LOGIN TOKEN**.

### Fan ticket flow (no account required)

1. Fan buys/RSVPs → tickets sent to their email
2. Fan visits `/my-tickets` → enters their email → sees all their tickets
3. Each ticket shows a QR code — tap **FULL SCREEN QR** at the door
4. To transfer: click **TRANSFER →** → enter recipient email → they get a claim link

### Razorpay webhook setup

In your Razorpay Dashboard → Webhooks → Add New Webhook:
- URL: `https://catscandance.com/api/ticketing/webhooks/razorpay`
- Events: `payment.captured`, `refund.processed`
- Copy the webhook secret → set as `RAZORPAY_WEBHOOK_SECRET`

---

## Features Built

### 🏠 Homepage
Full-viewport hero, city marquee, scene snapshot, genre wheel, artist spotlight carousel, events strip, videos, playlists, shop drops, Instagram feed, early access signup, Disco Mode easter egg 🪩

### 🗺️ Discover Page (`/discover`)
Universal search, "What's On This Weekend" strip, city + genre tiles, global scene tiles

### 🏙️ City Scene Pages (`/scene/:city`)
Bengaluru, Mumbai, Delhi, Goa, Hyderabad, Pune — live artists, events, promoters, key venues

### 🎛️ Genre Pages (`/genres/:genre`)
Techno, House, Jungle/D&B, UK Garage, Disco, Ambient — origin story, Indian scene, starter tracks

### 🌍 Global Scene Pages (`/scenes/:scene`)
Detroit Techno, Chicago House, London Jungle, Berlin Techno, UK Garage, NYC House, Goa Trance

### 🎤 Artists Directory + Detail Pages
Grid with filters · 6-tab artist pages (Overview, Gigs, Connections, Journey, Stats, EPK)

### 🎟️ Events + Ticketing
- CCD own events + curated events from promoters
- `TicketTierPicker` on event detail pages
- Direct sale + RSVP-invite + free RSVP modes
- QR tickets, `/my-tickets` email lookup, fullscreen QR at `/my-tickets/[token]`
- Face-value ticket transfers (max 3 hops)
- Promoter portal: event config, tier management, RSVP approval, sales dashboard, door check-in
- Admin panel: Ticketing tab with applications, orders, revenue

### 🛍️ Shop (`/shop`)
Shopify Storefront API, cart via Zustand, product detail pages

### ✍️ Blog (`/blog`)
11 SEO-optimised articles, author profiles

### 🎓 Admin Panel (`/admin`)
Password-gated CMS (15 tabs): signups, events, RSVPs, blog, playlists, videos, promoters, artists, ticketing, SEO, marquees, theme

### 🎛️ Artist Portal (`/artist/dashboard`)
Self-service profile editing, tour dates, booking requests inbox

---

## Known Issues

| Issue | Status | Fix needed |
|---|---|---|
| **Shop products empty** | 🔴 Needs config | Verify Shopify Storefront token in Shopify Admin → Apps → Storefront API. Confirm products are published to the Storefront channel |
| **Ticketing DB tables not created** | 🔴 Must do before ticketing works | Run `pnpm --filter @workspace/db push` against your Supabase DB to create the 9 ticketing tables |
| **Ticket emails not sending** | 🟡 Needs env | Set `RESEND_API_KEY` in api-server. Without it, tickets are shown inline in the UI (QR links) but no email goes out |
| **Razorpay not wired** | 🟡 Needs env | Set `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` + `RAZORPAY_WEBHOOK_SECRET`. Free tickets work without this |
| **Instagram feed empty** | 🟡 Needs env | Set `INSTAGRAM_ACCESS_TOKEN` (long-lived token from Meta Graph API) |
| **YouTube videos empty** | 🟡 Needs env | Set `YOUTUBE_API_KEY` |
| **Booking OTP emails not sent** | 🟡 Needs env | Set `RESEND_API_KEY` |
| **Artist enrichment no-op** | 🟡 Needs env | Set `FIRECRAWL_API_KEY` + `OPENAI_API_KEY` |
| **Disco Mode audio CORS** | 🟡 Dev only | Move audio file to CDN (or Supabase Storage) for production |
| **Admin panel ghost routes** | 🟡 Partial | `AdminPanel.tsx` role-application routes call `/api/role-applications` which is handled by the Supabase proxy. Works when `SUPABASE_SERVICE_KEY` is set |

---

## Database Schema

30 tables in PostgreSQL (Supabase), managed via Drizzle ORM (`lib/db/src/schema/`).

### Core
| Table | Purpose |
|---|---|
| `artists` | Artist profiles |
| `events` | CCD own events |
| `curated_events` | Events from external promoters |
| `promoters` | Promoter profiles |
| `venue_profiles` | Venue data |
| `site_settings` | CMS data |

### Ticketing (9 tables)
| Table | Purpose |
|---|---|
| `promoter_applications` | Promoter sign-up applications |
| `promoter_users` | Links promoter profiles to auth (Clerk OR access_token) |
| `event_ticketing` | Per-event ticketing config (mode, commission, capacity) |
| `ticket_tiers` | Ticket tiers (GA, VIP, Early Bird, etc.) |
| `ticket_orders` | One row per checkout session |
| `ticket_order_items` | Line items per order |
| `issued_tickets` | Individual QR tickets with holder info |
| `ticket_transfers` | Face-value transfer chain |
| `door_checkins` | Door scan audit log |
| `rsvp_extensions` | Extends event_rsvps with ticketing status |

### Rich Artist Data
`artist_connections`, `artist_dates`, `event_appearances`, `artist_milestones`, `artist_social_stats`, `artist_discography`, `schema_event_artist_lineups`, `schema_user_event_interactions`, `schema_user_taste_profiles`

---

## API Reference

Base URL: `/api`

All `/api/ticketing/*` routes are proxied from Next.js → Express API server.

### Ticketing — Public (no auth)
| Method | Route | Description |
|---|---|---|
| GET | `/ticketing/events/:slug/config` | Ticket tiers + availability |
| POST | `/ticketing/orders` | Create order (free or Razorpay) |
| POST | `/ticketing/orders/:id/verify` | Verify Razorpay payment |
| POST | `/ticketing/webhooks/razorpay` | Razorpay webhook handler |
| GET | `/ticketing/tickets/:token` | Ticket by QR token |
| GET | `/ticketing/my-tickets?email=xxx` | Fan's tickets by email (no auth needed) |
| POST | `/ticketing/transfers/:token/claim` | Claim a transferred ticket |
| POST | `/ticketing/promoter/apply` | Submit promoter application |

### Ticketing — Promoter (x-promoter-token or Clerk or x-admin-password)
| Method | Route | Description |
|---|---|---|
| GET | `/ticketing/promoter/me` | Promoter profile |
| GET | `/ticketing/promoter/events` | All configured events |
| POST | `/ticketing/promoter/events` | Enable ticketing for an event |
| POST | `/ticketing/promoter/events/:slug/tiers` | Add ticket tier |
| GET | `/ticketing/promoter/events/:slug/rsvps` | RSVP list |
| POST | `/ticketing/promoter/rsvps/:id/approve` | Approve RSVP + send payment link |
| POST | `/ticketing/promoter/checkin` | Door QR scan |

### Ticketing — Admin (x-admin-password)
| Method | Route | Description |
|---|---|---|
| GET | `/ticketing/admin/applications` | All promoter applications |
| POST | `/ticketing/admin/applications/:id/approve` | Approve + generate token |
| POST | `/ticketing/admin/promoter-token/regenerate` | Regenerate promoter token |
| GET | `/ticketing/admin/orders` | All orders |
| POST | `/ticketing/admin/orders/:id/refund` | Refund via Razorpay |
| GET | `/ticketing/admin/revenue` | Revenue summary |

### Events
| Method | Route | Description |
|---|---|---|
| GET | `/events` | CCD events list |
| GET | `/events/:slug` | Event detail |
| GET | `/events/recommended` | Personalised recommendations |
| POST | `/event-rsvp` | Legacy free RSVP |

### Artists
| Method | Route | Description |
|---|---|---|
| GET | `/artists` | Artist directory |
| GET | `/artists/:slug` | Artist profile |
| GET | `/artists/:slug/full` | Fully enriched profile |

---

## Design System

CCD uses a custom brutalist design system. All classes are Tailwind.

### Colour palette
| Token | Value | Usage |
|---|---|---|
| `cream` | `#F5F0E8` | Primary background |
| `ink` | `#1A1A1A` | Text, borders |
| `magenta` | `#E040FB` | Accent, CTAs |
| `acid-yellow` | `#F5E642` | Badges, highlights |
| `electric-blue` | `#00BFFF` | Bengaluru, ambient |
| `lime` | `#AAFF00` | Success, Goa |
| `orange` | `#FF6600` | Hyderabad, warnings |

### Typography
- **Display:** `font-display` — Bowlby One SC (all-caps, chunky)
- **Body:** system sans-serif

### Signature utilities
```css
/* Hard offset box shadow */
.chunk-shadow { box-shadow: 4px 4px 0 #1a1a1a; }

/* Hover press-in micro-interaction */
hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none

/* All interactive elements */
border-4 border-ink + chunk-shadow
```

---

## Roadmap & Next Steps

### 🚀 To go live — do these first (in order)

These are the only things standing between "local dev" and "production":

**1. Run the DB migration**
```bash
pnpm --filter @workspace/db push
```
Creates all 30 tables in Supabase. Run this once after first deploy, and again whenever schema changes land.

**2. Set env vars in Vercel + Railway**

Minimum to go live:
```
# Vercel (frontend)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
ADMIN_PASSWORD         ← change from default "84838281"
NEXT_PUBLIC_API_URL    ← your Railway API server URL

# Railway (api-server)
DATABASE_URL
ADMIN_PASSWORD         ← same as frontend
NEXT_PUBLIC_SITE_URL   ← https://catscandance.com
```

**3. Change the default admin password**

Default is `84838281`. Set `ADMIN_PASSWORD` in both Vercel and Railway env vars to something strong before going live.

**4. Test the full ticketing loop**
1. Visit `/promoter/apply` — submit a test application
2. Open `/admin` → Ticketing → Applications → Approve → copy the token
3. Open `/promoter` → paste token → enable ticketing on an event → add a free tier
4. Visit that event → RSVP → confirm tickets appear at `/my-tickets`

**5. Wire Resend for real emails**
```
RESEND_API_KEY=re_...
EMAIL_FROM=tickets@catscandance.com
```
Without this, ticket QR links appear inline in the UI but no email goes out. Works fine for testing; not for production.

---

### 💳 When you're ready for paid tickets (Layer 3)

1. Create a Razorpay account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Get API keys → Settings → API Keys → Generate Test Key
3. Set env vars:
   ```
   RAZORPAY_KEY_ID=rzp_test_...          # api-server + frontend
   RAZORPAY_KEY_SECRET=...               # api-server only
   RAZORPAY_WEBHOOK_SECRET=...           # api-server only
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...  # frontend
   ```
4. Add webhook in Razorpay Dashboard → Webhooks:
   - URL: `https://catscandance.com/api/ticketing/webhooks/razorpay`
   - Events: `payment.captured`, `refund.processed`
5. Switch from test keys (`rzp_test_`) to live keys (`rzp_live_`) when going live

---

### 🧩 Feature backlog — prioritised by impact

#### High impact, relatively quick
- [ ] **Mobile QR scanner** on door check-in page
  Use `html5-qrcode` (already planned). Right now door staff paste tokens manually — this makes it a real scanner app. ~2 hours work.
  
- [ ] **Ticket reminder emails** — 24h before event
  A simple cron job (`pages/api/cron/ticket-reminders.ts`) that queries `issued_tickets` for events tomorrow and sends via Resend. Same pattern as `weekly-digest.ts`. ~3 hours.

- [ ] **WhatsApp share on tickets**
  The share button on `/my-tickets` already uses `navigator.share`. Add a dedicated WhatsApp button: `https://wa.me/?text=I'm+going+to+${eventTitle}+%F0%9F%8E%B6+${ticketUrl}`. Huge in India. 30 minutes.

- [ ] **Event ticketing setup from admin-cms**
  Currently only promoters with a portal account can enable ticketing. Add a shortcut in `/admin-cms` → Events tab so admin can also enable it directly with an `event_ticketing` upsert. ~2 hours.

#### Medium impact
- [ ] **Razorpay Routes — auto-split payout**
  Right now CCD collects 100% and manually pays promoters. Razorpay Routes splits the payment at capture time (promoter gets paid automatically, CCD keeps commission). Requires promoters to create Razorpay accounts and link them. [Docs](https://razorpay.com/docs/route/).

- [ ] **Apple Wallet / Google Wallet passes**
  Use `passkit-generator` (npm) to create `.pkpass` files for Apple Wallet. Attach to confirmation email. Very high perceived quality — feels like a real ticket. ~1 day.

- [ ] **OTP-based ticket access** (alternative to email lookup)
  Instead of "enter email → see tickets", add "enter email → receive OTP → see tickets". Reuses the `booking_otp_codes` table already in the DB. ~3 hours.

- [ ] **Post-event "Heard At" track IDs**
  After check-in, fans can submit "what was that track at 1am?". Simple form → `heard_at_submissions` table. Brilliant for CCD's curation brand.

#### Longer term
- [ ] **User profiles** — follow artists, save events, attendance history
  The `user_taste_profiles` and `schema_user_event_interactions` tables already exist and are populated by the recommendation engine. The profile UI at `/profile` just needs building on top.

- [ ] **Weekly digest email**
  `pages/api/cron/weekly-digest.ts` already exists and sends personalised event digests. Just needs the Vercel cron enabled and `RESEND_API_KEY` set.

- [ ] **PWA** — offline ticket view, push notifications
  Service worker to cache `/my-tickets/[token]` after first load. Works offline at the venue. Web Push API for "new event from followed artist" notifications.

- [ ] **Artist verified badge** — paid subscription for verified status + analytics access

- [ ] **Razorpay Smart Collect** — UPI payment links for RSVP-invite mode
  Currently the payment link opens a Razorpay checkout page. Smart Collect generates a UPI ID / payment link that fans can pay directly from their UPI app. More native India experience.

---

### 🔒 Before going fully public

- [ ] Change `ADMIN_PASSWORD` from default `84838281`
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production domain
- [ ] Rotate Supabase service key (regenerate in Supabase Dashboard → Settings → API)
- [ ] Enable Supabase RLS policies on ticketing tables
- [ ] Set up Razorpay webhook with real secret (not the dummy placeholder)
- [ ] Review `CORS` origins in `artifacts/api-server/src/app.ts` — currently `origin: true` (accepts all)

---

*Built with ❤️ by Cats Can Dance — Bengaluru's underground crew.*
*Platform engineered by Kiro AI in collaboration with the CCD team.*
