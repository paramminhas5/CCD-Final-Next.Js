# Cats Can Dance — Next.js Web App

> Bangalore's underground dance music crew + streetwear label. Events, drops, playlists, community.

**Live site:** [catscandance.com](https://catscandance.com)  
**Stack:** Next.js 14 (Pages Router) · TypeScript · TailwindCSS · Supabase · Clerk Auth

---

## Table of Contents

- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [What Was Built — CCDxSocial Series Update](#what-was-built--ccdxsocial-series-update)
- [How to Go Live with the Events](#how-to-go-live-with-the-events)
- [Architecture: The Series Template](#architecture-the-series-template)
- [Next Steps](#next-steps)
- [Suggestions](#suggestions)
- [Environment Variables](#environment-variables)

---

## Project Structure

```
artifacts/cats-can-dance/     ← Main Next.js app
├── pages/                    ← Next.js routes (thin wrappers)
│   ├── events/               ← /events, /events/[slug]
│   ├── ccdxsocial/           ← /ccdxsocial, /ccdxsocial/sponsor, /ccdxsocial/events
│   └── ...
├── src/
│   ├── types/events.ts       ← Shared EventRow type (series-aware)
│   ├── pages/                ← Page implementations
│   │   ├── Events.tsx        ← /events page — series-first layout
│   │   ├── EventDetail.tsx   ← /events/[slug] — pet zone + series siblings
│   │   ├── CcdxSocial.tsx    ← /ccdxsocial (private proposal doc)
│   │   └── CcdxSocialSponsor.tsx ← /ccdxsocial/sponsor (NEW)
│   └── components/
│       ├── Events.tsx        ← Homepage events section (series-aware)
│       ├── Nav.tsx           ← Global nav (Sponsor a Show added)
│       ├── Footer.tsx        ← Global footer (CCDxSocial links added)
│       └── PartnerContactDialog.tsx ← Contact dialog (sponsors kind added)
├── public/
│   └── ccdxsocial-seed.sql   ← Supabase seed for the 3 shows + finale
artifacts/api-server/         ← Express API server
lib/                          ← Shared packages (db, api-spec, api-client)
.migration-backup/            ← Original Vite/React source (reference only)
```

---

## Quick Start

```bash
cd artifacts/cats-can-dance
npm install
npm run dev
```

Requires `.env.local` — see [Environment Variables](#environment-variables).

---

## What Was Built — CCDxSocial Series Update

### PR #1 · `feat/ccdxsocial-events-series`

This update wires the CCDxSocial pet lifestyle festival series into every part of the site and backend. Here's exactly what changed:

---

### 1. `src/types/events.ts` — Shared Event Type *(new file)*

A single source of truth for the `EventRow` type used across all components and pages. Added optional series fields that are **fully backward-compatible** — existing events work with zero changes:

| Field | Type | Purpose |
|---|---|---|
| `series` | `string \| null` | Stable series slug, e.g. `"ccdxsocial"` |
| `series_label` | `string \| null` | Display name, e.g. `"CCD × SOCIAL"` |
| `event_type` | `string \| null` | Type key for conditional UI |
| `pet_friendly` | `boolean \| null` | Shows pet zone section on event page |
| `series_tagline` | `string \| null` | Short tagline on series cards |
| `is_finale` | `boolean \| null` | Marks the season finale |

---

### 2. `src/components/Events.tsx` — Homepage Events *(updated)*

- Detects active series: **when 2+ upcoming events share the same `series` slug**, the component automatically switches to `SeriesBanner` mode
- `SeriesBanner` shows all 3 show cards side-by-side with RSVP buttons + grand finale teaser
- Falls back cleanly to the original single-featured layout when no series is active
- Per-card RSVP dialogs work individually for each show

---

### 3. `src/pages/Events.tsx` — `/events` Page *(updated)*

- **Series is front and centre** at the top of the page when a series is active
- `SeriesSection` component: 3 show cards, activities strip (Startdawg · Merman · Pet Zone · Agility · Portrait Booth), grand format finale dark-hero block
- Standalone upcoming events (non-series) appear below the series
- Past events unchanged
- "Host with us" strip now includes **Sponsor a Show →** CTA alongside For Venues

---

### 4. `src/pages/EventDetail.tsx` — `/events/[slug]` *(updated)*

- **Series banner** at top of page: "Part of the CCD × SOCIAL series" with link back to /events
- **Pet-friendly chips** on hero: 🐾 PET FRIENDLY · 🌿 OUTDOOR ZONE 4PM–8PM · 🎧 DANCE MUSIC TILL CLOSE
- **`PetFriendlySchedule`** section: full 4PM–8PM timeline (doors → activities → peak → evening mode) + pet amenities chips — only shown when `pet_friendly: true`
- **`SeriesSiblings`** section: dynamically fetches and displays the other events in the same series, plus a grand finale teaser card with Sponsor It CTA — only shown when `series` is set

---

### 5. `src/pages/CcdxSocialSponsor.tsx` — `/ccdxsocial/sponsor` *(new page)*

Full sponsor pitch page with:
- **The Opportunity** — audience stats, demographic profile, reach numbers
- **The Series** — 3 show cards + grand finale card with attendance projection
- **Three sponsor tiers:**
  - 🐾 **SERIES PARTNER** — All 3 shows + finale, headline placement, stage naming, co-branded content, email reach, website logo
  - ✦ **SHOW SPONSOR** — One show of choice, headline logo, activation booth, co-branded content, social post
  - 🌿 **COMMUNITY SUPPORTER** — All shows light touch, logo + social mentions, passes
- **Who Should Sponsor** — 8 brand category cards
- **What You Get** — activation space, content assets, social reach, co-branding, reporting
- All CTAs use `PartnerContactDialog` with pre-filled reason + default message per tier

---

### 6. `pages/ccdxsocial/sponsor.tsx` + `pages/ccdxsocial/events.tsx` *(new routes)*

- `/ccdxsocial/sponsor` — renders the Sponsor page
- `/ccdxsocial/events` — redirects to `/events` (preserves any external links)

---

### 7. `src/pages/Admin.tsx` — Admin Dashboard *(updated)*

Series fields added to the **EventEditor** in the admin Events tab:

- Series slug input
- Series label input
- Event type input
- Series tagline input
- 🐾 Pet Friendly checkbox
- ★ Season Finale checkbox

Any future event series can be tagged from the admin dashboard — no code changes needed.

---

### 8. `src/components/PartnerContactDialog.tsx` *(updated)*

Added `"sponsors"` kind with:
- 5 pre-filled reason options (Series Partner / Show Sponsor / Community Supporter / Grand Finale / Custom)
- Default message pre-filled
- Routes to `hello@catscandance.com` with subject `CCDxSocial Sponsorship Enquiry`

---

### 9. `src/components/Footer.tsx` + `src/components/Nav.tsx` *(updated)*

- Footer → EXPLORE section: **CCDxSocial Shows** link added
- Footer → PARTNERS section: **Sponsor a Show** link added
- Nav → Partners dropdown: **Sponsor a Show 🐾** added

---

### 10. `public/ccdxsocial-seed.sql` *(new file)*

Supabase SQL seed — see [How to Go Live](#how-to-go-live-with-the-events).

---

## How to Go Live with the Events

The frontend is live the moment the PR is merged. To activate the series banner and all three event pages, you need to seed the Supabase database:

### Step 1 — Open Supabase SQL Editor

Go to your project → SQL Editor → New query.

### Step 2 — Paste and run the seed

Copy the contents of `artifacts/cats-can-dance/public/ccdxsocial-seed.sql` and run it.

This will:
1. Add the series columns to your `events` table (if not already there)
2. Insert all 4 CCDxSocial events (3 shows + finale) with `ON CONFLICT DO UPDATE` — safe to re-run

### Step 3 — Verify

```sql
SELECT slug, title, date, series, pet_friendly, is_finale, sort_order
FROM events
WHERE series = 'ccdxsocial'
ORDER BY sort_order;
```

Expected result: 4 rows with slugs `ccdxsocial-debut`, `ccdxsocial-groom-room`, `ccdxsocial-zoomies`, `ccdxsocial-grand-finale`.

### Step 4 — Update lineup when confirmed

Once Startdawg, Merman, and the 3 TBA artists are locked in, update the `lineup` column via `/admin` → Events tab, or directly in Supabase.

---

## Architecture: The Series Template

The series system is designed as a **reusable template** for every future event series. To create a new series:

### In the Admin Dashboard (`/admin` → Events tab):

For each event in the series, set:

| Field | Example |
|---|---|
| Series slug | `episode-2-series` |
| Series label | `CCD EPISODE II` |
| Event type | `standard` |
| Series tagline | `WAREHOUSE · LATE NIGHT · ACID` |
| Pet Friendly | ☐ (uncheck for non-pet events) |
| Season Finale | ☐ or ☑ for the capstone show |

When **2 or more upcoming events share the same series slug**, the series banner activates automatically across:
- Homepage Events component
- `/events` page (front and centre)
- Individual event detail pages (series banner + sibling links)

No code changes needed for future series.

---

## Next Steps

These are the immediate next actions to get the CCDxSocial series fully live:

### Must Do

- [ ] **Run `ccdxsocial-seed.sql`** in Supabase SQL Editor to activate the series on the live site
- [ ] **Update lineup** once all 5 DJs are confirmed — edit via `/admin` → Events → lineup field
- [ ] **Add event posters** — upload via `/admin` → Events → Poster upload for each show
- [ ] **Confirm venues** — update venue name for each show (currently "Social, Indiranagar", "Social, Church Street", "Social, Koramangala" — adjust if needed)
- [ ] **Set exact show dates** — Jun 21 and Jun 28/29 are set; confirm all three match actual booking dates
- [ ] **Update the Grand Finale date** once confirmed — change `date` field from "Date TBA · 2026" to the actual date

### Should Do

- [ ] **Create event posters** — design a poster per show in the CCD brutalist visual language and upload via admin; the events page becomes significantly more visually striking with posters
- [ ] **Send sponsor pack** — the `/ccdxsocial/sponsor` page is live; follow up by email with the full deck to priority brands using `hello@catscandance.com`
- [ ] **Add CCDxSocial to sitemap.xml** — add `/ccdxsocial/sponsor` to `public/sitemap.xml`
- [ ] **Update `public/brand.json`** — add the CCDxSocial series to the `knownFor` and `categories` arrays so AI crawlers surface it
- [ ] **Update `public/llms.txt` and `public/llms-full.txt`** — include the series for GEO (AI search) coverage
- [ ] **Instagram + email campaign** — announce the series; link to `/events` for RSVPs and `/ccdxsocial/sponsor` for sponsors
- [ ] **Submit updated sitemap to Google Search Console** after the events are live

### Nice to Have

- [ ] Set up a countdown timer on the hero of each event detail page
- [ ] Add a "Bring a friend" share button to the RSVP confirmation
- [ ] Add pet-specific FAQ to each CCDxSocial event detail page (what animals are allowed, what to bring, etc.)
- [ ] Create a CCDxSocial-specific OG image for social sharing previews

---

## Suggestions

### On Sponsors

1. **Lead with the finale** — the 2,000+ capacity grand format show is the anchor. Pitch series partners on the finale first, then back-fill individual show sponsors. The finale is where headline logos matter most.

2. **Pet brand outreach shortlist** — Heads Up For Tails, Supertails, Wiggles India, Drools, Pawsitively are the obvious first five. All have marketing budgets and are actively looking for experiential activations.

3. **Beverage brand angle** — position the outdoor pet zone (4PM–8PM, family-friendly) as a premium opportunity for non-alcoholic and health beverage brands who can't buy into traditional nightlife but want the same crowd.

4. **Content package is the pitch** — the strongest sponsor sell is the content deliverable (photo + video assets within a week). Lead with that in every outreach email.

### On Events

5. **Keep sort_order 1–3 for the CCDxSocial shows** — the homepage series banner auto-activates based on sort order; don't add other upcoming events at sort_order 1–3 during June or they'll compete for the featured slot.

6. **RSVP flow** — consider a post-RSVP confirmation email that mentions the pet zone rules (on-lead, vaccinated, calm dogs) to set expectations and reduce day-of friction.

7. **Series cadence** — 3 shows in 9 days (Jun 21, 28, 29) is tight. If demand is strong after Show 01, you have an argument to extend the series into July. The series system supports adding events at any time.

### On the Codebase

8. **The series template is generic** — use the same `series` slug pattern for future themed runs (e.g. a rooftop summer series, a collab with another brand). Admin fields are already there — no code changes needed.

9. **Admin panel** — the Events tab now has all series fields. Use it as your primary CMS for event management; it writes directly to Supabase via the `admin-content` edge function.

10. **The `supabase-seed.sql` pattern** — keep this approach for any data you want to be reproducible across environments. Store future seeds in `public/` or a `scripts/` folder.

---

## Environment Variables

Create `artifacts/cats-can-dance/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

---

## Contact

**hello@catscandance.com** · [@catscan.dance](https://instagram.com/catscan.dance) · [catscandance.com](https://catscandance.com)
