/**
 * /api/curated-events
 *
 * GET  ?city=&limit=&featured= — public published events list
 * (Admin CRUD lives in /api/functions/v1/admin-curated-events via proxy)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, eqf, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { city, limit, featured } = req.query as Record<string, string>;

  const filters: Record<string, string> = {
    ...eqf("submission_status", "published"),
    ...ord("event_date"),
  };
  if (city) filters["city"] = `ilike.%${city}%`;
  if (limit) filters["limit"] = limit;
  if (featured === "true") filters["is_featured"] = "eq.true";

  const rows = await get("curated_events", pq(filters));
  return res.json(rows ?? []);
}
