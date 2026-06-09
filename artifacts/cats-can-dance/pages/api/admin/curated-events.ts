/**
 * /api/admin/curated-events
 *
 * GET           — all curated events (any status)
 * POST { action, payload } — upsert / delete
 * DELETE ?id=   — delete by id
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
    return res.json({ events: await get("curated_events", pq(ord("created_at", false))) });
  }

  if (req.method === "POST") {
    const action = req.body.action;
    const row = req.body.payload ?? req.body;
    const now = new Date().toISOString();

    if (action === "delete") {
      await del("curated_events", pq(eqf("id", row.id)));
      return res.json({ ok: true });
    }

    const clean = { ...row, updated_at: now };
    delete clean.action; delete clean.payload;
    if (clean.id) {
      await patch("curated_events", pq(eqf("id", clean.id)), clean);
    } else {
      clean.created_at = now;
      await ins("curated_events", clean);
    }
    return res.json({ ok: true });
  }

  if (req.method === "DELETE") {
    const id = (req.query.id ?? req.body?.id) as string;
    if (!id) return res.status(400).json({ error: "id required" });
    await del("curated_events", pq(eqf("id", id)));
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
