import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactMessagesTable = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const earlyAccessSignupsTable = pgTable("early_access_signups", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  source: text("source"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventRsvpsTable = pgTable("event_rsvps", {
  id: uuid("id").primaryKey().defaultRandom(),
  event_slug: text("event_slug").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  plus_ones: integer("plus_ones").notNull().default(0),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactMessagesTable).omit({ id: true, created_at: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type ContactMessage = typeof contactMessagesTable.$inferSelect;

export const insertEarlyAccessSchema = createInsertSchema(earlyAccessSignupsTable).omit({ id: true, created_at: true });
export type InsertEarlyAccess = z.infer<typeof insertEarlyAccessSchema>;
export type EarlyAccessSignup = typeof earlyAccessSignupsTable.$inferSelect;

export const insertEventRsvpSchema = createInsertSchema(eventRsvpsTable).omit({ id: true, created_at: true });
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type EventRsvp = typeof eventRsvpsTable.$inferSelect;
