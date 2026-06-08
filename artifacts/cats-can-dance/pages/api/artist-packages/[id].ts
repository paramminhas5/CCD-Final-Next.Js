/**
 * /api/artist-packages/:id
 *
 * PATCH  { name?, price_inr?, is_active?, ... }  — update package (artist-authed)
 * DELETE                                          — soft-delete (set is_active=false)
 *
 * Both require the signed-in artist to own the package.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbPatch, pq, eqf } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;
  if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

  const artists = await sbGet<any>("artists", pq(eqf("claimed_by", clerkUserId)));
  const artist = artists?.[0] ?? null;
  if (!artist) return res.status(401).json({ error: "No artist profile linked to this account" });

  const pkgId = req.query.id as string;

  // Verify ownership
  const existing = await sbGet<any>(
    "artist_packages",
    pq({ ...eqf("id", pkgId), ...eqf("artist_id", artist.id) }),
  );
  if (!existing?.length) {
    return res.status(404).json({ error: "Package not found or not yours" });
  }

  // ── PATCH — update ─────────────────────────────────────────────────────────
  if (req.method === "PATCH") {
    const { ok, data } = await sbPatch<any>(
      "artist_packages",
      pq(eqf("id", pkgId)),
      { ...req.body, updated_at: new Date().toISOString() },
    );
    if (!ok) return res.status(500).json({ error: "Update failed", detail: data });
    return res.json({ ok: true });
  }

  // ── DELETE — soft delete (is_active = false) ───────────────────────────────
  if (req.method === "DELETE") {
    const { ok } = await sbPatch<any>(
      "artist_packages",
      pq(eqf("id", pkgId)),
      { is_active: false, updated_at: new Date().toISOString() },
    );
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Delete failed" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
