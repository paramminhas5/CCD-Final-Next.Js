/**
 * /api/shortlist
 *
 * GET  — promoter's shortlist with artist details joined
 * POST { artist_slug, brief_* } — add/update artist on shortlist (upsert)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, upsert, pq, eqf, ord } from "@/lib/api-helpers";
import { clerkId } from "@/lib/api-helpers";

async function resolvePromoter(clerkUserId?: string) {
  if (!clerkUserId) return { promoter: null, error: "Unauthorized" };
  const rows = await get("promoter_profiles", pq(eqf("clerk_user_id", clerkUserId))) as any[];
  if (!rows?.length) return { promoter: null, error: "No promoter profile found. Register first." };
  return { promoter: rows[0] };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const uid = clerkId(req);

  if (req.method === "GET") {
    const { promoter, error } = await resolvePromoter(uid);
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });

    const entries = await get("booking_shortlist",
      pq({ ...eqf("promoter_clerk_id", uid!), ...ord("created_at", false) }),
    ) as any[];
    if (!entries?.length) return res.json([]);

    const artistIds = [...new Set(entries.map((e: any) => e.artist_id))];
    const artistRows = await get("artists",
      `?id=in.(${artistIds.join(",")})&select=id,slug,name,photo_url,based_city,genres,fee_min_inr,open_to_bookings,available_cities,kind`,
    ) as any[];
    const artistMap: Record<string, any> = {};
    for (const a of artistRows ?? []) artistMap[a.id] = a;

    return res.json(entries.map((e: any) => ({ ...e, artist: artistMap[e.artist_id] ?? null })));
  }

  if (req.method === "POST") {
    const { promoter, error } = await resolvePromoter(uid);
    if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });

    const { artist_slug, brief_event_type, brief_date, brief_date_end,
            brief_cities, brief_budget_inr, brief_notes } = req.body ?? {};
    if (!artist_slug) return res.status(400).json({ error: "artist_slug required" });

    const artistRows = await get("artists", pq(eqf("slug", artist_slug))) as any[];
    if (!artistRows?.length) return res.status(404).json({ error: "Artist not found" });

    const now = new Date().toISOString();
    const { ok, data } = await upsert("booking_shortlist", {
      promoter_clerk_id: uid,
      artist_id: artistRows[0].id,
      brief_event_type: brief_event_type ?? null,
      brief_date: brief_date ?? null,
      brief_date_end: brief_date_end ?? null,
      brief_cities: Array.isArray(brief_cities) ? brief_cities : (brief_cities ? [brief_cities] : []),
      brief_budget_inr: brief_budget_inr ? Number(brief_budget_inr) : null,
      brief_notes: brief_notes ?? null,
      updated_at: now,
      created_at: now,
    });
    if (!ok) return res.status(500).json({ error: "Failed to add to shortlist", detail: data });
    return res.status(201).json({ ok: true, artist_id: artistRows[0].id });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
