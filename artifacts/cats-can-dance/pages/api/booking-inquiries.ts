/**
 * GET /api/booking-inquiries?artist_slug=<slug>
 *
 * Returns all booking requests for an artist by slug.
 * Used by the artist portal "Inquiries" tab (MarketplaceInbox).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, eqf, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { artist_slug } = req.query as Record<string, string>;
  if (!artist_slug) return res.status(400).json({ error: "artist_slug required" });

  // Resolve artist to get both id and name
  const artistRows = await get("artists", pq(eqf("slug", artist_slug))) as any[];
  if (!artistRows?.length) return res.json([]);

  const artist = artistRows[0];

  // Fetch by artist_id_resolved (v2) or artist_name (v1 legacy), merge + dedupe
  const [byId, byName] = await Promise.all([
    get("booking_requests", pq({ ...eqf("artist_id_resolved", artist.id), ...ord("created_at", false) })) as Promise<any[]>,
    get("booking_requests", pq({ ...eqf("artist_name", artist.name), ...ord("created_at", false) })) as Promise<any[]>,
  ]);

  const seen = new Set<string>();
  const merged: any[] = [];
  for (const b of [...(byId ?? []), ...(byName ?? [])]) {
    if (!seen.has(b.id)) { seen.add(b.id); merged.push(b); }
  }
  merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return res.json(merged);
}
