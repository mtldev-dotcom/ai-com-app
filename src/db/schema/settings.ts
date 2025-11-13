import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

/**
 * Settings table
 * Stores application settings as key-value pairs
 * Uses JSONB for flexible value storage
 */
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // e.g., "medusa_admin_url", "fx_base_currency"
  valueJsonb: jsonb("value_jsonb").$type<unknown>().notNull(), // Flexible JSON value
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
