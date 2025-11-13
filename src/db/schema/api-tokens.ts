import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Token provider enum
 * Supports OpenAI, Gemini, and Medusa Admin API tokens
 */
export const tokenProviderEnum = pgEnum("token_provider", [
  "openai",
  "gemini",
  "medusa",
]);

/**
 * API Tokens table
 * Stores encrypted API tokens for different providers
 * Tokens are encrypted before storage for security
 */
export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: tokenProviderEnum("provider").notNull(),
  tokenValueEncrypted: text("token_value_encrypted").notNull(), // Encrypted token value
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  active: boolean("active").notNull().default(true), // Soft delete via active flag
});

export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;
