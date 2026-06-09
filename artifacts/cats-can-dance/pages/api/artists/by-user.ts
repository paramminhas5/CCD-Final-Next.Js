/**
 * GET /api/artists/by-user
 *
 * Returns the artist profile claimed by the authenticated Clerk user.
 * Used by ArtistPortal to load the artist's own profile after sign-in.
 *
 * Reads user_id from the request body (legacy) or x-clerk-user-id header.
 * Returns null if no artist is linked to this user.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getArtistByUser } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // Support both header (Clerk middleware) and query param
  const clerkUserId =
    (req.headers["x-clerk-user-id"] as string) ||
    (req.query.user_id as string) ||
    null;

  if (!clerkUserId) return res.json(null);

  const artist = await getArtistByUser(clerkUserId);
  return res.json(artist ?? null);
}
