/**
 * /artists/[slug] — Artist profile page.
 *
 * getServerSideProps fetches the COMPLETE artist profile directly from
 * Supabase — no self-HTTP calls, no client double-fetch.
 *
 * Before (broken pattern):
 *   1. getStaticProps → fetch(`${baseUrl}/api/artists/${slug}`)  ← self-HTTP, slow
 *   2. Client mounts  → fetch(`/api/artists/${slug}/full`)       ← second fetch
 *   Result: loading spinner on every visit, ISR cold-start latency
 *
 * After (correct pattern):
 *   1. getServerSideProps → getArtistFullProfile(slug)           ← direct DB
 *   2. ArtistDetail receives initialProfile prop                  ← skips all client fetches
 *   Result: full content in HTML on first byte, zero loading spinners
 *
 * SEO: bio, genres, gigs, connections all in HTML → Google indexes everything.
 * Social cards: artist photo + bio in og:image/og:description on share.
 * Vercel Edge: 2-min cache, 5-min stale-while-revalidate.
 */
import type { GetServerSideProps } from "next";
import Head from "next/head";
import ArtistDetailPage from "@/pages/ArtistDetail";
import { getArtistFullProfile } from "@/lib/db/artists";
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

// ── Full profile shape passed as props ────────────────────────────────────────

export interface FullProfile {
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

interface Props {
  profile: FullProfile;
  slug:    string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ArtistSlugPage({ profile, slug }: Props) {
  const { artist } = profile;

  const SITE  = "https://catscandance.com";
  const city  = artist.based_city ?? artist.from_city ?? "India";
  const genre = (artist.genres ?? []).slice(0, 3).join(", ");
  const desc  = artist.bio
    ? artist.bio.slice(0, 155) + (artist.bio.length > 155 ? "…" : "")
    : `${artist.name} is a ${genre} artist from ${city}. Book, follow, and explore their full profile on Cats Can Dance.`;
  const ogImg = artist.photo_url ?? `${SITE}/og-image.jpg`;
  const url   = `${SITE}/artists/${artist.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "MusicGroup",
    name:       artist.name,
    url,
    image:      ogImg,
    description: desc,
    genre:      artist.genres ?? [],
    ...(artist.instagram && {
      sameAs: [`https://instagram.com/${artist.instagram.replace("@", "")}`],
    }),
  };

  return (
    <>
      <Head>
        <title>{`${artist.name} — Artist Profile | Cats Can Dance`}</title>
        <meta name="description"         content={desc} />
        <link rel="canonical"            href={url} />
        {/* Open Graph */}
        <meta property="og:title"        content={`${artist.name} — Artist Profile`} />
        <meta property="og:description"  content={desc} />
        <meta property="og:url"          content={url} />
        <meta property="og:type"         content="profile" />
        <meta property="og:image"        content={ogImg} />
        <meta property="og:image:alt"    content={`${artist.name} artist photo`} />
        <meta property="og:site_name"    content="Cats Can Dance" />
        {/* Twitter */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={`${artist.name} — Cats Can Dance`} />
        <meta name="twitter:description" content={desc} />
        <meta name="twitter:image"       content={ogImg} />
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      {/*
        Pass the complete pre-fetched profile as initialProfile.
        ArtistDetail checks: if initialProfile is set → skip all useEffect fetches.
        The component renders immediately with full data — no loading state.
      */}
      <ArtistDetailPage
        initialArtist={artist}
        initialProfile={profile}
        slug={slug}
      />
    </>
  );
}

// ── Server-side data fetching ─────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
  res,
}) => {
  const slug = (params?.slug as string) ?? "";

  // Cache at Vercel Edge for 2 min, serve stale for 5 min while revalidating
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=120, stale-while-revalidate=300",
  );

  // Single function — fetches artist + all relations in parallel, never throws
  const profile = await getArtistFullProfile(slug);

  // Artist not found → 404
  if (!profile) return { notFound: true };

  return { props: { profile, slug } };
};
