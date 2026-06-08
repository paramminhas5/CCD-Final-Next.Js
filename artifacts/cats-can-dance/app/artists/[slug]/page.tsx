/**
 * /artists/[slug] — Artist profile page (App Router, server component).
 *
 * What changed vs pages/artists/[slug]/index.tsx:
 *
 * BEFORE (Pages Router + ISR):
 *   - getStaticPaths: empty → fallback:"blocking" → SSR on first request
 *   - getStaticProps: fetch(`${baseUrl}/api/artists/${slug}`) — HTTP round-trip to self!
 *   - Client hydrates → fetch("/api/artists/slug/full") for the rich data
 *   - Two network fetches, one of them a slow self-HTTP call at build/request time
 *
 * NOW (App Router):
 *   - generateStaticParams: pre-renders all approved artists at build time
 *   - generateMetadata: direct DB call for per-artist SEO tags
 *   - Page component: direct DB call for full profile — one round-trip to Supabase
 *   - ArtistDetailClient: receives all data as props, handles the interactive tabs
 *   - No self-HTTP calls. No double-fetch. Data in HTML before browser gets it.
 *
 * Caching:
 *   - revalidate = 120 (2 min) — artist profiles are updated occasionally
 *   - generateStaticParams runs at build, new artists get ISR on first request
 */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { listArtists, getArtistFullProfile } from "@/lib/db/artists";
import { artistPageMetadata } from "../../lib/metadata";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Marquee from "@/components/Marquee";
import ArtistDetailClient from "./ArtistDetailClient";

// ── Revalidate ────────────────────────────────────────────────────────────────

export const revalidate = 120;

// ── Pre-render all approved artists at build time ─────────────────────────────

export async function generateStaticParams() {
  const artists = await listArtists();
  return artists.map((a) => ({ slug: a.slug }));
}

// ── Per-artist metadata (SEO + social cards) ──────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Lightweight fetch — only needs basic artist fields for meta tags
  const artists = await listArtists();
  const artist  = artists.find((a) => a.slug === slug);
  if (!artist) return { title: "Artist not found" };
  return artistPageMetadata(artist);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ArtistSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Single parallel fetch — all profile data in one DB round-trip
  const profile = await getArtistFullProfile(slug);

  // Not found → Next.js shows the nearest not-found.tsx
  if (!profile) notFound();

  const { artist, appearances, connections, upcomingDates, milestones,
          socialStats, socialHistory, discography, press, stats, facts } = profile;

  // JSON-LD for artist structured data (music artist schema)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "MusicGroup",
    name:       artist.name,
    url:        `https://catscandance.com/artists/${artist.slug}`,
    image:      artist.photo_url ?? "https://catscandance.com/og-image.jpg",
    description: artist.bio ?? `${artist.name} — electronic music artist from India.`,
    genre:      artist.genres,
    ...(artist.instagram && {
      sameAs: [`https://instagram.com/${artist.instagram.replace("@", "")}`],
    }),
  };

  return (
    <main className="bg-background text-foreground">
      <Nav />

      {/* JSON-LD — in <head> via dangerouslySetInnerHTML in a script tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/*
        ArtistDetailClient owns all interactive behaviour:
          - Tab navigation (HOME / GIGS / CONNECTIONS / JOURNEY / STATS / EPK / BOOK)
          - Cover hero with sticky BOOK CTA
          - FollowButton, BookingForm, ArtistConnectionGraph, etc.

        All data arrives as props — no fetching inside the client component.
        This is the key improvement: the page HTML contains all the content
        Google needs, and the JS just adds interactivity on top.
      */}
      <ArtistDetailClient
        artist={artist}
        appearances={appearances}
        connections={connections}
        upcomingDates={upcomingDates}
        milestones={milestones}
        socialStats={socialStats}
        socialHistory={socialHistory}
        discography={discography}
        press={press}
        stats={stats}
        facts={facts}
      />

      <Marquee bg="bg-ink" />
      <Footer />
    </main>
  );
}
