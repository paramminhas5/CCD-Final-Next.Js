import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Press mentions, reviews, interviews for artists.
 * Powers the press EPK section.
 */
export const artistPressTable = pgTable("artist_press", {
  id: uuid("id").primaryKey().defaultRandom(),
  artist_id: text("artist_id").notNull(),
  artist_slug: text("artist_slug").notNull(),

  title: text("title").notNull(),
  publication: text("publication").notNull(),
  author: text("author"),

  // Content
  excerpt: text("excerpt"),
  url: text("url"),

  // Categorization
  type: text("type").notNull().default("review"), // review | interview | feature | premiere | mention | podcast
  tone: text("tone").default("positive"), // positive | neutral | critical

  // Metadata
  language: text("language").default("en"),
  country: text("country"),
  date_published: text("date_published"),

  // For EPK
  is_featured: boolean("is_featured").notNull().default(false),
  quote_for_epk: text("quote_for_epk"), // Best pull quote

  // Source
  source: text("source").notNull().default("manual"),
  raw_data: jsonb("raw_data").notNull().default({}),

  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertArtistPressSchema = createInsertSchema(artistPressTable).omit({ id: true, created_at: true });
export type InsertArtistPress = z.infer<typeof insertArtistPressSchema>;
export type ArtistPress = typeof artistPressTable.$inferSelect;
