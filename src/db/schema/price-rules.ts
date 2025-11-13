import {
  pgTable,
  text,
  uuid,
  pgEnum,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * Price rounding rule enum
 */
export const priceRoundingRuleEnum = pgEnum("price_rounding_rule", [
  ".99",
  ".95",
  "none",
]);

/**
 * Currency preference enum
 */
export const currencyPreferenceEnum = pgEnum("currency_preference", [
  "CAD",
  "USD",
  "AUTO",
]);

/**
 * Price Rules table
 * Defines pricing rules for automatic price calculations
 * Used by monitoring jobs to validate margins
 */
export const priceRules = pgTable("price_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruleName: text("rule_name").notNull(),
  targetMarginPct: numeric("target_margin_pct", {
    precision: 5,
    scale: 2,
  }).notNull(), // Target margin percentage
  minMarginPct: numeric("min_margin_pct", {
    precision: 5,
    scale: 2,
  }), // Minimum acceptable margin
  roundingRule: priceRoundingRuleEnum("rounding_rule")
    .notNull()
    .default("none"),
  currencyPreference: currencyPreferenceEnum("currency_preference")
    .notNull()
    .default("CAD"),
  active: boolean("active").notNull().default(true),
});

export type PriceRule = typeof priceRules.$inferSelect;
export type NewPriceRule = typeof priceRules.$inferInsert;
