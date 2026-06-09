/**
 * /api/role-applications
 *
 * GET  (admin) ?status= — list role applications
 * POST         — submit a new role application (any authenticated user)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, pq, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    if (!isAdminReq(req)) return res.status(401).json({ error: "Admin only" });
    const filters: Record<string, string> = { ...ord("created_at", false) };
    if (req.query.status) filters["status"] = `eq.${req.query.status}`;
    return res.json(await get("role_applications", pq(filters)) ?? []);
  }

  if (req.method === "POST") {
    const { user_id, email, display_name, requested_role, entity_id, entity_slug, message, links } = req.body ?? {};
    if (!user_id || !email || !requested_role) {
      return res.status(400).json({ error: "user_id, email, requested_role required" });
    }
    const { ok } = await ins("role_applications", {
      user_id,
      email,
      display_name,
      requested_role,
      entity_id: entity_id ?? null,
      entity_slug: entity_slug ?? null,
      message: message ?? null,
      links: links ?? {},
      status: "pending",
      created_at: new Date().toISOString(),
    });
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
