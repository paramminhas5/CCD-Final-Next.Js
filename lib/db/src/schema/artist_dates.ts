import { pgTable, text, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const artistDatesTable = pgTable("artist_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  artist_id: uuid("artist_id").notNull(),
  city: text("city").notNull(),
  venue: text("venue"),
  event_date: text("event_date").notNull(),
  event_time: text("event_time"),
  status: text("status").notNull().default("confirmed"),
  ticket_url: text("ticket_url"),
  notes: text("notes"),
  is_public: boolean("is_public").notNull().default(true),
  created_by: text("created_by").notNull().default("artist"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArtistDateSchema = createInsertSchema(artistDatesTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertArtistDate = z.infer<typeof insertArtistDateSchema>;
export type ArtistDate = typeof artistDatesTable.$inferSelect;
