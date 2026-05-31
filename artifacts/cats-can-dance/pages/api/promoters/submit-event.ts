/**
 * POST /api/promoters/submit-event
 *
 * Allows a verified promoter to submit an event to the curated_events table.
 *
 * Auth: requires a Clerk session token in Authorization: Bearer header.
 *       We decode the sub to get user_id, then verify they are a promoter
 *       by looking up promoters.claimed_by = user_id.
 *
 * Moderation policy:
 *   - trusted promoters (promoters.trusted = true)  → submission_status = 'published'
 *   - non-trusted promoters                         → submission_status = 'pending'
 *
 * Body fields:
 *   title*       string   Event name
 *   url*         string   Ticket / event page URL
 *   event_date*  string   YYYY-MM-DD
 *   event_time   string   HH:MM (24h)
 *   city*        string   City name
 *   venue        string   Venue name
 *   blurb        string   Short description (max 200 chars)
 *   genre        string[] Genre tags e.g. ["House","Techno"]
 *   image_url    string   Event flyer / poster URL
 */

import type { NextApiRequest, NextApiResponse } from "next";

const SB = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK = process.env.SUPABASE_SERVICE_KEY ?? "";

const sbHeaders = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
  Prefer: "return=representation",
});

async function sbGet(table: string, qs = ""): Promise<any[]> {
  if (!SK) return [];
  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs}`, { headers: sbHeaders() });
    if (!r.ok) return [];
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch { return []; }
}

async function sbInsert(table: string, row: object): Promise<{ ok: boolean; data?: any; error?: string }> {
  if (!SK) return { ok: false, error: "Service key not configured" };
  try {
    const r = await fetch(`${SB}/rest/v1/${table}`, {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify(row),
    });
    const t = await r.text();
    const data = t ? JSON.parse(t) : null;
    if (!r.ok) return { ok: false, error: data?.message ?? `HTTP ${r.status}` };
    return { ok: true, data: Array.isArray(data) ? data[0] : data };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Lightweight JWT decode — no verification, just read sub claim */
function extractUserId(req: NextApiRequest): string | null {
  try {
    const auth = req.headers.authorization ?? "";
    if (!auth.startsWith("Bearer ")) return null;
    const token = auth.slice(7);
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return payload.sub ?? payload.user_id ?? null;
  } catch { return null; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── Auth ────────────────────────────────────────────────────────────────────
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  // ── Look up promoter by claimed_by ──────────────────────────────────────────
  const promoters = await sbGet(
    "promoters",
    `?claimed_by=eq.${encodeURIComponent(userId)}&limit=1`
  );
  const promoter = promoters[0];

  if (!promoter) {
    return res.status(403).json({
      error: "No verified promoter profile linked to this account.",
      hint: "Apply at /submit-event to become a verified promoter.",
    });
  }

  // ── Validate body ────────────────────────────────────────────────────────────
  const { title, url, event_date, event_time, city, venue, blurb, genre, image_url } = req.body ?? {};

  if (!title?.trim()) return res.status(400).json({ error: "title is required" });
  if (!url?.trim())   return res.status(400).json({ error: "url is required" });
  if (!event_date)    return res.status(400).json({ error: "event_date is required (YYYY-MM-DD)" });
  if (!city?.trim())  return res.status(400).json({ error: "city is required" });

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
    return res.status(400).json({ error: "event_date must be YYYY-MM-DD" });
  }

  // Don't allow past events
  const today = new Date().toISOString().split("T")[0];
  if (event_date < today) {
    return res.status(400).json({ error: "event_date must be in the future" });
  }

  // ── Determine publication status ─────────────────────────────────────────────
  // trusted promoters publish immediately; non-trusted go to pending queue
  const isTrusted = promoter.trusted === true;
  const submission_status = isTrusted ? "published" : "pending";
  const source = `promoter:${promoter.slug}`;

  // ── Insert ───────────────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const { ok, data, error } = await sbInsert("curated_events", {
    title:             title.trim().slice(0, 200),
    url:               url.trim(),
    source,
    city:              city.trim(),
    venue:             venue?.trim() ?? null,
    event_date,
    event_time:        event_time ?? null,
    blurb:             blurb?.trim().slice(0, 200) ?? null,
    genre:             Array.isArray(genre) ? genre.slice(0, 6) : [],
    image_url:         image_url?.trim() ?? null,
    is_featured:       false,
    submission_status,
    submitted_by:      userId,
    promoter_slug:     promoter.slug,
    created_at:        now,
    updated_at:        now,
  });

  if (!ok) {
    console.error("[submit-event]", error);
    return res.status(500).json({ error: "Failed to save event. Try again." });
  }

  return res.json({
    ok: true,
    submission_status,
    message: isTrusted
      ? "Event published! It will appear on Discover shortly."
      : "Event submitted for review. We'll approve it within 24 hours.",
    event: data,
    promoter: { slug: promoter.slug, name: promoter.name, trusted: isTrusted },
  });
}
