import { pgTable, text, timestamp, uuid, numeric } from "drizzle-orm/pg-core";

/**
 * Suppliers table
 * Stores supplier information and ratings
 * Supports rating system: quality, speed, price, support
 */
export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  notes: text("notes"),
  // Ratings (1-5 scale, can be null if not rated yet)
  qualityRating: numeric("quality_rating", { precision: 3, scale: 2 }),
  speedRating: numeric("speed_rating", { precision: 3, scale: 2 }),
  priceRating: numeric("price_rating", { precision: 3, scale: 2 }),
  supportRating: numeric("support_rating", { precision: 3, scale: 2 }),
  // Average of all ratings (calculated field)
  averageRating: numeric("average_rating", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
