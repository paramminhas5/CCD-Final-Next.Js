/**
 * PATCH /api/bookings/:id/status
 *
 * Artist-authenticated state machine transition.
 * Body: { status: "quoted" | "held" | "confirmed" | "declined" | ..., quoted_inr?, hold_hours? }
 *
 * Valid transitions:
 *   new       → quoted, declined
 *   quoted    → held, declined
 *   held      → confirmed, declined
 *   confirmed → completed, cancelled
 *   declined  → (terminal)
 *   cancelled → (terminal)
 *   completed → (terminal)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbPatch, getArtistByUser, pq, eqf } from "@/lib/db";
import { fireBookingEmail } from "@/lib/booking-email";

const VALID_TRANSITIONS: Record<string, string[]> = {
  new:       ["quoted", "declined"],
  quoted:    ["held",   "declined"],
  held:      ["confirmed", "declined"],
  confirmed: ["completed", "cancelled"],
  declined:  [],
  cancelled: [],
  completed: [],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ error: "Method not allowed" });

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  const artist = await getArtistByUser(clerkUserId);
  if (!artist) return res.status(404).json({ error: "No artist profile linked to this account" });

  const bookingId = req.query.id as string;
  const { status: newStatus, quoted_inr, hold_hours = 48 } = req.body ?? {};

  if (!newStatus) return res.status(400).json({ error: "status is required" });

  // Fetch booking — must belong to this artist
  const bookings = await sbGet("booking_requests", pq({ ...eqf("id", bookingId), ...eqf("artist_id_resolved", artist.id) }));
  if (!bookings.length) return res.status(404).json({ error: "Booking not found or not yours" });
  const booking = bookings[0];

  const allowed = VALID_TRANSITIONS[booking.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return res.status(400).json({
      error: `Cannot transition from '${booking.status}' to '${newStatus}'. Allowed: ${allowed.join(", ") || "none"}`,
    });
  }

  const now = new Date().toISOString();
  const changes: Record<string, any> = { status: newStatus, updated_at: now };
  if (newStatus === "quoted"    && quoted_inr)  changes.quoted_inr      = Number(quoted_inr);
  if (newStatus === "held")                     changes.hold_expires_at = new Date(Date.now() + Number(hold_hours) * 3_600_000).toISOString();
  if (newStatus === "confirmed")                changes.confirmed_at    = now;

  const { ok, data } = await sbPatch("booking_requests", pq(eqf("id", bookingId)), changes);
  if (!ok) return res.status(500).json({ error: "Status update failed" });

  // Fire transactional email (non-blocking)
  const emailEventMap: Record<string, string> = {
    quoted: "quoted", held: "hold_placed", confirmed: "confirmed",
    declined: "declined", cancelled: "cancelled",
  };
  const emailEvent = emailEventMap[newStatus];
  if (emailEvent && booking.requester_email && process.env.RESEND_API_KEY) {
    fireBookingEmail(emailEvent as any, {
      bookingId,
      artistName:    artist.name,
      artistEmail:   artist.booking_email ?? null,
      promoterName:  booking.requester_name ?? booking.requester_email,
      promoterEmail: booking.requester_email,
      eventType:     booking.event_type    ?? null,
      eventDate:     booking.event_date    ?? null,
      eventDateEnd:  booking.event_date_end ?? null,
      venueCity:     booking.venue_city    ?? null,
      venueName:     booking.venue_name    ?? null,
      budgetInr:     booking.budget_inr    ?? null,
      quotedInr:     newStatus === "quoted" ? (Number(quoted_inr) || null) : (booking.quoted_inr ?? null),
      holdExpiresAt: newStatus === "held" ? changes.hold_expires_at : null,
      notes:         booking.notes         ?? null,
    });
  }

  return res.json({ ok: true, status: newStatus });
}
