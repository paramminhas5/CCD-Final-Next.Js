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
} from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

router.use(requireAdmin);

// ─── Site content ────────────────────────────────────────────────────────────

// GET|PATCH /functions/v1/admin-content  →  site_settings row
router.get("/admin-content", async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable);
    res.json(rows[0] ?? null);
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

// ─── Videos ──────────────────────────────────────────────────────────────────

router.get("/admin-videos", async (_req, res) => {
  try {
    const rows = await db.select().from(siteVideosTable).orderBy(desc(siteVideosTable.sort_order));
    res.json(rows);
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

router.patch("/admin-videos", async (req, res) => {
  try {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ error: "id required" });
    await db.update(siteVideosTable).set({ ...rest, updated_at: new Date() }).where(eq(siteVideosTable.id, id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

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
    res.json(rows);
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
    res.json(rows);
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
    res.json(rows);
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
    res.json(rows);
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

// ─── Stub routes (AI/integrations — not yet connected) ───────────────────────

router.all("/enrich-artists", (_req, res) => {
  res.json({ ok: true, enriched: 0, message: "Artist enrichment not yet connected to external data source." });
});

router.all("/curate-events", (_req, res) => {
  res.json({ ok: true, curated: 0, message: "Event curation not yet connected to external data source." });
});

router.all("/scheduled-curate", (_req, res) => {
  res.json({ ok: true, message: "Scheduled curation not yet active." });
});

router.all("/admin-generate-blog", (_req, res) => {
  res.json({ ok: true, message: "AI blog generation not yet connected." });
});

router.post("/admin-upload-poster", (_req, res) => {
  res.json({ ok: true, url: null, message: "Poster upload not yet connected to object storage." });
});

export default router;
