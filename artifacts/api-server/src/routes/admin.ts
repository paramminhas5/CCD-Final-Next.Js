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
