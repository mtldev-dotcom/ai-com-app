/**
 * Medusa Sync API Route
 * POST /api/sync - Create and trigger a sync job
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSyncJob } from "@/app/actions/sync-jobs";
import { processFetchSyncJob } from "@/lib/medusa/process-sync";
import { z } from "zod";
import type { MedusaEntityType, SyncOperation } from "@/lib/medusa/sync";

const syncJobSchema = z.object({
  entityType: z.enum([
    "product",
    "category",
    "collection",
    "type",
    "tag",
    "sales_channel",
  ]),
  operation: z.enum(["fetch", "create", "update", "delete"]),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

/**
 * POST /api/sync
 * Create and process a sync job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = syncJobSchema.parse(body);

    // Create sync job
    const job = await createSyncJob({
      entityType: validated.entityType as MedusaEntityType,
      operation: validated.operation as SyncOperation,
    });

    // For fetch operations, process immediately
    // For create/update/delete, these would typically require payload and be processed differently
    if (validated.operation === "fetch") {
      // Process in background (non-blocking)
      processFetchSyncJob(job.id, validated.entityType as MedusaEntityType, {
        limit: validated.limit,
        offset: validated.offset,
      }).catch((error) => {
        console.error(`Failed to process sync job ${job.id}:`, error);
      });

      return NextResponse.json(
        {
          jobId: job.id,
          status: job.status,
          message: "Sync job created and processing",
        },
        { status: 202 }
      );
    }

    // For other operations, return the job (they'll need payload/entityId)
    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
        message:
          "Sync job created (requires additional payload for create/update/delete)",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Sync API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create sync job" },
      { status: 500 }
    );
  }
}
