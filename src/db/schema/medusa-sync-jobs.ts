import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  index,
} from "drizzle-orm/pg-core";

/**
 * Medusa entity type enum
 * Defines which Medusa entities can be synced
 */
export const medusaEntityTypeEnum = pgEnum("medusa_entity_type", [
  "product",
  "category",
  "collection",
  "type",
  "tag",
  "sales_channel",
]);

/**
 * Medusa sync operation enum
 * Defines the type of sync operation
 */
export const medusaSyncOperationEnum = pgEnum("medusa_sync_operation", [
  "fetch",
  "create",
  "update",
  "delete",
]);

/**
 * Medusa sync job status enum
 */
export const medusaSyncJobStatusEnum = pgEnum("medusa_sync_job_status", [
  "queued",
  "running",
  "done",
  "error",
]);

/**
 * Medusa Sync Jobs table
 * Tracks synchronization jobs between this app and Medusa stores
 * Indexed on entity_type and status for efficient querying
 */
export const medusaSyncJobs = pgTable(
  "medusa_sync_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: medusaEntityTypeEnum("entity_type").notNull(),
    operation: medusaSyncOperationEnum("operation").notNull(),
    status: medusaSyncJobStatusEnum("status").notNull().default("queued"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    recordCount: integer("record_count"), // Number of records processed
    logText: text("log_text"), // Error messages or execution logs
  },
  (table) => ({
    entityTypeStatusIdx: index("medusa_sync_jobs_entity_type_status_idx").on(
      table.entityType,
      table.status
    ),
  })
);

export type MedusaSyncJob = typeof medusaSyncJobs.$inferSelect;
export type NewMedusaSyncJob = typeof medusaSyncJobs.$inferInsert;
