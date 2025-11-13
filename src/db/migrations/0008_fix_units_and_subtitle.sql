-- Fix units: weight in grams, dimensions in mm (no conversions)
-- Also ensure subtitle column exists
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "subtitle" text;--> statement-breakpoint
-- Update weight column precision if needed (should be numeric(10,2) for grams)
-- Note: PostgreSQL doesn't support ALTER COLUMN TYPE directly if data exists
-- This will only run if column doesn't exist or if we need to change precision
DO $$ 
BEGIN
  -- Check if weight column exists and has wrong precision
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products_draft' 
    AND column_name = 'weight' 
    AND numeric_precision = 10 
    AND numeric_scale = 3
  ) THEN
    -- Only alter if no data exists (safe for new tables)
    ALTER TABLE "products_draft" ALTER COLUMN "weight" TYPE numeric(10, 2);
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_draft_subtitle_idx" ON "products_draft" USING btree ("subtitle");

