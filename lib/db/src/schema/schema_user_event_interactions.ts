import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * User interactions with events — powers recommendation engine.
 */
export const userEventInteractionsTable = pgTable("user_event_interactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: text("user_id").notNull(), // Clerk user ID
  event_id: text("event_id").notNull(), // curated_events.id

  action: text("action").notNull(), // view | save | rsvp | share | attended | dismissed

  // Context
  city_filter: text("city_filter"),
  genre_filter: text("genre_filter"),
  source_tab: text("source_tab"), // for_you | trending | editors_picks

  // Device/session
  session_id: text("session_id"),
  device_type: text("device_type"),

  metadata: jsonb("metadata").notNull().default({}),

  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserEventInteractionSchema = createInsertSchema(userEventInteractionsTable).omit({ id: true, created_at: true });
export type InsertUserEventInteraction = z.infer<typeof insertUserEventInteractionSchema>;
export type UserEventInteraction = typeof userEventInteractionsTable.$inferSelect;
