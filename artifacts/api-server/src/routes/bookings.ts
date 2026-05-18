import { Router } from "express";
import { db } from "@workspace/db";
import { bookingRequestsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdminOrArtist } from "../middleware/adminAuth";

const router = Router();

// GET /api/booking-requests/:artistId — requires admin or valid artist session
router.get("/:artistId", requireAdminOrArtist("artistId"), async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(bookingRequestsTable)
      .where(eq(bookingRequestsTable.artist_id, req.params.artistId))
      .orderBy(desc(bookingRequestsTable.created_at));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
