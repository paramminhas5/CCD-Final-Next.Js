/**
 * PATCH /api/role-applications/:id
 *
 * Admin reviews a role application (approve or reject).
 * On approval, automatically grants the role via user_roles table.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, pq, eqf, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdminReq(req)) return res.status(401).json({ error: "Admin only" });

  const id = req.query.id as string;
  const { status: newStatus, reviewer_id } = req.body ?? {};
  const now = new Date().toISOString();

  const { ok } = await patch("role_applications", pq(eqf("id", id)), {
    status: newStatus,
    reviewed_by: reviewer_id,
    reviewed_at: now,
  });

  // Auto-grant role on approval
  if (ok && newStatus === "approved") {
    const apps = await get("role_applications", pq(eqf("id", id))) as any[];
    if (apps.length) {
      const app = apps[0];
      const existing = await get("user_roles", pq(eqf("user_id", app.user_id))) as any[];
      const roleData = {
        role:        app.requested_role,
        entity_id:   app.entity_id,
        entity_slug: app.entity_slug,
        entity_name: app.display_name,
        granted_by:  reviewer_id,
        granted_at:  now,
        updated_at:  now,
      };
      if (existing.length) {
        await patch("user_roles", pq(eqf("user_id", app.user_id)), roleData);
      } else {
        await ins("user_roles", {
          user_id: app.user_id,
          email: app.email,
          ...roleData,
          created_at: now,
        });
      }
    }
  }

  return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
}
