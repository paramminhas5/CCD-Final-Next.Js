/**
 * POST /api/promoters/:slug/claim
 *
 * Links a Clerk user_id to a promoter profile.
 * Idempotent if already claimed by the same user; 409 if claimed by someone else.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, patch, pq, eqf } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const slug = req.query.slug as string;
  const { user_id } = req.body ?? {};
  if (!user_id) return res.status(400).json({ error: "user_id required" });

  const rows = await get("promoters", pq(eqf("slug", slug))) as any[];
  if (!rows?.length) return res.status(404).json({ error: "Promoter not found" });
  if (rows[0].claimed_by) return res.status(409).json({ error: "Already claimed" });

  const { ok } = await patch("promoters", pq(eqf("slug", slug)), {
    claimed_by: user_id,
    updated_at: new Date().toISOString(),
  });
  return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed" });
}
