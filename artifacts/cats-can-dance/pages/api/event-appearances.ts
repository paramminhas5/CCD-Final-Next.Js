/**
 * /api/event-appearances
 *
 * GET  ?artist_slug=|artist_id=|city=|year=  — public gigography
 * POST (admin) — create an appearance record
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, pq, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const { artist_id, artist_slug, city, year } = req.query as Record<string, string>;
    const filters: Record<string, string> = { ...ord("event_date", false) };
    if (artist_id)   filters["artist_id"]   = `eq.${artist_id}`;
    if (artist_slug) filters["artist_slug"] = `eq.${artist_slug}`;
    if (city)        filters["city"]        = `ilike.*${city}*`;
    if (year)        filters["year"]        = `eq.${year}`;
    return res.json(await get("event_appearances", pq(filters)) ?? []);
  }

  if (req.method === "POST") {
    if (!isAdminReq(req)) return res.status(401).json({ error: "Admin only" });
    const { ok, data } = await ins("event_appearances", {
      ...req.body,
      created_at: new Date().toISOString(),
    });
    return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
