/**
 * booking-email.ts
 *
 * Transactional email helper for the CCD booking module.
 * Uses Resend (https://resend.com) — set RESEND_API_KEY env var.
 *
 * Graceful no-op when key is absent (dev / staging without email).
 *
 * Usage (server-side only — pages/api or api-server):
 *   import { sendBookingEmail } from "@/lib/booking-email";
 *   await sendBookingEmail("new_inquiry", booking, artist, promoter);
 */

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = "CCD Bookings <bookings@catscandance.com>";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";

// ── Types ──────────────────────────────────────────────────────────────────────
export type BookingEmailEvent =
  | "new_inquiry"       // → artist: you have a new booking request
  | "quoted"            // → promoter: artist has sent you a quote
  | "hold_placed"       // → promoter: artist placed a 48h hold
  | "confirmed"         // → both: booking confirmed 🎉
  | "declined"          // → promoter: artist declined
  | "cancelled"         // → artist: promoter cancelled
  | "message_received"  // → recipient: new message in thread
  | "fan_out_sent";     // → artist: brief received from promoter shortlist

export interface BookingEmailData {
  bookingId: string;
  artistName: string;
  artistEmail?: string | null;
  promoterName: string;
  promoterEmail: string;
  eventType?: string | null;
  eventDate?: string | null;
  eventDateEnd?: string | null;
  venueCity?: string | null;
  venueName?: string | null;
  budgetInr?: number | null;
  quotedInr?: number | null;
  holdExpiresAt?: string | null;
  notes?: string | null;
  senderName?: string;    // for message_received
  messageSnippet?: string; // first 200 chars of message body
}

// ── Resend API call ────────────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_KEY) {
    console.log(`[booking-email] RESEND_API_KEY not set — skipping email to ${to}: "${subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[booking-email] Resend error ${res.status}:`, err);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error("[booking-email] fetch error:", e.message);
    return false;
  }
}

