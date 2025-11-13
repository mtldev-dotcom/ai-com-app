import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { apiTokens } from "./api-tokens";

/**
 * Token provider enum (matches api_tokens)
 */
export const tokenUsageProviderEnum = pgEnum("token_usage_provider", [
  "openai",
  "gemini",
  "medusa",
]);

/**
 * Token Usage Logs table
 * Tracks every usage of provider tokens for governance and analytics
 * Indexed on token_id and used_at for efficient querying
 */
export const tokenUsageLogs = pgTable(
  "token_usage_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenId: uuid("token_id")
      .notNull()
      .references(() => apiTokens.id, { onDelete: "cascade" }),
    provider: tokenUsageProviderEnum("provider").notNull(),
    processName: text("process_name").notNull(), // e.g., "ai_enrich", "medusa_sync"
    usedAt: timestamp("used_at").notNull().defaultNow(),
    recordCount: integer("record_count"), // Number of records processed in this operation
    details: jsonb("details_jsonb").$type<Record<string, unknown>>(), // Additional metadata
  },
  (table) => ({
    tokenIdUsedAtIdx: index("token_usage_logs_token_id_used_at_idx").on(
      table.tokenId,
      table.usedAt
    ),
  })
);

export type TokenUsageLog = typeof tokenUsageLogs.$inferSelect;
export type NewTokenUsageLog = typeof tokenUsageLogs.$inferInsert;
