/**
 * CCD Ticketing Routes
 *
 * Mount points (all under /api):
 *   POST   /ticketing/promoter/apply              — submit promoter application
 *   GET    /ticketing/events/:slug/config          — get event ticketing config + tiers
 *   POST   /ticketing/orders                       — create Razorpay order
 *   POST   /ticketing/orders/:id/verify            — verify Razorpay signature → issue tickets
 *   POST   /ticketing/webhooks/razorpay            — Razorpay webhook (payment.captured etc.)
 *   GET    /ticketing/my-tickets                   — Clerk-authed buyer's tickets
 *   GET    /ticketing/tickets/:token               — single ticket by QR token
 *   POST   /ticketing/tickets/:token/transfer      — initiate transfer
 *   POST   /ticketing/transfers/:token/claim       — recipient claims transfer
 *   POST   /ticketing/transfers/:token/cancel      — sender cancels transfer
 *
 * Promoter-facing (requires Clerk auth + promoter role check):
 *   GET    /ticketing/promoter/me                  — current promoter profile
 *   POST   /ticketing/promoter/events              — create event ticketing config
 *   PATCH  /ticketing/promoter/events/:slug        — update event ticketing config
 *   POST   /ticketing/promoter/events/:slug/tiers  — add ticket tier
 *   PATCH  /ticketing/promoter/tiers/:id           — update tier
 *   DELETE /ticketing/promoter/tiers/:id           — delete tier
 *   GET    /ticketing/promoter/events/:slug/orders — sales dashboard data
 *   GET    /ticketing/promoter/events/:slug/rsvps  — RSVP list
 *   POST   /ticketing/promoter/rsvps/:id/approve   — approve RSVP, create order, send payment link
 *   POST   /ticketing/promoter/rsvps/:id/decline   — decline RSVP
 *   POST   /ticketing/promoter/checkin             — door scan endpoint
 *
 * Admin-facing (requires x-admin-password):
 *   GET    /ticketing/admin/applications           — all promoter applications
 *   POST   /ticketing/admin/applications/:id/approve
 *   POST   /ticketing/admin/applications/:id/reject
 *   GET    /ticketing/admin/orders                 — all orders across events
 *   POST   /ticketing/admin/orders/:id/refund      — trigger Razorpay refund
 *   GET    /ticketing/admin/revenue                — revenue summary
 */

import { Router } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  eventsTable,
  promotersTable,
  eventRsvpsTable,
  promoterApplicationsTable,
  promoterUsersTable,
  eventTicketingTable,
  ticketTiersTable,
  ticketOrdersTable,
  ticketOrderItemsTable,
  issuedTicketsTable,
  ticketTransfersTable,
  doorCheckinsTable,
  rsvpExtensionsTable,
} from "@workspace/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { requireAdmin } from "../middleware/adminAuth";
import { logger } from "../lib/logger";


const router = Router();

// ─── Constants ────────────────────────────────────────────────────────────────

const CCD_COMMISSION_PCT = 5; // 5% each side
const PAYMENT_LINK_EXPIRY_HOURS = 48;

// ─── Razorpay helpers ─────────────────────────────────────────────────────────

function getRazorpayKeys() {
  return {
    key_id: process.env.RAZORPAY_KEY_ID ?? "rzp_test_DUMMY_KEY_ID",
    key_secret: process.env.RAZORPAY_KEY_SECRET ?? "DUMMY_SECRET",
    webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "DUMMY_WEBHOOK_SECRET",
  };
}

async function createRazorpayOrder(amountPaise: number, currency = "INR", receiptId: string) {
  const { key_id, key_secret } = getRazorpayKeys();
  const auth = Buffer.from(`${key_id}:${key_secret}`).toString("base64");
  const body = { amount: amountPaise, currency, receipt: receiptId.slice(0, 40) };
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay order creation failed: ${err}`);
  }
  return res.json();
}

async function refundRazorpayPayment(paymentId: string, amountPaise?: number) {
  const { key_id, key_secret } = getRazorpayKeys();
  const auth = Buffer.from(`${key_id}:${key_secret}`).toString("base64");
  const body: Record<string, unknown> = { speed: "normal" };
  if (amountPaise) body.amount = amountPaise;
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Razorpay refund failed: ${err}`);
  }
  return res.json();
}

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const { key_secret } = getRazorpayKeys();
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", key_secret).update(body).digest("hex");
  return expected === signature;
}



// ─── Email helpers (Resend) ───────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    logger.warn("RESEND_API_KEY not set — skipping email to " + to);
    return;
  }
  const FROM = process.env.EMAIL_FROM ?? "tickets@catscandance.com";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `Cats Can Dance <${FROM}>`, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    logger.error({ err }, "Resend email failed");
  }
}

