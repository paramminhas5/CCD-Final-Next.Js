/**
 * /api/booking-messages/:booking_id
 *
 * GET  — fetch full message thread for a booking (artist or promoter)
 *        Also marks messages as read for the requesting party.
 * POST { body, quote_inr?, quote_valid_hours? } — post a new message
 *
 * Auth: Clerk user must be either:
 *   - The artist who owns the booking (claimed_by = clerk user)
 *   - The promoter who created the booking (promoter_clerk_id OR email match)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbInsert, sbPatch, pq, eqf, ord } from "@/lib/db";
import { sendBookingEmail } from "@/lib/booking-email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  const bookingId = req.query.booking_id as string;

  // Fetch booking
  const bookings = await sbGet<any>("booking_requests", pq(eqf("id", bookingId)));
  if (!bookings?.length) return res.status(404).json({ error: "Booking not found" });
  const booking = bookings[0];

  // Determine caller's role
  let callerRole: "artist" | "promoter" | null = null;
  let callerName = "";

  // Check if caller is the artist
  if (booking.artist_id_resolved) {
    const artistRows = await sbGet<any>(
      "artists",
      pq({ ...eqf("id", booking.artist_id_resolved), ...eqf("claimed_by", clerkUserId) }),
    );
    if (artistRows?.length) {
      callerRole = "artist";
      callerName = artistRows[0].name;
    }
  }

  // Check if caller is the promoter
  if (!callerRole) {
    const promoRows = await sbGet<any>("promoter_profiles", pq(eqf("clerk_user_id", clerkUserId)));
    const promo = promoRows?.[0];
    if (
      booking.promoter_clerk_id === clerkUserId ||
      (promo && booking.requester_email === promo.email)
    ) {
      callerRole = "promoter";
      callerName = promo?.company_name ?? booking.requester_name ?? "";
    }
  }

  if (!callerRole) return res.status(403).json({ error: "Forbidden — you are not party to this booking" });

  // ── GET — fetch thread ─────────────────────────────────────────────────────
  if (req.method === "GET") {
    const messages = await sbGet<any>(
      "booking_messages",
      pq({ ...eqf("booking_id", bookingId), ...ord("created_at") }),
    );

    // Mark messages as read for this party
    const now = new Date().toISOString();
    if (callerRole === "artist") {
      await sbPatch<any>(
        "booking_messages",
        `?booking_id=eq.${bookingId}&sender_role=eq.promoter&read_by_artist=eq.false`,
        { read_by_artist: true },
      ).catch(() => {});
    }
    if (callerRole === "promoter") {
      await sbPatch<any>(
        "booking_messages",
        `?booking_id=eq.${bookingId}&sender_role=eq.artist&read_by_promoter=eq.false`,
        { read_by_promoter: true },
      ).catch(() => {});
    }

    return res.json(messages ?? []);
  }

  // ── POST — send message ────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { body: msgBody, quote_inr, quote_valid_hours } = req.body ?? {};
    if (!msgBody?.trim()) return res.status(400).json({ error: "message body required" });

    const now = new Date().toISOString();
    const { ok, data } = await sbInsert<any>("booking_messages", {
      booking_id: bookingId,
      sender_role: callerRole,
      sender_clerk_id: clerkUserId,
      sender_name: callerName,
      body: msgBody.trim(),
      is_system: false,
      quote_inr: quote_inr ? Number(quote_inr) : null,
      quote_valid_until: quote_valid_hours
        ? new Date(Date.now() + Number(quote_valid_hours) * 3600000).toISOString()
        : null,
      read_by_artist: callerRole === "artist",
      read_by_promoter: callerRole === "promoter",
      created_at: now,
    });

    if (!ok) return res.status(500).json({ error: "Failed to send message", detail: data });

    // Fire message_received email to the other party (non-blocking)
    if (process.env.RESEND_API_KEY) {
      try {
        let recipientEmail: string | null = null;
        let recipientName: string | null = null;
        if (callerRole === "artist") {
          recipientEmail = booking.requester_email;
          recipientName = booking.requester_name;
        } else {
          const artistRows = await sbGet<any>(
            "artists",
            pq(eqf("id", booking.artist_id_resolved ?? "")),
          );
          recipientEmail = artistRows?.[0]?.booking_email ?? null;
          recipientName = artistRows?.[0]?.name ?? null;
        }

        if (recipientEmail) {
          sendBookingEmail("message_received", {
            bookingId,
            artistName: booking.artist_name ?? "",
            artistEmail: recipientEmail,
            promoterName: booking.requester_name ?? "",
            promoterEmail: booking.requester_email ?? "",
            eventType: booking.event_type ?? null,
            eventDate: booking.event_date ?? null,
            eventDateEnd: booking.event_date_end ?? null,
            venueCity: booking.venue_city ?? null,
            venueName: booking.venue_name ?? null,
            budgetInr: booking.budget_inr ?? null,
            quotedInr: booking.quoted_inr ?? null,
            holdExpiresAt: booking.hold_expires_at ?? null,
            notes: booking.notes ?? null,
          }).catch(console.error);
        }
      } catch { /* non-fatal */ }
    }

    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
