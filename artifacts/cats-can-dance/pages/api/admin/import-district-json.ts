/**
 * POST /api/admin/import-district-json
 *
 * Admin-only endpoint to bulk-import District events from a JSON array.
 * Accepts any combination of fields and normalises them to curated_events schema.
 * Deduplicates by URL — existing events are skipped (not overwritten).
 *
 * Auth: x-admin-password header
 *
 * Body: { events: Array<{title, url, event_date?, city?, venue?, genre?, blurb?, image_url?, event_time?}> }
 * Response: { ok, upserted, skipped, total, errors }
 */

import type { NextApiRequest, NextApiResponse } from "next";

const SB       = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK       = process.env.SUPABASE_SERVICE_KEY ?? "";
const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "84838281";

const sbHeaders = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
  Prefer: "return=minimal,resolution=ignore-duplicates",
});

async function sbGet(table: string, qs = ""): Promise<any[]> {
  if (!SK) return [];
  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs}`, {
      headers: { Authorization: `Bearer ${SK}`, apikey: SK },
    });
    if (!r.ok) return [];
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch { return []; }
}

async function sbUpsert(table: string, rows: object[]): Promise<{ upserted: number; error?: string }> {
  if (!SK || !rows.length) return { upserted: 0 };
  try {
    const r = await fetch(`${SB}/rest/v1/${table}`, {
      method: "POST",
      headers: sbHeaders(),
      body: JSON.stringify(rows),
    });
    if (!r.ok) {
      const err = await r.text();
      return { upserted: 0, error: err };
    }
    return { upserted: rows.length };
  } catch (e: any) {
    return { upserted: 0, error: e.message };
  }
}

/** Normalise a raw input object to a valid curated_events row */
function normalise(raw: any, existingUrls: Set<string>): { row: object | null; reason?: string } {
  const title = (raw.title ?? raw.name ?? "").toString().trim().slice(0, 200);
  const url   = (raw.url ?? raw.event_url ?? raw.link ?? "").toString().trim();

  if (!title) return { row: null, reason: "missing title" };
  if (!url)   return { row: null, reason: "missing url" };

  // Dedup
  if (existingUrls.has(url)) return { row: null, reason: "already exists" };

  // Normalise date
  let event_date: string | null = null;
  const rawDate = raw.event_date ?? raw.date ?? raw.start_date ?? raw.startDate ?? null;
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        event_date = d.toISOString().split("T")[0];
      }
    } catch { /* skip */ }
  }

  // Normalise genre
  let genre: string[] = [];
  if (Array.isArray(raw.genre))  genre = raw.genre.filter((g: any) => typeof g === "string").slice(0, 6);
  if (Array.isArray(raw.genres)) genre = raw.genres.filter((g: any) => typeof g === "string").slice(0, 6);
  if (typeof raw.genre === "string") genre = [raw.genre];

  const now = new Date().toISOString();

  return {
    row: {
      title,
      url,
      source:             "import:district",
      city:               (raw.city ?? raw.location_city ?? null)?.toString().trim() ?? null,
      venue:              (raw.venue ?? raw.location_name ?? raw.venue_name ?? null)?.toString().trim() ?? null,
      event_date,
      event_time:         (raw.event_time ?? raw.time ?? null)?.toString().trim() ?? null,
      blurb:              (raw.blurb ?? raw.description ?? raw.short_description ?? null)?.toString().trim().slice(0, 200) ?? null,
      genre,
      image_url:          (raw.image_url ?? raw.image ?? raw.poster_url ?? null)?.toString().trim() ?? null,
      is_featured:        false,
      submission_status:  "published",
      created_at:         now,
      updated_at:         now,
    },
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Admin auth
  if (req.headers["x-admin-password"] !== ADMIN_PW) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { events } = req.body ?? {};
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "events must be a non-empty array" });
  }
  if (events.length > 500) {
    return res.status(400).json({ error: "Maximum 500 events per import" });
  }

  // Fetch existing URLs to dedup
  const today = new Date().toISOString().split("T")[0];
  const existing = await sbGet("curated_events", `?select=url&event_date=gte.${today}&limit=5000`);
  const existingUrls = new Set(existing.map((r: any) => r.url as string));

  const toInsert: object[] = [];
  const errors: string[]   = [];
  let skipped = 0;

  for (const raw of events) {
    const { row, reason } = normalise(raw, existingUrls);
    if (!row) {
      if (reason === "already exists") {
        skipped++;
      } else {
        errors.push(`Skipped: ${JSON.stringify(raw).slice(0, 80)} — ${reason}`);
        skipped++;
      }
    } else {
      toInsert.push(row);
      // Add to existingUrls to prevent intra-batch duplication
      existingUrls.add((raw.url ?? raw.event_url ?? raw.link ?? "").toString().trim());
    }
  }

  if (!toInsert.length) {
    return res.json({ ok: true, upserted: 0, skipped, total: events.length, errors });
  }

  // Batch insert in chunks of 50
  let upserted = 0;
  const CHUNK = 50;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const { upserted: n, error } = await sbUpsert("curated_events", chunk);
    upserted += n;
    if (error) errors.push(`Chunk ${i}–${i + chunk.length}: ${error}`);
  }

  return res.json({
    ok: true,
    upserted,
    skipped,
    total: events.length,
    errors: errors.length ? errors.slice(0, 10) : undefined,
  });
}
