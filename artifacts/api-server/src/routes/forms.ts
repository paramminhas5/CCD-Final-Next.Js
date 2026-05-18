import { Router } from "express";
import { db } from "@workspace/db";
import {
  contactMessagesTable,
  earlyAccessSignupsTable,
  eventRsvpsTable,
  artistSubmissionsTable,
  bookingRequestsTable,
  bookingOtpCodesTable,
} from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

const router = Router();

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/contact
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: "Missing required fields" });
    await db.insert(contactMessagesTable).values({
      name,
      email,
      message,
      user_agent: req.headers["user-agent"] ?? null,
    });
    res.status(201).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/contact-messages
router.get("/admin/contact-messages", async (_req, res) => {
  try {
    const rows = await db.select().from(contactMessagesTable);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/early-access
router.post("/early-access", async (req, res) => {
  try {
    const { email, source } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });
    await db.insert(earlyAccessSignupsTable).values({
      email,
      source: source ?? null,
      user_agent: req.headers["user-agent"] ?? null,
    });
    res.status(201).json({ ok: true });
  } catch (e: any) {
    if (e.message?.includes("unique")) return res.status(409).json({ error: "Already signed up" });
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/signups
router.get("/admin/signups", async (_req, res) => {
  try {
    const rows = await db.select().from(earlyAccessSignupsTable);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/event-rsvp
router.post("/event-rsvp", async (req, res) => {
  try {
    const { eventSlug, name, email, plusOnes } = req.body;
    if (!eventSlug || !name || !email) return res.status(400).json({ error: "Missing required fields" });
    await db.insert(eventRsvpsTable).values({
      event_slug: eventSlug,
      name,
      email,
      plus_ones: plusOnes ?? 0,
      user_agent: req.headers["user-agent"] ?? null,
    });
    res.status(201).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/admin/rsvps
router.get("/admin/rsvps", async (_req, res) => {
  try {
    const rows = await db.select().from(eventRsvpsTable);
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/artist-submissions
router.post("/artist-submissions", async (req, res) => {
  try {
    const { name, submitter_email } = req.body;
    if (!name || !submitter_email) return res.status(400).json({ error: "Missing required fields" });
    await db.insert(artistSubmissionsTable).values({
      ...req.body,
      user_agent: req.headers["user-agent"] ?? null,
    });
    res.status(201).json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/booking-otp/start
// Accepts both camelCase and snake_case field names for compatibility
router.post("/booking-otp/start", async (req, res) => {
  try {
    const {
      artistId, artist_id,
      artistName, artist_name,
      requesterEmail, requester_email,
      requesterPhone, requester_phone,
      purpose,
    } = req.body;
    const effectiveArtistId = artistId ?? artist_id;
    const effectiveArtistName = artistName ?? artist_name;
    const effectiveRequesterEmail = requesterEmail ?? requester_email;
    const effectiveRequesterPhone = requesterPhone ?? requester_phone;
    if (!effectiveArtistId || !effectiveRequesterEmail) return res.status(400).json({ error: "Missing required fields" });

    // Create the booking request
    const requests = await db.insert(bookingRequestsTable).values({
      artist_id: effectiveArtistId,
      artist_name: effectiveArtistName ?? "",
      requester_email: effectiveRequesterEmail,
      requester_phone: effectiveRequesterPhone ?? null,
      purpose: purpose ?? null,
      user_agent: req.headers["user-agent"] ?? null,
    }).returning();
    const request = requests[0];

    // Create OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await db.insert(bookingOtpCodesTable).values({
      email: effectiveRequesterEmail,
      code_hash: hashCode(code),
      expires_at: expiresAt,
    });

    // In production, send an email with the OTP here
    // For now, we return the requestId and the OTP (dev mode)
    const isDev = process.env.NODE_ENV !== "production";
    res.json({
      requestId: request.id,
      booking_id: request.id,  // alias for frontend compatibility
      ...(isDev ? { code } : {}),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/booking-otp/verify
// Accepts both requestId and booking_id for frontend compatibility
router.post("/booking-otp/verify", async (req, res) => {
  try {
    const { requestId, booking_id, code } = req.body;
    const effectiveRequestId = requestId ?? booking_id;
    if (!effectiveRequestId || !code) return res.status(400).json({ error: "Missing required fields" });

    const request = await db
      .select()
      .from(bookingRequestsTable)
      .where(eq(bookingRequestsTable.id, effectiveRequestId));
    if (!request.length) return res.status(404).json({ error: "Request not found" });

    const otps = await db
      .select()
      .from(bookingOtpCodesTable)
      .where(eq(bookingOtpCodesTable.email, request[0].requester_email));

    const valid = otps.find((otp) => {
      return (
        otp.code_hash === hashCode(code) &&
        !otp.consumed_at &&
        new Date(otp.expires_at) > new Date()
      );
    });

    if (!valid) return res.status(400).json({ error: "Invalid or expired OTP" });

    // Mark OTP as consumed
    await db
      .update(bookingOtpCodesTable)
      .set({ consumed_at: new Date() })
      .where(eq(bookingOtpCodesTable.id, valid.id));

    // Mark booking request as verified
    await db
      .update(bookingRequestsTable)
      .set({ verified_at: new Date() })
      .where(eq(bookingRequestsTable.id, requestId));

    res.json({ ok: true, requestId });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
