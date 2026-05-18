import { Router } from "express";
import { db } from "@workspace/db";
import { bookingRequestsTable, artistsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAdminOrArtist } from "../middleware/adminAuth";

const router = Router();

// GET /booking-requests?artist_id=<uuid>  — query-param form used by the supabase shim
router.get("/", requireAdminOrArtist("artist_id"), async (req, res): Promise<void> => {
  const artistId = req.query.artist_id as string | undefined;
  if (!artistId) {
    res.status(400).json({ error: "artist_id query param required" });
    return;
  }
  const sessionUserId = (req as any).sessionUserId as string | undefined;
  try {
    if (sessionUserId) {
      const owned = await db
        .select({ id: artistsTable.id })
        .from(artistsTable)
        .where(
          and(
            eq(artistsTable.id, artistId),
            eq(artistsTable.claimed_by, sessionUserId),
          ),
        );
      if (!owned.length) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }
    const rows = await db
      .select()
      .from(bookingRequestsTable)
      .where(eq(bookingRequestsTable.artist_id, artistId))
      .orderBy(desc(bookingRequestsTable.created_at));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:artistId", requireAdminOrArtist("artistId"), async (req, res): Promise<void> => {
  const artistId = req.params.artistId as string;
  const sessionUserId = (req as any).sessionUserId as string | undefined;
  try {
    if (sessionUserId) {
      const owned = await db
        .select({ id: artistsTable.id })
        .from(artistsTable)
        .where(
          and(
            eq(artistsTable.id, artistId),
            eq(artistsTable.claimed_by, sessionUserId),
          ),
        );
      if (!owned.length) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }
    const rows = await db
      .select()
      .from(bookingRequestsTable)
      .where(eq(bookingRequestsTable.artist_id, artistId))
      .orderBy(desc(bookingRequestsTable.created_at));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
