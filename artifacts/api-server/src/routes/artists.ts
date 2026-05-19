import { Router } from "express";
import { db } from "@workspace/db";
import {
  artistsTable,
  artistConnectionsTable,
  artistDatesTable,
  eventAppearancesTable,
  artistMilestonesTable,
  artistSocialStatsTable,
  artistDiscographyTable,
  artistPressTable,
  curatedEventsTable,
} from "@workspace/db/schema";
import { eq, and, sql, desc, asc, inArray, gte, lte } from "drizzle-orm";
import { requireAdmin } from "../middleware/adminAuth";
import { verifySessionToken } from "./auth";
import { getAuth } from "@clerk/express";

const router = Router();

// ─── GET /api/artists ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.status, "approved"));
    res.json(rows);
  } catch (e: any) {
    console.error("[GET /api/artists] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/artists/by-user ─────────────────────────────────────────────────
router.get("/by-user", async (req, res) => {
  const auth = getAuth(req);
  const rawId =
    auth?.userId ??
    verifySessionToken(req.headers["x-session-token"] as string | undefined);
  const userId = rawId ?? undefined;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.claimed_by, userId));
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    console.error("[GET /api/artists/by-user] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/artists/:slug ───────────────────────────────────────────────────
router.get("/:slug", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.slug, req.params.slug as string));
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    console.error("[GET /api/artists/:slug] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/artists/:slug/basic ─────────────────────────────────────────────
// Simplified endpoint: artist + events only. Resilient to missing related tables.
router.get("/:slug/basic", async (req, res) => {
  try {
    const slug = req.params.slug;

    // Get artist
    const artistRows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.slug, slug));
    if (!artistRows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const artist = artistRows[0];

    // Get event appearances (gig history) — wrapped in try/catch for resilience
    let appearances: any[] = [];
    try {
      appearances = await db
        .select()
        .from(eventAppearancesTable)
        .where(eq(eventAppearancesTable.artist_slug, slug))
        .orderBy(desc(eventAppearancesTable.event_date))
        .limit(50);
    } catch (err) {
      console.error("[basic] eventAppearances query failed:", err);
    }

    // Get upcoming dates
    let upcomingDates: any[] = [];
    try {
      upcomingDates = await db
        .select()
        .from(artistDatesTable)
        .where(
          and(
            eq(artistDatesTable.artist_id, artist.id),
            gte(artistDatesTable.event_date, new Date().toISOString().split('T')[0])
          )
        )
        .orderBy(asc(artistDatesTable.event_date))
        .limit(10);
    } catch (err) {
      console.error("[basic] artistDates query failed:", err);
    }

    // Simple stats
    const stats = {
      total_gigs: appearances.length,
      total_cities: new Set(appearances.map(a => a.city).filter(Boolean)).size,
      total_venues: new Set(appearances.map(a => a.venue).filter(Boolean)).size,
      years_active: appearances.length > 0
        ? Math.max(...appearances.map(a => a.year || 0)) - Math.min(...appearances.map(a => a.year || 9999)) + 1
        : 0,
    };

    res.json({ artist, appearances, upcomingDates, stats });
  } catch (e: any) {
    console.error("[GET /api/artists/:slug/basic] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/artists/:slug/full ──────────────────────────────────────────────
// Returns artist + all enriched data in one request. Now resilient to partial failures.
router.get("/:slug/full", async (req, res) => {
  try {
    const slug = req.params.slug;

    // Get artist
    const artistRows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.slug, slug));
    if (!artistRows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const artist = artistRows[0];

    // Query all related tables with individual try/catch so one failure doesn't kill everything
    let connections: any[] = [];
    try {
      connections = await db
        .select()
        .from(artistConnectionsTable)
        .where(
          sql`${artistConnectionsTable.artist_a_slug} = ${slug} OR ${artistConnectionsTable.artist_b_slug} = ${slug}`
        )
        .orderBy(desc(artistConnectionsTable.strength))
        .limit(20);
    } catch (err) {
      console.error("[full] connections query failed:", err);
    }

    let appearances: any[] = [];
    try {
      appearances = await db
        .select()
        .from(eventAppearancesTable)
        .where(eq(eventAppearancesTable.artist_slug, slug))
        .orderBy(desc(eventAppearancesTable.event_date))
        .limit(50);
    } catch (err) {
      console.error("[full] appearances query failed:", err);
    }

    let upcomingDates: any[] = [];
    try {
      upcomingDates = await db
        .select()
        .from(artistDatesTable)
        .where(
          and(
            eq(artistDatesTable.artist_id, artist.id),
            gte(artistDatesTable.event_date, new Date().toISOString().split('T')[0])
          )
        )
        .orderBy(asc(artistDatesTable.event_date))
        .limit(10);
    } catch (err) {
      console.error("[full] upcomingDates query failed:", err);
    }

    let milestones: any[] = [];
    try {
      milestones = await db
        .select()
        .from(artistMilestonesTable)
        .where(eq(artistMilestonesTable.artist_slug, slug))
        .orderBy(asc(artistMilestonesTable.date))
        .limit(30);
    } catch (err) {
      console.error("[full] milestones query failed:", err);
    }

    let socialStats: any = null;
    try {
      const ss = await db
        .select()
        .from(artistSocialStatsTable)
        .where(eq(artistSocialStatsTable.artist_slug, slug))
        .orderBy(desc(artistSocialStatsTable.captured_at))
        .limit(1);
      socialStats = ss[0] || null;
    } catch (err) {
      console.error("[full] socialStats query failed:", err);
    }

    let discography: any[] = [];
    try {
      discography = await db
        .select()
        .from(artistDiscographyTable)
        .where(eq(artistDiscographyTable.artist_slug, slug))
        .orderBy(desc(artistDiscographyTable.release_date))
        .limit(20);
    } catch (err) {
      console.error("[full] discography query failed:", err);
    }

    let press: any[] = [];
    try {
      press = await db
        .select()
        .from(artistPressTable)
        .where(eq(artistPressTable.artist_slug, slug))
        .orderBy(desc(artistPressTable.date_published))
        .limit(10);
    } catch (err) {
      console.error("[full] press query failed:", err);
    }

    // Compute stats
    const stats = {
      total_gigs: appearances.length,
      total_cities: new Set(appearances.map(a => a.city).filter(Boolean)).size,
      total_venues: new Set(appearances.map(a => a.venue).filter(Boolean)).size,
      total_connections: connections.length,
      years_active: appearances.length > 0
        ? Math.max(...appearances.map(a => a.year || 0)) - Math.min(...appearances.map(a => a.year || 9999)) + 1
        : 0,
      b2b_count: connections.filter(c => c.connection_type === 'b2b').length,
      festival_count: appearances.filter(a => a.role === 'headliner' || (a.event_name || '').toLowerCase().includes('festival')).length,
    };

    // Generate cool facts from data
    const facts = generateCoolFacts(artist, appearances, connections, milestones, stats);

    res.json({
      artist,
      connections,
      appearances,
      upcomingDates,
      milestones,
      socialStats,
      discography,
      press,
      stats,
      facts,
    });
  } catch (e: any) {
    console.error("[GET /api/artists/:slug/full] fatal error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/artists/:slug/connections ───────────────────────────────────────
router.get("/:slug/connections", async (req, res) => {
  try {
    const slug = req.params.slug;
    const connections = await db
      .select()
      .from(artistConnectionsTable)
      .where(
        sql`${artistConnectionsTable.artist_a_slug} = ${slug} OR ${artistConnectionsTable.artist_b_slug} = ${slug}`
      )
      .orderBy(desc(artistConnectionsTable.strength));
    res.json(connections);
  } catch (e: any) {
    console.error("[GET connections] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/artists/:slug/gigography ──────────────────────────────────────────
router.get("/:slug/gigography", async (req, res) => {
  try {
    const slug = req.params.slug;
    const { year, city, venue } = req.query;

    let conditions = [eq(eventAppearancesTable.artist_slug, slug)];
    if (year) conditions.push(eq(eventAppearancesTable.year, parseInt(year as string)));
    if (city) conditions.push(eq(eventAppearancesTable.city, city as string));
    if (venue) conditions.push(eq(eventAppearancesTable.venue, venue as string));

    const appearances = await db
      .select()
      .from(eventAppearancesTable)
      .where(and(...conditions))
      .orderBy(desc(eventAppearancesTable.event_date));

    // Group by year for timeline view
    const byYear = appearances.reduce((acc, gig) => {
      const y = gig.year || 'unknown';
      if (!acc[y]) acc[y] = [];
      acc[y].push(gig);
      return acc;
    }, {} as Record<string, any[]>);

    res.json({ appearances, byYear, total: appearances.length });
  } catch (e: any) {
    console.error("[GET gigography] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/artists/:slug/milestones ────────────────────────────────────────
router.get("/:slug/milestones", async (req, res) => {
  try {
    const slug = req.params.slug;
    const milestones = await db
      .select()
      .from(artistMilestonesTable)
      .where(eq(artistMilestonesTable.artist_slug, slug))
      .orderBy(asc(artistMilestonesTable.date));
    res.json(milestones);
  } catch (e: any) {
    console.error("[GET milestones] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── GET /api/artists/:slug/stats ─────────────────────────────────────────────
router.get("/:slug/stats", async (req, res) => {
  try {
    const slug = req.params.slug;

    const appearances = await db
      .select()
      .from(eventAppearancesTable)
      .where(eq(eventAppearancesTable.artist_slug, slug));

    const connections = await db
      .select()
      .from(artistConnectionsTable)
      .where(
        sql`${artistConnectionsTable.artist_a_slug} = ${slug} OR ${artistConnectionsTable.artist_b_slug} = ${slug}`
      );

    // Yearly breakdown
    const byYear = appearances.reduce((acc, gig) => {
      const y = gig.year || 0;
      if (!acc[y]) acc[y] = { count: 0, cities: new Set(), venues: new Set(), festivals: 0 };
      acc[y].count++;
      if (gig.city) acc[y].cities.add(gig.city);
      if (gig.venue) acc[y].venues.add(gig.venue);
      if (gig.role === 'headliner') acc[y].festivals++;
      return acc;
    }, {} as Record<number, any>);

    // City breakdown
    const byCity = appearances.reduce((acc, gig) => {
      const c = gig.city || 'Unknown';
      if (!acc[c]) acc[c] = 0;
      acc[c]++;
      return acc;
    }, {} as Record<string, number>);

    // Venue breakdown
    const byVenue = appearances.reduce((acc, gig) => {
      const v = gig.venue || 'Unknown';
      if (!acc[v]) acc[v] = { count: 0, city: gig.city || 'Unknown' };
      acc[v].count++;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      total_gigs: appearances.length,
      total_cities: Object.keys(byCity).length,
      total_venues: Object.keys(byVenue).length,
      total_connections: connections.length,
      b2b_partners: connections.filter(c => c.connection_type === 'b2b').length,
      byYear: Object.entries(byYear).map(([year, data]) => ({
        year: parseInt(year),
        gigs: data.count,
        cities: data.cities.size,
        venues: data.venues.size,
      })),
      byCity: Object.entries(byCity).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count),
      byVenue: Object.entries(byVenue).map(([venue, data]) => ({ venue, count: data.count, city: data.city })).sort((a, b) => b.count - a.count),
    });
  } catch (e: any) {
    console.error("[GET stats] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/artists/:slug/generate-milestones ──────────────────────────────
// Auto-generate milestones from gig history
router.post("/:slug/generate-milestones", requireAdmin, async (req, res) => {
  try {
    const slug = req.params.slug;

    const artistRows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.slug, slug));
    if (!artistRows.length) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }
    const artist = artistRows[0];

    const appearances = await db
      .select()
      .from(eventAppearancesTable)
      .where(eq(eventAppearancesTable.artist_slug, slug))
      .orderBy(asc(eventAppearancesTable.event_date));

    const milestones = [];

    // First gig milestone
    if (appearances.length > 0) {
      const first = appearances[0];
      milestones.push({
        artist_id: artist.id,
        artist_slug: slug,
        date: first.event_date || first.year + '-01-01',
        year: first.year,
        type: 'first_gig',
        title: `First recorded gig`,
        description: `Played at ${first.venue || 'unknown venue'} in ${first.city || 'unknown city'}`,
        venue: first.venue,
        city: first.city,
        event_name: first.event_name,
        source: 'auto',
        source_event_id: first.id,
        importance: 8,
      });
    }

    // Festival debut (first headliner role)
    const firstFestival = appearances.find(a => a.role === 'headliner');
    if (firstFestival) {
      milestones.push({
        artist_id: artist.id,
        artist_slug: slug,
        date: firstFestival.event_date || firstFestival.year + '-01-01',
        year: firstFestival.year,
        type: 'festival_debut',
        title: `Festival debut`,
        description: `Headlined ${firstFestival.event_name} at ${firstFestival.venue}`,
        venue: firstFestival.venue,
        city: firstFestival.city,
        event_name: firstFestival.event_name,
        source: 'auto',
        source_event_id: firstFestival.id,
        importance: 9,
      });
    }

    // B2B milestone (from connections)
    const b2bs = await db
      .select()
      .from(artistConnectionsTable)
      .where(
        and(
          sql`${artistConnectionsTable.artist_a_slug} = ${slug} OR ${artistConnectionsTable.artist_b_slug} = ${slug}`,
          eq(artistConnectionsTable.connection_type, 'b2b')
        )
      );

    if (b2bs.length > 0) {
      const firstB2B = b2bs[0];
      const partnerSlug = firstB2B.artist_a_slug === slug ? firstB2B.artist_b_slug : firstB2B.artist_a_slug;
      milestones.push({
        artist_id: artist.id,
        artist_slug: slug,
        date: firstB2B.created_at.toISOString().split('T')[0],
        type: 'b2b',
        title: `B2B with ${partnerSlug}`,
        description: `First back-to-back set with ${partnerSlug}`,
        related_artist_slug: partnerSlug,
        source: 'auto',
        importance: 7,
      });
    }

    // City milestones (first time in each major city)
    const cities = new Set();
    const majorCities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Goa', 'Hyderabad', 'Chennai', 'Kolkata'];
    for (const gig of appearances) {
      if (gig.city && majorCities.includes(gig.city) && !cities.has(gig.city)) {
        cities.add(gig.city);
        milestones.push({
          artist_id: artist.id,
          artist_slug: slug,
          date: gig.event_date || gig.year + '-01-01',
          year: gig.year,
          type: 'tour',
          title: `First time in ${gig.city}`,
          description: `Debut performance in ${gig.city} at ${gig.venue}`,
          city: gig.city,
          venue: gig.venue,
          event_name: gig.event_name,
          source: 'auto',
          source_event_id: gig.id,
          importance: 6,
        });
      }
    }

    // Insert milestones
    for (const m of milestones) {
      await db.insert(artistMilestonesTable).values(m).onConflictDoNothing();
    }

    res.json({ generated: milestones.length, milestones });
  } catch (e: any) {
    console.error("[POST generate-milestones] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── POST /api/artists/:slug/generate-connections ─────────────────────────────
// Auto-generate connections from event appearances
router.post("/:slug/generate-connections", requireAdmin, async (req, res) => {
  try {
    const slug = req.params.slug;

    const artistRows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.slug, slug));
    if (!artistRows.length) {
      res.status(404).json({ error: "Artist not found" });
      return;
    }
    const artist = artistRows[0];

    // Find all events this artist appeared at
    const myAppearances = await db
      .select()
      .from(eventAppearancesTable)
      .where(eq(eventAppearancesTable.artist_slug, slug));

    const eventNames = myAppearances.map(a => a.event_name).filter(Boolean);
    if (eventNames.length === 0) {
      res.json({ generated: 0, message: "No events found" });
      return;
    }

    // Find other artists at same events
    const coAppearances = await db
      .select()
      .from(eventAppearancesTable)
      .where(
        and(
          inArray(eventAppearancesTable.event_name, eventNames),
          sql`${eventAppearancesTable.artist_slug} != ${slug}`
        )
      );

    // Group by artist
    const byArtist = coAppearances.reduce((acc, gig) => {
      const key = gig.artist_slug;
      if (!acc[key]) {
        acc[key] = {
          artist_id: gig.artist_id,
          artist_slug: gig.artist_slug,
          artist_name: gig.artist_name,
          events: [],
          venues: new Set(),
        };
      }
      acc[key].events.push(gig.event_name);
      if (gig.venue) acc[key].venues.add(gig.venue);
      return acc;
    }, {} as Record<string, any>);

    const connections = [];
    for (const [partnerSlug, data] of Object.entries(byArtist)) {
      const strength = Math.min(10, data.events.length * 2);
      const connectionType = data.events.length >= 3 ? 'b2b' : 'collab';

      connections.push({
        artist_a_id: artist.id,
        artist_a_slug: slug,
        artist_b_id: data.artist_id || '',
        artist_b_slug: partnerSlug,
        connection_type: connectionType,
        strength,
        shared_events: data.events,
        shared_venues: Array.from(data.venues),
        source: 'auto',
        metadata: { generated_from: 'event_appearances', event_count: data.events.length },
      });
    }

    // Upsert connections
    for (const c of connections) {
      await db.insert(artistConnectionsTable)
        .values(c)
        .onConflictDoUpdate({
          target: [artistConnectionsTable.artist_a_slug, artistConnectionsTable.artist_b_slug],
          set: {
            strength: c.strength,
            shared_events: c.shared_events,
            shared_venues: c.shared_venues,
            updated_at: new Date(),
          },
        });
    }

    res.json({ generated: connections.length, connections });
  } catch (e: any) {
    console.error("[POST generate-connections] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── Helper: Generate cool facts ──────────────────────────────────────────────
function generateCoolFacts(artist: any, appearances: any[], connections: any[], milestones: any[], stats: any) {
  const facts = [];

  if (stats.total_gigs > 0) {
    facts.push({
      icon: "🎧",
      label: "Gigs played",
      value: stats.total_gigs.toString(),
      detail: `Across ${stats.total_cities} cities and ${stats.total_venues} venues`,
    });
  }

  if (stats.years_active > 1) {
    facts.push({
      icon: "📅",
      label: "Years active",
      value: stats.years_active.toString(),
      detail: `From ${Math.min(...appearances.map(a => a.year || 9999))} to present`,
    });
  }

  if (stats.b2b_count > 0) {
    facts.push({
      icon: "🤝",
      label: "B2B partners",
      value: stats.b2b_count.toString(),
      detail: "Artists they've shared the decks with",
    });
  }

  if (stats.festival_count > 0) {
    facts.push({
      icon: "🏟️",
      label: "Festival appearances",
      value: stats.festival_count.toString(),
      detail: "Headliner or featured slots",
    });
  }

  // Most played city
  const cityCounts = appearances.reduce((acc, gig) => {
    if (gig.city) {
      acc[gig.city] = (acc[gig.city] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topCity = Object.entries(cityCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
  if (topCity) {
    facts.push({
      icon: "📍",
      label: "Home turf",
      value: topCity[0],
      detail: `${topCity[1]} gigs — their most played city`,
    });
  }

  // Most played venue
  const venueCounts = appearances.reduce((acc, gig) => {
    if (gig.venue) {
      acc[gig.venue] = (acc[gig.venue] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const topVenue = Object.entries(venueCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
  if (topVenue && (topVenue[1] as number) >= 3) {
    facts.push({
      icon: "🏛️",
      label: "Regular spot",
      value: topVenue[0],
      detail: `${topVenue[1]} times — their favorite venue`,
    });
  }

  // First gig
  const firstGig = appearances[appearances.length - 1];
  if (firstGig) {
    facts.push({
      icon: "🚀",
      label: "Started",
      value: firstGig.year?.toString() || "?",
      detail: `First gig: ${firstGig.event_name} at ${firstGig.venue}`,
    });
  }

  // Genre versatility
  if (artist.genres?.length > 1) {
    facts.push({
      icon: "🎛️",
      label: "Genre range",
      value: artist.genres.length.toString(),
      detail: artist.genres.join(", "),
    });
  }

  return facts;
}

// ─── Profile update (existing) ────────────────────────────────────────────────
const profileFields = [
  "bio", "why", "instagram", "soundcloud", "bandcamp", "spotify",
  "website", "booking_email", "manager_email", "labels",
  "open_to_bookings", "available_cities",
] as const;

async function handleProfileUpdate(req: any, res: any): Promise<void> {
  const auth = getAuth(req);
  const rawId =
    auth?.userId ??
    verifySessionToken(req.headers["x-session-token"] as string | undefined);
  const userId = rawId ?? undefined;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const patch: Record<string, any> = { updated_at: new Date() };
    for (const f of profileFields) if (req.body[f] !== undefined) patch[f] = req.body[f];
    const rows = await db
      .update(artistsTable)
      .set(patch)
      .where(and(eq(artistsTable.id, req.params.id as string), eq(artistsTable.claimed_by, userId)))
      .returning();
    if (!rows.length) {
      res.status(404).json({ error: "Not found or not authorized" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    console.error("[PATCH profile] error:", e);
    res.status(500).json({ error: e.message });
  }
}

router.patch("/:id/profile", handleProfileUpdate);
router.patch("/:id", handleProfileUpdate);

// ─── Claim (existing) ─────────────────────────────────────────────────────────
router.post("/:id/claim", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.userId ?? undefined;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const existing = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.id, req.params.id as string));
    if (!existing.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (existing[0].claimed_by) {
      res.status(409).json({ error: "Already claimed" });
      return;
    }
    const rows = await db
      .update(artistsTable)
      .set({ claimed_by: userId, updated_at: new Date() })
      .where(eq(artistsTable.id, req.params.id as string))
      .returning();
    res.json(rows[0]);
  } catch (e: any) {
    console.error("[POST claim] error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ─── Admin routes (existing) ──────────────────────────────────────────────────
router.patch("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .update(artistsTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(artistsTable.id, req.params.id as string))
      .returning();
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    console.error("[PATCH admin] error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/seed", requireAdmin, async (req, res) => {
  const artists: any[] = req.body;
  if (!Array.isArray(artists) || artists.length === 0) {
    res.status(400).json({ error: "Body must be a non-empty array of artists" });
    return;
  }
  try {
    const results = { inserted: 0, updated: 0, errors: [] as string[] };
    for (const a of artists) {
      if (!a.slug || !a.name) {
        results.errors.push(`Missing slug/name: ${JSON.stringify(a).slice(0, 60)}`);
        continue;
      }
      const existing = await db.select({ id: artistsTable.id }).from(artistsTable).where(eq(artistsTable.slug, a.slug));
      const now = new Date();
      const row = {
        slug: a.slug, name: a.name,
        members: a.members ?? null, from_city: a.from_city ?? null, based_city: a.based_city ?? null,
        bio: a.bio ?? null, why: a.why ?? null,
        genres: Array.isArray(a.genres) ? a.genres : [],
        festivals: Array.isArray(a.festivals) ? a.festivals : [],
        instagram: a.instagram ?? null, soundcloud: a.soundcloud ?? null,
        bandcamp: a.bandcamp ?? null, spotify: a.spotify ?? null, website: a.website ?? null,
        booking_email: a.booking_email ?? null, manager_email: a.manager_email ?? null,
        labels: a.labels ?? null,
        fee_min_inr: a.fee_min_inr ?? null, fee_max_inr: a.fee_max_inr ?? null,
        fee_currency: a.fee_currency ?? "INR",
        featured: a.featured ?? false, status: a.status ?? "approved", source: a.source ?? "enriched",
        enrichment_log: a.enrichment_log ?? {}, enrichment_status: a.enrichment_status ?? "done",
        updated_at: now,
      };
      if (existing.length > 0) {
        await db.update(artistsTable).set(row).where(eq(artistsTable.slug, a.slug));
        results.updated++;
      } else {
        await db.insert(artistsTable).values({ ...row, created_at: now });
        results.inserted++;
      }
    }
    res.json({ ok: true, ...results, total: artists.length });
  } catch (e: any) {
    console.error("[POST seed] error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
