/**
 * /api/admin/signups
 *
 * GET ?format=csv  — download CSV of all early access signups
 * GET              — return JSON array of signups
 *
 * Admin only (x-admin-password header required).
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });

  const rows = await get("early_access_signups", pq(ord("created_at", false))) as any[];

  if (req.query.format === "csv") {
    const csv = [
      "id,email,source,created_at",
      ...rows.map((r: any) =>
        [r.id, r.email, r.source ?? "", r.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=signups.csv");
    return res.send(csv);
  }

  return res.json({ signups: rows });
}
