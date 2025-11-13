import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { suppliers } from "./suppliers";

/**
 * Supplier score type enum
 * Different dimensions of supplier evaluation
 */
export const supplierScoreTypeEnum = pgEnum("supplier_score_type", [
  "quality",
  "speed",
  "support",
  "price",
  "reliability",
]);

/**
 * Supplier Scores table
 * Tracks detailed supplier ratings across multiple dimensions
 * Separated from suppliers table for historical tracking and detailed rationale
 */
export const supplierScores = pgTable(
  "supplier_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    scoreType: supplierScoreTypeEnum("score_type").notNull(),
    value: integer("value").notNull(), // Score 0-100
    rationale: text("rationale"), // Explanation for the score
    createdBy: uuid("created_by").notNull(), // User ID who created this score
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    supplierIdIdx: index("supplier_scores_supplier_id_idx").on(
      table.supplierId
    ),
  })
);

export type SupplierScore = typeof supplierScores.$inferSelect;
export type NewSupplierScore = typeof supplierScores.$inferInsert;
