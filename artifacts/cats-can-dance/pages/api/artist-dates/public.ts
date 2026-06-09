/**
 * GET /api/artist-dates/public?artist_id=<uuid>&from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Public endpoint returning artist gig dates in a date range.
 * Used by CalendarManager to render confirmed gigs alongside availability blocks.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { artist_id, from, to } = req.query as Record<string, string>;
  if (!artist_id) return res.status(400).json({ error: "artist_id required" });

  const fromDate = from ?? new Date().toISOString().split("T")[0];
  const toDate = to ?? new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0];

  const rows = await get(
    "artist_dates",
    `?artist_id=eq.${artist_id}&is_public=eq.true&event_date=gte.${fromDate}&event_date=lte.${toDate}&order=event_date.asc`,
  );
  return res.json(rows ?? []);
}
