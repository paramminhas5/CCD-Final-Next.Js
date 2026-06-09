/**
 * /api/admin/blog
 *
 * POST { post? }           — publish / generate blog post (appended to site_settings.blog_posts)
 * POST { action: "delete", slug } — delete a post by slug
 *
 * Admin only.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, pq, eqf, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });

  const rows = await get("site_settings", pq(eqf("id", "main"))) as any[];
  const existing = rows[0];

  if (req.method === "GET") {
    return res.json({ posts: existing?.blog_posts ?? [] });
  }

  const { action, slug: deleteSlug, post } = req.body ?? {};
  let posts = [...(existing?.blog_posts ?? [])];
  const now = new Date().toISOString();

  if (action === "delete" && deleteSlug) {
    posts = posts.filter((p: any) => p.slug !== deleteSlug);
  } else if (post) {
    posts.unshift(post);
  }

  if (existing) {
    await patch("site_settings", pq(eqf("id", "main")), { blog_posts: posts, updated_at: now });
  } else {
    await ins("site_settings", { id: "main", blog_posts: posts, updated_at: now });
  }

  return res.json({ ok: true, posts });
}
