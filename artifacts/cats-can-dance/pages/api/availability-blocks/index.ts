/**
 * /api/availability-blocks
 *
 * GET  ?artist_id=<uuid>&from=YYYY-MM-DD&to=YYYY-MM-DD  — public blocks in range
 * GET  ?artist_slug=<slug>&from=…&to=…                  — same, resolved by slug
 * POST { kind, start_date, end_date, ... }              — create (artist-authed)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbInsert, pq, eqf, ord } from "@/lib/db";

async function resolveArtistForClerkUser(clerkUserId?: string) {
  if (!clerkUserId) return null;
  const rows = await sbGet<any>("artists", pq(eqf("claimed_by", clerkUserId)));
  return rows?.[0] ?? null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;

  // ── GET — public blocks in date range ─────────────────────────────────────
  if (req.method === "GET") {
    const { artist_id, artist_slug, from, to } = req.query as Record<string, string>;

    let id = artist_id;
    if (!id && artist_slug) {
      const rows = await sbGet<any>("artists", pq(eqf("slug", artist_slug)));
      id = rows?.[0]?.id;
    }
    if (!id) return res.status(400).json({ error: "artist_id or artist_slug required" });

    const fromDate = from ?? new Date().toISOString().split("T")[0];
    const toDate = to ?? new Date(Date.now() + 180 * 86400000).toISOString().split("T")[0];

    const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const SK = process.env.SUPABASE_SERVICE_KEY ?? "";
    const qs = `?artist_id=eq.${id}&is_public=eq.true&start_date=lte.${toDate}&end_date=gte.${fromDate}&order=start_date.asc`;

    const r = await fetch(`${SB}/rest/v1/artist_availability_blocks${qs}`, {
      headers: {
        Authorization: `Bearer ${SK}`,
        apikey: SK,
        "Content-Type": "application/json",
      },
    });
    const data = r.ok ? await r.json() : [];
    return res.json(Array.isArray(data) ? data : []);
  }

  // ── POST — create a new block (artist-authed) ──────────────────────────────
  if (req.method === "POST") {
    const artist = await resolveArtistForClerkUser(clerkUserId);
    if (!artist) return res.status(401).json({ error: "Unauthorized — no artist profile linked" });

    const {
      kind, label, city, cities, start_date, end_date,
      weekly_days, fee_override_inr, notes, is_public,
    } = req.body ?? {};

    if (!start_date || !end_date) {
      return res.status(400).json({ error: "start_date and end_date required" });
    }
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: "end_date must be >= start_date" });
    }
    const validKinds = ["tour_leg", "unavailable", "available"];
    if (kind && !validKinds.includes(kind)) {
      return res.status(400).json({ error: `kind must be one of: ${validKinds.join(", ")}` });
    }

    const now = new Date().toISOString();
    const { ok, data } = await sbInsert<any>("artist_availability_blocks", {
      artist_id: artist.id,
      kind: kind ?? "available",
      label: label ?? null,
      city: city ?? null,
      cities: cities ?? (city ? [city] : []),
      start_date,
      end_date,
      weekly_days: weekly_days ?? null,
      fee_override_inr: fee_override_inr ? Number(fee_override_inr) : null,
      notes: notes ?? null,
      is_public: is_public !== false,
      created_at: now,
      updated_at: now,
    });

    if (!ok) return res.status(500).json({ error: "Failed to create availability block", detail: data });
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
