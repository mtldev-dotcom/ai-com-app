import {
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { suppliers } from "./suppliers";

/**
 * Product draft status enum
 */
export const productDraftStatusEnum = pgEnum("product_draft_status", [
  "draft",
  "enriched",
  "ready",
  "published",
  "archived",
]);

/**
 * Products draft table
 * Stores product information before publication to Medusa
 * Supports bilingual content (FR/EN) for Nick a Deal
 */
export const productsDraft = pgTable("products_draft", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  // Bilingual titles
  titleFr: text("title_fr"),
  titleEn: text("title_en"),
  // Bilingual descriptions
  descriptionFr: text("description_fr"),
  descriptionEn: text("description_en"),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  // Images (array of URLs)
  images: jsonb("images").$type<string[]>(),
  // Pricing
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull(), // Supplier cost
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }), // Calculated selling price
  margin: numeric("margin", { precision: 5, scale: 2 }), // Margin percentage
  // Specifications (JSON field for flexible specs)
  specifications: jsonb("specifications").$type<Record<string, unknown>>(),
  // Status
  status: productDraftStatusEnum("status").notNull().default("draft"),
  // Medusa integration (populated after publishing)
  medusaProductId: text("medusa_product_id"),
  medusaVariantIds: jsonb("medusa_variant_ids").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductDraft = typeof productsDraft.$inferSelect;
export type NewProductDraft = typeof productsDraft.$inferInsert;
