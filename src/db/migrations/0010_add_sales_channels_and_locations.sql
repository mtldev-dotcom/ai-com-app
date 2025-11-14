-- Add sales channels and stock locations columns to products_draft table
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "sales_channel_ids" jsonb;
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "stock_location_ids" jsonb;

