import { pgTable, text, uuid, integer, numeric } from "drizzle-orm/pg-core";
import { productsDraft } from "./products-draft";

/**
 * Images table
 * Stores image metadata for product drafts
 * Supports bilingual alt text (FR/EN)
 */
export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productDraftId: uuid("product_draft_id")
    .notNull()
    .references(() => productsDraft.id, { onDelete: "cascade" }),
  srcUrl: text("src_url").notNull(), // Image URL or storage key
  altEn: text("alt_en"), // English alt text
  altFr: text("alt_fr"), // French alt text
  width: integer("width"), // Image width in pixels
  height: integer("height"), // Image height in pixels
  storageKey: text("storage_key"), // Storage service key (S3, Supabase, etc.)
  sortOrder: integer("sort_order").default(0), // Order for image display
});

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
