/**
 * GET /api/user/saved-events?user_id=<id>
 *
 * Returns the curated events the user has saved (action = "save")
 * ordered by most recently saved, with full event details joined.
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

  // 1. Fetch save interactions for this user (most recent first)
  const interactions = await sbGet(
    "user_event_interactions",
    `?user_id=eq.${encodeURIComponent(user_id)}&action=eq.save&order=created_at.desc&limit=${parseInt(limit, 10) * 3}`
  );

  if (!interactions.length) return res.json({ events: [] });

  // 2. Deduplicate event IDs (user may have saved/unsaved multiple times — take latest action)
  const savedIds: string[] = [];
  const seenIds = new Set<string>();
  for (const i of interactions) {
    if (!seenIds.has(i.event_id)) {
      seenIds.add(i.event_id);
      savedIds.push(i.event_id);
    }
    if (savedIds.length >= parseInt(limit, 10)) break;
  }

  if (!savedIds.length) return res.json({ events: [] });

  // 3. Fetch event details
  const events = await sbGet(
    "curated_events",
    `?id=in.(${savedIds.map(id => encodeURIComponent(id)).join(",")})&order=event_date.asc`
  );

  return res.json({ events });
}
