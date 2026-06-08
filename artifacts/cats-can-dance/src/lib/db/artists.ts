/**
 * artists.ts — data access functions for the artists domain
 *
 * Server-side only. Import in pages/api/* handlers.
 * Never import in client components (no 'use client' files).
 *
 * All functions return typed results and never throw —
 * errors are returned as null / empty arrays.
 */

import {
  sbGet, sbGetOne, sbInsert, sbPatch, sbDelete, sbUpsert,
  pq, eqf, neqf, ord, inf, ilikef, gtef, ltef, csf,
} from "./supabase";

import type {
  Artist, EventAppearance, ArtistConnection, ArtistSocialStats,
  ArtistMilestone, ArtistRelease, ArtistPress, ArtistDate,
  ArtistAvailabilityBlock, ArtistPackage, ArtistStats,
  ArtistFact, ArtistFullProfile, ArtistCalendar, DayStatus,
  SbResult,
} from "./types";

// Re-export SbResult so callers don't need to import from supabase.ts directly
export type { SbResult } from "./supabase";

// ── Read ──────────────────────────────────────────────────────────────────────

/** List all approved artists, optionally filtered by featured flag. */
export async function listArtists(opts: {
  featured?: boolean;
  limit?: number;
} = {}): Promise<Artist[]> {
  const f: Record<string, string> = { ...eqf("status", "approved"), ...ord("name") };
  if (opts.featured) f["featured"] = "eq.true";
  let rows = await sbGet<Artist>("artists", pq(f));
  if (opts.limit && opts.limit > 0) rows = rows.slice(0, opts.limit);
  return rows;
}

/** Get a single approved artist by slug. Returns null if not found. */
export async function getArtist(slug: string): Promise<Artist | null> {
  return sbGetOne<Artist>("artists", pq({ ...eqf("slug", slug), ...eqf("status", "approved") }));
}

/** Get an artist by slug regardless of status (for admin/portal use). */
export async function getArtistAny(slug: string): Promise<Artist | null> {
  return sbGetOne<Artist>("artists", pq(eqf("slug", slug)));
}

/** Get the artist claimed by a Clerk user. */
export async function getArtistByUser(clerkUserId: string): Promise<Artist | null> {
  return sbGetOne<Artist>("artists", pq(eqf("claimed_by", clerkUserId)));
}

/** Get all artists for admin panel. */
export async function listAllArtists(): Promise<Artist[]> {
  return sbGet<Artist>("artists", pq(ord("name")));
}

// ── Appearances (gigography) ──────────────────────────────────────────────────

/** Get gig history for an artist, normalised across old/new schema. */
export async function getAppearances(artistSlug: string, limit = 50): Promise<EventAppearance[]> {
  const raw = await sbGet<any>(
    "event_appearances",
    `?artist_slug=eq.${encodeURIComponent(artistSlug)}&order=event_date.desc&limit=${limit}`,
  );
  return raw.map((a) => ({
    ...a,
    venue: a.venue ?? a.venue_name ?? null,
    city:  a.city  ?? a.venue_city ?? null,
    year:  a.year  ?? (a.event_date ? parseInt(a.event_date.split("-")[0], 10) : null),
  })) as EventAppearance[];
}

// ── Connections ───────────────────────────────────────────────────────────────

/** Get connections for an artist (slug-based, both directions). */
export async function getConnections(artistSlug: string): Promise<ArtistConnection[]> {
  const [asA, asB] = await Promise.all([
    sbGet<ArtistConnection>("artist_connections", `?artist_a_slug=eq.${encodeURIComponent(artistSlug)}&order=strength.desc&limit=20`),
    sbGet<ArtistConnection>("artist_connections", `?artist_b_slug=eq.${encodeURIComponent(artistSlug)}&order=strength.desc&limit=20`),
  ]);
  return [...asA, ...asB];
}

// ── Social stats ──────────────────────────────────────────────────────────────

export async function getSocialStats(artistSlug: string): Promise<ArtistSocialStats | null> {
  return sbGetOne<ArtistSocialStats>(
    "artist_social_stats",
    `?artist_slug=eq.${encodeURIComponent(artistSlug)}&order=captured_at.desc&limit=1`,
  );
}

export async function getSocialHistory(artistSlug: string): Promise<ArtistSocialStats[]> {
  return sbGet<ArtistSocialStats>(
    "artist_social_stats",
    `?artist_slug=eq.${encodeURIComponent(artistSlug)}&order=captured_at.asc&limit=30`,
  );
}

// ── Milestones ────────────────────────────────────────────────────────────────

