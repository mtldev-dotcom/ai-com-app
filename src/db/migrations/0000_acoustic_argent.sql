DO $$ BEGIN
 CREATE TYPE "public"."import_source_type" AS ENUM('csv', 'xlsx', 'url');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."import_status" AS ENUM('pending', 'processing', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."product_draft_status" AS ENUM('draft', 'enriched', 'ready', 'published', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" "import_source_type" NOT NULL,
	"source_url" text,
	"filename" text,
	"mapped_columns" jsonb,
	"status" "import_status" DEFAULT 'pending' NOT NULL,
	"total_rows" jsonb,
	"processed_rows" jsonb,
	"failed_rows" jsonb,
	"errors" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"website" text,
	"notes" text,
	"quality_rating" numeric(3, 2),
	"speed_rating" numeric(3, 2),
	"price_rating" numeric(3, 2),
	"support_rating" numeric(3, 2),
	"average_rating" numeric(3, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products_draft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"title_fr" text,
	"title_en" text,
	"description_fr" text,
	"description_en" text,
	"meta_title" text,
	"meta_description" text,
	"images" jsonb,
	"cost" numeric(10, 2) NOT NULL,
	"selling_price" numeric(10, 2),
	"margin" numeric(5, 2),
	"specifications" jsonb,
	"status" "product_draft_status" DEFAULT 'draft' NOT NULL,
	"medusa_product_id" text,
	"medusa_variant_ids" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variants_draft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_draft_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"price_adjustment" numeric(10, 2) DEFAULT '0',
	"stock" integer DEFAULT 0,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "variants_draft_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "products_draft" ADD CONSTRAINT "products_draft_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variants_draft" ADD CONSTRAINT "variants_draft_product_draft_id_products_draft_id_fk" FOREIGN KEY ("product_draft_id") REFERENCES "public"."products_draft"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
