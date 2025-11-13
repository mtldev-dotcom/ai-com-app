DO $$ BEGIN
 CREATE TYPE "public"."token_provider" AS ENUM('openai', 'gemini', 'medusa');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'editor', 'viewer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."token_usage_provider" AS ENUM('openai', 'gemini', 'medusa');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."medusa_entity_type" AS ENUM('product', 'category', 'collection', 'type', 'tag', 'sales_channel');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."medusa_sync_job_status" AS ENUM('queued', 'running', 'done', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."medusa_sync_operation" AS ENUM('fetch', 'create', 'update', 'delete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."currency_preference" AS ENUM('CAD', 'USD', 'AUTO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."price_rounding_rule" AS ENUM('.99', '.95', 'none');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."supplier_score_type" AS ENUM('quality', 'speed', 'support', 'price', 'reliability');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "token_provider" NOT NULL,
	"token_value_encrypted" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_table" text NOT NULL,
	"target_id" uuid NOT NULL,
	"diff_jsonb" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_draft_id" uuid NOT NULL,
	"src_url" text NOT NULL,
	"alt_en" text,
	"alt_fr" text,
	"width" integer,
	"height" integer,
	"storage_key" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_id" uuid NOT NULL,
	"provider" "token_usage_provider" NOT NULL,
	"process_name" text NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL,
	"record_count" integer,
	"details_jsonb" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "medusa_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "medusa_entity_type" NOT NULL,
	"operation" "medusa_sync_operation" NOT NULL,
	"status" "medusa_sync_job_status" DEFAULT 'queued' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"record_count" integer,
	"log_text" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value_jsonb" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_name" text NOT NULL,
	"target_margin_pct" numeric(5, 2) NOT NULL,
	"min_margin_pct" numeric(5, 2),
	"rounding_rule" "price_rounding_rule" DEFAULT 'none' NOT NULL,
	"currency_preference" "currency_preference" DEFAULT 'CAD' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_draft_id" uuid NOT NULL,
	"supplier_price_amount" numeric(10, 2) NOT NULL,
	"supplier_price_currency" text NOT NULL,
	"selling_price_amount" numeric(10, 2) NOT NULL,
	"selling_price_currency" text NOT NULL,
	"margin_pct" numeric(5, 2) NOT NULL,
	"delta_pct" numeric(5, 2),
	"observed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"score_type" "supplier_score_type" NOT NULL,
	"value" integer NOT NULL,
	"rationale" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'viewer';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locale" text DEFAULT 'en';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_product_draft_id_products_draft_id_fk" FOREIGN KEY ("product_draft_id") REFERENCES "public"."products_draft"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_token_id_api_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."api_tokens"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_checks" ADD CONSTRAINT "price_checks_product_draft_id_products_draft_id_fk" FOREIGN KEY ("product_draft_id") REFERENCES "public"."products_draft"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "supplier_scores" ADD CONSTRAINT "supplier_scores_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_id_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_target_table_target_id_idx" ON "audit_logs" USING btree ("target_table","target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_usage_logs_token_id_used_at_idx" ON "token_usage_logs" USING btree ("token_id","used_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "medusa_sync_jobs_entity_type_status_idx" ON "medusa_sync_jobs" USING btree ("entity_type","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "supplier_scores_supplier_id_idx" ON "supplier_scores" USING btree ("supplier_id");