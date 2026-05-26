import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Venue profiles — capacity, genre focus, city.
 * Powers venue affinity on artist pages + event cards.
 */
export const venueProfilesTable = pgTable("venue_profiles", {
  id:           uuid("id").primaryKey().defaultRandom(),
  slug:         text("slug").notNull().unique(),
  name:         text("name").notNull(),
  city:         text("city").notNull(),
  capacity:     integer("capacity"),                          // rough headcount
  genre_focus:  text("genre_focus").array().notNull().default([]), // primary genres
  description:  text("description"),
  tier:         text("tier").notNull().default("club"),        // basement | club | festival | arena | cultural
  instagram:    text("instagram"),
  website:      text("website"),
  address:      text("address"),
  is_verified:  boolean("is_verified").notNull().default(false),
  metadata:     jsonb("metadata").notNull().default({}),       // promoters, notable nights, etc.
  created_at:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at:   timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVenueProfileSchema = createInsertSchema(venueProfilesTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertVenueProfile = z.infer<typeof insertVenueProfileSchema>;
export type VenueProfile = typeof venueProfilesTable.$inferSelect;
