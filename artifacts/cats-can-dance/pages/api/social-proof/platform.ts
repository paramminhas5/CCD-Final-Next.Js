/**
 * GET /api/social-proof/platform
 * Returns aggregate platform counts: RSVPs, artists, signups, cities.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { SB, SK } from "@/lib/api-helpers";

async function sbCount(table: string, qs: string): Promise<number | null> {
  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs || ""}?select=id&limit=0`, {
      headers: { Authorization: `Bearer ${SK}`, apikey: SK, Prefer: "count=exact" },
    });
    const raw = r.headers.get("content-range");
    if (raw) { const n = parseInt(raw.split("/")[1], 10); if (!isNaN(n)) return n; }
    return null;
  } catch { return null; }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const [rsvpCount, artistCount, signupCount] = await Promise.all([
    sbCount("event_rsvps", ""),
    sbCount("artists", "?status=eq.approved"),
    sbCount("early_access_signups", ""),
  ]);

  return res.json({
    total_rsvps:   rsvpCount   ?? 0,
    total_artists: artistCount ?? 0,
    total_signups: signupCount ?? 0,
    cities: 6,
  });
}
