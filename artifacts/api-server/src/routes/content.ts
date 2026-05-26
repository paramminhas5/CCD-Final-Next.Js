import { Router } from "express";
import { db } from "@workspace/db";
import { siteSettingsTable, siteVideosTable, promotersTable, curatedEventsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middleware/adminAuth";

const router = Router();

// GET /api/site-settings
router.get("/site-settings", async (_req, res) => {
  try {
    const rows = await db.select().from(siteSettingsTable);
    if (!rows.length) {
      return res.json({ id: "default", playlists: [], marquees: [], theme: {}, home_content: {}, blog_posts: [], backlinks: [], seo_verifications: {}, updated_at: new Date().toISOString() });
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/site-settings
router.patch("/admin/site-settings", requireAdmin, async (req, res) => {
  try {
    const existing = await db.select().from(siteSettingsTable);
    if (!existing.length) {
      const rows = await db.insert(siteSettingsTable).values({ id: "default", ...req.body }).returning();
      return res.json(rows[0]);
    }
    const rows = await db
      .update(siteSettingsTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(siteSettingsTable.id, "default"))
      .returning();
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/videos
router.get("/videos", async (_req, res) => {
  try {
    const rows = await db.select().from(siteVideosTable).orderBy(asc(siteVideosTable.sort_order));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/promoters
router.get("/promoters", async (_req, res) => {
  try {
    const rows = await db.select().from(promotersTable).where(eq(promotersTable.status, "active"));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/curated-events
router.get("/curated-events", async (_req, res) => {
  try {
    const rows = await db.select().from(curatedEventsTable).orderBy(asc(curatedEventsTable.created_at));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/curated-events
router.post("/admin/curated-events", requireAdmin, async (req, res) => {
  try {
    const rows = await db.insert(curatedEventsTable).values(req.body).returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/curated-events/:id
router.patch("/admin/curated-events/:id", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .update(curatedEventsTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(curatedEventsTable.id, req.params.id))
      .returning();
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/curated-events/:id
router.delete("/admin/curated-events/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(curatedEventsTable).where(eq(curatedEventsTable.id, req.params.id));
    res.sendStatus(204);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/event-poster-url
router.get("/event-poster-url", async (req, res) => {
  const p = req.query.path as string;
  if (!p) return res.status(400).json({ error: "path required" });
  // Return a public URL for the storage path
  res.json({ url: `/api/storage/event-posters/${p}` });
});

export default router;
