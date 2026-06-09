/**
 * POST /api/booking-inquiry  (v1 legacy)
 *
 * Legacy flat-field booking inquiry. Kept for backward-compat with any
 * older clients. New code should use /api/booking-inquiry-v2.
 *
 * Body: { artist_slug, artist_name, requester_name, requester_email,
 *         requester_phone?, purpose?, event_date?, venue?, budget?, notes? }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, pq, eqf } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    artist_slug, artist_name,
    requester_name, requester_email, requester_phone,
    purpose, event_date, venue, budget, notes,
  } = req.body ?? {};

  if (!artist_slug || !artist_name || !requester_email || !requester_name) {
    return res.status(400).json({ error: "artist_slug, artist_name, requester_name, requester_email required" });
  }

  const artistRows = await get("artists", pq(eqf("slug", artist_slug))) as any[];
  const artistBookingEmail = artistRows?.[0]?.booking_email ?? null;
  const now = new Date().toISOString();

  const purposeStr = [
    purpose,
    event_date ? `Date: ${event_date}` : null,
    venue ? `Venue: ${venue}` : null,
    budget ? `Budget: ${budget}` : null,
    notes,
  ].filter(Boolean).join(" | ") || null;

  const { ok, data } = await ins("booking_requests", {
    artist_id: artistRows?.[0]?.id ?? null,
    artist_id_resolved: artistRows?.[0]?.id ?? null,
    artist_name,
    requester_name: requester_name.trim(),
    requester_email: requester_email.toLowerCase().trim(),
    requester_phone: requester_phone ?? null,
    purpose: purposeStr,
    event_date: event_date ?? null,
    venue_name: venue ?? null,
    budget_inr: budget ? Number(budget.toString().replace(/[^0-9]/g, "")) || null : null,
    notes: notes ?? null,
    status: "new",
    source: "artist_page",
    forward_requested: true,
    user_agent: req.headers["user-agent"] ?? null,
    ip_hash: null,
    created_at: now,
    updated_at: now,
  });

  if (!ok) return res.status(500).json({ error: "Failed to save booking request" });

  // Fire email (non-blocking)
  if (artistBookingEmail && process.env.RESEND_API_KEY) {
    const FROM_EMAIL = process.env.EMAIL_FROM ?? "hello@catscandance.com";
    const html = `<p>New booking inquiry for <strong>${artist_name}</strong> from <strong>${requester_name}</strong> (${requester_email}).</p>${purposeStr ? `<p>${purposeStr}</p>` : ""}<p>Log in at <a href="https://catscandance.com/artist/dashboard">catscandance.com/artist/dashboard</a></p>`;
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Cats Can Dance <${FROM_EMAIL}>`,
        to: [artistBookingEmail],
        subject: `New booking inquiry — ${requester_name}`,
        html,
      }),
    }).catch(err => console.error("[booking-inquiry email]", err));
  }

  return res.json({ ok: true, message: "Booking inquiry submitted. The artist will be in touch." });
}
