/**
 * /api/user-role
 *
 * GET  ?user_id=<id>  — return role info for a user
 * POST (admin)        — grant / update a role
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, pq, eqf, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const userId = req.query.user_id as string;
    if (!userId) return res.json({ role: "user", entity_id: null, entity_slug: null, entity_name: null });
    const rows = await get("user_roles", `?user_id=eq.${encodeURIComponent(userId)}&limit=1`) as any[];
    if (!rows?.length) return res.json({ role: "user", entity_id: null, entity_slug: null, entity_name: null });
    return res.json(rows[0]);
  }

  if (req.method === "POST") {
    if (!isAdminReq(req)) return res.status(401).json({ error: "Admin only" });
    const now = new Date().toISOString();
    const existing = await get("user_roles", `?user_id=eq.${encodeURIComponent(req.body.user_id)}&limit=1`) as any[];
    if (existing.length) {
      const { ok } = await patch("user_roles", pq(eqf("user_id", req.body.user_id)), { ...req.body, updated_at: now });
      return ok ? res.json({ ok: true, action: "updated" }) : res.status(400).json({ error: "Failed" });
    }
    const { ok, data } = await ins("user_roles", { ...req.body, created_at: now, updated_at: now });
    return ok ? res.json({ ok: true, action: "created", data }) : res.status(400).json({ error: "Failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
