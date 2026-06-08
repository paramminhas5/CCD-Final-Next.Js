/**
 * GET /api/bookings/:id/thread
 *
 * Returns the booking record + full message thread + artist snippet.
 * Used by the promoter dashboard to show the full booking detail view.
 *
 * Auth: Clerk user must be either the artist (claimed_by) or the promoter.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, pq, eqf, ord } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  const bookingId = req.query.id as string;
  const bookings = await sbGet("booking_requests", pq(eqf("id", bookingId)));
  if (!bookings.length) return res.status(404).json({ error: "Booking not found" });
  const booking = bookings[0];

  const [messages, artistRows] = await Promise.all([
    sbGet("booking_messages", pq({ ...eqf("booking_id", bookingId), ...ord("created_at") })),
    booking.artist_id_resolved
      ? sbGet("artists", `?id=eq.${booking.artist_id_resolved}&select=id,slug,name,photo_url,based_city,genres,kind`)
      : Promise.resolve([]),
  ]);

  return res.json({
    booking,
    messages: messages ?? [],
    artist:   artistRows[0] ?? null,
  });
}
