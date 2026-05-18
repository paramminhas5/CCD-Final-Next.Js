import { Router } from "express";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin } from "../middleware/adminAuth";
import { verifySessionToken } from "./auth";
import { getAuth } from "@clerk/express";

const router = Router();

router.get("/", async (req, res): Promise<void> => {
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

router.get("/by-user", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const rawId =
    auth?.userId ??
    verifySessionToken(req.headers["x-session-token"] as string | undefined) ??
    (req.headers["x-user-id"] as string | undefined);
  const userId = rawId ?? undefined;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.claimed_by, userId));
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:slug", async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.slug, req.params.slug as string));
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const profileFields = [
  "bio", "why", "instagram", "soundcloud", "bandcamp", "spotify",
  "website", "booking_email", "manager_email", "labels",
  "open_to_bookings", "available_cities",
] as const;

async function handleProfileUpdate(req: any, res: any): Promise<void> {
  const auth = getAuth(req);
  const rawId =
    auth?.userId ??
    verifySessionToken(req.headers["x-session-token"] as string | undefined) ??
    (req.headers["x-user-id"] as string | undefined);
  const userId = rawId ?? undefined;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const patch: Record<string, any> = { updated_at: new Date() };
    for (const f of profileFields) if (req.body[f] !== undefined) patch[f] = req.body[f];
    const rows = await db
      .update(artistsTable)
      .set(patch)
      .where(and(eq(artistsTable.id, req.params.id as string), eq(artistsTable.claimed_by, userId)))
      .returning();
    if (!rows.length) {
      res.status(404).json({ error: "Not found or not authorized" });
      return;
    }
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

router.patch("/:id/profile", handleProfileUpdate);
router.patch("/:id", handleProfileUpdate);

router.post("/:id/claim", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId ?? undefined;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const existing = await db
      .select()
      .from(artistsTable)
      .where(eq(artistsTable.id, req.params.id as string));
    if (!existing.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (existing[0].claimed_by) {
      res.status(409).json({ error: "Already claimed" });
      return;
    }
    const rows = await db
      .update(artistsTable)
      .set({ claimed_by: userId, updated_at: new Date() })
      .where(eq(artistsTable.id, req.params.id as string))
      .returning();
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/admin/:id", requireAdmin, async (req, res): Promise<void> => {
  try {
    const rows = await db
      .update(artistsTable)
      .set({ ...req.body, updated_at: new Date() })
      .where(eq(artistsTable.id, req.params.id as string))
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

export default router;
