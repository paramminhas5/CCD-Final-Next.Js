import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Directed graph of relationships between artists.
 * B2B pairs, shared label rosters, crew members, booker relationships.
 */
export const artistConnectionsTable = pgTable("artist_connections", {
  id:              uuid("id").primaryKey().defaultRandom(),
  artist_a_id:     text("artist_a_id").notNull(),   // FK → artists.id
  artist_a_slug:   text("artist_a_slug").notNull(),
  artist_b_id:     text("artist_b_id").notNull(),   // FK → artists.id
  artist_b_slug:   text("artist_b_slug").notNull(),
  connection_type: text("connection_type").notNull(), // b2b | label | crew | booker | collab
  strength:        integer("strength").notNull().default(1),  // 1-10, higher = stronger
  shared_events:   text("shared_events").array().notNull().default([]),  // event names in common
  shared_venues:   text("shared_venues").array().notNull().default([]),
  notes:           text("notes"),
  source:          text("source").notNull().default("manual"),
  metadata:        jsonb("metadata").notNull().default({}),
  created_at:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArtistConnectionSchema = createInsertSchema(artistConnectionsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertArtistConnection = z.infer<typeof insertArtistConnectionSchema>;
export type ArtistConnection = typeof artistConnectionsTable.$inferSelect;
