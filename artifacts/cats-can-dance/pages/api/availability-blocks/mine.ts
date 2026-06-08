/**
 * GET /api/availability-blocks/mine
 *
 * Artist-authenticated — returns all availability blocks for the signed-in
 * artist's profile, including private ones.
 * Used by CalendarManager in the Artist Portal.
 *
 * Query params:
 *   from=YYYY-MM-DD  (default: today)
 *   to=YYYY-MM-DD    (default: 12 months ahead)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, pq, eqf } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  // Resolve artist from Clerk user
  const artists = await sbGet<any>("artists", pq(eqf("claimed_by", clerkUserId)));
  const artist = artists?.[0] ?? null;
  if (!artist) return res.status(404).json({ error: "No artist profile linked to this account" });

  const { from, to } = req.query as Record<string, string>;
  const fromDate = from ?? new Date().toISOString().split("T")[0];
  const toDate = to ?? new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];

  const SB = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const SK = process.env.SUPABASE_SERVICE_KEY ?? "";
  const qs = `?artist_id=eq.${artist.id}&start_date=lte.${toDate}&end_date=gte.${fromDate}&order=start_date.asc`;

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
