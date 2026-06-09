/**
 * /api/event-artist-lineups
 *
 * GET    ?curated_event_id=|artist_slug=  — public read (event lineup)
 * POST   (admin)  — add lineup entry
 * PATCH  ?id=     (admin)  — update lineup entry
 * DELETE ?id=     (admin)  — delete lineup entry
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, del, pq, eqf, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const { curated_event_id, artist_slug } = req.query as Record<string, string>;
    const filters: Record<string, string> = { ...ord("sort_order") };
    if (curated_event_id) filters["curated_event_id"] = `eq.${curated_event_id}`;
    // Also support event_id as alias
    if (req.query.event_id) filters["curated_event_id"] = `eq.${req.query.event_id}`;
    if (artist_slug) filters["artist_slug"] = `eq.${artist_slug}`;
    return res.json(await get("event_artist_lineups", pq(filters)) ?? []);
  }

  if (!isAdminReq(req)) return res.status(401).json({ error: "Admin only" });
  const now = new Date().toISOString();

  if (req.method === "POST") {
    const { ok, data } = await ins("event_artist_lineups", { ...req.body, created_at: now });
    return ok
      ? res.json(Array.isArray(data) ? data[0] : data)
      : res.status(400).json({ error: "Failed" });
  }

  const id = (req.query.id ?? req.body?.id) as string;
  if (!id) return res.status(400).json({ error: "id required" });

  if (req.method === "PATCH") {
    const { ok } = await patch("event_artist_lineups", pq(eqf("id", id)), req.body);
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  if (req.method === "DELETE") {
    await del("event_artist_lineups", pq(eqf("id", id)));
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
