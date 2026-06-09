/**
 * /api/admin/videos
 *
 * GET         — list all site videos
 * POST        — add a YouTube video by URL or ID
 * PUT         — update fields (toggle featured etc.)
 * DELETE ?id= — remove a video
 *
 * Admin only.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, del, pq, eqf, ord, isAdminReq } from "@/lib/api-helpers";

function ytId(urlOrId: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = urlOrId.match(p); if (m) return m[1]; }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    return res.json({ videos: await get("site_videos", pq(ord("sort_order"))) });
  }

  if (req.method === "POST") {
    const url: string = req.body.url ?? req.body.youtube_id ?? "";
    const id = ytId(url) ?? url;
    if (!id) return res.status(400).json({ error: "Could not parse YouTube ID from URL" });
    const thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    const now = new Date().toISOString();
    const existing = await get("site_videos", pq(ord("sort_order"))) as any[];
    const nextOrder = existing.length ? Math.max(...existing.map((v: any) => v.sort_order ?? 0)) + 1 : 0;
    const { ok, data } = await ins("site_videos", {
      youtube_id: id,
      title: req.body.title || id,
      thumbnail_url: thumb,
      is_featured: req.body.is_featured ?? false,
      sort_order: nextOrder,
      created_at: now,
      updated_at: now,
    });
    return ok ? res.json(Array.isArray(data) ? data[0] : data) : res.status(400).json({ error: "Failed" });
  }

  if (req.method === "PUT") {
    const { id, ...rest } = req.body ?? {};
    const { ok } = await patch("site_videos", pq(eqf("id", id)), { ...rest, updated_at: new Date().toISOString() });
    return ok ? res.json({ ok: true }) : res.status(400).json({ error: "Failed" });
  }

  if (req.method === "DELETE") {
    const id = (req.query.id ?? req.body?.id) as string;
    if (!id) return res.status(400).json({ error: "id required" });
    await del("site_videos", pq(eqf("id", id)));
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
