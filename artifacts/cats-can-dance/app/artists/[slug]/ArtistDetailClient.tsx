"use client";
/**
 * ArtistDetailClient — client boundary for the artist profile page.
 *
 * The App Router server page (page.tsx) fetches all data and passes it here
 * as props. This component receives everything pre-fetched — it does NOT
 * fetch anything on mount. All the complex interactive behaviour (tabs,
 * booking form, connection graph, follow button) lives here.
 *
 * We re-use the existing ArtistDetail component from src/pages/ rather than
 * rewriting it — it already handles all the UI. We just stop it from fetching
 * its own data by passing `initialArtist` and a new `initialProfile` prop.
 *
 * The existing ArtistDetail checks: if initialArtist is provided, skip the
 * /api/artists/:slug/basic fetch. We extend that pattern to skip /full too.
 */
import ArtistDetail from "@/pages/ArtistDetail";
import type {
  Artist,
  EventAppearance,
  ArtistConnection,
  ArtistDate,
  ArtistMilestone,
  ArtistRelease,
  ArtistPress,
  ArtistSocialStats,
  ArtistStats,
  ArtistFact,
} from "@/lib/db/types";

interface Props {
  artist:        Artist;
  appearances:   EventAppearance[];
  connections:   ArtistConnection[];
  upcomingDates: ArtistDate[];
  milestones:    ArtistMilestone[];
  socialStats:   ArtistSocialStats | null;
  socialHistory: ArtistSocialStats[];
  discography:   ArtistRelease[];
  press:         ArtistPress[];
  stats:         ArtistStats;
  facts:         ArtistFact[];
}

export default function ArtistDetailClient({
  artist,
  appearances,
  connections,
  upcomingDates,
  milestones,
  socialStats,
  socialHistory,
  discography,
  press,
  stats,
  facts,
}: Props) {
  return (
    <ArtistDetail
      // SSR seed — the existing component skips its own basic fetch when this is set
      initialArtist={artist}
      slug={artist.slug}
      // Pre-fetched full profile — new prop so ArtistDetail skips its /full fetch
      initialProfile={{
        artist,
        appearances,
        connections,
        upcomingDates,
        milestones,
        socialStats,
        socialHistory,
        discography,
        press,
        stats,
        facts,
      }}
    />
  );
}
