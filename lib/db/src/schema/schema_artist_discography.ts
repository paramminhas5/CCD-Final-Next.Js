import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Artist discography — releases, features, remixes, labels.
 */
export const artistDiscographyTable = pgTable("artist_discography", {
  id: uuid("id").primaryKey().defaultRandom(),
  artist_id: text("artist_id").notNull(),
  artist_slug: text("artist_slug").notNull(),

  title: text("title").notNull(),
  release_type: text("release_type").notNull(), // single | ep | album | remix | feature | compilation

  // Release info
  release_date: text("release_date"), // ISO date
  year: integer("year"),
  label: text("label"),
  catalog_number: text("catalog_number"),

  // Streaming links
  spotify_url: text("spotify_url"),
  soundcloud_url: text("soundcloud_url"),
  bandcamp_url: text("bandcamp_url"),
  youtube_url: text("youtube_url"),

  // Collaborators
  featured_artists: text("featured_artists").array().notNull().default([]),
  remix_artists: text("remix_artists").array().notNull().default([]),

  // Metadata
  genre_tags: text("genre_tags").array().notNull().default([]),
  artwork_url: text("artwork_url"),
  description: text("description"),

  // Source tracking
  source: text("source").notNull().default("manual"), // manual | discogs | spotify | bandcamp
  external_id: text("external_id"), // Discogs ID, Spotify ID, etc.
  raw_data: jsonb("raw_data").notNull().default({}),

  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArtistDiscographySchema = createInsertSchema(artistDiscographyTable).omit({ id: true, created_at: true });
export type InsertArtistDiscography = z.infer<typeof insertArtistDiscographySchema>;
export type ArtistDiscography = typeof artistDiscographyTable.$inferSelect;
