import { Router } from "express";
import { db } from "@workspace/db";
import { artistsTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
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
    verifySessionToken(req.headers["x-session-token"] as string | undefined);
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
    verifySessionToken(req.headers["x-session-token"] as string | undefined);
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

// ─── Bulk seed (admin-only) ──────────────────────────────────────────────────
// POST /api/artists/seed — upserts by slug, protected by x-admin-password header
router.post("/seed", requireAdmin, async (req, res): Promise<void> => {
  const artists: any[] = req.body;
  if (!Array.isArray(artists) || artists.length === 0) {
    res.status(400).json({ error: "Body must be a non-empty array of artists" });
    return;
  }
  try {
    const results = { inserted: 0, updated: 0, errors: [] as string[] };
    for (const a of artists) {
      if (!a.slug || !a.name) {
        results.errors.push(`Missing slug/name: ${JSON.stringify(a).slice(0, 60)}`);
        continue;
      }
      const existing = await db.select({ id: artistsTable.id }).from(artistsTable).where(eq(artistsTable.slug, a.slug));
      const now = new Date();
      const row = {
        slug: a.slug, name: a.name,
        members: a.members ?? null, from_city: a.from_city ?? null, based_city: a.based_city ?? null,
        bio: a.bio ?? null, why: a.why ?? null,
        genres: Array.isArray(a.genres) ? a.genres : [],
        festivals: Array.isArray(a.festivals) ? a.festivals : [],
        instagram: a.instagram ?? null, soundcloud: a.soundcloud ?? null,
        bandcamp: a.bandcamp ?? null, spotify: a.spotify ?? null, website: a.website ?? null,
        booking_email: a.booking_email ?? null, manager_email: a.manager_email ?? null,
        labels: a.labels ?? null,
        fee_min_inr: a.fee_min_inr ?? null, fee_max_inr: a.fee_max_inr ?? null,
        fee_currency: a.fee_currency ?? "INR",
        featured: a.featured ?? false, status: a.status ?? "approved", source: a.source ?? "enriched",
        enrichment_log: a.enrichment_log ?? {}, enrichment_status: a.enrichment_status ?? "done",
        updated_at: now,
      };
      if (existing.length > 0) {
        await db.update(artistsTable).set(row).where(eq(artistsTable.slug, a.slug));
        results.updated++;
      } else {
        await db.insert(artistsTable).values({ ...row, created_at: now });
        results.inserted++;
      }
    }
    res.json({ ok: true, ...results, total: artists.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
