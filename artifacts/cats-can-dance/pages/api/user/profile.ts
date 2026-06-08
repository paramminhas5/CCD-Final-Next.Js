/**
 * /api/user/profile
 *
 * GET  ?userId=<clerk_user_id>  — fetch taste profile (liked artists, cities, genres)
 * POST { userId, liked_artist_slugs?, cities?, genres? } — upsert taste profile
 *
 * Used by UserProfile page (/profile) and fan preference saving.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbInsert, sbPatch, pq, eqf } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const rows = await sbGet<any>("user_taste_profiles", pq(eqf("user_id", userId)));
    const profile = rows?.[0] ?? null;

    return res.json(
      profile ?? {
        user_id: userId,
        liked_artist_slugs: [],
        cities: [],
        genres: [],
      },
    );
  }

  // ── POST (upsert) ──────────────────────────────────────────────────────────
  if (req.method === "POST") {
    const { userId, ...updates } = req.body ?? {};
    if (!userId) return res.status(400).json({ error: "userId required" });

    const existing = await sbGet<any>("user_taste_profiles", pq(eqf("user_id", userId)));
    const now = new Date().toISOString();

    if (existing?.length) {
      const { ok } = await sbPatch<any>(
        "user_taste_profiles",
        pq(eqf("user_id", userId)),
        { ...updates, updated_at: now },
      );
      return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed to update profile" });
    }

    const { ok } = await sbInsert<any>("user_taste_profiles", {
      user_id: userId,
      liked_artist_slugs: [],
      cities: [],
      genres: [],
      ...updates,
      created_at: now,
      updated_at: now,
    });
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed to create profile" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
