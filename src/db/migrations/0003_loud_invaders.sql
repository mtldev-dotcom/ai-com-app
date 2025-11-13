DO $$ BEGIN
 CREATE TYPE "public"."product_matcher_job_status" AS ENUM('pending', 'processing', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."product_match_result_status" AS ENUM('pending', 'searching', 'found', 'not_found', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_matcher_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sheet_url" text,
	"sheet_data" jsonb,
	"providers" jsonb,
	"criteria" jsonb,
	"status" "product_matcher_job_status" DEFAULT 'pending' NOT NULL,
	"progress" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_match_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"original_product" jsonb,
	"matches" jsonb,
	"best_match_id" text,
	"status" "product_match_result_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_match_results" ADD CONSTRAINT "product_match_results_job_id_product_matcher_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."product_matcher_jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_matcher_jobs_user_id_idx" ON "product_matcher_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_matcher_jobs_status_idx" ON "product_matcher_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_matcher_jobs_created_at_idx" ON "product_matcher_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_match_results_job_id_idx" ON "product_match_results" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_match_results_status_idx" ON "product_match_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_match_results_created_at_idx" ON "product_match_results" USING btree ("created_at");