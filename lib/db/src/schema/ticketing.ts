/**
 * CCD Ticketing Module — DB Schema
 *
 * Tables:
 *   promoter_users        — links Clerk user IDs to promoter profiles
 *   promoter_applications — promoter sign-up applications (replaces contact_messages hack)
 *   ticket_tiers          — per-event ticket tiers (GA, VIP, Early Bird, etc.)
 *   ticket_orders         — one row per checkout session
 *   ticket_order_items    — line items inside an order (tier × qty)
 *   issued_tickets        — individual QR tickets
 *   ticket_transfers      — face-value transfer log
 *   door_checkins         — door scan audit log
 *
 * Events table is extended via ALTER-style additions modelled here as
 * a companion table so we don't break the existing events schema.
 * The ticketing_settings table carries per-event ticketing config.
 */

import {
  pgTable,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  uuid,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const ticketingModeEnum = pgEnum("ticketing_mode", [
  "free_rsvp",       // existing RSVP flow, no payment
  "rsvp_invite",     // RSVP → promoter approves → sends payment link
  "direct_sale",     // fans buy immediately (no approval step)
]);

export const tierStatusEnum = pgEnum("tier_status", [
  "active",
  "sold_out",
  "paused",
  "scheduled",   // not yet on sale (before sale_start)
  "ended",       // past sale_end
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",    // Razorpay order created, awaiting payment
  "paid",       // payment captured
  "failed",     // payment failed or abandoned
  "refunded",   // full refund issued
  "partially_refunded",
  "complimentary", // free / comp ticket (no payment needed)
]);

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",   // awaiting promoter decision
  "approved",  // promoter approved, payment link sent
  "declined",  // promoter declined
  "paid",      // payment confirmed — has issued tickets
  "expired",   // payment link expired without payment
  "cancelled", // fan cancelled
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "issued",        // valid, not yet scanned
  "checked_in",    // scanned at door
  "refunded",      // money returned
  "transferred",   // original ticket, replaced by transfer_child
  "transfer_pending", // awaiting recipient confirmation
  "voided",
]);

export const transferStatusEnum = pgEnum("transfer_status", [
  "pending",   // waiting for recipient to claim
  "accepted",  // recipient claimed ticket
  "cancelled", // sender cancelled transfer
  "expired",   // link expired
]);

// ─── Promoter Users (Clerk ↔ promoter profile link) ───────────────────────────
//
// Auth tiers (all work independently):
//   Tier 1 — access_token (UUID, generated on approval, shown in admin panel)
//             → paste into promoter dashboard, no account needed
//   Tier 2 — x-admin-password header (for door check-in from admin devices)
//   Tier 3 — Clerk session (full user accounts, optional)

