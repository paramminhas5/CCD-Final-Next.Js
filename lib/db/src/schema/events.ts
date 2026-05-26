import { pgTable, text, integer, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  city: text("city").notNull(),
  venue: text("venue").notNull(),
  blurb: text("blurb").notNull().default(""),
  lineup: jsonb("lineup").notNull().default([]),
  media: jsonb("media").notNull().default([]),
  poster_url: text("poster_url"),
  sort_order: integer("sort_order").notNull().default(0),
  status: text("status").notNull().default("upcoming"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
