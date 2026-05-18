import { pgTable, text, boolean, integer, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const artistsTable = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  based_city: text("based_city"),
  from_city: text("from_city"),
  bio: text("bio"),
  why: text("why"),
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
  fee_min_inr: integer("fee_min_inr"),
  fee_max_inr: integer("fee_max_inr"),
  fee_currency: text("fee_currency").notNull().default("INR"),
  open_to_bookings: boolean("open_to_bookings").notNull().default(true),
  available_cities: text("available_cities").array().notNull().default([]),
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull().default("pending"),
  source: text("source").notNull().default("manual"),
  claimed_by: text("claimed_by"),
  claim_requested_at: timestamp("claim_requested_at", { withTimezone: true }),
  gallery: jsonb("gallery").notNull().default([]),
  videos: jsonb("videos").notNull().default([]),
  enrichment_status: text("enrichment_status").notNull().default("pending"),
  enrichment_log: jsonb("enrichment_log").notNull().default({}),
  enriched_at: timestamp("enriched_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArtistSchema = createInsertSchema(artistsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artistsTable.$inferSelect;
