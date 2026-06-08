/**
 * Admin: artist management
 *
 * GET    /api/admin/artists           — list all artists
 * POST   /api/admin/artists           — create artist
 * PATCH  /api/admin/artists?id=:id    — update artist
 * DELETE /api/admin/artists?id=:id    — delete artist
 *
 * All routes require x-admin-password header.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbInsert, sbPatch, sbDelete, pq, eqf, ord } from "@/lib/db";

const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "";
const isAdmin  = (req: NextApiRequest) =>
  !!ADMIN_PW && req.headers["x-admin-password"] === ADMIN_PW;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!isAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query as Record<string, string>;
  const body   = req.body ?? {};
  const now    = new Date().toISOString();

  if (req.method === "GET") {
    return res.json({ artists: await sbGet("artists", pq(ord("name"))) });
  }

  if (req.method === "POST") {
    const { ok, data } = await sbInsert("artists", { ...body, created_at: now, updated_at: now });
    return ok
      ? res.json(Array.isArray(data) ? data[0] : data)
      : res.status(400).json({ error: "Failed to create artist" });
  }

  if (req.method === "PATCH") {
    const artistId = id ?? body.id;
    if (!artistId) return res.status(400).json({ error: "id is required" });
    const { ok, data } = await sbPatch("artists", pq(eqf("id", artistId)), { ...body, updated_at: now });
    return ok
      ? res.json(Array.isArray(data) ? data[0] : data)
      : res.status(400).json({ error: "Failed to update artist" });
  }

  if (req.method === "DELETE") {
    const artistId = id ?? body.id;
    if (!artistId) return res.status(400).json({ error: "id is required" });
    await sbDelete("artists", pq(eqf("id", artistId)));
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
