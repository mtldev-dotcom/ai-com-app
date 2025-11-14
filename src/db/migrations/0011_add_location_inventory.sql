-- Add location_inventory column to products_draft table
-- Stores inventory quantities per stock location: { "locationId": quantity }
ALTER TABLE "products_draft" ADD COLUMN IF NOT EXISTS "location_inventory" jsonb;

