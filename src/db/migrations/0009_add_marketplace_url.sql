-- Add marketplace_url column to products_draft table
-- Stores URL to the product on supplier's marketplace site
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "marketplace_url" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_draft_marketplace_url_idx" ON "products_draft" USING btree ("marketplace_url");

