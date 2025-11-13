/**
 * Product Matcher Results API Route
 * Handles bulk delete operations for product match results
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productMatchResults } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BulkDeleteRequestSchema = z.object({
  resultIds: z.array(z.string().uuid()),
});

/**
 * DELETE /api/product-matcher/[jobId]/results
 * Bulk delete results by their IDs
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validated = BulkDeleteRequestSchema.parse(body);

    if (!validated.resultIds || validated.resultIds.length === 0) {
      return NextResponse.json(
        { error: "No result IDs provided" },
        { status: 400 }
      );
    }

    // Verify job exists and belongs to user
    const jobExists = await db.query.productMatcherJobs.findFirst({
      where: (jobs, { eq, and }) =>
        and(eq(jobs.id, jobId), eq(jobs.userId, user.id)),
    });

    if (!jobExists) {
      return NextResponse.json(
        { error: "Job not found or access denied" },
        { status: 404 }
      );
    }

    // Delete results that belong to this job
    const deletedCount = await db
      .delete(productMatchResults)
      .where(
        inArray(
          productMatchResults.id,
          validated.resultIds as unknown as string[]
        )
      )
      .returning();

    // Verify all deleted results belonged to this job
    const deletedJobIds = deletedCount.map((r) => r.jobId);
    const allBelongToJob = deletedJobIds.every((id) => id === jobId);

    if (!allBelongToJob) {
      return NextResponse.json(
        { error: "Some results do not belong to this job" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedCount.length,
      message: `Successfully deleted ${deletedCount.length} result(s)`,
    });
  } catch (error) {
    console.error("Error deleting results:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

