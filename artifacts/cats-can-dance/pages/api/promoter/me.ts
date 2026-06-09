/**
 * /api/promoter/me
 *
 * GET   — return own promoter profile
 * PATCH — update own promoter profile fields
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, patch, pq, eqf, clerkId } from "@/lib/api-helpers";

const ALLOWED_FIELDS = [
  "company_name", "contact_name", "bio", "logo_url", "website",
  "instagram", "primary_city", "cities", "genre_focus",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const uid = clerkId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const rows = await get("promoter_profiles", pq(eqf("clerk_user_id", uid))) as any[];
  if (!rows?.length) return res.status(404).json({ error: "No promoter profile found. Register first." });
  const promoter = rows[0];

  if (req.method === "GET") return res.json(promoter);

  if (req.method === "PATCH") {
    const profilePatch: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const k of ALLOWED_FIELDS) {
      if (req.body[k] !== undefined) profilePatch[k] = req.body[k];
    }
    const { ok } = await patch("promoter_profiles", pq(eqf("clerk_user_id", uid)), profilePatch);
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Update failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
