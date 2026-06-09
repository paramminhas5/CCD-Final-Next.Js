/**
 * GET /api/promoters/by-user?user_id=<clerk_id>
 *
 * Returns the promoter profile claimed by this Clerk user, or null.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, eqf } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const userId = req.query.user_id as string;
  if (!userId) return res.json(null);

  const rows = await get("promoters", pq(eqf("claimed_by", userId))) as any[];
  return res.json(rows[0] ?? null);
}
