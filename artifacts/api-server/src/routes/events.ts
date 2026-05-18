import { Router } from "express";
import { db } from "@workspace/db";
import { eventsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";

const router = Router();

// GET /api/events
router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(eventsTable)
      .orderBy(asc(eventsTable.sort_order));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/events/:slug
router.get("/:slug", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.slug, req.params.slug));
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/admin/events
router.post("/admin", async (req, res) => {
  try {
    const rows = await db.insert(eventsTable).values(req.body).returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/events/:id
router.patch("/admin/:id", async (req, res) => {
  try {
    const rows = await db
      .update(eventsTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(eventsTable.id, req.params.id))
      .returning();
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/admin/events/:id
router.delete("/admin/:id", async (req, res) => {
  try {
    await db.delete(eventsTable).where(eq(eventsTable.id, req.params.id));
    res.sendStatus(204);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
