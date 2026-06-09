/**
 * /api/artist-dates
 *
 * GET  ?artist_id=<uuid>  — public upcoming dates for an artist
 * POST { artist_id, city, event_date, ... } — create date entry
 * DELETE ?id=<uuid>       — delete a date entry
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, del, pq, eqf, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const filters: Record<string, string> = { ...eqf("is_public", "true"), ...ord("event_date") };
    if (req.query.artist_id) filters["artist_id"] = `eq.${req.query.artist_id}`;
    return res.json(await get("artist_dates", pq(filters)) ?? []);
  }

  if (req.method === "POST") {
    const { ok, data } = await ins("artist_dates", { ...req.body, created_at: new Date().toISOString() });
    return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
  }

  if (req.method === "DELETE") {
    const id = (req.query.id ?? req.body?.id) as string;
    if (!id) return res.status(400).json({ error: "id required" });
    await del("artist_dates", pq(eqf("id", id)));
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