function baseEmailWrapper(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cats Can Dance Tickets</title></head>
<body style="background:#f5f0e8;margin:0;padding:20px;font-family:sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
<tr><td style="background:#1a1a1a;padding:20px 28px;border:4px solid #1a1a1a;">
  <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:22px;color:#f5f0e8;text-transform:uppercase;letter-spacing:2px;">
    CATS<span style="color:#e040fb;">.</span>CAN<span style="color:#e040fb;">.</span>DANCE
  </div>
  <div style="font-size:11px;color:#aaa;margin-top:3px;text-transform:uppercase;letter-spacing:1px;">TICKETS</div>
</td></tr>
<tr><td style="background:#f5f0e8;padding:24px 28px;border-left:4px solid #1a1a1a;border-right:4px solid #1a1a1a;border-bottom:4px solid #1a1a1a;">
  ${content}
</td></tr>
<tr><td style="background:#1a1a1a;padding:16px 28px;border:4px solid #1a1a1a;">
  <div style="color:#666;font-size:11px;text-align:center;">
    Cats Can Dance · Bangalore Underground<br>
    <a href="https://catscandance.com" style="color:#f5e642;">catscandance.com</a>
  </div>
</td></tr>
</table></body></html>`;
}

async function sendTicketConfirmationEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  eventVenue: string,
  tickets: Array<{ tier_name: string; qr_token: string }>,
  baseUrl: string
) {
  const ticketRows = tickets.map(t => `
    <div style="border:3px solid #1a1a1a;padding:14px 16px;margin-bottom:10px;background:#fff;">
      <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:13px;color:#e040fb;text-transform:uppercase;">${t.tier_name}</div>
      <div style="font-size:12px;color:#555;margin-top:4px;">Ticket ID: <code style="background:#f5e642;padding:2px 6px;">${t.qr_token.slice(0, 12).toUpperCase()}</code></div>
      <div style="margin-top:8px;">
        <a href="${baseUrl}/my-tickets/${t.qr_token}" style="background:#1a1a1a;color:#f5e642;font-family:'Courier New',monospace;font-size:12px;padding:8px 14px;text-decoration:none;text-transform:uppercase;border:2px solid #1a1a1a;">VIEW TICKET + QR →</a>
      </div>
    </div>`).join("");

  const html = baseEmailWrapper(`
    <h2 style="font-family:'Courier New',monospace;font-size:26px;font-weight:bold;text-transform:uppercase;color:#1a1a1a;margin:0 0 4px;">YOU'RE IN.</h2>
    <p style="color:#555;margin:0 0 16px;font-size:14px;">Hi ${name} — your tickets for <strong>${eventTitle}</strong> are confirmed.</p>
    <div style="background:#f5e642;padding:12px 16px;border:3px solid #1a1a1a;margin-bottom:20px;">
      <div style="font-family:'Courier New',monospace;font-weight:bold;font-size:13px;text-transform:uppercase;">${eventTitle}</div>
      <div style="font-size:13px;color:#333;margin-top:3px;">${eventDate} · ${eventVenue}</div>
    </div>
    <p style="font-family:'Courier New',monospace;font-size:11px;text-transform:uppercase;color:#888;margin-bottom:10px;">/ YOUR TICKETS</p>
    ${ticketRows}
    <p style="font-size:12px;color:#888;margin-top:16px;">Show your QR code at the door. Tickets are non-refundable unless the event is cancelled. Transfers available via your ticket page.</p>
  `);
  await sendEmail(to, `🎟️ Your tickets — ${eventTitle}`, html);
}

async function sendRsvpApprovedEmail(
  to: string,
  name: string,
  eventTitle: string,
  eventDate: string,
  paymentLink: string,
  expiryHours: number,
  tierName: string,
  amountInr: number
) {
  const html = baseEmailWrapper(`
    <h2 style="font-family:'Courier New',monospace;font-size:24px;font-weight:bold;text-transform:uppercase;color:#1a1a1a;margin:0 0 4px;">YOU'RE APPROVED.</h2>
    <p style="color:#555;margin:0 0 16px;font-size:14px;">Hi ${name} — your RSVP for <strong>${eventTitle}</strong> has been approved. Complete payment to secure your ticket.</p>
    <div style="background:#f5e642;padding:12px 16px;border:3px solid #1a1a1a;margin-bottom:20px;">
      <div style="font-family:'Courier New',monospace;font-weight:bold;text-transform:uppercase;">${eventTitle}</div>
      <div style="font-size:13px;color:#333;margin-top:2px;">${eventDate}</div>
      <div style="font-size:13px;margin-top:6px;"><strong>${tierName}</strong> — ₹${(amountInr).toLocaleString("en-IN")}</div>
    </div>
    <a href="${paymentLink}" style="display:block;background:#e040fb;color:#fff;font-family:'Courier New',monospace;font-weight:bold;font-size:16px;text-transform:uppercase;text-align:center;padding:16px;border:3px solid #1a1a1a;text-decoration:none;margin-bottom:12px;">COMPLETE PAYMENT →</a>
    <p style="font-size:12px;color:#888;">Link expires in ${expiryHours} hours. After expiry your spot goes to the next person on the list.</p>
  `);
  await sendEmail(to, `✅ RSVP approved — secure your ticket to ${eventTitle}`, html);
}

async function sendRsvpDeclinedEmail(to: string, name: string, eventTitle: string, reason?: string) {
  const html = baseEmailWrapper(`
    <h2 style="font-family:'Courier New',monospace;font-size:22px;font-weight:bold;text-transform:uppercase;color:#1a1a1a;margin:0 0 8px;">THANKS FOR RSVP'ING.</h2>
    <p style="color:#555;font-size:14px;">Hi ${name}, unfortunately your RSVP for <strong>${eventTitle}</strong> couldn't be approved this time. ${reason ? `<br><em style="color:#888;">${reason}</em>` : ""}</p>
    <p style="font-size:13px;color:#888;margin-top:16px;">Check out other upcoming CCD events at <a href="https://catscandance.com/events" style="color:#e040fb;">catscandance.com/events</a></p>
  `);
  await sendEmail(to, `CCD RSVP — ${eventTitle}`, html);
}

async function sendTransferEmail(
  to: string,
  fromName: string,
  eventTitle: string,
  tierName: string,
  claimLink: string
) {
  const html = baseEmailWrapper(`
    <h2 style="font-family:'Courier New',monospace;font-size:22px;font-weight:bold;text-transform:uppercase;color:#1a1a1a;margin:0 0 8px;">YOU GOT A TICKET.</h2>
    <p style="color:#555;font-size:14px;"><strong>${fromName}</strong> has transferred their <strong>${tierName}</strong> ticket to <strong>${eventTitle}</strong> to you.</p>
    <a href="${claimLink}" style="display:block;background:#1a1a1a;color:#f5e642;font-family:'Courier New',monospace;font-weight:bold;font-size:15px;text-transform:uppercase;text-align:center;padding:14px;border:3px solid #1a1a1a;text-decoration:none;margin:16px 0;">CLAIM YOUR TICKET →</a>
    <p style="font-size:12px;color:#888;">This link expires in 24 hours. Face-value transfer only — no scalping.</p>
  `);
  await sendEmail(to, `🎟️ ${fromName} sent you a ticket to ${eventTitle}`, html);
}



// ─── Auth helpers ─────────────────────────────────────────────────────────────

function requireClerkAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  if (!auth?.userId) return res.status(401).json({ error: "Authentication required" });
  (req as any).clerkUserId = auth.userId;
  next();
}

async function requirePromoterRole(req: any, res: any, next: any) {
  const clerkUserId = (req as any).clerkUserId;
  if (!clerkUserId) return res.status(401).json({ error: "Authentication required" });
  const rows = await db.select().from(promoterUsersTable).where(eq(promoterUsersTable.clerk_user_id, clerkUserId)).limit(1);
  if (!rows.length) return res.status(403).json({ error: "Promoter account required", code: "NOT_A_PROMOTER" });
  (req as any).promoterUser = rows[0];
  next();
}

// ─── Commission calculation ───────────────────────────────────────────────────

function calcCommission(subtotalPaise: number, commissPct = CCD_COMMISSION_PCT) {
  const buyerFeePaise = Math.round(subtotalPaise * (commissPct / 100));
  const promoterFeePaise = Math.round(subtotalPaise * (commissPct / 100));
  const totalPaise = subtotalPaise + buyerFeePaise; // buyer pays subtotal + 5%
  return { buyerFeePaise, promoterFeePaise, totalPaise };
}

// ─── Issue tickets helper ─────────────────────────────────────────────────────

async function issueTicketsForOrder(orderId: string) {
  const [order] = await db.select().from(ticketOrdersTable).where(eq(ticketOrdersTable.id, orderId));
  if (!order) throw new Error("Order not found");

  const items = await db.select().from(ticketOrderItemsTable).where(eq(ticketOrderItemsTable.order_id, orderId));

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, order.event_slug));

  const issued: string[] = [];

  for (const item of items) {
    const [tier] = await db.select().from(ticketTiersTable).where(eq(ticketTiersTable.id, item.tier_id));

    for (let i = 0; i < item.quantity; i++) {
      const qrToken = crypto.randomUUID();
      await db.insert(issuedTicketsTable).values({
        order_id: orderId,
        tier_id: item.tier_id,
        event_slug: order.event_slug,
        qr_token: qrToken,
        holder_name: order.buyer_name,
        holder_email: order.buyer_email,
        holder_phone: order.buyer_phone ?? null,
        holder_clerk_id: order.buyer_clerk_id ?? null,
        buyer_name: order.buyer_name,
        buyer_email: order.buyer_email,
        status: "issued",
        tier_name: tier?.name ?? item.tier_name,
        event_title: event?.title ?? order.event_slug,
        event_date: event?.date ?? null,
        event_venue: event?.venue ?? null,
        transfer_count: 0,
      });
      issued.push(qrToken);
    }

    // Increment sold count on tier
    await db.update(ticketTiersTable)
      .set({ sold: sql`${ticketTiersTable.sold} + ${item.quantity}`, reserved: sql`GREATEST(${ticketTiersTable.reserved} - ${item.quantity}, 0)`, updated_at: new Date() })
      .where(eq(ticketTiersTable.id, item.tier_id));
  }

  // Mark order as paid
  await db.update(ticketOrdersTable)
    .set({ status: "paid", paid_at: new Date(), updated_at: new Date() })
    .where(eq(ticketOrdersTable.id, orderId));

  return issued;
}



// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/ticketing/promoter/apply
router.post("/promoter/apply", async (req, res) => {
  try {
    const { name, email, instagram, website, city, genres, bio, sample_event } = req.body;
    if (!name || !email) return res.status(400).json({ error: "name and email required" });

    // Prevent duplicate submissions
    const existing = await db.select({ id: promoterApplicationsTable.id })
      .from(promoterApplicationsTable)
      .where(and(eq(promoterApplicationsTable.email, email.toLowerCase()), eq(promoterApplicationsTable.status, "pending")))
      .limit(1);
    if (existing.length) return res.status(409).json({ error: "Application already pending for this email" });

    await db.insert(promoterApplicationsTable).values({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      instagram: instagram?.trim() ?? null,
      website: website?.trim() ?? null,
      city: city ?? null,
      genres: Array.isArray(genres) ? genres : [],
      bio: bio?.trim() ?? null,
      sample_event: sample_event?.trim() ?? null,
      user_agent: req.headers["user-agent"] ?? null,
    });
    res.status(201).json({ ok: true });
  } catch (e: any) {
    logger.error(e, "promoter/apply error");
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ticketing/events/:slug/config — public: tiers + availability
router.get("/events/:slug/config", async (req, res) => {
  try {
    const { slug } = req.params;
    const [config] = await db.select().from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, slug));
    const tiers = await db.select().from(ticketTiersTable)
      .where(and(eq(ticketTiersTable.event_slug, slug), eq(ticketTiersTable.is_hidden, false)))
      .orderBy(ticketTiersTable.sort_order);

    // Compute availability for each tier
    const now = new Date();
    const enrichedTiers = tiers.map(t => {
      const available = t.capacity !== null ? Math.max(0, t.capacity - t.sold - t.reserved) : null;
      let onSale = t.status === "active";
      if (t.sale_start && now < t.sale_start) onSale = false;
      if (t.sale_end && now > t.sale_end) onSale = false;
      return { ...t, available, on_sale: onSale };
    });

    res.json({ config: config ?? null, tiers: enrichedTiers });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ticketing/payment-link/:token — resolve a payment link to order details
router.get("/payment-link/:token", async (req, res) => {
  try {
    const [order] = await db.select().from(ticketOrdersTable)
      .where(eq(ticketOrdersTable.payment_link_token, req.params.token));
    if (!order) return res.status(404).json({ error: "Invalid payment link" });
    if (order.payment_link_expires_at && new Date() > order.payment_link_expires_at) {
      return res.status(410).json({ error: "Payment link expired" });
    }
    if (order.status === "paid") return res.status(409).json({ error: "Already paid", order_id: order.id });

    const items = await db.select().from(ticketOrderItemsTable).where(eq(ticketOrderItemsTable.order_id, order.id));
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, order.event_slug));
    const [config] = await db.select().from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, order.event_slug));

    res.json({ order, items, event: event ?? null, config: config ?? null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/orders — create Razorpay order
router.post("/orders", async (req, res) => {
  try {
    const { event_slug, buyer_name, buyer_email, buyer_phone, items, payment_link_token, rsvp_id } = req.body;
    if (!event_slug || !buyer_name || !buyer_email || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "event_slug, buyer_name, buyer_email, items[] required" });
    }

    const [config] = await db.select().from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, event_slug));
    const auth = getAuth(req);

    // Validate tiers + compute totals
    let subtotalPaise = 0;
    const lineItems: Array<{ tier: any; quantity: number }> = [];

    for (const item of items) {
      const [tier] = await db.select().from(ticketTiersTable).where(eq(ticketTiersTable.id, item.tier_id));
      if (!tier || tier.event_slug !== event_slug) return res.status(400).json({ error: `Tier ${item.tier_id} not found` });
      if (tier.status !== "active") return res.status(400).json({ error: `Tier "${tier.name}" is not currently on sale` });

      const now = new Date();
      if (tier.sale_start && now < tier.sale_start) return res.status(400).json({ error: `"${tier.name}" not yet on sale` });
      if (tier.sale_end && now > tier.sale_end) return res.status(400).json({ error: `"${tier.name}" sale has ended` });

      const qty = Math.min(item.quantity ?? 1, tier.max_per_order);
      const available = tier.capacity !== null ? tier.capacity - tier.sold - tier.reserved : Infinity;
      if (available < qty) return res.status(400).json({ error: `Only ${available} tickets left for "${tier.name}"` });

      subtotalPaise += tier.price_inr * 100 * qty;
      lineItems.push({ tier, quantity: qty });

      // Reserve seats
      await db.update(ticketTiersTable)
        .set({ reserved: sql`${ticketTiersTable.reserved} + ${qty}`, updated_at: new Date() })
        .where(eq(ticketTiersTable.id, tier.id));
    }

    const isFree = config?.is_free || subtotalPaise === 0;
    const commissPct = parseFloat(String(config?.commission_pct ?? CCD_COMMISSION_PCT));
    const { buyerFeePaise, promoterFeePaise, totalPaise } = isFree
      ? { buyerFeePaise: 0, promoterFeePaise: 0, totalPaise: 0 }
      : calcCommission(subtotalPaise, commissPct);

    // Create our order record first
    const orderId = crypto.randomUUID();
    const [dbOrder] = await db.insert(ticketOrdersTable).values({
      id: orderId,
      event_slug,
      promoter_id: config?.promoter_id ?? null,
      buyer_name,
      buyer_email: buyer_email.toLowerCase(),
      buyer_phone: buyer_phone ?? null,
      buyer_clerk_id: auth?.userId ?? null,
      subtotal_paise: subtotalPaise,
      buyer_fee_paise: buyerFeePaise,
      promoter_fee_paise: promoterFeePaise,
      total_paise: totalPaise,
      status: isFree ? "complimentary" : "pending",
      rsvp_id: rsvp_id ?? null,
      payment_link_token: payment_link_token ?? null,
      source: "web",
    }).returning();

    // Insert line items
    for (const li of lineItems) {
      await db.insert(ticketOrderItemsTable).values({
        order_id: orderId,
        tier_id: li.tier.id,
        tier_name: li.tier.name,
        quantity: li.quantity,
        unit_price_paise: li.tier.price_inr * 100,
        total_paise: li.tier.price_inr * 100 * li.quantity,
      });
    }

    // Free tickets: issue immediately
    if (isFree) {
      const tokens = await issueTicketsForOrder(orderId);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";
      await sendTicketConfirmationEmail(
        buyer_email, buyer_name,
        event_slug, "", "",
        tokens.map(t => ({ tier_name: lineItems[0].tier.name, qr_token: t })),
        baseUrl
      );
      return res.json({ ok: true, order_id: orderId, free: true, tickets_issued: tokens.length });
    }

    // Paid tickets: create Razorpay order
    const rzpOrder = await createRazorpayOrder(totalPaise, "INR", orderId) as any;
    await db.update(ticketOrdersTable)
      .set({ razorpay_order_id: rzpOrder.id, updated_at: new Date() })
      .where(eq(ticketOrdersTable.id, orderId));

    const { key_id } = getRazorpayKeys();
    res.json({
      ok: true,
      order_id: orderId,
      razorpay_order_id: rzpOrder.id,
      razorpay_key_id: key_id,
      amount_paise: totalPaise,
      subtotal_paise: subtotalPaise,
      buyer_fee_paise: buyerFeePaise,
      currency: "INR",
    });
  } catch (e: any) {
    logger.error(e, "POST /orders error");
    res.status(500).json({ error: e.message });
  }
});



// POST /api/ticketing/orders/:id/verify — verify signature, issue tickets
router.post("/orders/:id/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "razorpay_order_id, razorpay_payment_id, razorpay_signature required" });
    }

    const [order] = await db.select().from(ticketOrdersTable).where(eq(ticketOrdersTable.id, req.params.id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status === "paid") return res.json({ ok: true, already_paid: true, order_id: order.id });

    const valid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) return res.status(400).json({ error: "Payment signature verification failed" });

    await db.update(ticketOrdersTable)
      .set({ razorpay_payment_id, razorpay_signature, updated_at: new Date() })
      .where(eq(ticketOrdersTable.id, order.id));

    const tokens = await issueTicketsForOrder(order.id);

    // Get event details for email
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, order.event_slug));
    const items = await db.select().from(ticketOrderItemsTable).where(eq(ticketOrderItemsTable.order_id, order.id));
    const issuedTickets = await db.select().from(issuedTicketsTable).where(eq(issuedTicketsTable.order_id, order.id));

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";
    await sendTicketConfirmationEmail(
      order.buyer_email, order.buyer_name,
      event?.title ?? order.event_slug,
      event?.date ?? "", event?.venue ?? "",
      issuedTickets.map(t => ({ tier_name: t.tier_name, qr_token: t.qr_token })),
      baseUrl
    );

    // If this order came from an RSVP, mark it as paid
    if (order.rsvp_id) {
      await db.update(rsvpExtensionsTable)
        .set({ status: "paid", updated_at: new Date() })
        .where(eq(rsvpExtensionsTable.rsvp_id, order.rsvp_id));
    }

    res.json({ ok: true, order_id: order.id, tickets_issued: tokens.length });
  } catch (e: any) {
    logger.error(e, "POST /orders/:id/verify error");
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/webhooks/razorpay — Razorpay webhooks
router.post("/webhooks/razorpay", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const { webhook_secret } = getRazorpayKeys();
    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac("sha256", webhook_secret).update(body).digest("hex");
    if (signature !== expected) {
      logger.warn("Razorpay webhook signature mismatch");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { event, payload } = req.body;
    const payment = payload?.payment?.entity;

    if (event === "payment.captured" && payment) {
      const [order] = await db.select().from(ticketOrdersTable)
        .where(eq(ticketOrdersTable.razorpay_order_id, payment.order_id));
      if (order && order.status !== "paid") {
        await db.update(ticketOrdersTable)
          .set({ razorpay_payment_id: payment.id, status: "paid", paid_at: new Date(), updated_at: new Date() })
          .where(eq(ticketOrdersTable.id, order.id));
        const tokens = await issueTicketsForOrder(order.id);
        const [ev] = await db.select().from(eventsTable).where(eq(eventsTable.slug, order.event_slug));
        const issuedTickets = await db.select().from(issuedTicketsTable).where(eq(issuedTicketsTable.order_id, order.id));
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";
        await sendTicketConfirmationEmail(
          order.buyer_email, order.buyer_name,
          ev?.title ?? order.event_slug, ev?.date ?? "", ev?.venue ?? "",
          issuedTickets.map(t => ({ tier_name: t.tier_name, qr_token: t.qr_token })),
          baseUrl
        );
      }
    }

    if (event === "refund.processed" && payload?.refund?.entity) {
      const refund = payload.refund.entity;
      await db.update(ticketOrdersTable)
        .set({ razorpay_refund_id: refund.id, status: "refunded", refunded_at: new Date(), updated_at: new Date() })
        .where(eq(ticketOrdersTable.razorpay_payment_id, refund.payment_id));
    }

    res.json({ ok: true });
  } catch (e: any) {
    logger.error(e, "Razorpay webhook error");
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ticketing/my-tickets — Clerk-authed buyer's tickets
router.get("/my-tickets", requireClerkAuth, async (req: any, res) => {
  try {
    const clerkUserId = req.clerkUserId;
    const tickets = await db.select().from(issuedTicketsTable)
      .where(eq(issuedTicketsTable.holder_clerk_id, clerkUserId))
      .orderBy(desc(issuedTicketsTable.created_at));
    res.json(tickets);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ticketing/tickets/:token — single ticket by QR token (for QR page + door scan)
router.get("/tickets/:token", async (req, res) => {
  try {
    const [ticket] = await db.select().from(issuedTicketsTable)
      .where(eq(issuedTicketsTable.qr_token, req.params.token));
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, ticket.event_slug));
    res.json({ ticket, event: event ?? null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});



// POST /api/ticketing/tickets/:token/transfer — initiate ticket transfer
router.post("/tickets/:token/transfer", requireClerkAuth, async (req: any, res) => {
  try {
    const { to_email, to_name } = req.body;
    if (!to_email) return res.status(400).json({ error: "to_email required" });

    const [ticket] = await db.select().from(issuedTicketsTable)
      .where(eq(issuedTicketsTable.qr_token, req.params.token));
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (ticket.holder_clerk_id !== req.clerkUserId) return res.status(403).json({ error: "Not your ticket" });
    if (ticket.status !== "issued") return res.status(400).json({ error: `Cannot transfer a ${ticket.status} ticket` });
    if (ticket.transfer_count >= 3) return res.status(400).json({ error: "Maximum transfers reached" });

    // Check event ticketing config allows transfers
    const [cfg] = await db.select().from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, ticket.event_slug));
    if (cfg && !cfg.allow_transfers) return res.status(400).json({ error: "Transfers not allowed for this event" });

    // Mark original ticket as transfer_pending
    await db.update(issuedTicketsTable)
      .set({ status: "transfer_pending", updated_at: new Date() })
      .where(eq(issuedTicketsTable.id, ticket.id));

    const claimToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await db.insert(ticketTransfersTable).values({
      ticket_id: ticket.id,
      from_holder_email: ticket.holder_email,
      from_holder_name: ticket.holder_name,
      to_email: to_email.toLowerCase(),
      to_name: to_name ?? null,
      claim_token: claimToken,
      claim_expires_at: expiresAt,
      status: "pending",
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";
    const claimLink = `${baseUrl}/tickets/claim/${claimToken}`;
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, ticket.event_slug));

    await sendTransferEmail(to_email, ticket.holder_name, event?.title ?? ticket.event_slug, ticket.tier_name, claimLink);

    res.json({ ok: true, claim_token: claimToken, expires_at: expiresAt });
  } catch (e: any) {
    logger.error(e, "transfer error");
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/transfers/:token/claim — recipient claims transfer
router.post("/transfers/:token/claim", async (req, res) => {
  try {
    const { recipient_name, recipient_clerk_id } = req.body;
    const [transfer] = await db.select().from(ticketTransfersTable)
      .where(eq(ticketTransfersTable.claim_token, req.params.token));

    if (!transfer) return res.status(404).json({ error: "Invalid transfer link" });
    if (transfer.status !== "pending") return res.status(400).json({ error: `Transfer already ${transfer.status}` });
    if (new Date() > transfer.claim_expires_at) return res.status(410).json({ error: "Transfer link expired" });

    const [oldTicket] = await db.select().from(issuedTicketsTable).where(eq(issuedTicketsTable.id, transfer.ticket_id));
    if (!oldTicket) return res.status(404).json({ error: "Original ticket not found" });

    // Create new ticket for recipient
    const newQrToken = crypto.randomUUID();
    await db.insert(issuedTicketsTable).values({
      order_id: oldTicket.order_id,
      tier_id: oldTicket.tier_id,
      event_slug: oldTicket.event_slug,
      qr_token: newQrToken,
      holder_name: recipient_name ?? transfer.to_name ?? transfer.to_email,
      holder_email: transfer.to_email,
      holder_clerk_id: recipient_clerk_id ?? null,
      buyer_name: oldTicket.buyer_name,
      buyer_email: oldTicket.buyer_email,
      status: "issued",
      tier_name: oldTicket.tier_name,
      event_title: oldTicket.event_title,
      event_date: oldTicket.event_date,
      event_venue: oldTicket.event_venue,
      transfer_from_ticket_id: oldTicket.id,
      transfer_count: (oldTicket.transfer_count ?? 0) + 1,
    });

    // Void old ticket
    await db.update(issuedTicketsTable)
      .set({ status: "transferred", updated_at: new Date() })
      .where(eq(issuedTicketsTable.id, oldTicket.id));

    // Complete transfer record
    const [newTkt] = await db.select().from(issuedTicketsTable).where(eq(issuedTicketsTable.qr_token, newQrToken));
    await db.update(ticketTransfersTable)
      .set({ status: "accepted", new_ticket_id: newTkt.id, claimed_at: new Date() })
      .where(eq(ticketTransfersTable.id, transfer.id));

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, oldTicket.event_slug));
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";
    await sendTicketConfirmationEmail(
      transfer.to_email, recipient_name ?? transfer.to_email,
      event?.title ?? oldTicket.event_slug, event?.date ?? "", event?.venue ?? "",
      [{ tier_name: oldTicket.tier_name, qr_token: newQrToken }],
      baseUrl
    );

    res.json({ ok: true, new_qr_token: newQrToken, ticket: newTkt });
  } catch (e: any) {
    logger.error(e, "transfer claim error");
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/transfers/:token/cancel
router.post("/transfers/:token/cancel", requireClerkAuth, async (req: any, res) => {
  try {
    const [transfer] = await db.select().from(ticketTransfersTable)
      .where(eq(ticketTransfersTable.claim_token, req.params.token));
    if (!transfer) return res.status(404).json({ error: "Transfer not found" });
    if (transfer.status !== "pending") return res.status(400).json({ error: "Cannot cancel completed transfer" });

    await db.update(ticketTransfersTable)
      .set({ status: "cancelled" })
      .where(eq(ticketTransfersTable.id, transfer.id));

    // Restore original ticket to issued
    await db.update(issuedTicketsTable)
      .set({ status: "issued", updated_at: new Date() })
      .where(eq(issuedTicketsTable.id, transfer.ticket_id));

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});



// ═══════════════════════════════════════════════════════════════════════════════
// PROMOTER ROUTES (Clerk auth + promoter role)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/ticketing/promoter/me
router.get("/promoter/me", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const [promoter] = await db.select().from(promotersTable).where(eq(promotersTable.id, pu.promoter_id));
    res.json({ promoter_user: pu, promoter: promoter ?? null });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/promoter/events — create/enable ticketing for an event
router.post("/promoter/events", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const { event_slug, ticketing_mode, is_free, total_capacity, sale_start, sale_end,
      max_tickets_per_order, allow_transfers, require_phone, commission_pct,
      payment_link_expiry_hours, custom_confirmation_msg, is_soft_launch } = req.body;

    if (!event_slug) return res.status(400).json({ error: "event_slug required" });

    // Verify event exists
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, event_slug));
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Upsert
    const existing = await db.select({ id: eventTicketingTable.id })
      .from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, event_slug)).limit(1);

    const data: any = {
      event_slug,
      promoter_id: pu.promoter_id,
      promoter_clerk_id: pu.clerk_user_id,
      ticketing_mode: ticketing_mode ?? "rsvp_invite",
      is_free: is_free ?? false,
      total_capacity: total_capacity ?? null,
      sale_start: sale_start ? new Date(sale_start) : null,
      sale_end: sale_end ? new Date(sale_end) : null,
      max_tickets_per_order: max_tickets_per_order ?? 4,
      allow_transfers: allow_transfers ?? true,
      require_phone: require_phone ?? false,
      commission_pct: commission_pct ?? CCD_COMMISSION_PCT,
      payment_link_expiry_hours: payment_link_expiry_hours ?? PAYMENT_LINK_EXPIRY_HOURS,
      custom_confirmation_msg: custom_confirmation_msg ?? null,
      is_soft_launch: is_soft_launch ?? false,
      updated_at: new Date(),
    };

    if (existing.length) {
      await db.update(eventTicketingTable).set(data).where(eq(eventTicketingTable.event_slug, event_slug));
      return res.json({ ok: true, updated: true });
    }
    const [row] = await db.insert(eventTicketingTable).values(data).returning();
    res.status(201).json({ ok: true, config: row });
  } catch (e: any) {
    logger.error(e, "promoter/events POST error");
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/ticketing/promoter/events/:slug
router.patch("/promoter/events/:slug", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const [cfg] = await db.select().from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, req.params.slug));
    if (!cfg) return res.status(404).json({ error: "Event ticketing config not found" });
    if (cfg.promoter_id !== pu.promoter_id) return res.status(403).json({ error: "Not your event" });

    const { ticketing_mode, is_free, total_capacity, sale_start, sale_end,
      max_tickets_per_order, allow_transfers, require_phone, commission_pct,
      payment_link_expiry_hours, custom_confirmation_msg, is_soft_launch } = req.body;

    await db.update(eventTicketingTable).set({
      ...(ticketing_mode !== undefined && { ticketing_mode }),
      ...(is_free !== undefined && { is_free }),
      ...(total_capacity !== undefined && { total_capacity }),
      ...(sale_start !== undefined && { sale_start: sale_start ? new Date(sale_start) : null }),
      ...(sale_end !== undefined && { sale_end: sale_end ? new Date(sale_end) : null }),
      ...(max_tickets_per_order !== undefined && { max_tickets_per_order }),
      ...(allow_transfers !== undefined && { allow_transfers }),
      ...(require_phone !== undefined && { require_phone }),
      ...(commission_pct !== undefined && { commission_pct }),
      ...(payment_link_expiry_hours !== undefined && { payment_link_expiry_hours }),
      ...(custom_confirmation_msg !== undefined && { custom_confirmation_msg }),
      ...(is_soft_launch !== undefined && { is_soft_launch }),
      updated_at: new Date(),
    }).where(eq(eventTicketingTable.event_slug, req.params.slug));

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/promoter/events/:slug/tiers
router.post("/promoter/events/:slug/tiers", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const [cfg] = await db.select().from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, req.params.slug));
    if (!cfg) return res.status(404).json({ error: "Event ticketing config not found" });
    if (cfg.promoter_id !== pu.promoter_id) return res.status(403).json({ error: "Not your event" });

    const { name, description, price_inr, capacity, max_per_order, sale_start, sale_end,
      sort_order, is_hidden, is_comp, is_free } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });

    const [tier] = await db.insert(ticketTiersTable).values({
      event_slug: req.params.slug,
      event_ticketing_id: cfg.id,
      name, description: description ?? null,
      price_inr: is_free ? 0 : (price_inr ?? 0),
      is_free: is_free ?? price_inr === 0,
      capacity: capacity ?? null,
      max_per_order: max_per_order ?? 4,
      sale_start: sale_start ? new Date(sale_start) : null,
      sale_end: sale_end ? new Date(sale_end) : null,
      sort_order: sort_order ?? 0,
      is_hidden: is_hidden ?? false,
      is_comp: is_comp ?? false,
      status: "active",
    }).returning();
    res.status(201).json({ ok: true, tier });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/ticketing/promoter/tiers/:id
router.patch("/promoter/tiers/:id", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const [tier] = await db.select().from(ticketTiersTable).where(eq(ticketTiersTable.id, req.params.id));
    if (!tier) return res.status(404).json({ error: "Tier not found" });

    const [cfg] = await db.select({ promoter_id: eventTicketingTable.promoter_id })
      .from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, tier.event_slug));
    if (!cfg || cfg.promoter_id !== pu.promoter_id) return res.status(403).json({ error: "Not your tier" });

    const allowed = ["name","description","price_inr","capacity","max_per_order","sale_start",
      "sale_end","sort_order","is_hidden","is_comp","is_free","status"];
    const updates: any = { updated_at: new Date() };
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        updates[k] = k.includes("_at") && req.body[k] ? new Date(req.body[k]) : req.body[k];
      }
    }
    await db.update(ticketTiersTable).set(updates).where(eq(ticketTiersTable.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/ticketing/promoter/tiers/:id
router.delete("/promoter/tiers/:id", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const [tier] = await db.select().from(ticketTiersTable).where(eq(ticketTiersTable.id, req.params.id));
    if (!tier) return res.status(404).json({ error: "Tier not found" });
    if (tier.sold > 0) return res.status(400).json({ error: "Cannot delete tier with sold tickets" });

    const [cfg] = await db.select({ promoter_id: eventTicketingTable.promoter_id })
      .from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, tier.event_slug));
    if (!cfg || cfg.promoter_id !== pu.promoter_id) return res.status(403).json({ error: "Not your tier" });

    await db.delete(ticketTiersTable).where(eq(ticketTiersTable.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});



// GET /api/ticketing/promoter/events/:slug/orders
router.get("/promoter/events/:slug/orders", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const [cfg] = await db.select({ promoter_id: eventTicketingTable.promoter_id })
      .from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, req.params.slug));
    if (!cfg || cfg.promoter_id !== pu.promoter_id) return res.status(403).json({ error: "Not your event" });

    const orders = await db.select().from(ticketOrdersTable)
      .where(eq(ticketOrdersTable.event_slug, req.params.slug))
      .orderBy(desc(ticketOrdersTable.created_at));

    const tiers = await db.select().from(ticketTiersTable).where(eq(ticketTiersTable.event_slug, req.params.slug));

    // Revenue summary
    const paid = orders.filter((o: typeof orders[number]) => o.status === "paid" || o.status === "complimentary");
    const grossPaise = paid.reduce((a: number, o: typeof orders[number]) => a + o.subtotal_paise, 0);
    const buyerFeesPaise = paid.reduce((a: number, o: typeof orders[number]) => a + o.buyer_fee_paise, 0);
    const promoterFeesPaise = paid.reduce((a: number, o: typeof orders[number]) => a + o.promoter_fee_paise, 0);
    const netPayoutPaise = grossPaise - promoterFeesPaise;

    res.json({
      orders,
      tiers,
      summary: {
        total_orders: paid.length,
        gross_inr: grossPaise / 100,
        buyer_fees_inr: buyerFeesPaise / 100,
        promoter_fees_inr: promoterFeesPaise / 100,
        net_payout_inr: netPayoutPaise / 100,
        tickets_sold: tiers.reduce((a: number, t: typeof tiers[number]) => a + t.sold, 0),
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ticketing/promoter/events/:slug/rsvps
router.get("/promoter/events/:slug/rsvps", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const [cfg] = await db.select({ promoter_id: eventTicketingTable.promoter_id })
      .from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, req.params.slug));
    if (!cfg || cfg.promoter_id !== pu.promoter_id) return res.status(403).json({ error: "Not your event" });

    // Join event_rsvps with rsvp_extensions
    const rsvps = await db.select().from(eventRsvpsTable).where(eq(eventRsvpsTable.event_slug, req.params.slug))
      .orderBy(desc(eventRsvpsTable.created_at));
    const rsvpIds = rsvps.map(r => r.id);

    let extensions: any[] = [];
    if (rsvpIds.length > 0) {
      extensions = await db.select().from(rsvpExtensionsTable)
        .where(inArray(rsvpExtensionsTable.rsvp_id, rsvpIds as any));
    }

    const extMap = new Map(extensions.map((e: any) => [e.rsvp_id, e]));
    const enriched = rsvps.map((r: any) => ({ ...r, extension: extMap.get(r.id as any) ?? null }));

    res.json({ rsvps: enriched });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/promoter/rsvps/:id/approve
router.post("/promoter/rsvps/:id/approve", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const rsvpId = req.params.id;
    const { tier_id, note } = req.body;

    const [rsvp] = await db.select().from(eventRsvpsTable).where(eq(eventRsvpsTable.id, rsvpId as any));
    if (!rsvp) return res.status(404).json({ error: "RSVP not found" });

    const [cfg] = await db.select().from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, rsvp.event_slug));
    if (!cfg || cfg.promoter_id !== pu.promoter_id) return res.status(403).json({ error: "Not your event" });

    // Get or resolve tier
    let tier: any = null;
    if (tier_id) {
      [tier] = await db.select().from(ticketTiersTable).where(eq(ticketTiersTable.id, tier_id));
    } else {
      // Use first active, cheapest tier
      const tiers = await db.select().from(ticketTiersTable)
        .where(and(eq(ticketTiersTable.event_slug, rsvp.event_slug), eq(ticketTiersTable.status, "active")))
        .orderBy(ticketTiersTable.price_inr);
      tier = tiers[0] ?? null;
    }

    const isFree = cfg.is_free || !tier || tier.price_inr === 0;
    const expiryHours = cfg.payment_link_expiry_hours ?? PAYMENT_LINK_EXPIRY_HOURS;

    // Create order (pending if paid, complimentary if free)
    const paymentLinkToken = crypto.randomUUID();
    const paymentLinkExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const subtotalPaise = tier ? tier.price_inr * 100 : 0;
    const commissPct = parseFloat(String(cfg.commission_pct ?? CCD_COMMISSION_PCT));
    const { buyerFeePaise, promoterFeePaise, totalPaise } = isFree
      ? { buyerFeePaise: 0, promoterFeePaise: 0, totalPaise: 0 }
      : calcCommission(subtotalPaise, commissPct);

    const [order] = await db.insert(ticketOrdersTable).values({
      event_slug: rsvp.event_slug,
      promoter_id: pu.promoter_id,
      buyer_name: rsvp.name,
      buyer_email: rsvp.email,
      subtotal_paise: subtotalPaise,
      buyer_fee_paise: buyerFeePaise,
      promoter_fee_paise: promoterFeePaise,
      total_paise: totalPaise,
      status: isFree ? "complimentary" : "pending",
      rsvp_id: rsvpId as any,
      payment_link_token: isFree ? null : paymentLinkToken,
      payment_link_expires_at: isFree ? null : paymentLinkExpiry,
      source: "rsvp_invite",
    }).returning();

    if (tier) {
      await db.insert(ticketOrderItemsTable).values({
        order_id: order.id,
        tier_id: tier.id,
        tier_name: tier.name,
        quantity: 1 + rsvp.plus_ones,
        unit_price_paise: tier.price_inr * 100,
        total_paise: tier.price_inr * 100 * (1 + rsvp.plus_ones),
      });
    }

    // Upsert rsvp extension
    const existingExt = await db.select().from(rsvpExtensionsTable)
      .where(eq(rsvpExtensionsTable.rsvp_id, rsvpId as any)).limit(1);
    if (existingExt.length) {
      await db.update(rsvpExtensionsTable).set({
        status: isFree ? "paid" : "approved",
        order_id: order.id,
        approved_by: pu.clerk_user_id,
        approved_at: new Date(),
        payment_link_sent_at: isFree ? null : new Date(),
        updated_at: new Date(),
      }).where(eq(rsvpExtensionsTable.rsvp_id, rsvpId as any));
    } else {
      await db.insert(rsvpExtensionsTable).values({
        rsvp_id: rsvpId as any,
        event_slug: rsvp.event_slug,
        status: isFree ? "paid" : "approved",
        order_id: order.id,
        approved_by: pu.clerk_user_id,
        approved_at: new Date(),
        payment_link_sent_at: isFree ? null : new Date(),
      });
    }

    if (isFree) {
      const tokens = await issueTicketsForOrder(order.id);
      const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, rsvp.event_slug));
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";
      const issuedTickets = await db.select().from(issuedTicketsTable).where(eq(issuedTicketsTable.order_id, order.id));
      await sendTicketConfirmationEmail(rsvp.email, rsvp.name, event?.title ?? rsvp.event_slug,
        event?.date ?? "", event?.venue ?? "",
        issuedTickets.map(t => ({ tier_name: t.tier_name, qr_token: t.qr_token })), baseUrl);
      return res.json({ ok: true, free: true, tickets_issued: tokens.length });
    }

    // Send payment link email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://catscandance.com";
    const paymentLink = `${baseUrl}/checkout/${order.id}?token=${paymentLinkToken}`;
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, rsvp.event_slug));
    await sendRsvpApprovedEmail(rsvp.email, rsvp.name, event?.title ?? rsvp.event_slug,
      event?.date ?? "", paymentLink, expiryHours, tier?.name ?? "General Admission", totalPaise / 100);

    res.json({ ok: true, order_id: order.id, payment_link: paymentLink });
  } catch (e: any) {
    logger.error(e, "rsvp approve error");
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/promoter/rsvps/:id/decline
router.post("/promoter/rsvps/:id/decline", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const { reason } = req.body;
    const [rsvp] = await db.select().from(eventRsvpsTable).where(eq(eventRsvpsTable.id, req.params.id as any));
    if (!rsvp) return res.status(404).json({ error: "RSVP not found" });
    const [cfg] = await db.select({ promoter_id: eventTicketingTable.promoter_id })
      .from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, rsvp.event_slug));
    if (!cfg || cfg.promoter_id !== pu.promoter_id) return res.status(403).json({ error: "Not your event" });

    const existingExt = await db.select().from(rsvpExtensionsTable)
      .where(eq(rsvpExtensionsTable.rsvp_id, req.params.id as any)).limit(1);
    if (existingExt.length) {
      await db.update(rsvpExtensionsTable).set({ status: "declined", declined_reason: reason ?? null, updated_at: new Date() })
        .where(eq(rsvpExtensionsTable.rsvp_id, req.params.id as any));
    } else {
      await db.insert(rsvpExtensionsTable).values({
        rsvp_id: req.params.id as any,
        event_slug: rsvp.event_slug,
        status: "declined",
        declined_reason: reason ?? null,
      });
    }

    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, rsvp.event_slug));
    await sendRsvpDeclinedEmail(rsvp.email, rsvp.name, event?.title ?? rsvp.event_slug, reason);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/promoter/checkin — door QR scan
router.post("/promoter/checkin", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const { qr_token, gate } = req.body;
    if (!qr_token) return res.status(400).json({ error: "qr_token required" });

    const [ticket] = await db.select().from(issuedTicketsTable).where(eq(issuedTicketsTable.qr_token, qr_token));

    if (!ticket) {
      await db.insert(doorCheckinsTable).values({ ticket_id: "00000000-0000-0000-0000-000000000000" as any, event_slug: "unknown", qr_token, result: "invalid", scanned_by: pu.clerk_user_id, gate: gate ?? null, device_info: req.headers["user-agent"] ?? null });
      return res.status(404).json({ result: "invalid", message: "Ticket not found" });
    }

    // Verify the ticket belongs to an event this promoter owns
    const [cfg] = await db.select({ promoter_id: eventTicketingTable.promoter_id })
      .from(eventTicketingTable).where(eq(eventTicketingTable.event_slug, ticket.event_slug));
    if (!cfg || cfg.promoter_id !== pu.promoter_id) {
      return res.status(403).json({ error: "Not your event" });
    }

    let result: string;
    if (ticket.status === "checked_in") {
      result = "already_checked_in";
    } else if (ticket.status === "refunded") {
      result = "refunded";
    } else if (ticket.status === "transferred" || ticket.status === "transfer_pending") {
      result = "transferred";
    } else if (ticket.status === "voided") {
      result = "voided";
    } else {
      result = "ok";
      await db.update(issuedTicketsTable).set({
        status: "checked_in",
        checked_in_at: new Date(),
        checked_in_by: pu.clerk_user_id,
        check_in_gate: gate ?? "Main",
        updated_at: new Date(),
      }).where(eq(issuedTicketsTable.id, ticket.id));
    }

    await db.insert(doorCheckinsTable).values({
      ticket_id: ticket.id,
      event_slug: ticket.event_slug,
      qr_token,
      result,
      scanned_by: pu.clerk_user_id,
      gate: gate ?? "Main",
      device_info: req.headers["user-agent"] ?? null,
    });

    res.json({ result, ticket: { ...ticket, status: result === "ok" ? "checked_in" : ticket.status } });
  } catch (e: any) {
    logger.error(e, "checkin error");
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ticketing/promoter/events — list all events this promoter has configured
router.get("/promoter/events", requireClerkAuth, requirePromoterRole, async (req: any, res) => {
  try {
    const pu = req.promoterUser;
    const configs = await db.select().from(eventTicketingTable)
      .where(eq(eventTicketingTable.promoter_id, pu.promoter_id))
      .orderBy(desc(eventTicketingTable.created_at));

    const slugs = configs.map(c => c.event_slug);
    const events = slugs.length > 0
      ? await db.select().from(eventsTable).where(inArray(eventsTable.slug, slugs))
      : [];

    const evMap = new Map(events.map(e => [e.slug, e]));
    const enriched = configs.map(c => ({ config: c, event: evMap.get(c.event_slug) ?? null }));
    res.json({ events: enriched });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});



// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES (x-admin-password)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/ticketing/admin/applications
router.get("/admin/applications", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = db.select().from(promoterApplicationsTable).orderBy(desc(promoterApplicationsTable.created_at)) as any;
    if (status) {
      query = db.select().from(promoterApplicationsTable)
        .where(eq(promoterApplicationsTable.status, status as string))
        .orderBy(desc(promoterApplicationsTable.created_at));
    }
    res.json({ applications: await query });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/admin/applications/:id/approve
router.post("/admin/applications/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { clerk_user_id, promoter_slug } = req.body;
    const [app] = await db.select().from(promoterApplicationsTable)
      .where(eq(promoterApplicationsTable.id, req.params.id));
    if (!app) return res.status(404).json({ error: "Application not found" });

    // Create or find promoter record
    let promoterId: string;
    const slug = promoter_slug ?? app.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await db.select({ id: promotersTable.id }).from(promotersTable)
      .where(eq(promotersTable.slug, slug)).limit(1);

    if (existing.length) {
      promoterId = existing[0].id;
    } else {
      const [newPromoter] = await db.insert(promotersTable).values({
        slug,
        name: app.name,
        city: app.city ?? null,
        cities: app.city ? [app.city] : [],
        genres: app.genres ?? [],
        instagram: app.instagram ?? null,
        website: app.website ?? null,
        booking_email: app.email,
        trusted: true,
        status: "active",
      }).returning();
      promoterId = newPromoter.id;
    }

    // Link Clerk user to promoter (if clerk_user_id provided)
    if (clerk_user_id) {
      await db.insert(promoterUsersTable).values({
        clerk_user_id,
        promoter_id: promoterId,
        email: app.email,
        display_name: app.name,
        role: "owner",
      }).onConflictDoNothing();
    }

    await db.update(promoterApplicationsTable).set({
      status: "approved",
      reviewed_at: new Date(),
      linked_promoter_id: promoterId,
    }).where(eq(promoterApplicationsTable.id, req.params.id));

    res.json({ ok: true, promoter_id: promoterId });
  } catch (e: any) {
    logger.error(e, "admin approve application error");
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/admin/applications/:id/reject
router.post("/admin/applications/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { notes } = req.body;
    await db.update(promoterApplicationsTable).set({
      status: "rejected",
      reviewed_at: new Date(),
      notes: notes ?? null,
    }).where(eq(promoterApplicationsTable.id, req.params.id));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/admin/promoter-users — manually link a Clerk user to a promoter
router.post("/admin/promoter-users", requireAdmin, async (req, res) => {
  try {
    const { clerk_user_id, promoter_id, email, display_name, role } = req.body;
    if (!clerk_user_id || !promoter_id) return res.status(400).json({ error: "clerk_user_id and promoter_id required" });
    const [row] = await db.insert(promoterUsersTable).values({
      clerk_user_id, promoter_id, email, display_name, role: role ?? "owner",
    }).onConflictDoNothing().returning();
    res.json({ ok: true, row });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ticketing/admin/orders
router.get("/admin/orders", requireAdmin, async (req, res) => {
  try {
    const { event_slug, status, limit = "100" } = req.query;
    let q = db.select().from(ticketOrdersTable).orderBy(desc(ticketOrdersTable.created_at)).limit(parseInt(limit as string)) as any;
    if (event_slug) q = db.select().from(ticketOrdersTable)
      .where(eq(ticketOrdersTable.event_slug, event_slug as string))
      .orderBy(desc(ticketOrdersTable.created_at)).limit(parseInt(limit as string));
    else if (status) q = db.select().from(ticketOrdersTable)
      .where(eq(ticketOrdersTable.status, status as string))
      .orderBy(desc(ticketOrdersTable.created_at)).limit(parseInt(limit as string));

    const orders = await q;
    res.json({ orders });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ticketing/admin/orders/:id/refund
router.post("/admin/orders/:id/refund", requireAdmin, async (req, res) => {
  try {
    const [order] = await db.select().from(ticketOrdersTable).where(eq(ticketOrdersTable.id, req.params.id));
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "paid") return res.status(400).json({ error: `Order status is ${order.status}, not paid` });
    if (!order.razorpay_payment_id) return res.status(400).json({ error: "No Razorpay payment ID on order" });

    const refund = await refundRazorpayPayment(order.razorpay_payment_id) as any;

    await db.update(ticketOrdersTable).set({
      status: "refunded",
      razorpay_refund_id: refund.id,
      refunded_at: new Date(),
      updated_at: new Date(),
    }).where(eq(ticketOrdersTable.id, req.params.id));

    // Void all issued tickets for this order
    await db.update(issuedTicketsTable)
      .set({ status: "refunded", updated_at: new Date() })
      .where(eq(issuedTicketsTable.order_id, req.params.id));

    res.json({ ok: true, refund_id: refund.id });
  } catch (e: any) {
    logger.error(e, "admin refund error");
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ticketing/admin/revenue — global revenue summary
router.get("/admin/revenue", requireAdmin, async (req, res) => {
  try {
    const orders = await db.select().from(ticketOrdersTable)
      .where(eq(ticketOrdersTable.status, "paid"))
      .orderBy(desc(ticketOrdersTable.paid_at));

    const gross = orders.reduce((a, o) => a + o.subtotal_paise, 0);
    const buyerFees = orders.reduce((a, o) => a + o.buyer_fee_paise, 0);
    const promoterFees = orders.reduce((a, o) => a + o.promoter_fee_paise, 0);
    const ccdRevenue = buyerFees + promoterFees;

    // Per-event breakdown
    const byEvent: Record<string, { count: number; gross_paise: number; ccd_paise: number }> = {};
    for (const o of orders) {
      if (!byEvent[o.event_slug]) byEvent[o.event_slug] = { count: 0, gross_paise: 0, ccd_paise: 0 };
      byEvent[o.event_slug].count++;
      byEvent[o.event_slug].gross_paise += o.subtotal_paise;
      byEvent[o.event_slug].ccd_paise += o.buyer_fee_paise + o.promoter_fee_paise;
    }

    res.json({
      total_orders: orders.length,
      gross_inr: gross / 100,
      buyer_fees_inr: buyerFees / 100,
      promoter_fees_inr: promoterFees / 100,
      ccd_revenue_inr: ccdRevenue / 100,
      by_event: byEvent,
      recent_orders: orders.slice(0, 20),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ticketing/admin/checkins/:slug — door audit for an event
router.get("/admin/checkins/:slug", requireAdmin, async (req, res) => {
  try {
    const checkins = await db.select().from(doorCheckinsTable)
      .where(eq(doorCheckinsTable.event_slug, req.params.slug))
      .orderBy(desc(doorCheckinsTable.created_at));
    const tickets = await db.select().from(issuedTicketsTable)
      .where(eq(issuedTicketsTable.event_slug, req.params.slug));
    const checkedIn = tickets.filter(t => t.status === "checked_in").length;
    res.json({ checkins, tickets, stats: { total: tickets.length, checked_in: checkedIn, remaining: tickets.length - checkedIn } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
