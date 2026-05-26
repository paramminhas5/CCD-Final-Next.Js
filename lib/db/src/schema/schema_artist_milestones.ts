import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Auto-generated and manually curated artist milestones.
 * Powers the "journey" timeline and cool facts.
 */
export const artistMilestonesTable = pgTable("artist_milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  artist_id: text("artist_id").notNull(),
  artist_slug: text("artist_slug").notNull(),

  date: text("date").notNull(), // ISO date string
  year: integer("year"),

  type: text("type").notNull(), // first_gig | festival_debut | label_signing | release | milestone_followers | tour | b2b | residency | award | radio_show

  title: text("title").notNull(),
  description: text("description"),

  // Related entities
  venue: text("venue"),
  city: text("city"),
  event_name: text("event_name"),
  related_artist_slug: text("related_artist_slug"),
  related_artist_name: text("related_artist_name"),

  // Media
  image_url: text("image_url"),
  video_url: text("video_url"),

  // Source
  source: text("source").notNull().default("auto"), // auto | manual | editorial
  source_event_id: text("source_event_id"), // FK to event_appearances or artist_dates

  // Display
  importance: integer("importance").notNull().default(5), // 1-10, for sorting
  is_featured: boolean("is_featured").notNull().default(false),

  metadata: jsonb("metadata").notNull().default({}),

  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArtistMilestoneSchema = createInsertSchema(artistMilestonesTable).omit({ id: true, created_at: true });
export type InsertArtistMilestone = z.infer<typeof insertArtistMilestoneSchema>;
export type ArtistMilestone = typeof artistMilestonesTable.$inferSelect;
