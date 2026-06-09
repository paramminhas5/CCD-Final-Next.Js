/**
 * /api/fan-profiles
 *
 * GET ?user_id=<clerk_id>   — fetch single fan profile
 * GET ?limit=N              — leaderboard (top N by XP)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { user_id, userId, limit } = req.query as Record<string, string>;
  const uid = user_id ?? userId;

  if (uid) {
    const rows = await get("fan_profiles", `?user_id=eq.${encodeURIComponent(uid)}&limit=1`) as any[];
    return res.json(rows[0] ?? null);
  }

  const rows = await get("fan_profiles", `?order=xp.desc&limit=${limit ?? 50}`);
  return res.json(rows ?? []);
}
