/**
 * /api/site-settings
 *
 * GET         — returns site settings (public)
 * PATCH (admin) — update site settings
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, pq, eqf, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const rows = await get("site_settings", pq(eqf("id", "main"))) as any[];
    return res.json(rows[0] ?? null);
  }

  if (req.method === "PATCH") {
    if (!isAdminReq(req)) return res.status(401).json({ error: "Admin only" });
    const existing = await get("site_settings", pq(eqf("id", "main"))) as any[];
    const now = new Date().toISOString();
    if (existing.length) {
      await patch("site_settings", pq(eqf("id", "main")), { ...req.body, updated_at: now });
    } else {
      const { created_at: _drop, ...safeSettings } = req.body ?? {};
      await ins("site_settings", { id: "main", ...safeSettings, updated_at: now });
    }
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
