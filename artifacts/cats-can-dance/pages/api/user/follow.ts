/**
 * POST /api/user/follow
 *
 * Body: { userId: string, artistSlug: string, action: "follow" | "unfollow" }
 *
 * Adds or removes an artist slug from the user's liked_artist_slugs array
 * in user_taste_profiles. Creates the profile row if it doesn't exist yet.
 *
 * Returns: { ok: true, following: boolean }
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbInsert, sbPatch, pq, eqf } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, artistSlug, action: followAction } = req.body ?? {};

  if (!userId || !artistSlug) {
    return res.status(400).json({ error: "userId and artistSlug are required" });
  }
  if (followAction !== "follow" && followAction !== "unfollow") {
    return res.status(400).json({ error: "action must be 'follow' or 'unfollow'" });
  }

  const rows = await sbGet<any>("user_taste_profiles", pq(eqf("user_id", userId)));
  const existing = rows?.[0];
  const now = new Date().toISOString();

  if (!existing) {
    // Create new profile with this artist liked/not
    const liked = followAction === "follow" ? [artistSlug] : [];
    const { ok } = await sbInsert<any>("user_taste_profiles", {
      user_id: userId,
      liked_artist_slugs: liked,
      cities: [],
      genres: [],
      created_at: now,
      updated_at: now,
    });
    return ok
      ? res.json({ ok: true, following: liked.includes(artistSlug) })
      : res.status(500).json({ error: "Failed to create profile" });
  }

  // Update existing profile
  let liked: string[] = existing.liked_artist_slugs ?? [];
  if (followAction === "follow") {
    if (!liked.includes(artistSlug)) liked = [...liked, artistSlug];
  } else {
    liked = liked.filter((s: string) => s !== artistSlug);
  }

  const { ok } = await sbPatch<any>(
    "user_taste_profiles",
    pq(eqf("user_id", userId)),
    { liked_artist_slugs: liked, updated_at: now },
  );

  return ok
    ? res.json({ ok: true, following: liked.includes(artistSlug) })
    : res.status(500).json({ error: "Failed to update profile" });
}
