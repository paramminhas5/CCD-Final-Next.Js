/**
 * /api/artist-packages
 *
 * GET  ?artist_id=<uuid>  — all active packages for an artist (public)
 * GET  ?artist_slug=<slug> — same, resolved by slug (public)
 * GET  ?artist_id=<uuid>&all=true — all packages incl. inactive (portal owner)
 * POST { name, price_inr, ... } — create package (artist-authed)
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { sbGet, sbInsert, pq, eqf, ord } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const clerkUserId = req.headers["x-clerk-user-id"] as string | undefined;

  // ── GET ────────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { artist_id, artist_slug, all: showAll } = req.query as Record<string, string>;

    let id = artist_id;
    if (!id && artist_slug) {
      const rows = await sbGet<any>("artists", pq(eqf("slug", artist_slug)));
      id = rows?.[0]?.id;
    }
    if (!id) return res.status(400).json({ error: "artist_id or artist_slug required" });

    // Show all (incl. inactive) only for the portal owner
    const filters: Record<string, string> = {
      ...eqf("artist_id", id),
      ...ord("sort_order"),
    };
    if (!showAll || showAll !== "true") {
      filters["is_active"] = "eq.true";
    }

    const pkgs = await sbGet<any>("artist_packages", pq(filters));
    return res.json(pkgs ?? []);
  }

  // ── POST — create (artist-authed) ──────────────────────────────────────────
  if (req.method === "POST") {
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

    const artists = await sbGet<any>("artists", pq(eqf("claimed_by", clerkUserId)));
    const artist = artists?.[0] ?? null;
    if (!artist) return res.status(401).json({ error: "No artist profile linked to this account" });

    const {
      name, description, suitable_for, price_inr, price_is_minimum,
      travel_included, travel_note, set_duration_min, set_type,
      tech_rider, is_active, sort_order,
    } = req.body ?? {};

    if (!name || price_inr == null) {
      return res.status(400).json({ error: "name and price_inr required" });
    }

    const now = new Date().toISOString();
    const { ok, data } = await sbInsert<any>("artist_packages", {
      artist_id: artist.id,
      artist_slug: artist.slug,
      name,
      description: description ?? null,
      suitable_for: suitable_for ?? [],
      price_inr: Number(price_inr),
      price_is_minimum: price_is_minimum !== false,
      travel_included: travel_included === true,
      travel_note: travel_note ?? null,
      set_duration_min: set_duration_min ? Number(set_duration_min) : null,
      set_type: set_type ?? "solo",
      tech_rider: tech_rider ?? null,
      is_active: is_active !== false,
      sort_order: sort_order ? Number(sort_order) : 0,
      created_at: now,
      updated_at: now,
    });

    if (!ok) return res.status(500).json({ error: "Failed to create package", detail: data });
    return res.status(201).json(Array.isArray(data) ? data[0] : data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