export async function getMilestones(artistSlug: string): Promise<ArtistMilestone[]> {
  return sbGet<ArtistMilestone>(
    "artist_milestones",
    `?artist_slug=eq.${encodeURIComponent(artistSlug)}&order=date.asc&limit=30`,
  );
}

// ── Discography ───────────────────────────────────────────────────────────────

export async function getDiscography(artistSlug: string): Promise<ArtistRelease[]> {
  return sbGet<ArtistRelease>(
    "artist_discography",
    `?artist_slug=eq.${encodeURIComponent(artistSlug)}&order=release_date.desc&limit=20`,
  );
}

// ── Press ─────────────────────────────────────────────────────────────────────

export async function getPress(artistSlug: string): Promise<ArtistPress[]> {
  return sbGet<ArtistPress>(
    "artist_press",
    `?artist_slug=eq.${encodeURIComponent(artistSlug)}&order=date_published.desc&limit=10`,
  );
}

// ── Upcoming dates ────────────────────────────────────────────────────────────

export async function getUpcomingDates(artistId: string, limit = 10): Promise<ArtistDate[]> {
  const today = new Date().toISOString().split("T")[0];
  return sbGet<ArtistDate>(
    "artist_dates",
    `?artist_id=eq.${artistId}&event_date=gte.${today}&is_public=eq.true&order=event_date.asc&limit=${limit}`,
  );
}

// ── Availability blocks ────────────────────────────────────────────────────────

export async function getAvailabilityBlocks(
  artistId: string,
  from: string,
  to: string,
  publicOnly = true,
): Promise<ArtistAvailabilityBlock[]> {
  const qs = `?artist_id=eq.${artistId}${publicOnly ? "&is_public=eq.true" : ""}&start_date=lte.${to}&end_date=gte.${from}&order=start_date.asc`;
  return sbGet<ArtistAvailabilityBlock>("artist_availability_blocks", qs);
}

// ── Packages ──────────────────────────────────────────────────────────────────

export async function getActivePackages(artistId: string): Promise<ArtistPackage[]> {
  return sbGet<ArtistPackage>(
    "artist_packages",
    pq({ ...eqf("artist_id", artistId), ...eqf("is_active", "true"), ...ord("sort_order") }),
  );
}

// ── Calendar (merged view) ────────────────────────────────────────────────────

/**
 * Builds a merged day-indexed calendar combining availability_blocks and artist_dates.
 * Used by the public AvailabilityStrip and booking date picker.
 */
export async function getArtistCalendar(
  artist: { id: string; slug: string; available_cities: string[]; open_to_bookings: boolean },
  from: string,
  to: string,
): Promise<ArtistCalendar> {
  const [blocks, gigs] = await Promise.all([
    getAvailabilityBlocks(artist.id, from, to),
    sbGet<ArtistDate>(
      "artist_dates",
      `?artist_id=eq.${artist.id}&is_public=eq.true&event_date=gte.${from}&event_date=lte.${to}&order=event_date.asc`,
    ),
  ]);

  const days: Record<string, DayStatus> = {};
  const rank: Record<DayStatus, number> = { busy: 3, tentative: 2, available: 1, open: 0 };

  function setDay(iso: string, status: DayStatus) {
    const cur = days[iso];
    if (!cur || rank[status] > rank[cur]) days[iso] = status;
  }

  // Expand blocks into individual days
  for (const b of blocks) {
    const start = new Date(b.start_date);
    const end   = new Date(b.end_date);
    const status: DayStatus =
      b.kind === "unavailable" ? "busy"
      : b.kind === "available"  ? "available"
      : "tentative"; // tour_leg

    const weeklyDays: number[] | null = b.weekly_days
      ? (Array.isArray(b.weekly_days) ? b.weekly_days : JSON.parse(b.weekly_days as any))
      : null;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (weeklyDays && !weeklyDays.includes(d.getDay())) continue;
      setDay(d.toISOString().split("T")[0], status);
    }
  }

  // Individual gig dates override block status
  for (const g of gigs) {
    const iso = g.event_date?.slice(0, 10);
    if (!iso) continue;
    const status: DayStatus =
      g.status === "confirmed" ? "busy"
      : g.status === "tentative" ? "tentative"
      : "available";
    setDay(iso, status);
  }

  return {
    artist_id:        artist.id,
    artist_slug:      artist.slug,
    from,
    to,
    days,
    blocks,
    gigs,
    available_cities: artist.available_cities ?? [],
    open_to_bookings: artist.open_to_bookings ?? false,
  };
}

// ── Stats computation ─────────────────────────────────────────────────────────

