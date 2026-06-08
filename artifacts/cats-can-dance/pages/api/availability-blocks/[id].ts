/**
 * /api/availability-blocks/:id
 *
 * PATCH  { kind?, label?, city?, start_date?, end_date?, ... }  — update
 * DELETE                                                         — delete
 *
 * Both operations require the signed-in artist to own the block.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbPatch, sbDelete, pq, eqf } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  // Resolve artist from Clerk user
  const artists = await sbGet<any>("artists", pq(eqf("claimed_by", clerkUserId)));
  const artist = artists?.[0] ?? null;
  if (!artist) return res.status(404).json({ error: "No artist profile linked to this account" });

  const blockId = req.query.id as string;

  // Verify ownership
  const existing = await sbGet<any>(
    "artist_availability_blocks",
    pq({ ...eqf("id", blockId), ...eqf("artist_id", artist.id) }),
  );
  if (!existing?.length) {
    return res.status(404).json({ error: "Block not found or not yours" });
  }

  // ── PATCH — update block ───────────────────────────────────────────────────
  if (req.method === "PATCH") {
    const { ok, data } = await sbPatch<any>(
      "artist_availability_blocks",
      pq(eqf("id", blockId)),
      { ...req.body, updated_at: new Date().toISOString() },
    );
    if (!ok) return res.status(500).json({ error: "Update failed", detail: data });
    return res.json({ ok: true });
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    await sbDelete("artist_availability_blocks", pq(eqf("id", blockId)));
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
