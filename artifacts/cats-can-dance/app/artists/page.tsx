/**
 * /artists — Artist directory page (App Router, server component).
 *
 * What changed vs the old pages/artists/index.tsx:
 *
 * BEFORE (Pages Router):
 *   1. Browser requests /artists
 *   2. Next.js sends empty HTML shell + JS bundle
 *   3. Browser runs JS, mounts component
 *   4. useEffect fires → fetch("/api/artists")
 *   5. Loading spinner shown while waiting
 *   6. Artists render after 2 round-trips
 *
 * NOW (App Router, server component):
 *   1. Browser requests /artists
 *   2. Next.js fetches artists from Supabase DIRECTLY on the server
 *   3. Browser receives fully-rendered HTML with all artists already in it
 *   4. No loading spinner. No extra network round-trip. Instant paint.
 *   5. React hydrates for the filter/search interactivity
 *
 * Google sees all 40+ artists in the HTML source → full SEO indexing.
 */
import type { Metadata } from "next";
import { listArtists } from "@/lib/db/artists";
import { artistsPageMetadata } from "../lib/metadata";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import Marquee from "@/components/Marquee";
import ArtistFilters from "./components/ArtistFilters";

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = artistsPageMetadata();

// ── Revalidate every 5 minutes — artists change infrequently ─────────────────
export const revalidate = 300;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ArtistsPage() {
  // Direct DB call — no fetch(), no API route, no round-trip.
  // This runs at request time on the server (or from cache during revalidate window).
  const artists = await listArtists();

  return (
    <main className="bg-background text-foreground">
      <Nav />

      <PageHero
        eyebrow="ARTISTS"
        title={<>THE<br />ROSTER.</>}
        bg="bg-electric-blue"
        textColor="text-cream"
        eyebrowColor="text-acid-yellow"
      />

      <Marquee bg="bg-ink" />

      {/*
        ArtistFilters is a client component — it owns the search/filter/sort state.
        We pass the full artist list as a prop (already fetched above, no extra cost).
        The grid re-renders instantly in the browser as the user types — no network.
      */}
      <ArtistFilters artists={artists} />

      <Footer />
    </main>
  );
}
