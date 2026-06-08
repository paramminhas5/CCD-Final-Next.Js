/**
 * GET  /api/artists          — list all approved artists
 * POST /api/artists          — submit a new artist (public, goes to artist_submissions)
 *
 * Query params for GET:
 *   ?featured=true           — only featured artists
 *   ?limit=N                 — cap results
 *   ?slug=xxx                — single artist by slug (legacy query-param style)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { listArtists, getArtist, sbInsert, pq, eqf } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET ───────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { featured, limit, slug } = req.query as Record<string, string>;

    // Legacy: ?slug=xxx query-param style — single artist
    if (slug) {
      const artist = await getArtist(slug);
      return artist
        ? res.json(artist)
        : res.status(404).json({ error: "Artist not found" });
    }

    const artists = await listArtists({
      featured: featured === "true",
      limit:    limit ? parseInt(limit, 10) : undefined,
    });
    return res.json(artists);
  }

  // ── POST — public artist submission ────────────────────────────────────────
  if (req.method === "POST") {
    const body = req.body ?? {};
    const {
      name, submitter_email, submitter_role, bio, from_city, based_city,
      genres, festivals, instagram, soundcloud, bandcamp, spotify, website,
      booking_email, manager_email, labels, members, photo_url, notes,
    } = body;

    if (!name?.trim()) return res.status(400).json({ error: "name is required" });

    const { ok } = await sbInsert("artist_submissions", {
      ...(name              && { name }),
      ...(submitter_email   && { submitter_email }),
      ...(submitter_role    && { submitter_role }),
      ...(bio               && { bio }),
      ...(from_city         && { from_city }),
      ...(based_city        && { based_city }),
      ...(genres !== undefined  && { genres }),
      ...(festivals !== undefined && { festivals }),
      ...(instagram         && { instagram }),
      ...(soundcloud        && { soundcloud }),
      ...(bandcamp          && { bandcamp }),
      ...(spotify           && { spotify }),
      ...(website           && { website }),
      ...(booking_email     && { booking_email }),
      ...(manager_email     && { manager_email }),
      ...(labels            && { labels }),
      ...(members           && { members }),
      ...(photo_url         && { photo_url }),
      ...(notes             && { notes }),
      status:     "pending",
      created_at: new Date().toISOString(),
    });

    return ok
      ? res.json({ ok: true, message: "Submission received. We'll review it within 48h." })
      : res.status(500).json({ error: "Failed to save submission. Please try again." });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