// ── Brand HTML wrapper ─────────────────────────────────────────────────────────
function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;background:#f5f0e8;margin:0;padding:24px}
    .card{background:#fff;border:4px solid #1a1a1a;max-width:560px;margin:0 auto}
    .header{background:#1a1a1a;padding:20px 24px}
    .header h1{color:#f5e642;font-size:22px;font-weight:900;text-transform:uppercase;margin:0;letter-spacing:0.05em}
    .header p{color:#ffffff99;font-size:12px;text-transform:uppercase;margin:6px 0 0;letter-spacing:0.1em}
    .body{padding:24px}
    .badge{display:inline-block;background:#f5e642;color:#1a1a1a;font-weight:700;font-size:11px;
           text-transform:uppercase;padding:4px 10px;border:2px solid #1a1a1a;letter-spacing:0.08em}
    .badge.magenta{background:#e040fb;color:#fff}
    .badge.blue{background:#00bfff;color:#1a1a1a}
    .badge.lime{background:#aaff00;color:#1a1a1a}
    .badge.red{background:#ff3366;color:#fff}
    .row{margin:12px 0;font-size:14px;color:#1a1a1a}
    .label{font-size:11px;text-transform:uppercase;color:#666;letter-spacing:0.08em;font-weight:700}
    .value{font-size:15px;color:#1a1a1a;margin-top:2px}
    .cta{display:inline-block;background:#1a1a1a;color:#f5e642;font-weight:900;font-size:13px;
         text-transform:uppercase;padding:12px 22px;border:4px solid #1a1a1a;
         text-decoration:none;letter-spacing:0.06em;margin-top:20px}
    .divider{border:none;border-top:4px solid #1a1a1a;margin:20px 0}
    .footer{background:#1a1a1a;padding:14px 24px;font-size:11px;color:#ffffff60;text-transform:uppercase;letter-spacing:0.08em}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
    .snippet{background:#f5f0e8;border:2px solid #1a1a1a;padding:12px;font-size:13px;color:#1a1a1a;margin:12px 0;font-style:italic}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Cats Can Dance</h1>
      <p>Artist Booking Platform</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      catscandance.com · India's underground music platform<br/>
      <a href="${BASE_URL}/artist/dashboard" style="color:#f5e642">Artist Portal</a> &nbsp;·&nbsp;
      <a href="${BASE_URL}/promoter/dashboard" style="color:#f5e642">Promoter Dashboard</a>
    </div>
  </div>
</body>
</html>`;
}

// ── Date formatter ─────────────────────────────────────────────────────────────
function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

function fmtInr(n?: number | null): string {
  if (!n) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function eventBlock(d: BookingEmailData): string {
  const rows: string[] = [];
  if (d.eventType) rows.push(`<div class="row"><div class="label">Event type</div><div class="value">${d.eventType}</div></div>`);
  if (d.eventDate) {
    const dateStr = d.eventDateEnd && d.eventDateEnd !== d.eventDate
      ? `${fmtDate(d.eventDate)} → ${fmtDate(d.eventDateEnd)}`
      : fmtDate(d.eventDate);
    rows.push(`<div class="row"><div class="label">Date</div><div class="value">${dateStr}</div></div>`);
  }
  if (d.venueName || d.venueCity) rows.push(`<div class="row"><div class="label">Location</div><div class="value">${[d.venueName, d.venueCity].filter(Boolean).join(", ")}</div></div>`);
  if (d.budgetInr) rows.push(`<div class="row"><div class="label">Budget</div><div class="value">${fmtInr(d.budgetInr)}</div></div>`);
  return rows.join("");
}

// ── Email templates per event ──────────────────────────────────────────────────
const templates: Record<BookingEmailEvent, (d: BookingEmailData) => { to: "artist" | "promoter" | "both"; subject: string; html: string }> = {

  new_inquiry: (d) => ({
    to: "artist",
    subject: `New booking request — ${d.promoterName} wants to book you`,
    html: wrap(`
      <span class="badge">New Request</span>
      <h2 style="margin:16px 0 4px;font-size:22px;text-transform:uppercase">${d.promoterName}</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">wants to book <strong>${d.artistName}</strong></p>
      <hr class="divider"/>
      ${eventBlock(d)}
      ${d.notes ? `<div class="snippet">"${d.notes}"</div>` : ""}
      <hr class="divider"/>
      <p style="font-size:13px;color:#444">Open your Artist Portal to review the request, send a quote, or decline.</p>
      <a href="${BASE_URL}/artist/dashboard" class="cta">Open Artist Portal →</a>
    `),
  }),

  quoted: (d) => ({
    to: "promoter",
    subject: `${d.artistName} sent you a quote — ${fmtInr(d.quotedInr)}`,
    html: wrap(`
      <span class="badge magenta">Quote Received</span>
      <h2 style="margin:16px 0 4px;font-size:22px;text-transform:uppercase">${d.artistName}</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">has quoted <strong style="color:#1a1a1a;font-size:18px">${fmtInr(d.quotedInr)}</strong> for your booking request.</p>
      <hr class="divider"/>
      ${eventBlock(d)}
      <hr class="divider"/>
      <p style="font-size:13px;color:#444">Review the quote and place a hold to secure the date, or message the artist to negotiate.</p>
      <a href="${BASE_URL}/promoter/dashboard" class="cta">View Quote + Respond →</a>
    `),
  }),

  hold_placed: (d) => ({
    to: "promoter",
    subject: `Hold placed — ${d.artistName} is holding your date`,
    html: wrap(`
      <span class="badge blue">Hold Placed</span>
      <h2 style="margin:16px 0 4px;font-size:22px;text-transform:uppercase">${d.artistName}</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">has placed a hold on your booking.</p>
      <hr class="divider"/>
      ${eventBlock(d)}
      ${d.holdExpiresAt ? `<div class="row"><div class="label">Hold expires</div><div class="value" style="color:#e040fb;font-weight:700">${new Date(d.holdExpiresAt).toLocaleString("en-IN", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</div></div>` : ""}
      <hr class="divider"/>
      <p style="font-size:13px;color:#444">Confirm the booking before the hold expires to lock in the date.</p>
      <a href="${BASE_URL}/promoter/dashboard" class="cta">Confirm Booking →</a>
    `),
  }),

  confirmed: (d) => ({
    to: "both",
    subject: `✅ Booking confirmed — ${d.artistName} × ${d.promoterName}`,
    html: wrap(`
      <span class="badge lime">Confirmed ✅</span>
      <h2 style="margin:16px 0 4px;font-size:24px;text-transform:uppercase">${d.artistName}</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">Your booking with <strong>${d.promoterName}</strong> is confirmed.</p>
      <hr class="divider"/>
      ${eventBlock(d)}
      ${d.quotedInr ? `<div class="row"><div class="label">Agreed fee</div><div class="value" style="font-weight:700;font-size:18px">${fmtInr(d.quotedInr)}</div></div>` : ""}
      <hr class="divider"/>
      <p style="font-size:13px;color:#444">Use the message thread to coordinate logistics, tech rider, and load-in times.</p>
      <a href="${BASE_URL}/artist/dashboard" class="cta">Open Message Thread →</a>
    `),
  }),

  declined: (d) => ({
    to: "promoter",
    subject: `${d.artistName} is unavailable for this booking`,
    html: wrap(`
      <span class="badge red">Unavailable</span>
      <h2 style="margin:16px 0 4px;font-size:22px;text-transform:uppercase">${d.artistName}</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">is not available for this booking request.</p>
      <hr class="divider"/>
      ${eventBlock(d)}
      <hr class="divider"/>
      <p style="font-size:13px;color:#444">Browse more artists on the marketplace — filter by your date and city.</p>
      <a href="${BASE_URL}/book" class="cta">Browse Artists →</a>
    `),
  }),

  cancelled: (d) => ({
    to: "artist",
    subject: `Booking cancelled by ${d.promoterName}`,
    html: wrap(`
      <span class="badge red">Cancelled</span>
      <h2 style="margin:16px 0 4px;font-size:22px;text-transform:uppercase">${d.promoterName}</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">has cancelled the booking for <strong>${d.artistName}</strong>.</p>
      <hr class="divider"/>
      ${eventBlock(d)}
      <hr class="divider"/>
      <p style="font-size:13px;color:#444">Your calendar has been freed. Open your portal to manage availability.</p>
      <a href="${BASE_URL}/artist/dashboard" class="cta">Open Artist Portal →</a>
    `),
  }),

  message_received: (d) => ({
    to: "both", // caller decides which address to actually use
    subject: `New message from ${d.senderName ?? "your booking contact"}`,
    html: wrap(`
      <span class="badge">New Message</span>
      <h2 style="margin:16px 0 4px;font-size:20px;text-transform:uppercase">${d.senderName ?? "Message"}</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">sent you a message about the <strong>${d.artistName} × ${d.promoterName}</strong> booking.</p>
      ${d.messageSnippet ? `<div class="snippet">"${d.messageSnippet.slice(0, 200)}${d.messageSnippet.length > 200 ? "…" : ""}"</div>` : ""}
      <hr class="divider"/>
      <a href="${BASE_URL}/artist/dashboard" class="cta">View Thread →</a>
    `),
  }),

  fan_out_sent: (d) => ({
    to: "artist",
    subject: `Booking brief from ${d.promoterName}`,
    html: wrap(`
      <span class="badge blue">Brief Received</span>
      <h2 style="margin:16px 0 4px;font-size:22px;text-transform:uppercase">${d.promoterName}</h2>
      <p style="color:#666;font-size:13px;margin:0 0 16px">added you to their shortlist and sent a brief for <strong>${d.artistName}</strong>.</p>
      <hr class="divider"/>
      ${eventBlock(d)}
      ${d.notes ? `<div class="snippet">"${d.notes}"</div>` : ""}
      <hr class="divider"/>
      <p style="font-size:13px;color:#444">Review the brief and respond — you can quote, hold, or decline directly from your portal.</p>
      <a href="${BASE_URL}/artist/dashboard" class="cta">Review Brief →</a>
    `),
  }),
};

// ── Public send function ────────────────────────────────────────────────────────
export async function sendBookingEmail(
  event: BookingEmailEvent,
  data: BookingEmailData,
  /** Override which address(es) receive the email. Default: template decides. */
  override?: { toArtist?: boolean; toPromoter?: boolean },
): Promise<{ artistSent: boolean; promoterSent: boolean }> {
  const tmpl = templates[event](data);

  const sendToArtist  = override?.toArtist  ?? (tmpl.to === "artist"  || tmpl.to === "both");
  const sendToPromoter= override?.toPromoter ?? (tmpl.to === "promoter"|| tmpl.to === "both");

  const [artistSent, promoterSent] = await Promise.all([
    sendToArtist && data.artistEmail
      ? send(data.artistEmail, tmpl.subject, tmpl.html)
      : Promise.resolve(false),
    sendToPromoter && data.promoterEmail
      ? send(data.promoterEmail, tmpl.subject + (tmpl.to === "both" ? "" : ""), tmpl.html)
      : Promise.resolve(false),
  ]);

  return { artistSent: !!artistSent, promoterSent: !!promoterSent };
}

/**
 * Convenience: send booking email from within the /api proxy
 * (no async context needed — fire and forget via void).
 */
export function fireBookingEmail(
  event: BookingEmailEvent,
  data: BookingEmailData,
  override?: { toArtist?: boolean; toPromoter?: boolean },
): void {
  void sendBookingEmail(event, data, override).catch(e =>
    console.error("[booking-email] fire error:", e)
  );
}
