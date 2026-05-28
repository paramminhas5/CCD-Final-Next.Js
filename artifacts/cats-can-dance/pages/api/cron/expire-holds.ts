/**
 * /api/cron/expire-holds
 *
 * Vercel Cron Job — runs every hour.
 * Finds booking_requests with status = 'held' whose hold_expires_at
 * has passed, transitions them back to 'new' (re-opens for requoting),
 * and posts a system message to the thread.
 *
 * Vercel cron config in vercel.json:
 *   { "crons": [{ "path": "/api/cron/expire-holds", "schedule": "0 * * * *" }] }
 *
 * Protected by ADMIN_PASSWORD header (same pattern as other cron routes).
 */
import type { NextApiRequest, NextApiResponse } from "next";

const SB  = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK  = process.env.SUPABASE_SERVICE_KEY ?? "";
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "";

const H = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

async function sbReq(table: string, qs = "", method = "GET", body?: unknown) {
  const r = await fetch(`${SB}/rest/v1/${table}${qs}`, {
    method,
    headers: H(),
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });
  const t = await r.text();
  return { ok: r.ok, data: t ? JSON.parse(t) : null };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Accept Vercel cron (no auth header) or manual trigger with admin password
  const isVercelCron = req.headers["x-vercel-cron"] === "1";
  const isAdmin = !!ADMIN_PW && req.headers["x-admin-password"] === ADMIN_PW;
  if (!isVercelCron && !isAdmin) return res.status(401).json({ error: "Unauthorized" });

  const now = new Date().toISOString();

  // Find all held bookings whose hold has expired
  const { ok, data: expiredRows } = await sbReq(
    "booking_requests",
    `?status=eq.held&hold_expires_at=lt.${now}&select=id,artist_name,requester_email,requester_name,promoter_name`,
  );
  if (!ok || !Array.isArray(expiredRows) || expiredRows.length === 0) {
    return res.json({ ok: true, expired: 0 });
  }

  let expiredCount = 0;
  for (const booking of expiredRows) {
    // Transition back to 'new' — hold lapsed, either party can re-quote
    const { ok: patchOk } = await sbReq(
      "booking_requests",
      `?id=eq.${booking.id}`,
      "PATCH",
      { status: "new", hold_expires_at: null, updated_at: now },
    );
    if (!patchOk) continue;

    // Post system message so both parties see what happened
    await sbReq("booking_messages", "", "POST", {
      booking_id: booking.id,
      sender_role: "system",
      sender_clerk_id: null,
      sender_name: "CCD Booking",
      body: `⏰ Hold expired — the 48h hold on this booking lapsed without confirmation. The booking is back to **New** status. Either party can re-initiate a quote.`,
      is_system: true,
      read_by_artist: false,
      read_by_promoter: false,
      created_at: now,
    });

    expiredCount++;
  }

  console.log(`[expire-holds] expired ${expiredCount} of ${expiredRows.length} held bookings`);
  return res.json({ ok: true, expired: expiredCount, total_found: expiredRows.length });
}
