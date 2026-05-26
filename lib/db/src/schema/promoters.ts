import { pgTable, text, boolean, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promotersTable = pgTable("promoters", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city"),
  cities: text("cities").array().notNull().default([]),
  genres: text("genres").array().notNull().default([]),
  blurb: text("blurb"),
  logo_url: text("logo_url"),
  instagram: text("instagram"),
  website: text("website"),
  booking_email: text("booking_email"),
  crawl_urls: jsonb("crawl_urls").notNull().default([]),
  trusted: boolean("trusted").notNull().default(false),
  status: text("status").notNull().default("active"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPromoterSchema = createInsertSchema(promotersTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertPromoter = z.infer<typeof insertPromoterSchema>;
export type Promoter = typeof promotersTable.$inferSelect;
