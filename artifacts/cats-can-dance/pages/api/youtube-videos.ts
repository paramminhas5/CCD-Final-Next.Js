/**
 * GET /api/youtube-videos
 *
 * Returns site videos from the site_videos table, ordered by sort_order.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, pq, ord } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const rows = await get("site_videos", pq(ord("sort_order"))) as any[];
  const videos = (rows ?? []).map((v: any) => ({
    id: v.youtube_id,
    title: v.title,
    thumbnail: v.thumbnail_url ?? `https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`,
    publishedAt: v.published_at ?? v.created_at,
  }));
  return res.json({ videos });
}
