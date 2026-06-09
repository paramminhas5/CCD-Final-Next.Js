/**
 * /api/promoters
 *
 * GET              — public promoter list
 * GET ?user_id=xxx — promoter claimed by this Clerk user
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, eqf, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { user_id } = req.query as Record<string, string>;

  if (user_id) {
    // Return the promoter claimed by this user
    const rows = await get("promoters", pq(eqf("claimed_by", user_id))) as any[];
    return res.json(rows[0] ?? null);
  }

  const rows = await get("promoters", pq(ord("name")));
  return res.json(rows ?? []);
}
