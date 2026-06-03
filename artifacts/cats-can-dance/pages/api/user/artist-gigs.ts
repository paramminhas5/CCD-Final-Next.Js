/**
 * GET /api/user/artist-gigs?user_id=<id>&limit=5
 *
 * Returns upcoming curated events that feature any artist
 * in the user's liked_artist_slugs list.
 *
 * Flow:
 *   1. Read user_taste_profiles.liked_artist_slugs
 *   2. Query event_artist_lineups for those slugs
 *   3. Join curated_events on the resulting event IDs
 *   4. Return upcoming events only, ordered by date
 */

import type { NextApiRequest, NextApiResponse } from "next";

const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SK = process.env.SUPABASE_SERVICE_KEY ?? "";

const sbHeaders = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { user_id, limit = "5" } = req.query as Record<string, string>;
  if (!user_id) return res.json({ events: [] });

  // 1. Get taste profile
  const profiles = await sbGet(
    "user_taste_profiles",
    `?user_id=eq.${encodeURIComponent(user_id)}&limit=1`
  );
  const profile = profiles[0];
  const likedSlugs: string[] = profile?.liked_artist_slugs ?? [];

  if (!likedSlugs.length) return res.json({ events: [] });

  // 2. Find event_artist_lineups entries for liked slugs
  const lineups = await sbGet(
    "event_artist_lineups",
    `?artist_slug=in.(${likedSlugs.map(s => encodeURIComponent(s)).join(",")})&limit=100`
  );

  if (!lineups.length) return res.json({ events: [] });

  // 3. Unique event IDs from lineups
  const eventIds = [...new Set(lineups.map((l: any) => l.curated_event_id as string))];
  if (!eventIds.length) return res.json({ events: [] });

  // 4. Fetch upcoming curated events for those IDs
  const today = new Date().toISOString().split("T")[0];
  const events = await sbGet(
    "curated_events",
    `?id=in.(${eventIds.map(id => encodeURIComponent(id)).join(",")})&event_date=gte.${today}&order=event_date.asc&limit=${parseInt(limit, 10)}`
  );

  // 5. Enrich with "reason" — which artist from their follows is playing
  const enriched = events.map((ev: any) => {
    const matchingLineups = lineups.filter((l: any) => l.curated_event_id === ev.id);
    const matchingArtists = matchingLineups.map((l: any) => l.artist_name).filter(Boolean);
    return {
      ...ev,
      reasons: ["artist_you_like"],
      matched_artists: matchingArtists,
    };
  });

  return res.json({ events: enriched });
}
