/**
 * POST /api/admin/enrich-artists
 *
 * Stub — enrichment is queued externally. Returns ok immediately.
 * Admin only.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ ok: true, message: "Enrichment queued." });
}
