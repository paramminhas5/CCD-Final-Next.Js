/**
 * GET /api/bookings/mine?status=:status
 *
 * Artist-authenticated inbox — returns all booking requests for the
 * Clerk-authenticated artist.
 *
 * Auth: Clerk middleware injects x-clerk-user-id header server-side.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, getArtistByUser, pq, eqf, ord } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  const artist = await getArtistByUser(clerkUserId);
  if (!artist) return res.status(404).json({ error: "No artist profile linked to this account" });

  const { status } = req.query as Record<string, string>;
  const filters: Record<string, string> = {
    ...eqf("artist_id_resolved", artist.id),
    ...ord("created_at", false),
  };
  if (status) filters["status"] = `eq.${status}`;

  const bookings = await sbGet("booking_requests", pq(filters));
  return res.json(bookings);
}
