/**
 * /api/shortlist/:artist_slug
 *
 * PATCH { brief_* } — update brief for a shortlist entry
 * DELETE            — remove artist from shortlist
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { get, patch, del, pq, eqf, clerkId } from "@/lib/api-helpers";

async function resolvePromoter(clerkUserId?: string) {
  if (!clerkUserId) return { promoter: null, error: "Unauthorized" };
  const rows = await get("promoter_profiles", pq(eqf("clerk_user_id", clerkUserId))) as any[];
  if (!rows?.length) return { promoter: null, error: "No promoter profile found." };
  return { promoter: rows[0] };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const uid = clerkId(req);
  const { promoter, error } = await resolvePromoter(uid);
  if (!promoter) return res.status(error === "Unauthorized" ? 401 : 404).json({ error });

  const artistSlug = req.query.artist_slug as string;
  const artistRows = await get("artists", pq(eqf("slug", artistSlug))) as any[];
  if (!artistRows?.length) return res.status(404).json({ error: "Artist not found" });
  const artistId = artistRows[0].id;

  if (req.method === "PATCH") {
    const { ok } = await patch(
      "booking_shortlist",
      pq({ ...eqf("promoter_clerk_id", uid!), ...eqf("artist_id", artistId) }),
      { ...req.body, updated_at: new Date().toISOString() },
    );
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Update failed" });
  }

  if (req.method === "DELETE") {
    const { ok } = await del(
      "booking_shortlist",
      pq({ ...eqf("promoter_clerk_id", uid!), ...eqf("artist_id", artistId) }),
    );
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Delete failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
