import { Router } from "express";
import { db } from "@workspace/db";
import { artistDatesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdminOrArtist } from "../middleware/adminAuth";

const router = Router();
const guard = requireAdminOrArtist();

// GET /api/artist-dates?artist_id=X  (shim style)
router.get("/", guard, async (req, res) => {
  const artistId = (req.query.artist_id ?? req.query.artistId) as string | undefined;
  if (!artistId) return res.status(400).json({ error: "artist_id required" });
  try {
    const rows = await db
      .select()
      .from(artistDatesTable)
      .where(eq(artistDatesTable.artist_id, artistId))
      .orderBy(desc(artistDatesTable.event_date));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/artist-dates/:artistId  (path style)
router.get("/:artistId", guard, async (req, res) => {
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

// POST /api/artist-dates  (shim style — artist_id in body)
router.post("/", guard, async (req, res) => {
  const { artist_id, artistId, ...rest } = req.body;
  const id = artist_id ?? artistId;
  if (!id) return res.status(400).json({ error: "artist_id required" });
  try {
    const rows = await db
      .insert(artistDatesTable)
      .values({ ...rest, artist_id: id })
      .returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/artist-dates/:artistId  (path style)
router.post("/:artistId", guard, async (req, res) => {
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

// PATCH /api/artist-dates/entry/:id  (path style)
router.patch("/entry/:id", guard, async (req, res) => {
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

// PATCH /api/artist-dates/:id  (shim style)
router.patch("/:id", guard, async (req, res) => {
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

// DELETE /api/artist-dates/entry/:id  (path style)
router.delete("/entry/:id", guard, async (req, res) => {
  try {
    await db.delete(artistDatesTable).where(eq(artistDatesTable.id, req.params.id));
    res.sendStatus(204);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/artist-dates/:id  (shim style)
router.delete("/:id", guard, async (req, res) => {
  try {
    await db.delete(artistDatesTable).where(eq(artistDatesTable.id, req.params.id));
    res.sendStatus(204);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
