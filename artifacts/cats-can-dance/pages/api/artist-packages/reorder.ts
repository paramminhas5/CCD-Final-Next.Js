/**
 * POST /api/artist-packages/reorder
 *
 * Body: { order: Array<{ id: string; sort_order: number }> }
 *
 * Updates sort_order for all given package IDs in parallel.
 * Requires artist auth — only updates packages owned by the caller's artist.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbPatch, pq, eqf } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  const artists = await sbGet<any>("artists", pq(eqf("claimed_by", clerkUserId)));
  const artist = artists?.[0] ?? null;
  if (!artist) return res.status(401).json({ error: "No artist profile linked to this account" });

  const { order } = req.body ?? {};
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: "order[] required — array of { id, sort_order }" });
  }

  await Promise.all(
    order.map(({ id, sort_order }: { id: string; sort_order: number }) =>
      sbPatch<any>(
        "artist_packages",
        pq({ ...eqf("id", id), ...eqf("artist_id", artist.id) }),
        { sort_order, updated_at: new Date().toISOString() },
      ),
    ),
  );

  return res.json({ ok: true });
}
