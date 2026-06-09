/**
 * /api/admin/promoters
 *
 * GET  — list all promoters
 * POST { action, payload } — toggle_trust | delete | upsert
 *
 * Admin only.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, del, pq, eqf, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    return res.json({ promoters: await get("promoters", pq(ord("name"))) });
  }

  if (req.method === "POST") {
    const { action, payload } = req.body ?? {};
    const now = new Date().toISOString();
    const row = payload ?? req.body;

    if (action === "toggle_trust" && payload?.id) {
      const { ok } = await patch("promoters", pq(eqf("id", payload.id)), { trusted: payload.trusted, updated_at: now });
      return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
    }

    if (action === "delete" && payload?.id) {
      await del("promoters", pq(eqf("id", payload.id)));
      return res.json({ ok: true });
    }

    // upsert
    const { action: _a, payload: _p, created_at: _c, ...cleanRow } = row as any;
    if (cleanRow.id) {
      const { ok } = await patch("promoters", pq(eqf("id", cleanRow.id)), { ...cleanRow, updated_at: now });
      return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
    }
    const { ok, data } = await ins("promoters", { ...cleanRow, created_at: now, updated_at: now });
    return ok ? res.json(data) : res.status(400).json({ error: "Failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
