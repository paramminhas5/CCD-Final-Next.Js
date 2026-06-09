/**
 * /api/artist-connections
 *
 * GET  ?slug=<slug>      — connections for an artist (both directions)
 * GET  ?artist_id=<uuid> — legacy UUID-based lookup
 * POST (admin)           — create/upsert a connection
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, upsert, ins, pq, eqf, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const artistSlug = (req.query.slug ?? req.query.artist_slug) as string | undefined;
    const artistId   = (req.query.artist_id ?? req.query.id) as string | undefined;

    if (!artistSlug && !artistId) {
      return res.status(400).json({ error: "slug or artist_id required" });
    }

    if (artistSlug) {
      const [asA, asB] = await Promise.all([
        get("artist_connections", `?artist_a_slug=eq.${encodeURIComponent(artistSlug)}&order=strength.desc`),
        get("artist_connections", `?artist_b_slug=eq.${encodeURIComponent(artistSlug)}&order=strength.desc`),
      ]);
      return res.json([...(asA as any[]), ...(asB as any[])]);
    }

    const [asA, asB] = await Promise.all([
      get("artist_connections", `?artist_a_id=eq.${artistId}&order=strength.desc`),
      get("artist_connections", `?artist_b_id=eq.${artistId}&order=strength.desc`),
    ]);
    return res.json([...(asA as any[]), ...(asB as any[])]);
  }

  if (req.method === "POST") {
    if (!isAdminReq(req)) return res.status(401).json({ error: "Admin only" });
    const now = new Date().toISOString();
    const { ok, data } = await upsert("artist_connections", { ...req.body, created_at: now, updated_at: now });
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
