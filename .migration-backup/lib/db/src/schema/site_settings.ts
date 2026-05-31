import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const siteSettingsTable = pgTable("site_settings", {
  id: text("id").primaryKey(),
  playlists: jsonb("playlists").notNull().default([]),
  featured_playlist_id: text("featured_playlist_id"),
  seo_verifications: jsonb("seo_verifications").notNull().default({}),
  marquees: jsonb("marquees").notNull().default([]),
  theme: jsonb("theme").notNull().default({}),
  home_content: jsonb("home_content").notNull().default({}),
  blog_posts: jsonb("blog_posts").notNull().default([]),
  backlinks: jsonb("backlinks").notNull().default([]),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettingsTable).omit({ updated_at: true });
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;
