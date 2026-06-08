/**
 * GET /api/artist-calendar?slug=:slug&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns a merged, day-indexed calendar for a public artist profile.
 * Combines artist_availability_blocks and individual artist_dates.
 *
 * Used by:
 *   - AvailabilityStrip component on the artist profile page
 *   - The booking date picker in the BOOK tab
 *
 * Response shape: ArtistCalendar (see @/lib/db/types.ts)
 *   {
 *     artist_id, artist_slug, from, to,
 *     days: { "YYYY-MM-DD": "busy" | "tentative" | "available" | "open" },
 *     blocks: ArtistAvailabilityBlock[],
 *     gigs: ArtistDate[],
 *     available_cities: string[],
 *     open_to_bookings: boolean,
 *   }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getArtist, getArtistCalendar } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { slug, from, to } = req.query as Record<string, string>;

  if (!slug) return res.status(400).json({ error: "slug query param is required" });

  const artist = await getArtist(slug);
  if (!artist) return res.status(404).json({ error: "Artist not found" });

  const fromDate = from ?? new Date().toISOString().split("T")[0];
  const toDate   = to   ?? new Date(Date.now() + 180 * 86_400_000).toISOString().split("T")[0];

  const calendar = await getArtistCalendar(artist, fromDate, toDate);

  // Cache for 2 minutes — calendar data changes infrequently
  res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
  return res.json(calendar);
}
