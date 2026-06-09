/**
 * GET /api/marketplace/artists-v2
 *
 * Date-aware artist search for the /book marketplace page.
 * Attaches availability signal to each artist for a given date+city.
 *
 * Query params:
 *   city?     — filter by available_cities / based_city
 *   date?     — YYYY-MM-DD — check availability on this date
 *   genre?    — genre keyword filter
 *   fee_max?  — maximum fee_min_inr filter
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, eqf, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { city, date, genre, fee_max } = req.query as Record<string, string>;

  const allArtists = await get("artists", pq({
    ...eqf("status", "approved"),
    ...eqf("open_to_bookings", "true"),
    ...ord("name"),
  })) as any[];

  const feeMax = fee_max ? parseInt(fee_max) : null;
  let filtered = allArtists.filter((a: any) => {
    if (genre && !(a.genres ?? []).some((g: string) =>
      g.toLowerCase().includes(genre.toLowerCase()))) return false;
    if (feeMax && a.fee_min_inr && a.fee_min_inr > feeMax) return false;
    return true;
  });

  if (date && city && filtered.length > 0) {
    const artistIds = filtered.map((a: any) => a.id);

    const [blocksRaw, gigsRaw] = await Promise.all([
      get(
        "artist_availability_blocks",
        `?artist_id=in.(${artistIds.join(",")})&is_public=eq.true&start_date=lte.${date}&end_date=gte.${date}&order=artist_id.asc`,
      ) as Promise<any[]>,
      get(
        "artist_dates",
        `?artist_id=in.(${artistIds.join(",")})&event_date=eq.${date}&is_public=eq.true`,
      ) as Promise<any[]>,
    ]);

    const signals: Record<string, "busy" | "available" | "tour_leg" | "unknown"> = {};

    for (const b of blocksRaw ?? []) {
      const cur = signals[b.artist_id];
      if (b.kind === "unavailable") { signals[b.artist_id] = "busy"; continue; }
      if (b.kind === "available" && cur !== "busy") { signals[b.artist_id] = "available"; continue; }
      if (b.kind === "tour_leg" && !cur) { signals[b.artist_id] = "tour_leg"; }
    }
    for (const g of gigsRaw ?? []) {
      if (g.status === "confirmed") signals[g.artist_id] = "busy";
      else if (g.status === "available" && signals[g.artist_id] !== "busy") {
        signals[g.artist_id] = "available";
      }
    }

    filtered = filtered.map((a: any) => {
      const inCity =
        (a.based_city ?? "").toLowerCase().includes(city.toLowerCase()) ||
        (a.available_cities ?? []).some((c: string) =>
          c.toLowerCase().includes(city.toLowerCase()));
      return {
        ...a,
        availability_signal: signals[a.id] ?? "unknown",
        city_match: inCity,
      };
    });

    const sigOrder: Record<string, number> = { available: 0, tour_leg: 1, unknown: 2, busy: 3 };
    filtered.sort((a: any, b: any) => {
      const ao = sigOrder[a.availability_signal] ?? 2;
      const bo = sigOrder[b.availability_signal] ?? 2;
      if (ao !== bo) return ao - bo;
      if (a.city_match && !b.city_match) return -1;
      if (!a.city_match && b.city_match) return 1;
      return 0;
    });
  }

  return res.json(filtered);
}
