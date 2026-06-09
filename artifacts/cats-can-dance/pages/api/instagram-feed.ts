/**
 * GET /api/instagram-feed
 *
 * Proxies the Behold.so Instagram feed to avoid CSP / ad-blocker issues.
 * Returns last 9 posts in a normalised shape.
 */
import type { NextApiRequest, NextApiResponse } from "next";

const BEHOLD_URL = process.env.BEHOLD_FEED_URL ?? "https://feeds.behold.so/6bt7nDISwk0mUzAQMd9s";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Cache for 15 minutes at the edge
  res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=1800");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const r = await fetch(BEHOLD_URL, {
      headers: { "User-Agent": "CCDBot/1.0", Accept: "application/json" },
    });
    if (!r.ok) return res.json({ posts: [] });

    const data = await r.json();
    const posts = (data?.posts ?? []).slice(0, 9).map((p: any) => ({
      id: String(p.id),
      mediaUrl:
        p.sizes?.medium?.mediaUrl ??
        p.sizes?.large?.mediaUrl ??
        p.sizes?.full?.mediaUrl ??
        p.mediaUrl,
      permalink: p.permalink,
      caption: p.prunedCaption ?? p.caption ?? "",
      mediaType: p.mediaType ?? "IMAGE",
    }));
    return res.json({ posts });
  } catch {
    return res.json({ posts: [] });
  }
}
