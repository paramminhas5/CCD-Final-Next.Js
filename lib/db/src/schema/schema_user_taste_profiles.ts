import { pgTable, text, timestamp, uuid, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Computed user taste profiles for recommendation engine.
 * Updated periodically from user_event_interactions.
 */
export const userTasteProfilesTable = pgTable("user_taste_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull().unique(),

  // Inferred preferences
  liked_genres: text("liked_genres").array().notNull().default([]),
  liked_artist_slugs: text("liked_artist_slugs").array().notNull().default([]),
  liked_venues: text("liked_venues").array().notNull().default([]),
  liked_cities: text("liked_cities").array().notNull().default([]),

  // Genre affinity scores (0-1)
  genre_affinity: jsonb("genre_affinity").notNull().default({}),

  // Behavior
  preferred_days: text("preferred_days").array().notNull().default([]), // fri | sat | sun | weekday
  price_sensitivity: real("price_sensitivity"), // 0 = free only, 1 = price no object
  travel_willingness: real("travel_willingness"), // 0 = home city only, 1 = will travel

  // Computed stats
  total_events_viewed: integer("total_events_viewed").notNull().default(0),
  total_events_saved: integer("total_events_saved").notNull().default(0),
  total_events_attended: integer("total_events_attended").notNull().default(0),

  // Last update
  computed_at: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),

  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserTasteProfileSchema = createInsertSchema(userTasteProfilesTable).omit({ id: true, created_at: true, computed_at: true });
export type InsertUserTasteProfile = z.infer<typeof insertUserTasteProfileSchema>;
export type UserTasteProfile = typeof userTasteProfilesTable.$inferSelect;
