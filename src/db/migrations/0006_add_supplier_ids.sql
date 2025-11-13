-- Add supplier product and variant identifiers (pid and vid) as dedicated columns
-- These are important supplier identifiers for tracking products
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "supplier_product_id" text;--> statement-breakpoint
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "supplier_variant_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_draft_supplier_product_id_idx" ON "products_draft" USING btree ("supplier_product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_draft_supplier_variant_id_idx" ON "products_draft" USING btree ("supplier_variant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_draft_supplier_id_product_id_idx" ON "products_draft" USING btree ("supplier_id", "supplier_product_id");

