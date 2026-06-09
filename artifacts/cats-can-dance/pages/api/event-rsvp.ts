/**
 * POST /api/event-rsvp
 *
 * Body: { event_slug, name, email, plus_ones? }
 * Saves RSVP and fires a confirmation email via Resend.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, pq, eqf } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { event_slug, name, email, plus_ones } = req.body ?? {};
  if (!event_slug || !name || !email) {
    return res.status(400).json({ error: "event_slug, name, email required" });
  }

  const { ok } = await ins("event_rsvps", {
    event_slug,
    name,
    email,
    plus_ones: Number(plus_ones) || 0,
    created_at: new Date().toISOString(),
  });
  if (!ok) return res.status(500).json({ error: "Failed to save RSVP" });

  // Send confirmation email (non-blocking)
  const RESEND_KEY = process.env.RESEND_API_KEY ?? "";
  const FROM_EMAIL = process.env.EMAIL_FROM ?? "hello@catscandance.com";
  const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";

  if (RESEND_KEY) {
    const eventRows = await get("events", pq(eqf("slug", event_slug))) as any[];
    const ev = eventRows[0] ?? null;
    const eventName  = ev?.title ? `Cats Can Dance — ${ev.title}` : "Cats Can Dance";
    const eventDate  = ev?.date  ?? "";
    const eventVenue = ev?.venue ?? "";
    const eventCity  = ev?.city  ?? "";
    const eventUrl   = `${SITE_URL}/events/${event_slug}`;
    const plusStr    = Number(plus_ones) > 0 ? ` (+${plus_ones} guest${Number(plus_ones) > 1 ? "s" : ""})` : "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="background:#f5f0e8;margin:0;padding:20px;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td style="background:#1a1a1a;padding:22px 28px;border:4px solid #1a1a1a;">
      <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:22px;color:#f5f0e8;text-transform:uppercase;letter-spacing:2px;">
        CATS<span style="color:#e040fb;">.</span>CAN<span style="color:#e040fb;">.</span>DANCE
      </div>
    </td></tr>
    <tr><td style="background:#f5e642;padding:18px 28px;border-left:4px solid #1a1a1a;border-right:4px solid #1a1a1a;border-bottom:4px solid #1a1a1a;">
      <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:20px;text-transform:uppercase;color:#1a1a1a;">✓ You're On The List${plusStr}</div>
    </td></tr>
    <tr><td style="background:#f5f0e8;padding:24px 28px;border-left:4px solid #1a1a1a;border-right:4px solid #1a1a1a;border-bottom:4px solid #1a1a1a;">
      <p style="font-family:'Courier New',monospace;font-size:16px;color:#1a1a1a;text-transform:uppercase;margin:0 0 6px;">${eventName}</p>
      ${eventDate  ? `<p style="color:#555;font-size:13px;margin:0 0 4px;">📅 ${eventDate}</p>` : ""}
      ${eventVenue ? `<p style="color:#555;font-size:13px;margin:0 0 4px;">📍 ${eventVenue}${eventCity ? `, ${eventCity}` : ""}</p>` : ""}
      <p style="color:#888;font-size:12px;margin:16px 0 0;">Name on the door: <strong style="color:#1a1a1a;">${name}${plusStr}</strong></p>
      <div style="margin-top:20px;">
        <a href="${eventUrl}" style="display:inline-block;background:#1a1a1a;color:#f5f0e8;font-family:'Courier New',monospace;font-weight:bold;font-size:12px;padding:12px 20px;text-decoration:none;text-transform:uppercase;border:4px solid #1a1a1a;">EVENT DETAILS →</a>
      </div>
    </td></tr>
  </table>
</body></html>`;

    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `Cats Can Dance <${FROM_EMAIL}>`,
        to: [email],
        subject: `✓ You're on the list — ${eventName}`,
        html,
      }),
    }).catch(err => console.error("[rsvp-email]", err));
  }

  return res.json({ ok: true });
}
