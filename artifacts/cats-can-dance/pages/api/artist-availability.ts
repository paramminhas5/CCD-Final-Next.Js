/**
 * GET /api/artist-availability?slug=<artist_slug>
 *
 * Returns a summary of availability for a given artist:
 * available_cities, fee_range, open_to_bookings, upcoming_dates.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, eqf, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const slug = req.query.slug as string;
  if (!slug) return res.status(400).json({ error: "slug required" });

  const artistRows = await get("artists", pq(eqf("slug", slug))) as any[];
  if (!artistRows?.length) return res.status(404).json({ error: "Not found" });
  const artist = artistRows[0];

  const today = new Date().toISOString().split("T")[0];
  const dates = await get(
    "artist_dates",
    pq({ ...eqf("artist_id", artist.id), ...eqf("is_public", "true"), event_date: `gte.${today}`, ...ord("event_date") }),
  );

  return res.json({
    available_cities: artist.available_cities ?? [],
    fee_range: (artist.fee_min_inr || artist.fee_max_inr)
      ? { min: artist.fee_min_inr, max: artist.fee_max_inr, currency: artist.fee_currency ?? "INR" }
      : null,
    open_to_bookings: artist.open_to_bookings ?? false,
    upcoming_dates: dates ?? [],
  });
}
