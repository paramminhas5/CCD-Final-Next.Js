import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Structured artist lineups for curated events.
 * Powers "who's playing" and artist-event linking.
 */
export const eventArtistLineupsTable = pgTable("event_artist_lineups", {
  id: uuid("id").primaryKey().defaultRandom(),
  curated_event_id: text("curated_event_id").notNull(),

  // Artist info
  artist_id: text("artist_id"), // FK → artists.id (may be null if not in directory yet)
  artist_slug: text("artist_slug"),
  artist_name: text("artist_name").notNull(),

  // Role in lineup
  role: text("role").notNull().default("performer"), // headliner | performer | b2b | support | dj | live
  stage: text("stage"), // for multi-stage events
  set_time: text("set_time"),

  // Display order
  sort_order: integer("sort_order").notNull().default(0),
  is_featured: boolean("is_featured").notNull().default(false),

  // Source
  source: text("source").notNull().default("manual"), // manual | scraped | insider
  raw_data: jsonb("raw_data").notNull().default({}),

  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventArtistLineupSchema = createInsertSchema(eventArtistLineupsTable).omit({ id: true, created_at: true });
export type InsertEventArtistLineup = z.infer<typeof insertEventArtistLineupSchema>;
export type EventArtistLineup = typeof eventArtistLineupsTable.$inferSelect;
