import { Router } from "express";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../middleware/adminAuth";
import { verifySessionToken } from "./auth";

const router = Router();

// GET /api/artists
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.status, "approved"));
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/artists/by-user
router.get("/by-user", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const rows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.claimed_by, userId));
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/artists/:slug
router.get("/:slug", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.slug, req.params.slug));
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const profileFields = ["bio","why","instagram","soundcloud","bandcamp","spotify","website","booking_email","manager_email","labels","open_to_bookings","available_cities"] as const;

async function handleProfileUpdate(req: any, res: any) {
  const userId = verifySessionToken(req.headers["x-session-token"] as string | undefined)
    ?? (req.headers["x-user-id"] as string | undefined);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const patch: Record<string, any> = { updated_at: new Date() };
    for (const f of profileFields) if (req.body[f] !== undefined) patch[f] = req.body[f];
    const rows = await db
      .update(artistsTable)
      .set(patch)
      .where(and(eq(artistsTable.id, req.params.id), eq(artistsTable.claimed_by, userId)))
      .returning();
    if (!rows.length) return res.status(404).json({ error: "Not found or not authorized" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

// PATCH /api/artists/:id/profile  (legacy path)
router.patch("/:id/profile", handleProfileUpdate);

// PATCH /api/artists/:id  (shim path — supabase.from("artists").update().eq("id", id))
router.patch("/:id", handleProfileUpdate);

// POST /api/artists/:id/claim
router.post("/:id/claim", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const existing = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.id, req.params.id));
    if (!existing.length) return res.status(404).json({ error: "Not found" });
    if (existing[0].claimed_by) return res.status(409).json({ error: "Already claimed" });
    const rows = await db
      .update(artistsTable)
      .set({ claimed_by: userId, updated_at: new Date() })
      .where(eq(artistsTable.id, req.params.id))
      .returning();
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/admin/artists/:id (admin only)
router.patch("/admin/:id", requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .update(artistsTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(artistsTable.id, req.params.id))
      .returning();
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