export const promoterUsersTable = pgTable("promoter_users", {
  id:            uuid("id").primaryKey().defaultRandom(),
  clerk_user_id: text("clerk_user_id").unique(),   // optional — only set when Clerk is configured
  promoter_id:   uuid("promoter_id").notNull(),    // FK → promoters.id
  email:         text("email").notNull(),
  display_name:  text("display_name"),
  role:          text("role").notNull().default("owner"), // owner | manager | door_staff
  // Simple token auth — generated on promoter approval, admin copies it to promoter
  // Works without Clerk. Treated like a long-lived API key (regeneratable by admin).
  access_token:  text("access_token").unique(),
  created_at:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Promoter Applications ────────────────────────────────────────────────────

export const promoterApplicationsTable = pgTable("promoter_applications", {
  id:           uuid("id").primaryKey().defaultRandom(),
  name:         text("name").notNull(),
  email:        text("email").notNull(),
  instagram:    text("instagram"),
  website:      text("website"),
  city:         text("city"),
  genres:       text("genres").array().notNull().default([]),
  bio:          text("bio"),
  sample_event: text("sample_event"),
  // reviewer fields
  status:       text("status").notNull().default("pending"), // pending | approved | rejected
  reviewed_by:  text("reviewed_by"),  // admin user identifier
  reviewed_at:  timestamp("reviewed_at", { withTimezone: true }),
  notes:        text("notes"),        // reviewer notes
  // on approval: the promoter_id that was created/linked
  linked_promoter_id: uuid("linked_promoter_id"),
  user_agent:   text("user_agent"),
  created_at:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Event Ticketing Settings ─────────────────────────────────────────────────
// Companion to events table — one row per event that has ticketing enabled.

export const eventTicketingTable = pgTable("event_ticketing", {
  id:               uuid("id").primaryKey().defaultRandom(),
  event_slug:       text("event_slug").notNull().unique(), // FK → events.slug
  promoter_id:      uuid("promoter_id"),                  // FK → promoters.id
  promoter_clerk_id: text("promoter_clerk_id"),           // Clerk user who owns this

  // Mode
  ticketing_mode:   text("ticketing_mode").notNull().default("free_rsvp"),
  is_free:          boolean("is_free").notNull().default(false), // toggle: free tickets (no payment, just reservation)

  // Commission (5% default both sides, can override per event)
  commission_pct:   numeric("commission_pct", { precision: 5, scale: 2 }).notNull().default("5.00"),
  commission_on_buyer: boolean("commission_on_buyer").notNull().default(true),
  commission_on_promoter: boolean("commission_on_promoter").notNull().default(true),

  // Payout
  razorpay_account_id: text("razorpay_account_id"),  // promoter's linked Razorpay account for Routes

  // Caps
  total_capacity:   integer("total_capacity"),
  rsvp_cap:         integer("rsvp_cap"),              // max RSVPs before closing list

  // Dates
  sale_start:       timestamp("sale_start", { withTimezone: true }),
  sale_end:         timestamp("sale_end", { withTimezone: true }),

  // Flags
  show_capacity:    boolean("show_capacity").notNull().default(true),
  require_phone:    boolean("require_phone").notNull().default(false),
  age_restriction:  integer("age_restriction"),        // e.g. 21
  allow_transfers:  boolean("allow_transfers").notNull().default(true),
  max_tickets_per_order: integer("max_tickets_per_order").notNull().default(4),

  // Payment link expiry hours (for rsvp_invite mode)
  payment_link_expiry_hours: integer("payment_link_expiry_hours").notNull().default(48),

  // Soft-launch: event exists but URL not indexed
  is_soft_launch:   boolean("is_soft_launch").notNull().default(false),

  // Metadata
  custom_confirmation_msg: text("custom_confirmation_msg"),
  created_at:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Ticket Tiers ─────────────────────────────────────────────────────────────

export const ticketTiersTable = pgTable("ticket_tiers", {
  id:            uuid("id").primaryKey().defaultRandom(),
  event_slug:    text("event_slug").notNull(), // FK → events.slug
  event_ticketing_id: uuid("event_ticketing_id"), // FK → event_ticketing.id

  name:          text("name").notNull(),        // "General Admission", "VIP", "Early Bird"
  description:   text("description"),
  price_inr:     integer("price_inr").notNull().default(0), // in INR (paise × 100 for Razorpay)
  is_free:       boolean("is_free").notNull().default(false),

  capacity:      integer("capacity"),           // null = unlimited
  sold:          integer("sold").notNull().default(0),
  reserved:      integer("reserved").notNull().default(0), // pending payment

  // Per-order cap
  max_per_order: integer("max_per_order").notNull().default(4),

  // Sale window
  sale_start:    timestamp("sale_start", { withTimezone: true }),
  sale_end:      timestamp("sale_end", { withTimezone: true }),

  // Sorting / visibility
  sort_order:    integer("sort_order").notNull().default(0),
  is_hidden:     boolean("is_hidden").notNull().default(false),
  is_comp:       boolean("is_comp").notNull().default(false), // press/guest comps

  status:        text("status").notNull().default("active"),

  created_at:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Ticket Orders ────────────────────────────────────────────────────────────

export const ticketOrdersTable = pgTable("ticket_orders", {
  id:               uuid("id").primaryKey().defaultRandom(),
  event_slug:       text("event_slug").notNull(),
  promoter_id:      uuid("promoter_id"),

  // Buyer
  buyer_name:       text("buyer_name").notNull(),
  buyer_email:      text("buyer_email").notNull(),
  buyer_phone:      text("buyer_phone"),
  buyer_clerk_id:   text("buyer_clerk_id"), // if logged in

  // Financials (all in INR paise for Razorpay, display in ₹)
  subtotal_paise:   integer("subtotal_paise").notNull().default(0),
  buyer_fee_paise:  integer("buyer_fee_paise").notNull().default(0),   // 5% added to buyer
  promoter_fee_paise: integer("promoter_fee_paise").notNull().default(0), // 5% deducted from promoter payout
  total_paise:      integer("total_paise").notNull().default(0),        // buyer pays subtotal + buyer_fee

  // Razorpay
  razorpay_order_id:    text("razorpay_order_id").unique(),
  razorpay_payment_id:  text("razorpay_payment_id"),
  razorpay_signature:   text("razorpay_signature"),
  razorpay_refund_id:   text("razorpay_refund_id"),

  status:           text("status").notNull().default("pending"),

  // RSVP link — if this order came from an approved RSVP
  rsvp_id:          uuid("rsvp_id"),

  // Payment link (for rsvp_invite mode)
  payment_link_token: text("payment_link_token").unique(),
  payment_link_expires_at: timestamp("payment_link_expires_at", { withTimezone: true }),

  // Misc
  source:           text("source").notNull().default("web"),  // web | door | comp
  notes:            text("notes"),
  metadata:         jsonb("metadata").notNull().default({}),

  created_at:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at:       timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  paid_at:          timestamp("paid_at", { withTimezone: true }),
  refunded_at:      timestamp("refunded_at", { withTimezone: true }),
});

// ─── Order Line Items ─────────────────────────────────────────────────────────

export const ticketOrderItemsTable = pgTable("ticket_order_items", {
  id:          uuid("id").primaryKey().defaultRandom(),
  order_id:    uuid("order_id").notNull(), // FK → ticket_orders.id
  tier_id:     uuid("tier_id").notNull(),  // FK → ticket_tiers.id
  tier_name:   text("tier_name").notNull(), // snapshot at time of purchase
  quantity:    integer("quantity").notNull().default(1),
  unit_price_paise: integer("unit_price_paise").notNull().default(0),
  total_paise: integer("total_paise").notNull().default(0),
  created_at:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Issued Tickets (individual QR tickets) ───────────────────────────────────

export const issuedTicketsTable = pgTable("issued_tickets", {
  id:            uuid("id").primaryKey().defaultRandom(),
  order_id:      uuid("order_id").notNull(),        // FK → ticket_orders.id
  tier_id:       uuid("tier_id").notNull(),          // FK → ticket_tiers.id
  event_slug:    text("event_slug").notNull(),

  // QR token — random UUID used as the QR code value
  qr_token:      text("qr_token").notNull().unique(),

  // Holder (may differ from buyer for transfers)
  holder_name:   text("holder_name").notNull(),
  holder_email:  text("holder_email").notNull(),
  holder_phone:  text("holder_phone"),
  holder_clerk_id: text("holder_clerk_id"),

  // Original buyer (immutable)
  buyer_name:    text("buyer_name").notNull(),
  buyer_email:   text("buyer_email").notNull(),

  status:        text("status").notNull().default("issued"),

  // Check-in
  checked_in_at: timestamp("checked_in_at", { withTimezone: true }),
  checked_in_by: text("checked_in_by"),    // staff clerk_id or "door_staff"
  check_in_gate: text("check_in_gate"),    // "Main", "VIP", etc.

  // Transfer chain
  transfer_from_ticket_id: uuid("transfer_from_ticket_id"), // null = original
  transfer_count: integer("transfer_count").notNull().default(0),

  // Metadata snapshot
  tier_name:     text("tier_name").notNull(),
  event_title:   text("event_title"),
  event_date:    text("event_date"),
  event_venue:   text("event_venue"),

  created_at:    timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at:    timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Ticket Transfers ─────────────────────────────────────────────────────────

export const ticketTransfersTable = pgTable("ticket_transfers", {
  id:               uuid("id").primaryKey().defaultRandom(),
  ticket_id:        uuid("ticket_id").notNull(),       // FK → issued_tickets.id
  from_holder_email: text("from_holder_email").notNull(),
  from_holder_name:  text("from_holder_name").notNull(),

  // Recipient
  to_email:         text("to_email").notNull(),
  to_name:          text("to_name"),

  // Claim token (sent in email to recipient)
  claim_token:      text("claim_token").notNull().unique(),
  claim_expires_at: timestamp("claim_expires_at", { withTimezone: true }).notNull(),

  status:           text("status").notNull().default("pending"),

  // New ticket created on acceptance
  new_ticket_id:    uuid("new_ticket_id"),

  claimed_at:       timestamp("claimed_at", { withTimezone: true }),
  created_at:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Door Check-ins Audit Log ─────────────────────────────────────────────────

export const doorCheckinsTable = pgTable("door_checkins", {
  id:           uuid("id").primaryKey().defaultRandom(),
  ticket_id:    uuid("ticket_id").notNull(),  // FK → issued_tickets.id
  event_slug:   text("event_slug").notNull(),
  qr_token:     text("qr_token").notNull(),

  result:       text("result").notNull(), // "ok" | "already_checked_in" | "invalid" | "refunded" | "transferred"
  scanned_by:   text("scanned_by"),       // clerk_user_id or device identifier
  gate:         text("gate"),             // "Main Door" | "VIP" | etc.
  device_info:  text("device_info"),

  created_at:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Extended RSVP table ──────────────────────────────────────────────────────
// Extends event_rsvps with ticketing-specific fields.
// We add these as a companion table rather than altering the existing one
// to avoid breaking migrations.

export const rsvpExtensionsTable = pgTable("rsvp_extensions", {
  id:              uuid("id").primaryKey().defaultRandom(),
  rsvp_id:         uuid("rsvp_id").notNull().unique(), // FK → event_rsvps.id (uuid cast)
  event_slug:      text("event_slug").notNull(),

  status:          text("status").notNull().default("pending"), // rsvp_status enum values
  phone:           text("phone"),
  tier_preference: uuid("tier_preference"), // requested tier

  // Promoter decision
  approved_by:     text("approved_by"),
  approved_at:     timestamp("approved_at", { withTimezone: true }),
  declined_reason: text("declined_reason"),

  // Payment link (sent after approval)
  order_id:        uuid("order_id"), // FK → ticket_orders.id (created on approval)
  payment_link_sent_at: timestamp("payment_link_sent_at", { withTimezone: true }),

  created_at:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Zod schemas for insert ───────────────────────────────────────────────────

export const insertPromoterApplicationSchema = createInsertSchema(promoterApplicationsTable).omit({ id: true, created_at: true });
export type InsertPromoterApplication = z.infer<typeof insertPromoterApplicationSchema>;
export type PromoterApplication = typeof promoterApplicationsTable.$inferSelect;

export const insertEventTicketingSchema = createInsertSchema(eventTicketingTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertEventTicketing = z.infer<typeof insertEventTicketingSchema>;
export type EventTicketing = typeof eventTicketingTable.$inferSelect;

export const insertTicketTierSchema = createInsertSchema(ticketTiersTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertTicketTier = z.infer<typeof insertTicketTierSchema>;
export type TicketTier = typeof ticketTiersTable.$inferSelect;

export const insertTicketOrderSchema = createInsertSchema(ticketOrdersTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertTicketOrder = z.infer<typeof insertTicketOrderSchema>;
export type TicketOrder = typeof ticketOrdersTable.$inferSelect;

export const insertIssuedTicketSchema = createInsertSchema(issuedTicketsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertIssuedTicket = z.infer<typeof insertIssuedTicketSchema>;
export type IssuedTicket = typeof issuedTicketsTable.$inferSelect;

export const insertTicketTransferSchema = createInsertSchema(ticketTransfersTable).omit({ id: true, created_at: true });
export type InsertTicketTransfer = z.infer<typeof insertTicketTransferSchema>;
export type TicketTransfer = typeof ticketTransfersTable.$inferSelect;

export const insertDoorCheckinSchema = createInsertSchema(doorCheckinsTable).omit({ id: true, created_at: true });
export type InsertDoorCheckin = z.infer<typeof insertDoorCheckinSchema>;
export type DoorCheckin = typeof doorCheckinsTable.$inferSelect;

export const insertPromoterUserSchema = createInsertSchema(promoterUsersTable).omit({ id: true, created_at: true });
export type InsertPromoterUser = z.infer<typeof insertPromoterUserSchema>;
export type PromoterUser = typeof promoterUsersTable.$inferSelect;
