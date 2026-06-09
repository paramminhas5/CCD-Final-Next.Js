/**
 * GET /api/promoter/bookings?status=<status>
 *
 * Returns all booking requests made by the signed-in promoter.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, eqf, ord, clerkId } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const uid = clerkId(req);
  if (!uid) return res.status(401).json({ error: "Unauthorized" });

  const filters: Record<string, string> = {
    ...eqf("promoter_clerk_id", uid),
    ...ord("created_at", false),
  };
  if (req.query.status) filters["status"] = `eq.${req.query.status}`;

  const bookings = await get("booking_requests", pq(filters));
  return res.json(bookings ?? []);
}
