# Deployment Guide — Cats Can Dance

This guide covers what you need to set up in **Vercel** and **Supabase** so
the site runs end-to-end. The app is structured to degrade gracefully when
env vars are missing (Sign-In becomes a link, admin gets a password prompt,
events fall back to static content), but production needs everything wired.

---

## 1. Vercel — Environment Variables

Project → Settings → **Environment Variables**. Apply to **Production**,
**Preview**, and **Development** unless noted.

### Required

| Var | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` | Public Clerk key. Without this, Sign-In is disabled. |
| `CLERK_SECRET_KEY` | `sk_live_…` | Server-side Clerk key. |
| `SUPABASE_SERVICE_KEY` | `eyJ…` | Service-role key, server-only. Used by `/api/*` proxy. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…` | Anon key. Safe to expose. |
| `SUPABASE_ANON_KEY` | (same as above) | Alternate name read by `next.config.mjs`. |
| `ADMIN_PASSWORD` | a strong password | Gates `/admin` and `/admin-cms`. Falls back to `84838281` if unset. |

### Recommended

| Var | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SHOPIFY_API_VERSION` | `2025-10` | Bump quarterly. |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | `ccd-final-bv8ld.myshopify.com` | Storefront domain. |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN` | `c75…` | Storefront API token. |
| `CLERK_PROXY_URL` | `https://yourdomain.com/__clerk` | Only for proxied custom domains (Replit etc.). |

After saving env vars: **Redeploy** the latest production build so the new
values take effect (Vercel doesn't hot-swap them).

---

## 2. Supabase — Schema + Seed Data

### Schema setup (one-time, idempotent)

Open your project in Supabase → **SQL Editor** → run, in order:

1. `scripts/sql/ccd_complete.sql` — main tables (event_appearances,
   artist_connections, venue_profiles, event_signals, user_roles, etc.).
   Safe to re-run.
2. `artifacts/cats-can-dance/public/ccdxsocial-seed.sql` — seeds the four
   CCD × SOCIAL events (THE DEBUT, THE GROOM ROOM, ZOOMIES, GRAND FORMAT).
   Adds `series` / `series_label` / `pet_friendly` columns if absent, then
   upserts the rows. Re-running is safe.

### What's in the events table after seed

```sql
SELECT slug, title, date, series, pet_friendly, sort_order
FROM events
WHERE series = 'ccdxsocial'
ORDER BY sort_order;
```

Should return 4 rows — `ccdxsocial-debut`, `ccdxsocial-groom-room`,
`ccdxsocial-zoomies`, `ccdxsocial-grand-finale`.

> If for any reason you can't run the seed, the EventDetail page now
> falls back to a static catalogue in `src/content/events.ts` so the page
> still renders. Once you run the seed, the live DB row takes over.

---

## 3. Quick Verification

After redeploy, smoke-test these URLs:

- `/api/health` → `{ "ok": true, "ts": <number> }`
- `/api/events?slug=ccdxsocial-zoomies` → returns the ZOOMIES row
- `/events/ccdxsocial-zoomies` → renders the full event detail page
- `/admin` → shows dual-path login (Sign-in button + password fallback)
- `/admin-cms` → shows password prompt, unlocks the full CMS panel
- `/shop` → loads products. If `SHOP OFFLINE`, error message tells you exactly what's wrong.
- `/artists/<slug>` → loads new magazine layout with HOME / GIGS / ... / BOOK tabs
- `/book` → marketplace browse page

---

## 4. Admin Panel Tour

| Route | Auth | Use for |
|---|---|---|
| `/admin` | Clerk admin role **OR** admin password | Role applications, user roles, artists overview, XP leaderboard, scraper trigger. |
| `/admin-cms` | Admin password only | Signups, playlists, videos, events CRUD, contact messages, blog, curated events, promoters, RSVPs, marquees, theme, homepage copy. |
| `/artist/dashboard` | Clerk (artist role or claimed) | Artists self-manage their profile, dates calendar, booking inquiries. |

The two admin panels are intentionally split — `/admin` is for roles &
authorization (needs Clerk), `/admin-cms` is for content editing
(password-only, works without Clerk).

---

## 5. Artist Booking — How It Works

1. Artist signs in, lands at `/artist/dashboard`, clicks **Profile** tab.
2. Toggles **Open to bookings** + sets **Available cities** + fee range.
3. Goes to **Dates** tab, adds upcoming gigs:
   - `confirmed` → marked busy on the public calendar
   - `tentative` → marked tentative
   - `available` → marked as an open slot looking for a show
4. On the public artist page, the **BOOK** tab now shows:
   - The live availability calendar (next 6 months)
   - An inline booking inquiry form
   - Available cities + fee range as side panel
5. Inquiry submissions hit `/api/booking-inquiry` → land in the artist's
   **Inquiries** tab.

If `Open to bookings` is off, the BOOK tab shows a "not currently booking"
notice instead of the form.
