-- Add subtitle column to products_draft table
-- Subtitle is an important field from suppliers
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "subtitle" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_draft_subtitle_idx" ON "products_draft" USING btree ("subtitle");

