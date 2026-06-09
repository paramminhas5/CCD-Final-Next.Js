/**
 * GET /api/admin/rsvps?event_slug=<slug>
 *
 * Returns RSVP list, optionally filtered by event_slug.
 * Admin only.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });

  const filters: Record<string, string> = { ...ord("created_at", false) };
  if (req.query.event_slug) filters["event_slug"] = `eq.${req.query.event_slug}`;

  const rsvps = await get("event_rsvps", `?${Object.entries(filters).map(([k, v]) => `${k}=${v}`).join("&")}`);
  return res.json({ rsvps: rsvps ?? [] });
}
