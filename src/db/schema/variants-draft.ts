import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { productsDraft } from "./products-draft";

/**
 * Variants draft table
 * Stores product variant information (size, color, etc.)
 * Linked to products_draft table
 */
export const variantsDraft = pgTable("variants_draft", {
  id: uuid("id").primaryKey().defaultRandom(),
  productDraftId: uuid("product_draft_id")
    .references(() => productsDraft.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(), // e.g., "Size: Large", "Color: Red"
  sku: text("sku").unique(), // Stock keeping unit
  // Price adjustment from base product price
  priceAdjustment: numeric("price_adjustment", {
    precision: 10,
    scale: 2,
  }).default("0"),
  // Stock/inventory
  stock: integer("stock").default(0),
  // Variant-specific metadata (JSON for flexibility)
  metadata: text("metadata"), // JSON string for variant-specific data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type VariantDraft = typeof variantsDraft.$inferSelect;
export type NewVariantDraft = typeof variantsDraft.$inferInsert;
