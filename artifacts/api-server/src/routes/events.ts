import { Router } from "express";
import { db } from "@workspace/db";
import { 
  curatedEventsTable, 
  userEventInteractionsTable,
  userTasteProfilesTable,
  eventArtistLineupsTable,
} from "@workspace/db/schema";
import { eq, and, sql, desc, asc, gte, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

// ─── GET /api/events/recommended ──────────────────────────────────────────────
// World-class recommendation engine for electronic & culture-forward events
router.get("/recommended", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    const { 
      city, 
      tab = 'for_you', 
      limit = 20, 
      offset = 0,
      genre,
      date_from,
      date_to,
    } = req.query;

    // Get all upcoming events
    const today = new Date().toISOString().split('T')[0];
    let eventQuery = db
      .select()
      .from(curatedEventsTable)
      .where(gte(curatedEventsTable.event_date, today))
      .orderBy(asc(curatedEventsTable.event_date));

    const allEvents = await eventQuery;

    // Get user taste profile if authenticated
    let tasteProfile = null;
    let userInteractions = [];

    if (userId) {
      const profileRows = await db
        .select()
        .from(userTasteProfilesTable)
        .where(eq(userTasteProfilesTable.user_id, userId));
      tasteProfile = profileRows[0] || null;

      const interactionRows = await db
        .select()
        .from(userEventInteractionsTable)
        .where(eq(userEventInteractionsTable.user_id, userId));
      userInteractions = interactionRows;
    }

    // Get lineups for events
    const eventIds = allEvents.map(e => e.id);
    const lineups = eventIds.length > 0 
      ? await db
          .select()
          .from(eventArtistLineupsTable)
          .where(inArray(eventArtistLineupsTable.curated_event_id, eventIds))
      : [];

    const lineupsByEvent = lineups.reduce((acc, l) => {
      if (!acc[l.curated_event_id]) acc[l.curated_event_id] = [];
      acc[l.curated_event_id].push(l);
      return acc;
    }, {} as Record<string, typeof lineups>);

    // Score each event
    const scoredEvents = allEvents.map(event => {
      let score = 0;
      const reasons = [];
      const eventLineups = lineupsByEvent[event.id] || [];
      const eventGenres = event.genre || [];

      // ─── Tab-specific scoring ─────────────────────────────────────────────

      if (tab === 'trending') {
        // Hype score: RSVPs, shares, recency
        const daysUntil = daysBetween(today, event.event_date);
        score += Math.max(0, 14 - daysUntil) * 2; // Closer = more trending
        score += (eventLineups.filter(l => l.is_featured).length * 3); // Featured artists
        reasons.push('trending');
      }

      else if (tab === 'editors_picks') {
        // Editorial curation
        score += event.is_featured ? 100 : 0;
        score += event.source === 'editorial' ? 50 : 0;
        reasons.push('editors_pick');
      }

      else if (tab === 'this_weekend') {
        const daysUntil = daysBetween(today, event.event_date);
        if (daysUntil >= 0 && daysUntil <= 3) {
          score += 50;
          reasons.push('this_weekend');
        } else {
          score = -1000; // Exclude non-weekend
        }
      }

      else {
        // ─── "For You" personalized scoring ─────────────────────────────────

        // Genre affinity
        if (tasteProfile?.liked_genres?.length > 0) {
          const genreMatches = eventGenres.filter(g => 
            tasteProfile.liked_genres.some(lg => lg.toLowerCase() === g.toLowerCase())
          ).length;
          score += genreMatches * 15;
          if (genreMatches > 0) reasons.push('genre_match');
        }

        // Artist affinity (if any lineup artist is in liked list)
        if (tasteProfile?.liked_artist_slugs?.length > 0) {
          const artistMatches = eventLineups.filter(l => 
            tasteProfile.liked_artist_slugs.includes(l.artist_slug)
          ).length;
          score += artistMatches * 20;
          if (artistMatches > 0) reasons.push('artist_you_like');
        }

        // City preference
        if (tasteProfile?.liked_cities?.length > 0) {
          if (tasteProfile.liked_cities.includes(event.city || '')) {
            score += 10;
            reasons.push('city_you_like');
          }
        }

        // Venue affinity
        if (tasteProfile?.liked_venues?.length > 0) {
          if (tasteProfile.liked_venues.includes(event.venue || '')) {
            score += 8;
            reasons.push('venue_you_like');
          }
        }

        // Price sensitivity (simplified — assume free/affordable is better for young India)
        // Could add ticket_price field to curated_events

        // Travel willingness
        if (city && event.city !== city) {
          if (tasteProfile?.travel_willingness && tasteProfile.travel_willingness > 0.5) {
            score += 5; // Still show out-of-city if user is willing to travel
            reasons.push('worth_the_trip');
          } else {
            score -= 10; // Penalize out-of-city for homebodies
          }
        } else if (city && event.city === city) {
          score += 15;
          reasons.push('in_your_city');
        }

        // Diversity: penalize same genre as recently viewed/saved
        const recentSameGenre = userInteractions.filter(i => 
          i.action === 'view' && 
          i.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        );
        // Simplified: don't penalize too hard

        // Recency boost
        const daysUntil = daysBetween(today, event.event_date);
        score += Math.max(0, 10 - daysUntil) * 1;

        // Editorial boost
        score += event.is_featured ? 25 : 0;

        // Social proof
        const rsvpCount = userInteractions.filter(i => i.event_id === event.id && i.action === 'rsvp').length;
        score += Math.log(rsvpCount + 1) * 3;

        // Freshness — never shown before
        const seenBefore = userInteractions.some(i => i.event_id === event.id);
        if (!seenBefore) score += 5;
      }

      // ─── Global filters ───────────────────────────────────────────────────

      // City filter (if explicitly set)
      if (city && event.city !== city && tab !== 'for_you') {
        score = -1000;
      }

      // Genre filter
      if (genre && !eventGenres.some(g => g.toLowerCase().includes((genre as string).toLowerCase()))) {
        score = -1000;
      }

      // Date range
      if (date_from && event.event_date < (date_from as string)) score = -1000;
      if (date_to && event.event_date > (date_to as string)) score = -1000;

      return { event, score, reasons, lineups: eventLineups };
    });

    // Sort by score, filter out excluded
    const filtered = scoredEvents.filter(s => s.score > -500);
    filtered.sort((a, b) => b.score - a.score);

    // Apply diversity: don't let same genre dominate top 5
    const diversified = applyDiversity(filtered, 5);

    // Paginate
    const paginated = diversified.slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));

    // Group by section for UI
    const sections = groupIntoSections(paginated, tab as string, city as string | undefined);

    res.json({
      events: paginated.map(p => ({
        ...p.event,
        lineups: p.lineups,
        score: p.score,
        reasons: p.reasons,
      })),
      sections,
      total: filtered.length,
      tab,
      user_id: userId || null,
    });

  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/events/:id/interact ────────────────────────────────────────────
