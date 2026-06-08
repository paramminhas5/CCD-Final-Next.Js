/**
 * Artist routes by slug — all sub-resources live here.
 *
 * GET    /api/artists/:slug           — single artist profile
 * GET    /api/artists/:slug/basic     — artist + appearances + upcoming dates + stats
 * GET    /api/artists/:slug/full      — full enriched profile (all relations)
 * POST   /api/artists/:slug/claim     — claim artist profile (Clerk user)
 * PATCH  /api/artists/:slug/self-update — artist self-edit (Clerk user, safe fields only)
 * PATCH  /api/artists/:slug           — admin update (requires x-admin-password)
 * DELETE /api/artists/:slug           — admin delete (requires x-admin-password)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getArtist, getArtistAny, getArtistFullProfile,
  getAppearances, getUpcomingDates, getConnections,
  computeArtistStats, computeArtistFacts,
  updateArtist, deleteArtist, claimArtist, selfUpdateArtist,
  sbGet, sbPatch, pq, eqf,
} from "@/lib/db";

const ADMIN_PW = process.env.ADMIN_PASSWORD ?? "";
const isAdmin = (req: NextApiRequest) =>
  !!ADMIN_PW && req.headers["x-admin-password"] === ADMIN_PW;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const segments = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug as string];
  const slug     = segments[0];
  const sub      = segments[1]; // "basic" | "full" | "claim" | "self-update" | undefined

  // ── GET /api/artists/:slug ──────────────────────────────────────────────────
  if (req.method === "GET" && !sub) {
    const artist = await getArtist(slug);
    return artist ? res.json(artist) : res.status(404).json({ error: "Artist not found" });
  }

  // ── GET /api/artists/:slug/basic ────────────────────────────────────────────
  if (req.method === "GET" && sub === "basic") {
    const artist = await getArtistAny(slug);
    if (!artist) return res.status(404).json({ error: "Artist not found" });

    const [appearances, upcomingDates] = await Promise.all([
      getAppearances(slug),
      getUpcomingDates(artist.id),
    ]);

    const stats = computeArtistStats(appearances, []);
    return res.json({ artist, appearances, upcomingDates, stats, connections: [], milestones: [], socialStats: null, facts: [] });
  }

  // ── GET /api/artists/:slug/full ─────────────────────────────────────────────
  if (req.method === "GET" && sub === "full") {
    const profile = await getArtistFullProfile(slug);
    if (!profile) return res.status(404).json({ error: "Artist not found" });
    return res.json(profile);
  }

  // ── POST /api/artists/:slug/claim ───────────────────────────────────────────
  if (req.method === "POST" && sub === "claim") {
    const artist = await getArtist(slug);
    if (!artist) return res.status(404).json({ error: "Artist not found" });
    if (artist.claimed_by) return res.status(409).json({ error: "This profile is already claimed" });

    const userId = req.body?.user_id;
    if (!userId) return res.status(400).json({ error: "user_id is required" });

    const { ok } = await claimArtist(artist.id, userId);
    return ok ? res.json({ ok: true }) : res.status(500).json({ error: "Failed to claim profile" });
  }

  // ── PATCH /api/artists/:slug/self-update ────────────────────────────────────
  if (req.method === "PATCH" && sub === "self-update") {
    const { user_id, ...fields } = req.body as any ?? {};
    if (!user_id) return res.status(401).json({ error: "user_id is required" });

    // Verify ownership
    const artist = await getArtistAny(slug);
    if (!artist) return res.status(404).json({ error: "Artist not found" });
    if (artist.claimed_by !== user_id) return res.status(403).json({ error: "You don't own this profile" });

    const result = await selfUpdateArtist(artist.id, fields);
    if (!result.ok) return res.status(400).json({ error: result.error ?? "Update failed" });

    const data = Array.isArray(result.data) ? result.data[0] : result.data;
    return res.json(data);
  }

  // ── PATCH /api/artists/:slug — admin only ───────────────────────────────────
  if (req.method === "PATCH" && !sub) {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });

    // slug here is actually the artist ID for admin updates (legacy behaviour)
    const artist = await getArtistAny(slug);
    if (!artist) return res.status(404).json({ error: "Artist not found" });

    const { ok, data } = await updateArtist(artist.id, req.body ?? {});
    return ok
      ? res.json(Array.isArray(data) ? data[0] : data)
      : res.status(500).json({ error: "Update failed" });
  }

  // ── DELETE /api/artists/:slug — admin only ──────────────────────────────────
  if (req.method === "DELETE" && !sub) {
    if (!isAdmin(req)) return res.status(401).json({ error: "Admin only" });

    const artist = await getArtistAny(slug);
    if (!artist) return res.status(404).json({ error: "Artist not found" });

    await deleteArtist(artist.id);
    return res.json({ ok: true });
  }

  return res.status(404).json({ error: `No handler for ${req.method} /api/artists/${segments.join("/")}` });
}
