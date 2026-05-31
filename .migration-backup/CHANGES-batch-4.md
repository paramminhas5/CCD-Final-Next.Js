# Batch 4 — Homepage Artist Spotlight + City Marquee

## New Components

### CityMarquee (`src/components/CityMarquee.tsx`)
Rolling acid-yellow ticker strip positioned directly below the Hero section.
- CSS-only animation (no JS dependency), infinite seamless loop
- Items: Indian city names (Bengaluru, Mumbai, Delhi, Goa, Hyderabad, Pune)
  plus global scene names (Detroit Techno, Chicago House, London Jungle, Berlin, Goa Trance)
- Styled in CCD design system: acid-yellow background, ink border, font-display uppercase

### ArtistSpotlight (`src/components/ArtistSpotlight.tsx`)
Full-width editorial feature section showcasing a single featured artist.
- Fetches `GET /api/artists?featured=true&limit=1`
- Two-column layout: photo (left) + bio/details (right)
- Shows: city, genre tags, bio (4-line clamp), "Full Profile" CTA, Instagram link
- Magenta background to stand out between GenreWheel and Videos sections
- Graceful fallback: skeleton during load, null render if no featured artist

## Homepage (Index.tsx)
- `<CityMarquee />` inserted immediately after `<Hero />` (replaces gap)
- `<ArtistSpotlight />` inserted between `<GenreWheel />` and Videos section
- Imports added for both new components

## Final Homepage Section Order
1. Hero
2. CityMarquee ← NEW
3. About
4. Events
5. SceneSnapshot (Indian cities)
6. GenreWheel (6 genres + global origins)
7. ArtistSpotlight ← NEW
8. Videos
9. Playlist
10. Drops
11. Instagram
12. Early Access
13. Contact / Footer