// Track user interaction for recommendation engine
router.post("/:id/interact", async (req, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    const { action, metadata = {} } = req.body;
    const eventId = req.params.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!['view', 'save', 'rsvp', 'share', 'attended', 'dismissed'].includes(action)) {
      res.status(400).json({ error: "Invalid action" });
      return;
    }

    await db.insert(userEventInteractionsTable).values({
      user_id: userId,
      event_id: eventId,
      action,
      metadata,
      created_at: new Date(),
    });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/events/trending ─────────────────────────────────────────────────
router.get("/trending", async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const events = await db
      .select()
      .from(curatedEventsTable)
      .where(
        and(
          gte(curatedEventsTable.event_date, today),
          lte(curatedEventsTable.event_date, twoWeeksLater)
        )
      )
      .orderBy(asc(curatedEventsTable.event_date))
      .limit(20);

    res.json(events);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysBetween(date1: string, date2: string | null): number {
  if (!date2) return 999;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function applyDiversity(scored: any[], windowSize: number): any[] {
  const result = [];
  const usedGenres = new Set();

  for (const item of scored) {
    const genres = item.event.genre || [];
    const hasNewGenre = genres.some((g: string) => !usedGenres.has(g));

    if (result.length < windowSize || hasNewGenre || result.length > windowSize * 2) {
      result.push(item);
      genres.forEach((g: string) => usedGenres.add(g));
    } else {
      // Skip if too similar, but add if we're running low
      if (result.length < scored.length * 0.7) {
        result.push(item);
      }
    }
  }

  return result;
}

function groupIntoSections(paginated: any[], tab: string, userCity?: string) {
  const sections = [];

  if (tab === 'for_you') {
    // Group by reason
    const byReason = paginated.reduce((acc, item) => {
      const primaryReason = item.reasons[0] || 'recommended';
      if (!acc[primaryReason]) acc[primaryReason] = [];
      acc[primaryReason].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    if (byReason['artist_you_like']?.length > 0) {
      sections.push({
        title: "Artists You Love",
        subtitle: "Events featuring artists you follow",
        events: byReason['artist_you_like'].slice(0, 4),
      });
    }

    if (byReason['genre_match']?.length > 0) {
      sections.push({
        title: "Your Vibe",
        subtitle: "Matches your taste profile",
        events: byReason['genre_match'].slice(0, 4),
      });
    }

    if (byReason['worth_the_trip']?.length > 0) {
      sections.push({
        title: "Worth the Trip",
        subtitle: "Events outside your city that match your taste",
        events: byReason['worth_the_trip'].slice(0, 3),
      });
    }

    // Fallback: just show top scored
    if (sections.length === 0) {
      sections.push({
        title: "Recommended For You",
        subtitle: "Based on your activity",
        events: paginated.slice(0, 6),
      });
    }
  }

  return sections;
}

export default router;
