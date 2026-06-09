/**
 * POST /api/artist-submissions
 *
 * Public — saves a new artist submission for admin review.
 * Only known columns are passed to the DB; honeypot fields are stripped.
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { ins } from "@/lib/api-helpers";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const {
    name, submitter_email, submitter_role, bio, from_city, based_city,
    genres, festivals, instagram, soundcloud, bandcamp, spotify, website,
    booking_email, manager_email, labels, members, photo_url, notes,
  } = req.body ?? {};

  const { ok } = await ins("artist_submissions", {
    ...(name              && { name }),
    ...(submitter_email   && { submitter_email }),
    ...(submitter_role    && { submitter_role }),
    ...(bio               && { bio }),
    ...(from_city         && { from_city }),
    ...(based_city        && { based_city }),
    ...(genres !== undefined   && { genres }),
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
    status: "pending",
    created_at: new Date().toISOString(),
  });

  return ok
    ? res.json({ ok: true })
    : res.status(400).json({ error: "Failed to submit artist" });
}
