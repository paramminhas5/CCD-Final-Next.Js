/**
 * Booking requests — top-level routes
 *
 * GET  /api/bookings?artist_id_resolved=:id&status=:status
 *      Returns booking requests for an artist (portal inbox)
 *
 * GET  /api/bookings/mine    → /api/bookings/mine.ts
 * GET  /api/bookings/:id/thread → /api/bookings/[id]/thread.ts
 * PATCH /api/bookings/:id/status → /api/bookings/[id]/status.ts
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, pq, eqf, ord } from "@/lib/db";

const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "";
const isAdmin  = (req: NextApiRequest) =>
  !!ADMIN_PW && req.headers["x-admin-password"] === ADMIN_PW;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const { artist_id_resolved, artist_id, status } = req.query as Record<string, string>;
    const filters: Record<string, string> = { ...ord("created_at", false) };
    if (artist_id_resolved) filters["artist_id_resolved"] = `eq.${artist_id_resolved}`;
    if (artist_id)          filters["artist_id"]          = `eq.${artist_id}`;
    if (status)             filters["status"]             = `eq.${status}`;

    const bookings = await sbGet("booking_requests", pq(filters));
    return res.json(bookings);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
