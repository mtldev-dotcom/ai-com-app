ALTER TABLE "product_match_results" ADD COLUMN IF NOT EXISTS "sku" text;--> statement-breakpoint
ALTER TABLE "product_match_results" ADD COLUMN IF NOT EXISTS "landed_cost_value" numeric(18, 4);--> statement-breakpoint
ALTER TABLE "product_match_results" ADD COLUMN IF NOT EXISTS "landed_cost_currency" text DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "product_match_results" ADD COLUMN IF NOT EXISTS "eta_days" integer;--> statement-breakpoint
ALTER TABLE "product_match_results" ADD COLUMN IF NOT EXISTS "reliability_score" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "product_match_results" ADD COLUMN IF NOT EXISTS "ranking_score" numeric(7, 3);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_match_results_sku_idx" ON "product_match_results" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_match_results_ranking_score_idx" ON "product_match_results" USING btree ("ranking_score");