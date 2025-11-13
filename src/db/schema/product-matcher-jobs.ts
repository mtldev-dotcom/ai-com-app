import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/**
 * Product matcher job status enum
 */
export const productMatcherJobStatusEnum = pgEnum("product_matcher_job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

/**
 * Product Matcher Jobs table
 * Tracks bulk product search jobs from spreadsheets
 * Stores configuration, progress, and status
 */
export const productMatcherJobs = pgTable(
  "product_matcher_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(), // References Supabase auth.users.id
    name: text("name").notNull(), // User-friendly job name
    sheetUrl: text("sheet_url"), // Original Google Sheet or CSV URL
    sheetData: jsonb("sheet_data").$type<
      Array<Record<string, string | number>>
    >(), // Parsed product list from sheet
    providers: jsonb("providers").$type<string[]>(), // ["cj", "web"]
    criteria: jsonb("criteria").$type<{
      shippingOrigin?: string[];
      maxDeliveryDays?: number;
      priceRange?: { min?: number; max?: number };
      currency?: string;
      maxResults?: number; // 1-200
      minMoq?: number;
      maxMoq?: number;
      maxShippingCost?: number;
      shipFrom?: string; // Country code
      shipTo?: string; // Country code
    }>(), // Search criteria configuration
    status: productMatcherJobStatusEnum("status")
      .notNull()
      .default("pending"),
    progress: jsonb("progress").$type<{
      processed: number;
      total: number;
    }>(), // Progress tracking
    error: text("error"), // Error message if failed
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("product_matcher_jobs_user_id_idx").on(table.userId),
    statusIdx: index("product_matcher_jobs_status_idx").on(table.status),
    createdAtIdx: index("product_matcher_jobs_created_at_idx").on(
      table.createdAt
    ),
  })
);

export type ProductMatcherJob = typeof productMatcherJobs.$inferSelect;
export type NewProductMatcherJob = typeof productMatcherJobs.$inferInsert;

