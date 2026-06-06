/**
 * /artists/[slug] — Static-generated artist profile page.
 *
 * Strategy:
 *  - getStaticPaths: empty at build time → all paths use ISR (fallback: "blocking").
 *    This avoids a slow build when there are many artists, while still serving
 *    each page with full SSR content after the first request.
 *  - getStaticProps: fetch the artist's basic profile from the API proxy.
 *    Returns a minimal shape (name, bio, genres, photo) for SSR; the client
 *    hydrates with the full enriched profile (/api/artists/:slug/full).
 *  - revalidate: 120s — artist data changes infrequently.
 *
 * This replaces `dynamic({ ssr: false })` so that:
 *  1. Google indexes every artist's name/bio/city/genres without JS
 *  2. Social sharing cards show the artist photo + bio
 */
import type { GetStaticPaths, GetStaticProps } from "next";
import ArtistDetailPage from "@/pages/ArtistDetail";

interface ArtistSSR {
  id: string;
  slug: string;
  name: string;
  bio?: string;
  based_city?: string;
  genres: string[];
  photo_url?: string;
  instagram?: string;
  soundcloud?: string;
  spotify?: string;
  open_to_bookings?: boolean;
  claimed_by?: string;
  featured?: boolean;
}

interface Props {
  initialArtist: ArtistSSR | null;
  slug: string;
}

export default function ArtistSlugPage({ initialArtist, slug }: Props) {
  return <ArtistDetailPage initialArtist={initialArtist} slug={slug} />;
}

// ── Static paths ──────────────────────────────────────────────────────────────
// Empty paths array — let all requests fall through to ISR.
// First visit triggers a blocking SSR render; result is cached + revalidated.
export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: "blocking" };
};

// ── Static props ──────────────────────────────────────────────────────────────
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = (params?.slug as string) ?? "";

  let artist: ArtistSSR | null = null;

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      `http://localhost:${process.env.PORT ?? 3000}`;
    const res = await fetch(`${baseUrl}/api/artists/${encodeURIComponent(slug)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === "object" && data.slug) {
        // Only pick safe, serialisable fields for the SSR payload
        artist = {
          id:               data.id,
          slug:             data.slug,
          name:             data.name,
          bio:              data.bio ?? undefined,
          based_city:       data.based_city ?? undefined,
          genres:           data.genres ?? [],
          photo_url:        data.photo_url ?? undefined,
          instagram:        data.instagram ?? undefined,
          soundcloud:       data.soundcloud ?? undefined,
          spotify:          data.spotify ?? undefined,
          open_to_bookings: data.open_to_bookings ?? false,
          claimed_by:       data.claimed_by ?? undefined,
          featured:         data.featured ?? false,
        };
      }
    }
  } catch {
    // Network error — artist renders in loading state, client fetches
  }

  // Artist not found in DB → 404
  if (!artist) {
    return { notFound: true, revalidate: 30 };
  }

  return {
    props: { initialArtist: artist, slug },
    revalidate: 120,
  };
};
