/**
 * POST /api/booking-inquiry-v2
 *
 * Structured booking inquiry endpoint — writes to booking_requests with
 * all Phase-1 structured columns (event_type, event_date, budget_inr, etc.)
 * AND keeps legacy purpose blob for backward-compat with existing inbox views.
 *
 * Used by BookingForm component as primary endpoint; falls back to
 * /api/booking-inquiry (legacy) if this returns 404 — but with this file
 * in place, it should never fall back.
 *
 * Flow:
 *   1. Validate required fields
 *   2. Resolve artist_id from slug (direct DB call)
 *   3. Insert into booking_requests
 *   4. Fire new_inquiry email to artist via Resend (non-blocking)
 *   5. Return { ok: true }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbInsert, pq, eqf } from "@/lib/db";
import { sendBookingEmail } from "@/lib/booking-email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    artist_slug,
    artist_name,
    requester_name,
    requester_email,
    requester_phone,
    package_id,
    event_type,
    event_date,
    event_date_end,
    venue_name,
    venue_city,
    budget_inr,
    notes,
    source,
  } = req.body ?? {};

  // ── Validate required fields ───────────────────────────────────────────────
  if (!artist_slug || !artist_name || !requester_email || !requester_name) {
    return res.status(400).json({
      error: "artist_slug, artist_name, requester_name, requester_email are required",
    });
  }

  // ── Resolve artist_id from slug ────────────────────────────────────────────
  const artistRows = await sbGet<any>("artists", pq(eqf("slug", artist_slug)));
  const artist = artistRows?.[0] ?? null;
  const resolvedArtistId = artist?.id ?? null;

  const now = new Date().toISOString();

  // Legacy purpose blob — keeps old inbox views working
  const purposeParts = [
    event_type,
    event_date
      ? `Date: ${event_date}${event_date_end ? ` – ${event_date_end}` : ""}`
      : null,
    venue_name || venue_city
      ? `Venue: ${[venue_name, venue_city].filter(Boolean).join(", ")}`
      : null,
    budget_inr ? `Budget: ₹${Number(budget_inr).toLocaleString("en-IN")}` : null,
    notes,
  ]
    .filter(Boolean)
    .join(" | ");

  // ── Insert booking request ─────────────────────────────────────────────────
  const { ok, data } = await sbInsert<any>("booking_requests", {
    // Legacy fields (backward compat)
    artist_id: resolvedArtistId,
    artist_name,
    requester_email: requester_email.toLowerCase().trim(),
    requester_phone: requester_phone ?? null,
    purpose: purposeParts || null,
    forward_requested: true,
    ip_hash: null,
    user_agent: req.headers["user-agent"] ?? null,
    // Structured fields (Phase 1+)
    artist_id_resolved: resolvedArtistId,
    package_id: package_id ?? null,
    requester_name: requester_name.trim(),
    event_type: event_type ?? null,
    event_date: event_date ?? null,
    event_date_end: event_date_end ?? null,
    venue_name: venue_name ?? null,
    venue_city: venue_city ?? null,
    budget_inr: budget_inr ? Number(budget_inr) : null,
    notes: notes ?? null,
    status: "new",
    source: source ?? "marketplace",
    created_at: now,
    updated_at: now,
  });

  if (!ok) {
    return res.status(500).json({ error: "Failed to save booking request", detail: data });
  }

  // ── Fire notification email (non-blocking) ─────────────────────────────────
  if (artist?.booking_email && process.env.RESEND_API_KEY) {
    const bookingId = Array.isArray(data) ? data[0]?.id : data?.id ?? "";
    sendBookingEmail("new_inquiry", {
      bookingId,
      artistName: artist_name,
      artistEmail: artist.booking_email,
      promoterName: requester_name,
      promoterEmail: requester_email,
      eventType: event_type ?? null,
      eventDate: event_date ?? null,
      eventDateEnd: event_date_end ?? null,
      venueCity: venue_city ?? null,
      venueName: venue_name ?? null,
      budgetInr: budget_inr ? Number(budget_inr) : null,
      notes: notes ?? null,
    }).catch((err) => console.error("[booking-inquiry-v2 email]", err));
  }

  return res.json({
    ok: true,
    message: "Booking request submitted. The artist will be in touch.",
  });
}
