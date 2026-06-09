/**
 * GET /api/curated-events/by-promoter?promoter_slug=<slug>
 *
 * Returns all events (any status) submitted by a specific promoter.
 * Used in PromoterPortal.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, eqf, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { promoter_slug } = req.query as Record<string, string>;
  if (!promoter_slug) return res.json({ events: [] });

  const rows = await get("curated_events", pq({
    ...eqf("promoter_slug", promoter_slug),
    ...ord("created_at", false),
  })) as any[];

  return res.json({ events: rows ?? [] });
}
