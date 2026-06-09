/**
 * /api/artist-press
 *
 * GET    ?artist_slug=<slug>  — list press items
 * POST   { ... }              — create
 * PATCH  ?id=<uuid>          — update
 * DELETE ?id=<uuid>          — delete
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, del, pq, eqf, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const filters: Record<string, string> = { ...ord("date_published", false) };
    if (req.query.artist_slug) filters["artist_slug"] = `eq.${req.query.artist_slug}`;
    if (req.query.artist_id)   filters["artist_id"]   = `eq.${req.query.artist_id}`;
    return res.json(await get("artist_press", pq(filters)) ?? []);
  }

  const now = new Date().toISOString();

  if (req.method === "POST") {
    const { ok, data } = await ins("artist_press", { ...req.body, created_at: now, updated_at: now });
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed to create press item" });
  }

  if (req.method === "PATCH") {
    const id = (req.query.id ?? req.body?.id) as string;
    if (!id) return res.status(400).json({ error: "id required" });
    const { ok, data } = await patch("artist_press", pq(eqf("id", id)), { ...req.body, updated_at: now });
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Update failed" });
  }

  if (req.method === "DELETE") {
    const id = (req.query.id ?? req.body?.id) as string;
    if (!id) return res.status(400).json({ error: "id required" });
    await del("artist_press", pq(eqf("id", id)));
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
