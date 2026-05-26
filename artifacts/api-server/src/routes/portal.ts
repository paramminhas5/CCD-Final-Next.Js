import { Router } from "express";
import { db } from "@workspace/db";
import { artistDatesTable, artistsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAdminOrArtist } from "../middleware/adminAuth";

const router = Router();
const guard = requireAdminOrArtist();

/**
 * Verify that the authenticated artist owns the given artist profile.
 * Returns true if access is allowed (admin path or verified owner).
 * Returns false and sends 403 if ownership check fails.
 */
async function ownerOnly(req: any, res: any, artistId: string): Promise<boolean> {
  const sessionUserId = req.sessionUserId as string | undefined;
  if (!sessionUserId) return true;
  const rows = await db
    .select({ id: artistsTable.id })
    .from(artistsTable)
    .where(
      and(
        eq(artistsTable.id, artistId),
        eq(artistsTable.claimed_by, sessionUserId),
      ),
    );
  if (!rows.length) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

function extractStringParam(v: string | string[] | object | object[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

router.get("/", guard, async (req, res): Promise<void> => {
  const artistId = extractStringParam(req.query.artist_id ?? req.query.artistId);
  if (!artistId) {
    res.status(400).json({ error: "artist_id required" });
    return;
  }
  try {
    if (!(await ownerOnly(req, res, artistId))) return;
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

router.get("/:artistId", guard, async (req, res): Promise<void> => {
  const artistId = req.params.artistId as string;
  try {
    if (!(await ownerOnly(req, res, artistId))) return;
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

router.post("/", guard, async (req, res): Promise<void> => {
  const { artist_id, artistId, ...rest } = req.body;
  const id: string = artist_id ?? artistId;
  if (!id) {
    res.status(400).json({ error: "artist_id required" });
    return;
  }
  try {
    if (!(await ownerOnly(req, res, id))) return;
    const rows = await db
      .insert(artistDatesTable)
      .values({ ...rest, artist_id: id })
      .returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/:artistId", guard, async (req, res): Promise<void> => {
  const artistId = req.params.artistId as string;
  try {
    if (!(await ownerOnly(req, res, artistId))) return;
    const rows = await db
      .insert(artistDatesTable)
      .values({ ...req.body, artist_id: artistId })
      .returning();
    res.status(201).json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Verify that the authenticated artist owns the artist_date identified by dateId.
 * Admins (no sessionUserId set by guard) bypass this check.
 * Returns true if allowed, false and sends 403/404 if not.
 */
async function ownerOfDate(req: any, res: any, dateId: string): Promise<boolean> {
  const sessionUserId = req.sessionUserId as string | undefined;
  if (!sessionUserId) return true;
  const dateRows = await db
    .select({ artist_id: artistDatesTable.artist_id })
    .from(artistDatesTable)
    .where(eq(artistDatesTable.id, dateId));
  if (!dateRows.length) {
    res.status(404).json({ error: "Not found" });
    return false;
  }
  const artistId = dateRows[0].artist_id;
  const owned = await db
    .select({ id: artistsTable.id })
    .from(artistsTable)
    .where(and(eq(artistsTable.id, artistId), eq(artistsTable.claimed_by, sessionUserId)));
  if (!owned.length) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

router.patch("/entry/:id", guard, async (req, res): Promise<void> => {
  try {
    if (!(await ownerOfDate(req, res, req.params.id as string))) return;
    const rows = await db
      .update(artistDatesTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(artistDatesTable.id, req.params.id as string))
      .returning();
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/:id", guard, async (req, res): Promise<void> => {
  try {
    if (!(await ownerOfDate(req, res, req.params.id as string))) return;
    const rows = await db
      .update(artistDatesTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(artistDatesTable.id, req.params.id as string))
      .returning();
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/entry/:id", guard, async (req, res): Promise<void> => {
  try {
    if (!(await ownerOfDate(req, res, req.params.id as string))) return;
    await db.delete(artistDatesTable).where(eq(artistDatesTable.id, req.params.id as string));
    res.sendStatus(204);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", guard, async (req, res): Promise<void> => {
  try {
    if (!(await ownerOfDate(req, res, req.params.id as string))) return;
    await db.delete(artistDatesTable).where(eq(artistDatesTable.id, req.params.id as string));
    res.sendStatus(204);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
