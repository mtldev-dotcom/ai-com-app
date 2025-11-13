/**
 * Sync Job API Route (by ID)
 * GET /api/sync/:jobId - Get sync job status
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSyncJob } from "@/app/actions/sync-jobs";

/**
 * GET /api/sync/:jobId
 * Get sync job details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const job = await getSyncJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Sync job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    console.error("Get sync job error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync job" },
      { status: 500 }
    );
  }
}
