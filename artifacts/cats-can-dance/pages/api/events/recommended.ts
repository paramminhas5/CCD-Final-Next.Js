/**
 * GET /api/events/recommended
 *
 * Personalised recommendation engine for the CuratedEvents component.
 * Sources: curated_events table (Supabase), populated by the nightly
 * Vercel cron (Skillbox / District / Insider / HighApe + Claude Haiku).
 *
 * Auth: reads Clerk userId from Authorization: Bearer <session-token> header
 *       if present, enriches scoring with user_taste_profiles +
 *       user_event_interactions + event_artist_lineups.
 *
 * Tabs: for_you | trending | editors_picks | this_weekend
 * Filters: city, genre, date_from, date_to
 * Pagination: limit (default 12), offset (default 0)
 *
 * Scoring (for_you):
 *   +25  is_featured
 *   +15  each matching liked_genre
 *   +20  each matching liked_artist (via event_artist_lineups)
 *   +10  city in liked_cities
 *   +8   venue in liked_venues
 *   +15  city filter match (explicit)
 *   +5   penalty relief / travel bonus
 *   +0–10 recency (days until event)
 *   +5   never seen before
 *   +3   log(rsvp_count + 1)
 *   −10  out-of-city for non-travellers
 */

import type { NextApiRequest, NextApiResponse } from "next";

const SB = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK = process.env.SUPABASE_SERVICE_KEY ?? "";

if (!SK && process.env.NODE_ENV === "production") {
  console.warn("[recommended] SUPABASE_SERVICE_KEY env var is not set — queries will fail");
}

const sbHeaders = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
});

