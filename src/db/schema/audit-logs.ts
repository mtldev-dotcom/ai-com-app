import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/**
 * Audit Logs table
 * Tracks all sensitive operations for security and compliance
 * Stores before/after diffs for update operations
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").notNull(), // User ID who performed the action
    action: text("action").notNull(), // e.g., "publish", "delete", "update_settings"
    targetTable: text("target_table").notNull(), // Table name affected
    targetId: uuid("target_id").notNull(), // ID of the affected record
    diffJsonb: jsonb("diff_jsonb").$type<{
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    }>(), // Before/after diff for updates
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    actorIdIdx: index("audit_logs_actor_id_idx").on(table.actorId),
    targetTableTargetIdIdx: index("audit_logs_target_table_target_id_idx").on(
      table.targetTable,
      table.targetId
    ),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
