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
 * Includes supplier fields and flexible specifications
 */
export const productsDraft = pgTable("products_draft", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id")
    .references(() => suppliers.id)
    .notNull(),
  // Bilingual titles
  titleFr: text("title_fr"),
  titleEn: text("title_en"),
  subtitle: text("subtitle"), // Product subtitle (from suppliers)
  // Bilingual descriptions
  descriptionFr: text("description_fr"),
  descriptionEn: text("description_en"),
  // SEO fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  // Images (array of URLs)
  images: jsonb("images").$type<string[]>(),
  // Pricing (all costs are stored in USD)
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull(), // Supplier cost in USD
  sellingPrice: numeric("selling_price", { precision: 10, scale: 2 }), // Calculated selling price
  margin: numeric("margin", { precision: 5, scale: 2 }), // Margin percentage
  // Product identification
  sku: text("sku"), // Stock Keeping Unit
  handle: text("handle"), // URL-friendly slug
  currency: text("currency"), // Currency code (e.g., USD, CAD)
  // Supplier identifiers (important for tracking products from suppliers)
  supplierProductId: text("supplier_product_id"), // Supplier's product ID (pid)
  supplierVariantId: text("supplier_variant_id"), // Supplier's variant ID (vid)
  marketplaceUrl: text("marketplace_url"), // URL to product on supplier's marketplace site
  // Physical attributes
  weight: numeric("weight", { precision: 10, scale: 2 }), // Weight in grams
  length: numeric("length", { precision: 10, scale: 2 }), // Length in mm
  width: numeric("width", { precision: 10, scale: 2 }), // Width in mm
  height: numeric("height", { precision: 10, scale: 2 }), // Height in mm
  material: text("material"), // Material composition
  // Shipping & Customs
  originCountry: text("origin_country"), // Country of origin (ISO code)
  hsCode: text("hs_code"), // Harmonized System customs code
  midCode: text("mid_code"), // Manufacturer ID code
  // Product organization
  type: text("type"), // Product type/category
  collectionId: text("collection_id"), // Medusa collection identifier
  categoryIds: jsonb("category_ids").$type<string[]>(), // Array of category IDs
  tags: jsonb("tags").$type<string[]>(), // Array of tags
  salesChannelIds: jsonb("sales_channel_ids").$type<string[]>(), // Array of sales channel IDs
  stockLocationIds: jsonb("stock_location_ids").$type<string[]>(), // Array of stock location IDs
  locationInventory: jsonb("location_inventory").$type<Record<string, number>>(), // Inventory quantities per location: { "locationId": quantity }
  // Specifications (JSON field for flexible specs and supplier-specific fields)
  // Stores: pid, vid, option_map_json, metadata_json, option_axes, variant_title, subtitle, thumbnail, etc.
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
