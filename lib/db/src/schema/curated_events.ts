import { pgTable, text, boolean, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const curatedEventsTable = pgTable("curated_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: text("source").notNull(),
  city: text("city"),
  venue: text("venue"),
  event_date: text("event_date"),
  event_time: text("event_time"),
  blurb: text("blurb"),
  genre: jsonb("genre").notNull().default([]),
  image_url: text("image_url"),
  is_featured: boolean("is_featured").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCuratedEventSchema = createInsertSchema(curatedEventsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertCuratedEvent = z.infer<typeof insertCuratedEventSchema>;
export type CuratedEvent = typeof curatedEventsTable.$inferSelect;
