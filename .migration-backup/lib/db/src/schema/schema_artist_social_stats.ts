import { pgTable, text, integer, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Social media and streaming stats for artists, tracked over time.
 * Powers the "stats journey" and growth charts on artist pages.
 */
export const artistSocialStatsTable = pgTable("artist_social_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  artist_id: text("artist_id").notNull(), // FK → artists.id
  artist_slug: text("artist_slug").notNull(),

  // Instagram
  instagram_followers: integer("instagram_followers"),
  instagram_following: integer("instagram_following"),
  instagram_posts: integer("instagram_posts"),

  // SoundCloud
  soundcloud_followers: integer("soundcloud_followers"),
  soundcloud_tracks: integer("soundcloud_tracks"),
  soundcloud_plays: integer("soundcloud_plays"),

  // Spotify
  spotify_monthly_listeners: integer("spotify_monthly_listeners"),
  spotify_followers: integer("spotify_followers"),

  // YouTube
  youtube_subscribers: integer("youtube_subscribers"),
  youtube_videos: integer("youtube_videos"),
  youtube_views: integer("youtube_views"),

  // Bandcamp
  bandcamp_releases: integer("bandcamp_releases"),

  // Raw data snapshot
  raw_data: jsonb("raw_data").notNull().default({}),

  // Tracking
  source: text("source").notNull().default("api"), // api | manual | scraped
  captured_at: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArtistSocialStatsSchema = createInsertSchema(artistSocialStatsTable).omit({ id: true, captured_at: true });
export type InsertArtistSocialStats = z.infer<typeof insertArtistSocialStatsSchema>;
export type ArtistSocialStats = typeof artistSocialStatsTable.$inferSelect;
