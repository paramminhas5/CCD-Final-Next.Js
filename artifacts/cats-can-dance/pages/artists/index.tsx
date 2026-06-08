/**
 * /artists — Artist directory page.
 *
 * getServerSideProps fetches artists directly from Supabase on the server.
 * No client-side fetch, no loading spinner, no empty HTML shell.
 *
 * Before:  browser → JS bundle → useEffect → fetch('/api/artists') → loading spinner
 * After:   server → DB → full HTML with all artists on first byte
 *
 * Google sees all artists in the HTML source → full SEO indexing.
 * Vercel Edge caches the response for 5 min (stale-while-revalidate 10 min).
 */
import type { GetServerSideProps } from "next";
import ArtistsPage from "@/pages/Artists";
import { listArtists } from "@/lib/db/artists";
import type { Artist } from "@/lib/db/types";

interface Props {
  initialArtists: Artist[];
}

export default function ArtistsRoute({ initialArtists }: Props) {
  return <ArtistsPage initialArtists={initialArtists} />;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ res }) => {
  // Cache at Vercel Edge — artists change infrequently
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );

  const artists = await listArtists();

  return { props: { initialArtists: artists } };
};
