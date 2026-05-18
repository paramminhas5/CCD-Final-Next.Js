import { pgTable, text, boolean, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingRequestsTable = pgTable("booking_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  artist_id: uuid("artist_id"),
  artist_name: text("artist_name").notNull(),
  requester_email: text("requester_email").notNull(),
  requester_phone: text("requester_phone"),
  purpose: text("purpose"),
  forward_requested: boolean("forward_requested").notNull().default(false),
  ip_hash: text("ip_hash"),
  user_agent: text("user_agent"),
  verified_at: timestamp("verified_at", { withTimezone: true }),
  revealed_at: timestamp("revealed_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bookingOtpCodesTable = pgTable("booking_otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  code_hash: text("code_hash").notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumed_at: timestamp("consumed_at", { withTimezone: true }),
  attempts: integer("attempts").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const artistSubmissionsTable = pgTable("artist_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  submitter_email: text("submitter_email").notNull(),
  submitter_role: text("submitter_role"),
  bio: text("bio"),
  from_city: text("from_city"),
  based_city: text("based_city"),
  genres: text("genres").array().notNull().default([]),
  festivals: text("festivals").array().notNull().default([]),
  instagram: text("instagram"),
  soundcloud: text("soundcloud"),
  bandcamp: text("bandcamp"),
  spotify: text("spotify"),
  website: text("website"),
  booking_email: text("booking_email"),
  manager_email: text("manager_email"),
  labels: text("labels"),
  members: text("members"),
  photo_url: text("photo_url"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingRequestSchema = createInsertSchema(bookingRequestsTable).omit({ id: true, created_at: true });
export type InsertBookingRequest = z.infer<typeof insertBookingRequestSchema>;
export type BookingRequest = typeof bookingRequestsTable.$inferSelect;

export const insertArtistSubmissionSchema = createInsertSchema(artistSubmissionsTable).omit({ id: true, created_at: true });
export type InsertArtistSubmission = z.infer<typeof insertArtistSubmissionSchema>;
export type ArtistSubmission = typeof artistSubmissionsTable.$inferSelect;
