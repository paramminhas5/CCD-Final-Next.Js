import { pgTable, text, boolean, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteVideosTable = pgTable("site_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  youtube_id: text("youtube_id").notNull(),
  title: text("title").notNull(),
  thumbnail_url: text("thumbnail_url"),
  is_featured: boolean("is_featured").notNull().default(false),
  sort_order: integer("sort_order").notNull().default(0),
  published_at: timestamp("published_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSiteVideoSchema = createInsertSchema(siteVideosTable).omit({ id: true, created_at: true, updated_at: true });
export type InsertSiteVideo = z.infer<typeof insertSiteVideoSchema>;
export type SiteVideo = typeof siteVideosTable.$inferSelect;
