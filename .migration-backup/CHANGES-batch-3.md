# Batch 3 — Artist Pages v2 + Promoter Detail Pages

## New Components

### ArtistAudioEmbed (`src/components/ArtistAudioEmbed.tsx`)
Inline SoundCloud oEmbed + Spotify iframe player on artist pages.
- SoundCloud: uses oEmbed URL — no API key needed
- Spotify: extracts embed URL from artist/track/album Spotify links
- Shown in Overview tab if artist has soundcloud or spotify URL set

### ArtistConnectionGraph (`src/components/ArtistConnectionGraph.tsx`)
Visual strength-based connection display replacing the plain list.
- Cards sorted by connection strength (desc)
- Animated strength bar (0–10 scale)
- Connection type badges (b2b, collab, label, venue) each with accent colour
- Shared events listed below each card
- Foundation for full D3 force-directed graph upgrade

### ArtistGigChart (`src/components/ArtistGigChart.tsx`)
Recharts bar chart for the Stats tab.
- Bar chart: gigs per year, CCD colour palette bars
- City breakdown: horizontal bar chart for top 5 cities
- Only renders if appearance data exists

## Modified Pages

### ArtistDetail (`src/pages/ArtistDetail.tsx`)
- Overview tab: inject `ArtistAudioEmbed` after bio
- Connections tab: replace plain card grid with `ArtistConnectionGraph`
- Stats tab: inject `ArtistGigChart` above city bars

### PromoterDetail (`src/pages/PromoterDetail.tsx`) — NEW
Full `/promoters/:slug` detail page:
- Hero with logo, name, city, trusted badge
- About section with blurb + genre tags linking to genre pages
- Links panel: Instagram, website, booking email
- Recent events grid (approximate match from curated_events)
- Submit-your-night CTA strip

### Promoters (`src/pages/Promoters.tsx`)
- Promoter card names now link to `/promoters/:slug` detail pages
- Fetch migrated fully to `/api/promoters` (no more Supabase direct)

## New Routes
- `pages/promoters/[slug].tsx` — SSR route for promoter detail pages
