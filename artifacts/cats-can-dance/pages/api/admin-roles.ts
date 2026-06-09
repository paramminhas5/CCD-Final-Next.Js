/**
 * GET /api/admin-roles
 *
 * Returns all user role assignments.
 * Admin only.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });

  return res.json(await get("user_roles", pq(ord("created_at", false))) ?? []);
}
