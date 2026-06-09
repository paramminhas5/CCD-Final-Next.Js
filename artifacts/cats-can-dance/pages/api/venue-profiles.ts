/**
 * /api/venue-profiles
 *
 * GET  ?city=&tier=  — public venue directory
 * POST (admin)       — create a venue profile
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, pq, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const { city, tier } = req.query as Record<string, string>;
    const filters: Record<string, string> = { ...ord("name") };
    if (city) filters["city"] = `ilike.*${city}*`;
    if (tier) filters["tier"] = `eq.${tier}`;
    return res.json(await get("venue_profiles", pq(filters)) ?? []);
  }

  if (req.method === "POST") {
    if (!isAdminReq(req)) return res.status(401).json({ error: "Admin only" });
    const now = new Date().toISOString();
    const { ok, data } = await ins("venue_profiles", { ...req.body, created_at: now, updated_at: now });
    return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
