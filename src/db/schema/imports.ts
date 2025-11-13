import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Import source type enum
 */
export const importSourceTypeEnum = pgEnum("import_source_type", [
  "csv",
  "xlsx",
  "url",
  "cj",
]);

/**
 * Import status enum
 */
export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

/**
 * Imports table
 * Tracks import jobs from CSV/URL sources
 * Stores mapping configuration and import results
 */
export const imports = pgTable("imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceType: importSourceTypeEnum("source_type").notNull(),
  sourceUrl: text("source_url"), // For URL-based imports
  filename: text("filename"), // For file-based imports
  // Column mapping configuration (JSON)
  // Maps source columns to target fields
  mappedColumns: jsonb("mapped_columns").$type<Record<string, string>>(),
  // Status tracking
  status: importStatusEnum("status").notNull().default("pending"),
  // Results tracking
  totalRows: jsonb("total_rows").$type<number>(),
  processedRows: jsonb("processed_rows").$type<number>(),
  failedRows: jsonb("failed_rows").$type<number>(),
  // Error messages (JSON array)
  errors: jsonb("errors").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Import = typeof imports.$inferSelect;
export type NewImport = typeof imports.$inferInsert;
