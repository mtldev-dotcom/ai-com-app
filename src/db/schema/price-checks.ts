import { pgTable, text, timestamp, uuid, numeric } from "drizzle-orm/pg-core";
import { productsDraft } from "./products-draft";

/**
 * Price Checks table
 * Tracks price monitoring checks and margin deltas
 * Used by monitoring jobs to detect price changes and margin violations
 */
export const priceChecks = pgTable("price_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  productDraftId: uuid("product_draft_id")
    .notNull()
    .references(() => productsDraft.id, { onDelete: "cascade" }),
  supplierPriceAmount: numeric("supplier_price_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  supplierPriceCurrency: text("supplier_price_currency").notNull(), // e.g., "CAD", "USD"
  sellingPriceAmount: numeric("selling_price_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  sellingPriceCurrency: text("selling_price_currency").notNull(),
  marginPct: numeric("margin_pct", { precision: 5, scale: 2 }).notNull(), // Calculated margin
  deltaPct: numeric("delta_pct", { precision: 5, scale: 2 }), // Delta from target margin
  observedAt: timestamp("observed_at").notNull().defaultNow(),
});

export type PriceCheck = typeof priceChecks.$inferSelect;
export type NewPriceCheck = typeof priceChecks.$inferInsert;
