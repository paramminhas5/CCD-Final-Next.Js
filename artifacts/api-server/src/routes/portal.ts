import { Router } from "express";
import { db } from "@workspace/db";
import { artistDatesTable, bookingRequestsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /api/artist-dates/:artistId
router.get("/:artistId", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(artistDatesTable)
      .where(eq(artistDatesTable.artist_id, req.params.artistId))
      .orderBy(desc(artistDatesTable.event_date));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/artist-dates/:artistId
router.post("/:artistId", async (req, res) => {
  try {
    const rows = await db
      .insert(artistDatesTable)
      .values({ ...req.body, artist_id: req.params.artistId })
      .returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/artist-dates/entry/:id
router.patch("/entry/:id", async (req, res) => {
  try {
    const rows = await db
      .update(artistDatesTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(artistDatesTable.id, req.params.id))
      .returning();
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/artist-dates/entry/:id
router.delete("/entry/:id", async (req, res) => {
  try {
    await db.delete(artistDatesTable).where(eq(artistDatesTable.id, req.params.id));
    res.sendStatus(204);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
