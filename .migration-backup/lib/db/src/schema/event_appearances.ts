import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Links artists to specific events (curated_events or manual entries).
 * Powers the knowledge graph — "who played where with whom".
 */
export const eventAppearancesTable = pgTable("event_appearances", {
  id: uuid("id").primaryKey().defaultRandom(),
  artist_id:    text("artist_id").notNull(),          // FK → artists.id
  artist_slug:  text("artist_slug").notNull(),
  artist_name:  text("artist_name").notNull(),
  event_name:   text("event_name").notNull(),
  venue:        text("venue"),
  city:         text("city"),
  event_date:   text("event_date"),                   // ISO date string
  year:         integer("year"),
  role:         text("role").notNull().default("performer"), // performer | headliner | b2b | support
  source:       text("source").notNull().default("manual"),  // manual | district | insider | highape | scraped
  curated_event_id: text("curated_event_id"),         // optional FK → curated_events.id
  created_at:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventAppearanceSchema = createInsertSchema(eventAppearancesTable).omit({ id: true, created_at: true });
export type InsertEventAppearance = z.infer<typeof insertEventAppearanceSchema>;
export type EventAppearance = typeof eventAppearancesTable.$inferSelect;
