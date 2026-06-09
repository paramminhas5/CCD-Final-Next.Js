/**
 * GET /api/xp-events?user_id=<id>
 *
 * Returns recent XP event history for a user (last 50 events).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { user_id } = req.query as Record<string, string>;
  if (!user_id) return res.status(400).json({ error: "user_id required" });

  const rows = await get(
    "xp_events",
    `?user_id=eq.${encodeURIComponent(user_id)}&order=created_at.desc&limit=50`,
  );
  return res.json(rows ?? []);
}