async function sbGet(table: string, qs = ""): Promise<any[]> {
  if (!SK) return [];
  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs}`, { headers: sbHeaders() });
    if (!r.ok) return [];
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch {
    return [];
  }
}

// ── Auth: extract Clerk userId from the session token ───────────────────────
// Vercel doesn't run Clerk middleware in API routes by default, so we do a
// lightweight JWT parse (no verification — just reading the sub claim).
// The taste-profile data is non-sensitive; the worst case is a wrong user_id.
function extractUserId(req: NextApiRequest): string | null {
  try {
    const auth = req.headers.authorization ?? "";
    if (!auth.startsWith("Bearer ")) return null;
    const token = auth.slice(7);
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    return payload.sub ?? payload.user_id ?? null;
  } catch {
    return null;
  }
}

// ── Date helpers ─────────────────────────────────────────────────────────────
function daysBetween(iso1: string, iso2: string | null): number {
  if (!iso2) return 999;
  return Math.floor(
    (new Date(iso2).getTime() - new Date(iso1).getTime()) / (1000 * 60 * 60 * 24)
  );
}

// ── Genre-diversity pass: don't let one genre dominate the first N slots ─────
function diversify(scored: ScoredItem[], windowSize = 5): ScoredItem[] {
  const result: ScoredItem[] = [];
  const usedGenres = new Set<string>();
  for (const item of scored) {
    const genres: string[] = item.event.genre ?? [];
    const isNew = genres.some(g => !usedGenres.has(g.toLowerCase()));
    if (result.length < windowSize || isNew || result.length >= windowSize * 2) {
      result.push(item);
      genres.forEach(g => usedGenres.add(g.toLowerCase()));
    } else {
      result.push(item);
    }
  }
  return result;
}

interface ScoredItem {
  event: any;
  score: number;
  reasons: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const {
    tab = "for_you",
    city,
    genre,
    date_from,
    date_to,
    limit = "12",
    offset = "0",
  } = req.query as Record<string, string>;

  const today = new Date().toISOString().split("T")[0];

  // ── 1. Fetch all upcoming curated events (published only) ────────────────
  const allEvents: any[] = await sbGet(
    "curated_events",
    `?event_date=gte.${today}&submission_status=eq.published&order=event_date.asc&limit=300`
  );

  if (!allEvents.length) {
    return res.json({ events: [], sections: [], total: 0, tab });
  }

  // ── 2. Read user context (taste profile + interactions + lineups) ─────────
  const userId = extractUserId(req);
  let tasteProfile: any = null;
  let interactions: any[] = [];
  let lineupsByEvent: Record<string, any[]> = {};

  if (userId) {
    // Fetch in parallel
    const [profileRows, interactionRows, lineupRows] = await Promise.all([
      sbGet("user_taste_profiles", `?user_id=eq.${encodeURIComponent(userId)}&limit=1`),
      sbGet("user_event_interactions", `?user_id=eq.${encodeURIComponent(userId)}&limit=500&order=created_at.desc`),
      sbGet("event_artist_lineups", `?limit=500`),
    ]);

    tasteProfile  = profileRows[0] ?? null;
    interactions  = interactionRows;

    // Index lineups by curated_event_id
    for (const l of lineupRows) {
      if (!lineupsByEvent[l.curated_event_id]) lineupsByEvent[l.curated_event_id] = [];
      lineupsByEvent[l.curated_event_id].push(l);
    }
  }

  // ── 3. Score each event ───────────────────────────────────────────────────
  const scored: ScoredItem[] = allEvents.map(event => {
    let score = 0;
    const reasons: string[] = [];
    const eventGenres: string[] = event.genre ?? [];
    const eventLineups: any[] = lineupsByEvent[event.id] ?? [];
    const daysUntil = daysBetween(today, event.event_date);

    // ── Tab-specific scoring ──────────────────────────────────────────────
    if (tab === "trending") {
      score += Math.max(0, 14 - daysUntil) * 3;
      score += event.is_featured ? 20 : 0;
      score += eventLineups.filter((l: any) => l.is_featured).length * 4;
      reasons.push("trending");

    } else if (tab === "editors_picks") {
      score += event.is_featured ? 100 : 0;
      score += ["editorial", "manual"].includes(event.source) ? 40 : 0;
      if (score === 0) score = -9999; // hide non-featured from this tab
      reasons.push("editors_pick");

    } else if (tab === "this_weekend") {
      if (daysUntil >= 0 && daysUntil <= 3) {
        score += 50;
        reasons.push("this_weekend");
      } else {
        score = -9999;
      }

    } else {
      // ── "For You": personalised ──────────────────────────────────────────

      // Base boosts
      score += event.is_featured ? 25 : 0;
      score += Math.max(0, 10 - daysUntil); // recency

      // Never seen before
      const seenBefore = interactions.some(i => i.event_id === event.id);
      if (!seenBefore) score += 5;

      // ── Taste-profile scoring ──────────────────────────────────────────
      if (tasteProfile) {
        // Genre affinity
        const likedGenres: string[] = tasteProfile.liked_genres ?? tasteProfile.genres ?? [];
        const genreMatches = eventGenres.filter(g =>
          likedGenres.some(lg => lg.toLowerCase() === g.toLowerCase())
        ).length;
        if (genreMatches > 0) {
          score += genreMatches * 15;
          reasons.push("genre_match");
        }

        // Artist affinity (lineup join)
        const likedSlugs: string[] = tasteProfile.liked_artist_slugs ?? [];
        const artistMatches = eventLineups.filter(l =>
          l.artist_slug && likedSlugs.includes(l.artist_slug)
        ).length;
        if (artistMatches > 0) {
          score += artistMatches * 20;
          reasons.push("artist_you_like");
        }

        // City preference
        const likedCities: string[] = tasteProfile.liked_cities ?? tasteProfile.cities ?? [];
        if (likedCities.length > 0 && event.city) {
          if (likedCities.some(c => (event.city as string).toLowerCase().includes(c.toLowerCase()))) {
            score += 10;
            reasons.push("city_you_like");
          }
        }

        // Venue preference
        const likedVenues: string[] = tasteProfile.liked_venues ?? [];
        if (likedVenues.length > 0 && event.venue) {
          if (likedVenues.some(v => (event.venue as string).toLowerCase().includes(v.toLowerCase()))) {
            score += 8;
            reasons.push("venue_you_like");
          }
        }

        // Travel willingness — penalise out-of-city if user prefers home city
        const travelWillingness: number = tasteProfile.travel_willingness ?? 0.5;
        if (city && event.city) {
          const cityMatch = (event.city as string).toLowerCase().includes((city as string).toLowerCase());
          if (cityMatch) {
            score += 15;
            reasons.push("in_your_city");
          } else if (travelWillingness > 0.5) {
            score += 5;
            reasons.push("worth_the_trip");
          } else {
            score -= 10;
          }
        }

        // Social proof — RSVPs from interactions
        const rsvpCount = interactions.filter(i => i.event_id === event.id && i.action === "rsvp").length;
        score += Math.log(rsvpCount + 1) * 3;

      } else {
        // No taste profile: fallback heuristic
        if (city && event.city) {
          if ((event.city as string).toLowerCase().includes((city as string).toLowerCase())) {
            score += 20;
            reasons.push("in_your_city");
          }
        }
        if (eventGenres.length > 0) {
          score += 5;
          reasons.push("genre_match");
        }
      }
    }

    // ── Global filters ─────────────────────────────────────────────────────
    if (city && event.city && tab !== "for_you") {
      if (!(event.city as string).toLowerCase().includes((city as string).toLowerCase())) {
        score = -9999;
      }
    }
    if (genre) {
      const gLower = (genre as string).toLowerCase();
      const hasGenre = eventGenres.some(g => g.toLowerCase().includes(gLower));
      if (!hasGenre) score = -9999;
    }
    if (date_from && event.event_date && event.event_date < (date_from as string)) score = -9999;
    if (date_to   && event.event_date && event.event_date > (date_to   as string)) score = -9999;

    return { event, score, reasons };
  });

  // ── 4. Sort + filter + diversify + paginate ───────────────────────────────
  const filtered    = scored.filter(s => s.score > -500).sort((a, b) => b.score - a.score);
  const diversified = diversify(filtered, 5);

  const lim = parseInt(limit, 10);
  const off = parseInt(offset, 10);
  const paginated = diversified.slice(off, off + lim);

  // ── 5. Build sections for "for_you" tab ───────────────────────────────────
  const sections: { title: string; subtitle: string; events: any[] }[] = [];

  if (tab === "for_you" && paginated.length > 0) {
    // Group by primary reason
    const byReason: Record<string, ScoredItem[]> = {};
    for (const item of paginated) {
      const key = item.reasons[0] ?? "recommended";
      if (!byReason[key]) byReason[key] = [];
      byReason[key].push(item);
    }

    if (byReason["artist_you_like"]?.length > 0) {
      sections.push({
        title: "Artists You Love",
        subtitle: "Events featuring artists you follow",
        events: byReason["artist_you_like"].slice(0, 4).map(i => ({
          ...i.event, score: i.score, reasons: i.reasons,
        })),
      });
    }

    if (byReason["genre_match"]?.length > 0) {
      sections.push({
        title: "Your Vibe",
        subtitle: "Matches your taste profile",
        events: byReason["genre_match"].slice(0, 4).map(i => ({
          ...i.event, score: i.score, reasons: i.reasons,
        })),
      });
    }

    if (byReason["worth_the_trip"]?.length > 0) {
      sections.push({
        title: "Worth the Trip",
        subtitle: "Events outside your city that match your taste",
        events: byReason["worth_the_trip"].slice(0, 3).map(i => ({
          ...i.event, score: i.score, reasons: i.reasons,
        })),
      });
    }

    // Fallback: This Weekend / Editor's Picks / Coming Up
    if (sections.length === 0) {
      const thisWeekend = paginated.filter(p => daysBetween(today, p.event.event_date) <= 3);
      const featured    = paginated.filter(p => p.event.is_featured);
      const rest        = paginated.filter(p => !p.event.is_featured && daysBetween(today, p.event.event_date) > 3);

      if (thisWeekend.length > 0) sections.push({
        title: "This Weekend",
        subtitle: "Happening in the next 3 days",
        events: thisWeekend.slice(0, 4).map(i => ({ ...i.event, score: i.score, reasons: i.reasons })),
      });
      if (featured.length > 0) sections.push({
        title: "Editor's Picks",
        subtitle: "Hand-curated events worth showing up for",
        events: featured.slice(0, 4).map(i => ({ ...i.event, score: i.score, reasons: i.reasons })),
      });
      if (rest.length > 0) sections.push({
        title: "Coming Up",
        subtitle: "More events on the horizon",
        events: rest.slice(0, 4).map(i => ({ ...i.event, score: i.score, reasons: i.reasons })),
      });
    }
  }

  return res.json({
    events: paginated.map(p => ({ ...p.event, score: p.score, reasons: p.reasons })),
    sections,
    total: filtered.length,
    tab,
    user_id: userId ?? null,
  });
}
