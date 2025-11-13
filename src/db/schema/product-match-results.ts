import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  index,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { productMatcherJobs } from "./product-matcher-jobs";

/**
 * Product match result status enum
 */
export const productMatchResultStatusEnum = pgEnum(
  "product_match_result_status",
  ["pending", "searching", "found", "not_found", "error"]
);

/**
 * Product Match Results table
 * Stores individual product match results for each job
 * Contains original product data and matched provider results
 */
export const productMatchResults = pgTable(
  "product_match_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .references(() => productMatcherJobs.id, { onDelete: "cascade" })
      .notNull(),
    originalProduct: jsonb("original_product").$type<{
      name: string;
      description?: string;
      price?: number;
      specs?: Record<string, string>;
      [key: string]: unknown; // Allow other fields from sheet
    }>(), // Original product data from sheet
    matches: jsonb("matches").$type<
      Array<{
        providerId: string;
        providerName: string;
        productId: string;
        title: string;
        description: string;
        price: number;
        currency: string;
        images: string[];
        shippingOrigin: string;
        estimatedDeliveryDays?: number;
        supplierUrl: string;
        specs?: Record<string, string>;
        matchScore: number; // 0-100 similarity score
        sku?: string;
        moq?: number;
        leadTimeDays?: number;
        landedCost?: {
          unitPriceUsd: number;
          shippingCostUsd: number;
          dutiesUsd: number;
          totalLandedCostUsd: number;
          currency: string;
          confidence: "low" | "medium" | "high";
          etaDays?: number;
          etaConfidence: "low" | "medium" | "high";
        };
        reliabilityScore?: number;
      }>
    >(), // Provider search results with scores
    bestMatchId: text("best_match_id"), // ID of best match from matches array
    sku: text("sku"), // Extracted SKU from best match
    landedCostValue: numeric("landed_cost_value", { precision: 18, scale: 4 }),
    landedCostCurrency: text("landed_cost_currency").default("USD"),
    etaDays: integer("eta_days"), // Estimated delivery time in days
    reliabilityScore: numeric("reliability_score", { precision: 5, scale: 2 }), // 0-100
    rankingScore: numeric("ranking_score", { precision: 7, scale: 3 }), // Composite score for sorting
    status: productMatchResultStatusEnum("status")
      .notNull()
      .default("pending"),
    error: text("error"), // Error message if search failed
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    jobIdIdx: index("product_match_results_job_id_idx").on(table.jobId),
    statusIdx: index("product_match_results_status_idx").on(table.status),
    createdAtIdx: index("product_match_results_created_at_idx").on(
      table.createdAt
    ),
    skuIdx: index("product_match_results_sku_idx").on(table.sku),
    rankingScoreIdx: index("product_match_results_ranking_score_idx").on(
      table.rankingScore
    ),
  })
);

export type ProductMatchResult = typeof productMatchResults.$inferSelect;
export type NewProductMatchResult = typeof productMatchResults.$inferInsert;

