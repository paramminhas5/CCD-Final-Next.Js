/**
 * GET /api/events/recommended
 *
 * Recommendation engine for the CuratedEvents component.
 * Sources from the `curated_events` Supabase table (populated by admin + future
 * scrapers for Skillbox, District, etc.).
 *
 * Tabs: for_you | trending | editors_picks | this_weekend
 * Filters: city, genre, date_from, date_to
 * Pagination: limit, offset
 *
 * Scoring:
 *   - trending: proximity to today + featured artist boost
 *   - editors_picks: is_featured flag + editorial source
 *   - this_weekend: only events within next 3 days
 *   - for_you: freshness + city match + is_featured + genre diversity
 */

import type { NextApiRequest, NextApiResponse } from "next";

const SB = "https://nrzgyippztzenoyrtszr.supabase.co";
const SK =
  process.env.SUPABASE_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yemd5aXBwenR6ZW5veXJ0c3pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExNjAzOCwiZXhwIjoyMDk0NjkyMDM4fQ.79dS5Y1Ov1P51veAR62fKEX4m-okHqSAg6huzTTL2C4";

const headers = () => ({
  Authorization: `Bearer ${SK}`,
  apikey: SK,
  "Content-Type": "application/json",
});

async function sbGet(table: string, qs = ""): Promise<any[]> {
  try {
    const r = await fetch(`${SB}/rest/v1/${table}${qs}`, { headers: headers() });
    if (!r.ok) return [];
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch {
    return [];
  }
}

function daysBetween(iso1: string, iso2: string | null): number {
  if (!iso2) return 999;
  return Math.floor(
    (new Date(iso2).getTime() - new Date(iso1).getTime()) / (1000 * 60 * 60 * 24)
  );
}

/** Light genre-diversity pass: don't let one genre dominate the first N slots */
function diversify(scored: any[], windowSize = 5): any[] {
  const result: any[] = [];
  const usedGenres = new Set<string>();
  for (const item of scored) {
    const genres: string[] = item.event.genre ?? [];
    const isNew = genres.some((g) => !usedGenres.has(g.toLowerCase()));
    if (result.length < windowSize || isNew || result.length >= windowSize * 2) {
      result.push(item);
      genres.forEach((g) => usedGenres.add(g.toLowerCase()));
    } else {
      result.push(item); // include anyway, just de-prioritise
    }
  }
  return result;
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

  // ── Fetch all upcoming curated events ─────────────────────────────────────
  const allEvents: any[] = await sbGet(
    "curated_events",
    `?event_date=gte.${today}&order=event_date.asc&limit=200`
  );

  if (!allEvents.length) {
    return res.json({ events: [], sections: [], total: 0, tab });
  }

  // ── Score each event ───────────────────────────────────────────────────────
  const scored = allEvents.map((event) => {
    let score = 0;
    const reasons: string[] = [];
    const eventGenres: string[] = event.genre ?? [];
    const daysUntil = daysBetween(today, event.event_date);

    if (tab === "trending") {
      score += Math.max(0, 14 - daysUntil) * 3;
      score += event.is_featured ? 20 : 0;
      reasons.push("trending");
    } else if (tab === "editors_picks") {
      score += event.is_featured ? 100 : 0;
      score += event.source === "editorial" || event.source === "manual" ? 40 : 0;
      reasons.push("editors_pick");
    } else if (tab === "this_weekend") {
      if (daysUntil >= 0 && daysUntil <= 3) {
        score += 50;
        reasons.push("this_weekend");
      } else {
        score = -9999;
      }
    } else {
      // ── for_you: freshness + city + featured + recency ──────────────────
      score += event.is_featured ? 25 : 0;
      score += Math.max(0, 10 - daysUntil);

      if (city && event.city) {
        if (event.city.toLowerCase().includes((city as string).toLowerCase())) {
          score += 20;
          reasons.push("in_your_city");
        }
      }

      if (eventGenres.length > 0) {
        reasons.push("genre_match");
        score += 5;
      }
    }

    // ── Global filters ───────────────────────────────────────────────────────
    if (city && event.city && tab !== "for_you") {
      if (!event.city.toLowerCase().includes((city as string).toLowerCase())) {
        score = -9999;
      }
    }
    if (genre) {
      const gLower = (genre as string).toLowerCase();
      const hasGenre = eventGenres.some((g) => g.toLowerCase().includes(gLower));
      if (!hasGenre) score = -9999;
    }
    if (date_from && event.event_date && event.event_date < (date_from as string)) {
      score = -9999;
    }
    if (date_to && event.event_date && event.event_date > (date_to as string)) {
      score = -9999;
    }

    return { event, score, reasons };
  });

  // ── Sort + filter ──────────────────────────────────────────────────────────
  const filtered = scored.filter((s) => s.score > -500).sort((a, b) => b.score - a.score);
  const diversified = diversify(filtered, 5);

  const lim = parseInt(limit as string, 10);
  const off = parseInt(offset as string, 10);
  const paginated = diversified.slice(off, off + lim);

  // ── Build sections for "for_you" tab ──────────────────────────────────────
  const sections: { title: string; subtitle: string; events: any[] }[] = [];
  if (tab === "for_you" && paginated.length > 0) {
    const thisWeekend = paginated.filter(
      (p) => daysBetween(today, p.event.event_date) <= 3
    );
    const featured = paginated.filter((p) => p.event.is_featured);
    const rest = paginated.filter(
      (p) => !p.event.is_featured && daysBetween(today, p.event.event_date) > 3
    );

    if (thisWeekend.length > 0) {
      sections.push({
        title: "This Weekend",
        subtitle: "Happening in the next 3 days",
        events: thisWeekend.slice(0, 4),
      });
    }
    if (featured.length > 0) {
      sections.push({
        title: "Editor's Picks",
        subtitle: "Hand-curated events worth showing up for",
        events: featured.slice(0, 4),
      });
    }
    if (rest.length > 0) {
      sections.push({
        title: "Coming Up",
        subtitle: "More events on the horizon",
        events: rest.slice(0, 4),
      });
    }
  }

  return res.json({
    events: paginated.map((p) => ({ ...p.event, score: p.score, reasons: p.reasons })),
    sections,
    total: filtered.length,
    tab,
  });
}