export function computeArtistStats(
  appearances: EventAppearance[],
  connections: ArtistConnection[],
): ArtistStats {
  const years = appearances.map((a) => a.year).filter(Boolean) as number[];
  return {
    total_gigs:        appearances.length,
    total_cities:      new Set(appearances.map((a) => a.city).filter(Boolean)).size,
    total_venues:      new Set(appearances.map((a) => a.venue).filter(Boolean)).size,
    total_connections: connections.length,
    years_active:      years.length ? Math.max(...years) - Math.min(...years) + 1 : 0,
    b2b_count:         connections.filter((c) => c.connection_type === "b2b").length,
    festival_count:    appearances.filter((a) => a.role === "headliner").length,
  };
}

export function computeArtistFacts(
  stats: ArtistStats,
  appearances: EventAppearance[],
): ArtistFact[] {
  const facts: ArtistFact[] = [];
  if (stats.total_gigs > 0)
    facts.push({ icon: "🎧", label: "Gigs played",    value: String(stats.total_gigs),    detail: `Across ${stats.total_cities} cities and ${stats.total_venues} venues` });
  if (stats.years_active > 1)
    facts.push({ icon: "📅", label: "Years active",   value: String(stats.years_active),  detail: "Consistently performing" });
  if (stats.b2b_count > 0)
    facts.push({ icon: "🤝", label: "B2B partners",   value: String(stats.b2b_count),     detail: "Artists they've shared the decks with" });
  if (stats.festival_count > 0)
    facts.push({ icon: "🏟️", label: "Festival slots", value: String(stats.festival_count), detail: "Headliner appearances" });

  const cityCounts = appearances.reduce<Record<string, number>>((acc, a) => {
    if (a.city) acc[a.city] = (acc[a.city] ?? 0) + 1;
    return acc;
  }, {});
  const topCity = Object.entries(cityCounts).sort((x, y) => y[1] - x[1])[0] as [string, number] | undefined;
  if (topCity)
    facts.push({ icon: "📍", label: "Home turf", value: topCity[0], detail: `${topCity[1]} gigs` });

  return facts;
}

// ── Full profile aggregator ───────────────────────────────────────────────────

/**
 * Fetches all data needed for the artist profile page in one call.
 * All sub-fetches run in parallel. Never throws.
 */
export async function getArtistFullProfile(slug: string): Promise<ArtistFullProfile | null> {
  const artist = await getArtist(slug);
  if (!artist) return null;

  const [appearances, connections, upcomingDates, milestones, socialStats, socialHistory, discography, press] =
    await Promise.all([
      getAppearances(slug),
      getConnections(slug),
      getUpcomingDates(artist.id),
      getMilestones(slug),
      getSocialStats(slug),
      getSocialHistory(slug),
      getDiscography(slug),
      getPress(slug),
    ]);

  const stats = computeArtistStats(appearances, connections);
  const facts = computeArtistFacts(stats, appearances);

  return { artist, appearances, connections, upcomingDates, milestones, socialStats, socialHistory, discography, press, stats, facts };
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createArtist(data: Partial<Artist>) {
  const now = new Date().toISOString();
  return sbInsert<Artist>("artists", { ...data, created_at: now, updated_at: now });
}

export async function updateArtist(id: string, changes: Partial<Artist>) {
  return sbPatch<Artist>("artists", pq(eqf("id", id)), { ...changes, updated_at: new Date().toISOString() });
}

export async function deleteArtist(id: string) {
  return sbDelete("artists", pq(eqf("id", id)));
}

/** Claim an artist profile for a Clerk user. */
export async function claimArtist(artistId: string, clerkUserId: string) {
  return sbPatch("artists", pq(eqf("id", artistId)), { claimed_by: clerkUserId, updated_at: new Date().toISOString() });
}

/** Self-update: only allow safe editable fields. */
const SELF_UPDATE_ALLOWED = new Set([
  "bio","why","photo_url","instagram","soundcloud","spotify","bandcamp","website",
  "booking_email","manager_email","labels","open_to_bookings","available_cities",
  "fee_min_inr","fee_max_inr","fee_currency","genres","festivals","members","from_city","based_city",
]);

export async function selfUpdateArtist(artistId: string, fields: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const k of SELF_UPDATE_ALLOWED) {
    if (k in fields) safe[k] = fields[k];
  }
  if (!Object.keys(safe).length) return { ok: false as const, error: "No editable fields provided" };
  return sbPatch<Artist>("artists", pq(eqf("id", artistId)), { ...safe, updated_at: new Date().toISOString() });
}
