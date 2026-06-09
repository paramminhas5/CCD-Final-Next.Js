/**
 * /api/admin/content
 *
 * GET ?type=events|messages|settings — fetch admin CMS data
 * POST { type, action, payload }     — upsert/delete events or save settings
 *
 * Admin only.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, ins, patch, del, pq, eqf, ord, isAdminReq } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!isAdminReq(req)) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { type } = req.query as Record<string, string>;
    if (type === "events") return res.json({ events: await get("events", pq(ord("sort_order"))) });
    if (type === "messages") return res.json({ messages: await get("contact_messages", pq(ord("created_at", false))) });
    const rows = await get("site_settings", pq(eqf("id", "main"))) as any[];
    return res.json({ settings: rows[0] ?? null });
  }

  if (req.method === "POST") {
    const { type, action, payload } = req.body ?? {};
    const now = new Date().toISOString();

    if (type === "events") {
      const ev = payload ?? req.body;
      if (action === "upsert" || action === "save") {
        const existing = ev?.id ? await get("events", pq(eqf("id", ev.id))) as any[] : [];
        if (existing.length) {
          await patch("events", pq(eqf("id", ev.id)), { ...ev, updated_at: now });
        } else {
          if (!ev.slug) ev.slug = `event-${Date.now()}`;
          await ins("events", { ...ev, created_at: now, updated_at: now });
        }
        return res.json({ events: await get("events", pq(ord("sort_order"))) });
      }
      if (action === "delete" && payload?.id) {
        await del("events", pq(eqf("id", payload.id)));
        return res.json({ ok: true });
      }
    }

    // settings upsert
    const settings = payload ?? req.body;
    const existing = await get("site_settings", pq(eqf("id", "main"))) as any[];
    if (existing.length) {
      await patch("site_settings", pq(eqf("id", "main")), { ...settings, updated_at: now });
    } else {
      const { created_at: _d, ...safe } = settings as any;
      await ins("site_settings", { id: "main", ...safe, updated_at: now });
    }
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
