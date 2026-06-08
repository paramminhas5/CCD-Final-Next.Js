/**
 * /artists — Artist directory page.
 *
 * getServerSideProps fetches the full artist list directly from Supabase
 * on every request. No client-side fetch, no loading spinner, no empty HTML.
 *
 * Google sees all artists in the HTML source on first load → full SEO.
 *
 * Caching: Vercel Edge Cache via Cache-Control header (5 min stale-while-revalidate).
 * Artists change infrequently so this is safe and fast.
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
  // Cache at Vercel Edge for 5 min, serve stale for up to 10 min while revalidating
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );

  const artists = await listArtists();

  return {
    props: { initialArtists: artists },
  };
};
