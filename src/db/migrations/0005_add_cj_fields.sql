-- Add supplier and product fields to products_draft table
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "sku" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "handle" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "currency" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "weight" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "length" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "width" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "height" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "material" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "origin_country" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "hs_code" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "mid_code" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "type" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "collection_id" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "category_ids" jsonb;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "tags" jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_draft_sku_idx" ON "products_draft" USING btree ("sku");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_draft_handle_idx" ON "products_draft" USING btree ("handle");

