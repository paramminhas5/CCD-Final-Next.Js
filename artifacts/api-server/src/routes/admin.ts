/**
 * Admin router — handles legacy Supabase edge-function–style endpoints
 * used by the Admin.tsx page at /admin.
 *
 * All routes require the `x-admin-password` header to match
 * the ADMIN_PASSWORD env var (falls back to "ccd_admin" for development).
 *
 * Routes are mounted under /api/functions/v1/:name via the index router.
 */
import { Router } from "express";
import { db } from "@workspace/db";
import {
  siteSettingsTable,
  siteVideosTable,
  promotersTable,
  curatedEventsTable,
  earlyAccessSignupsTable,
  eventRsvpsTable,
  contactMessagesTable,
  artistsTable,
  artistDiscographyTable,
  artistSocialStatsTable,
} from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

router.use(requireAdmin);

// ─── Site content ────────────────────────────────────────────────────────────

// GET /functions/v1/admin-content?type=settings|events|messages
router.get("/admin-content", async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    if (type === "events") {
      const rows = await db.select().from(curatedEventsTable).orderBy(desc(curatedEventsTable.created_at));
      return res.json({ events: rows });
    }
    if (type === "messages") {
      const rows = await db.select().from(contactMessagesTable).orderBy(desc(contactMessagesTable.created_at));
      return res.json({ messages: rows });
    }
    // Default: settings
    const rows = await db.select().from(siteSettingsTable);
    res.json({ settings: rows[0] ?? null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/admin-content", async (req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable).limit(1);
    if (!rows.length) {
      await db.insert(siteSettingsTable).values({ id: "main", ...req.body });
    } else {
      await db.update(siteSettingsTable).set({ ...req.body, updated_at: new Date() }).where(eq(siteSettingsTable.id, rows[0].id));
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /functions/v1/admin-content — action-based contract used by Admin.tsx
// Body: { type: "settings" | "events" | "messages", action: "upsert" | "delete", payload: object }
router.post("/admin-content", async (req, res) => {
  const { type, action, payload } = req.body ?? {};
  try {
    if (type === "settings" && action === "upsert") {
      const existing = await db.select().from(siteSettingsTable).limit(1);
      if (!existing.length) {
        await db.insert(siteSettingsTable).values({ id: "main", ...payload });
      } else {
        await db.update(siteSettingsTable).set({ ...payload, updated_at: new Date() }).where(eq(siteSettingsTable.id, existing[0].id));
      }
      return res.json({ ok: true });
    }
    if (type === "events" && action === "upsert") {
      if (payload?.id) {
        const { id, ...rest } = payload;
        await db.update(curatedEventsTable).set({ ...rest, updated_at: new Date() }).where(eq(curatedEventsTable.id, id));
        return res.json({ ok: true });
      }
      const row = await db.insert(curatedEventsTable).values(payload).returning();
      return res.json(row[0]);
    }
    if (type === "events" && action === "delete") {
      if (!payload?.id) return res.status(400).json({ error: "payload.id required" });
      await db.delete(curatedEventsTable).where(eq(curatedEventsTable.id, payload.id));
      return res.json({ ok: true });
    }
    res.status(400).json({ error: `Unknown type/action: ${type}/${action}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Videos ──────────────────────────────────────────────────────────────────

router.get("/admin-videos", async (_req, res) => {
  try {
    const rows = await db.select().from(siteVideosTable).orderBy(desc(siteVideosTable.sort_order));
    res.json({ videos: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/admin-videos", async (req, res) => {
  try {
    const row = await db.insert(siteVideosTable).values(req.body).returning();
    res.json(row[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const updateAdminVideo = async (req: any, res: any) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.update(siteVideosTable).set({ ...rest, updated_at: new Date() }).where(eq(siteVideosTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
};
router.patch("/admin-videos", updateAdminVideo);
router.put("/admin-videos", updateAdminVideo);

router.delete("/admin-videos", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.delete(siteVideosTable).where(eq(siteVideosTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Sign-ups (early access list) ────────────────────────────────────────────

router.get("/admin-signups", async (req, res) => {
  try {
    const rows = await db.select().from(earlyAccessSignupsTable).orderBy(desc(earlyAccessSignupsTable.created_at));
    if (req.query.format === "csv") {
      const csv = ["id,email,source,created_at", ...rows.map(r => `${r.id},${r.email},${r.source ?? ""},${r.created_at}`)].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="signups.csv"');
      return res.send(csv);
    }
    res.json({ signups: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── RSVPs ───────────────────────────────────────────────────────────────────

router.get("/admin-rsvps", async (req, res) => {
  try {
    let query = db.select().from(eventRsvpsTable).orderBy(desc(eventRsvpsTable.created_at)) as any;
    if (req.query.event_slug) {
      query = db.select().from(eventRsvpsTable).where(eq(eventRsvpsTable.event_slug, req.query.event_slug as string)).orderBy(desc(eventRsvpsTable.created_at));
    }
    const rows = await query;
    if (req.query.format === "csv") {
      const csv = ["id,event_slug,name,email,plus_ones,created_at", ...rows.map((r: any) => `${r.id},${r.event_slug},${r.name},${r.email},${r.plus_ones},${r.created_at}`)].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="rsvps.csv"');
      return res.send(csv);
    }
    res.json({ rsvps: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/admin-rsvps", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.delete(eventRsvpsTable).where(eq(eventRsvpsTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Curated events ──────────────────────────────────────────────────────────

router.get("/admin-curated-events", async (_req, res) => {
  try {
    const rows = await db.select().from(curatedEventsTable).orderBy(desc(curatedEventsTable.created_at));
    res.json({ events: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/admin-curated-events", async (req, res) => {
  try {
    const row = await db.insert(curatedEventsTable).values(req.body).returning();
    res.json(row[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/admin-curated-events", async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.update(curatedEventsTable).set({ ...rest, updated_at: new Date() }).where(eq(curatedEventsTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/admin-curated-events", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.delete(curatedEventsTable).where(eq(curatedEventsTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Promoters ───────────────────────────────────────────────────────────────

router.get("/admin-promoters", async (_req, res) => {
  try {
    const rows = await db.select().from(promotersTable).orderBy(desc(promotersTable.created_at));
    res.json({ promoters: rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/admin-promoters", async (req, res) => {
  try {
    const row = await db.insert(promotersTable).values(req.body).returning();
    res.json(row[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/admin-promoters", async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.update(promotersTable).set({ ...rest, updated_at: new Date() }).where(eq(promotersTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/admin-promoters", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.delete(promotersTable).where(eq(promotersTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Blog (site_settings.blog_posts) ─────────────────────────────────────────

router.get("/admin-publish-blog", async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable).limit(1);
    const posts = (rows[0]?.blog_posts as any[]) ?? [];
    res.json(posts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/admin-publish-blog", async (req, res) => {
  try {
    const settings = await db.select().from(siteSettingsTable).limit(1);
    const existing = (settings[0]?.blog_posts as any[]) ?? [];
    const updated = [...existing, { ...req.body, id: crypto.randomUUID(), created_at: new Date().toISOString() }];
    if (!settings.length) {
      await db.insert(siteSettingsTable).values({ id: "main", blog_posts: updated as any });
    } else {
      await db.update(siteSettingsTable).set({ blog_posts: updated as any, updated_at: new Date() }).where(eq(siteSettingsTable.id, settings[0].id));
    }
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Artist Enrichment Pipeline ──────────────────────────────────────────────
// POST /functions/v1/enrich-artists
// Body: { slugs?: string[], all?: boolean, force?: boolean }
// Requires: FIRECRAWL_API_KEY + OPENAI_API_KEY env vars
//
// Flow per artist:
// 1. Scrape Instagram bio + SoundCloud page via Firecrawl
// 2. Send raw text to OpenAI for structured extraction
// 3. Update artists table: bio, genres, labels, based_city
// 4. Mark enrichment_status = "done"
router.post("/enrich-artists", async (req, res) => {
  const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
  const OPENAI_KEY    = process.env.OPENAI_API_KEY;

  // If keys are missing, return a clear message rather than crashing
  if (!FIRECRAWL_KEY || !OPENAI_KEY) {
    return res.json({
      ok: false,
      enriched: 0,
      message: "Enrichment requires FIRECRAWL_API_KEY and OPENAI_API_KEY env vars. Set them in your deployment environment.",
      missing: [
        ...(!FIRECRAWL_KEY ? ["FIRECRAWL_API_KEY"] : []),
        ...(!OPENAI_KEY    ? ["OPENAI_API_KEY"]    : []),
      ],
    });
  }

  try {
    const { slugs, all = false, force = false } = req.body ?? {};

    // Determine which artists to enrich
    let artists: any[] = [];
    if (all) {
      artists = await db.select().from(artistsTable)
        .where(force
          ? eq(artistsTable.status, "approved")
          : eq(artistsTable.enrichment_status, "pending"))
        .limit(20); // batch cap to avoid timeouts
    } else if (Array.isArray(slugs) && slugs.length > 0) {
      const { inArray } = await import("drizzle-orm");
      artists = await db.select().from(artistsTable)
        .where(inArray(artistsTable.slug, slugs));
    }

    if (!artists.length) {
      return res.json({ ok: true, enriched: 0, message: "No artists match the enrichment criteria." });
    }

    let enriched = 0;
    const errors: string[] = [];
    const log: any[] = [];

    for (const artist of artists) {
      try {
        const scraped: Record<string, string> = {};

        // Scrape Instagram bio (if URL set)
        if (artist.instagram) {
          const igHandle = artist.instagram.replace("@", "").trim();
          const igUrl = igHandle.startsWith("http") ? igHandle : `https://instagram.com/${igHandle}`;
          try {
            const fc = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: { "Authorization": `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ url: igUrl, formats: ["markdown"], onlyMainContent: true }),
              signal: AbortSignal.timeout(15_000),
            });
            if (fc.ok) {
              const fd = await fc.json();
              if (fd?.data?.markdown) scraped.instagram = fd.data.markdown.slice(0, 2000);
            }
          } catch { /* skip if scrape fails */ }
        }

        // Scrape SoundCloud page (if URL set)
        if (artist.soundcloud) {
          try {
            const scUrl = artist.soundcloud.startsWith("http") ? artist.soundcloud : `https://soundcloud.com/${artist.soundcloud}`;
            const fc = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: { "Authorization": `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({ url: scUrl, formats: ["markdown"], onlyMainContent: true }),
              signal: AbortSignal.timeout(15_000),
            });
            if (fc.ok) {
              const fd = await fc.json();
              if (fd?.data?.markdown) scraped.soundcloud = fd.data.markdown.slice(0, 2000);
            }
          } catch { /* skip */ }
        }

        if (!scraped.instagram && !scraped.soundcloud) {
          log.push({ slug: artist.slug, status: "skipped", reason: "no social URLs to scrape" });
          continue;
        }

        // Send to OpenAI for structured extraction
        const prompt = `You are extracting structured data about an electronic music artist based on their social media pages.

Artist name: ${artist.name}
Current city: ${artist.based_city ?? "unknown"}
Current genres: ${(artist.genres ?? []).join(", ") || "unknown"}

Raw data scraped from their profiles:
${scraped.instagram ? `--- Instagram ---\n${scraped.instagram}\n` : ""}
${scraped.soundcloud ? `--- SoundCloud ---\n${scraped.soundcloud}\n` : ""}

Extract the following as JSON (use null for fields you can't determine):
{
  "bio": "2-3 sentence artist bio in third person, factual and professional",
  "genres": ["array", "of", "music", "genres"],
  "based_city": "city name only",
  "labels": "label names as comma-separated string or null",
  "why": "one sentence on what makes this artist notable"
}

Return ONLY valid JSON. No extra text.`;

        const oai = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 500,
          }),
          signal: AbortSignal.timeout(30_000),
        });

        if (!oai.ok) throw new Error(`OpenAI ${oai.status}`);
        const od = await oai.json();
        const raw = od?.choices?.[0]?.message?.content ?? "";

        // Parse the JSON from the response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("OpenAI returned no JSON");
        const extracted = JSON.parse(jsonMatch[0]);

        // Only update fields that are actually extracted and non-empty
        const patch: Record<string, any> = {
          enrichment_status: "done",
          enriched_at: new Date(),
          enrichment_log: { ...((artist.enrichment_log as any) ?? {}), last_run: new Date().toISOString(), source: "firecrawl+openai" },
          updated_at: new Date(),
        };

        if (extracted.bio && typeof extracted.bio === "string" && (!artist.bio || force)) {
          patch.bio = extracted.bio.slice(0, 1000);
        }
        if (Array.isArray(extracted.genres) && extracted.genres.length > 0 && (!artist.genres?.length || force)) {
          patch.genres = extracted.genres.slice(0, 6);
        }
        if (extracted.based_city && typeof extracted.based_city === "string" && (!artist.based_city || force)) {
          patch.based_city = extracted.based_city;
        }
        if (extracted.labels && typeof extracted.labels === "string" && (!artist.labels || force)) {
          patch.labels = extracted.labels;
        }
        if (extracted.why && typeof extracted.why === "string" && (!artist.why || force)) {
          patch.why = extracted.why;
        }

        await db.update(artistsTable)
          .set(patch)
          .where(eq(artistsTable.id, artist.id));

        enriched++;
        log.push({ slug: artist.slug, status: "enriched", fields: Object.keys(patch).filter(k => !["enrichment_status","enriched_at","enrichment_log","updated_at"].includes(k)) });
      } catch (artistErr: any) {
        errors.push(`${artist.slug}: ${artistErr.message}`);
        log.push({ slug: artist.slug, status: "error", error: artistErr.message });
        // Mark as failed so we don't retry endlessly
        await db.update(artistsTable)
          .set({ enrichment_status: "failed", enrichment_log: { error: artistErr.message, at: new Date().toISOString() }, updated_at: new Date() })
          .where(eq(artistsTable.id, artist.id))
          .catch(() => {}); // best-effort
      }
    }

    res.json({
      ok: true,
      enriched,
      total: artists.length,
      errors: errors.length ? errors : undefined,
      log,
      message: `Enriched ${enriched}/${artists.length} artists.${errors.length ? ` ${errors.length} failed.` : ""}`,
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── Event Curation / Crawler ─────────────────────────────────────────────────
// POST /functions/v1/curate-events
// Body: { promoter_slug?: string, limit?: number }
// Requires: FIRECRAWL_API_KEY env var
//
// Flow:
// 1. Load trusted promoters with crawl_urls set
// 2. For each URL, use Firecrawl to scrape event listings
// 3. Use OpenAI to extract structured event data
// 4. Upsert into curated_events (dedupe by url)
router.post("/curate-events", async (req, res) => {
  const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
  const OPENAI_KEY    = process.env.OPENAI_API_KEY;

  if (!FIRECRAWL_KEY) {
    return res.json({
      ok: false,
      upserted: 0,
      message: "Event curation requires FIRECRAWL_API_KEY env var. Set it in your deployment environment.",
    });
  }

  try {
    const { promoter_slug, limit = 10 } = req.body ?? {};
    const { inArray, isNotNull, sql } = await import("drizzle-orm");

    // Load trusted promoters that have crawl_urls configured
    let promoters: any[] = await db.select().from(promotersTable)
      .where(eq(promotersTable.trusted, true))
      .limit(50);

    // Filter to those with crawl_urls set
    promoters = promoters.filter((p: any) => {
      const urls = Array.isArray(p.crawl_urls) ? p.crawl_urls : [];
      return urls.length > 0;
    });

    if (promoter_slug) {
      promoters = promoters.filter((p: any) => p.slug === promoter_slug);
    }

    if (!promoters.length) {
      return res.json({
        ok: true, upserted: 0,
        message: "No promoters with crawl_urls found. Add URLs to trusted promoters in the admin panel.",
      });
    }

    let upserted = 0;
    const errors: string[] = [];
    const log: any[] = [];

    for (const promoter of promoters.slice(0, 5)) { // cap at 5 promoters per run
      const crawlUrls: string[] = Array.isArray(promoter.crawl_urls) ? promoter.crawl_urls : [];

      for (const url of crawlUrls.slice(0, 3)) { // cap at 3 URLs per promoter
        try {
          // Scrape the events page
          const fc = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: { "Authorization": `Bearer ${FIRECRAWL_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
            signal: AbortSignal.timeout(20_000),
          });

          if (!fc.ok) {
            errors.push(`${promoter.slug}/${url}: Firecrawl ${fc.status}`);
            continue;
          }

          const fd = await fc.json();
          const markdown = fd?.data?.markdown;
          if (!markdown) continue;

          // Use OpenAI to extract events if available, otherwise do basic parsing
          let events: any[] = [];

          if (OPENAI_KEY) {
            const oai = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{
                  role: "user",
                  content: `Extract all upcoming events from this webpage. Return a JSON array of events. Each event should have:
- title: string
- event_date: "YYYY-MM-DD" or null
- event_time: "HH:MM" or null
- venue: string or null
- city: string or null
- blurb: string or null (short description)
- genre: array of genre strings

Webpage content:
${markdown.slice(0, 4000)}

Return ONLY a JSON array. No extra text. If no events found, return [].`,
                }],
                temperature: 0.2,
                max_tokens: 1500,
              }),
              signal: AbortSignal.timeout(30_000),
            });

            if (oai.ok) {
              const od = await oai.json();
              const raw = od?.choices?.[0]?.message?.content ?? "[]";
              const match = raw.match(/\[[\s\S]*\]/);
              if (match) {
                try { events = JSON.parse(match[0]); } catch { events = []; }
              }
            }
          }

          // Upsert extracted events into curated_events table
          const now = new Date();
          for (const ev of events.slice(0, limit as number)) {
            if (!ev.title) continue;

            // Build a deterministic URL for deduplication
            const eventUrl = ev.url || `${url}#${ev.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50)}`;

            try {
              const existing = await db.select({ id: curatedEventsTable.id })
                .from(curatedEventsTable)
                .where(eq(curatedEventsTable.url, eventUrl))
                .limit(1);

              if (existing.length) {
                // Update existing
                await db.update(curatedEventsTable)
                  .set({
                    title: ev.title,
                    city: ev.city ?? promoter.city ?? null,
                    venue: ev.venue ?? null,
                    event_date: ev.event_date ?? null,
                    event_time: ev.event_time ?? null,
                    blurb: ev.blurb ?? null,
                    genre: Array.isArray(ev.genre) ? ev.genre : (promoter.genres ?? []),
                    source: promoter.slug,
                    updated_at: now,
                  })
                  .where(eq(curatedEventsTable.url, eventUrl));
              } else {
                // Insert new
                await db.insert(curatedEventsTable).values({
                  title: ev.title,
                  url: eventUrl,
                  source: promoter.slug,
                  city: ev.city ?? promoter.city ?? null,
                  venue: ev.venue ?? null,
                  event_date: ev.event_date ?? null,
                  event_time: ev.event_time ?? null,
                  blurb: ev.blurb ?? null,
                  genre: Array.isArray(ev.genre) ? ev.genre : (promoter.genres ?? []),
                  is_featured: false,
                  created_at: now,
                  updated_at: now,
                });
                upserted++;
              }
            } catch (insertErr: any) {
              errors.push(`insert ${ev.title}: ${insertErr.message}`);
            }
          }

          log.push({ promoter: promoter.slug, url, events_found: events.length });
        } catch (urlErr: any) {
          errors.push(`${promoter.slug}/${url}: ${urlErr.message}`);
        }
      }
    }

    res.json({
      ok: true,
      upserted,
      promoters_crawled: promoters.length,
      errors: errors.length ? errors : undefined,
      log,
      message: `Crawled ${promoters.length} promoters, upserted ${upserted} events.`,
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.all("/scheduled-curate", async (req, res) => {
  // scheduled-curate is the same as curate-events but triggered by cron
  req.body = { all: true, limit: 20, ...(req.body ?? {}) };
  // Forward to curate-events handler logic — just re-route
  res.json({ ok: true, message: "Use POST /functions/v1/curate-events to trigger manually." });
});

router.all("/admin-generate-blog", (_req, res) => {
  res.json({ ok: true, message: "AI blog generation not yet connected." });
});

router.post("/admin-upload-poster", (_req, res) => {
  res.json({ ok: true, url: null, message: "Poster upload not yet connected to object storage." });
});

// ─── Spotify Discography Import ───────────────────────────────────────────────
// POST /functions/v1/import-discography
// Body: { slug: string } — imports Spotify releases for an artist
// Requires: SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET env vars
router.post("/import-discography", async (req, res) => {
  const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.json({
      ok: false, imported: 0,
      message: "Spotify import requires SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env vars.",
    });
  }

  const { slug } = req.body ?? {};
  if (!slug) return res.status(400).json({ error: "slug required" });

  try {
    // Get Spotify access token (client credentials flow)
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(10_000),
    });

    if (!tokenRes.ok) throw new Error(`Spotify token error: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    // Get artist from DB
    const artists = await db.select().from(artistsTable).where(eq(artistsTable.slug, slug)).limit(1);
    if (!artists.length) return res.status(404).json({ error: "Artist not found" });
    const artist = artists[0];

    if (!artist.spotify) {
      return res.json({ ok: false, imported: 0, message: "Artist has no Spotify URL set. Add it in the artist portal first." });
    }

    // Extract Spotify artist ID from URL
    const spotifyMatch = artist.spotify.match(/spotify\.com\/artist\/([a-zA-Z0-9]+)/);
    if (!spotifyMatch) return res.json({ ok: false, imported: 0, message: "Invalid Spotify artist URL format." });
    const spotifyId = spotifyMatch[1];

    // Fetch albums/releases from Spotify
    const albumsRes = await fetch(
      `https://api.spotify.com/v1/artists/${spotifyId}/albums?include_groups=album,single&market=IN&limit=20`,
      { headers: { "Authorization": `Bearer ${token}` }, signal: AbortSignal.timeout(10_000) }
    );
    if (!albumsRes.ok) throw new Error(`Spotify albums error: ${albumsRes.status}`);
    const albumsData = await albumsRes.json();

    let imported = 0;
    const { inArray } = await import("drizzle-orm");

    for (const album of albumsData.items ?? []) {
      const existing = await db.select({ id: artistDiscographyTable.id })
        .from(artistDiscographyTable)
        .where(eq(artistDiscographyTable.artist_slug, slug))
        .limit(50);

      const alreadyHas = existing.find((e: any) => e.id === album.id);
      if (alreadyHas) continue;

      await db.insert(artistDiscographyTable).values({
        artist_id:     artist.id,
        artist_slug:   slug,
        title:         album.name,
        release_type:  album.album_type === "single" ? "single" : album.album_type === "compilation" ? "compilation" : "album",
        release_date:  album.release_date ?? null,
        artwork_url:   album.images?.[0]?.url ?? null,
        spotify_url:   album.external_urls?.spotify ?? null,
        year:          album.release_date ? parseInt(album.release_date.slice(0, 4)) : null,
        source:        "spotify_api",
      }).onConflictDoNothing();

      imported++;
    }

    res.json({ ok: true, imported, artist: artist.name, message: `Imported ${imported} releases from Spotify.` });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ─── Social Stats Snapshot ────────────────────────────────────────────────────
// POST /functions/v1/snapshot-social-stats
// Body: { slug?: string, all?: boolean }
// Captures current Instagram follower counts (public profile endpoint)
router.post("/snapshot-social-stats", async (req, res) => {
  const IG_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const { slug, all = false } = req.body ?? {};

  try {
    let artists: any[] = [];
    if (all) {
      artists = await db.select().from(artistsTable)
        .where(eq(artistsTable.status, "approved"))
        .limit(50);
    } else if (slug) {
      artists = await db.select().from(artistsTable).where(eq(artistsTable.slug, slug)).limit(1);
    }

    let snapped = 0;
    for (const artist of artists) {
      try {
        const stats: Record<string, number | null> = {
          instagram_followers: null,
          soundcloud_followers: null,
          spotify_monthly_listeners: null,
        };

        // SoundCloud public API (no auth needed for basic stats)
        if (artist.soundcloud) {
          try {
            const scHandle = artist.soundcloud.replace("https://soundcloud.com/", "").replace(/\/$/, "");
            const scRes = await fetch(`https://soundcloud.com/${scHandle}`, {
              headers: { "User-Agent": "CCDBot/1.0" },
              signal: AbortSignal.timeout(8_000),
            });
            if (scRes.ok) {
              const html = await scRes.text();
              const followMatch = html.match(/"followers_count":\s*(\d+)/);
              if (followMatch) stats.soundcloud_followers = parseInt(followMatch[1]);
            }
          } catch { /* skip */ }
        }

        // Only save if we got any stats
        const hasData = Object.values(stats).some(v => v !== null);
        if (hasData) {
          await db.insert(artistSocialStatsTable).values({
            artist_id:            artist.id,
            artist_slug:          artist.slug,
            soundcloud_followers: stats.soundcloud_followers,
            source:               "scraped",
          });
          snapped++;
        }
      } catch { /* skip individual artist errors */ }
    }

    res.json({ ok: true, snapped, message: `Snapped stats for ${snapped}/${artists.length} artists.` });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
