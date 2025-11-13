/**
 * Product Matcher Server Actions
 * Server-side actions for creating and managing product matcher jobs
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { productMatcherJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchAndParseUrlServer } from "@/lib/imports/fetch-url-server";
import { processMatcherJob, getJobWithResults } from "@/lib/product-matcher/processor";
import { saveDraft } from "@/app/actions/drafts";
import { getAllSuppliers } from "@/db/queries/suppliers";

/**
 * Create a new product matcher job
 */
export async function createMatcherJobAction(data: {
  name?: string;
  sheetUrl?: string;
  sheetData?: Array<Record<string, string | number>>;
  providers: string[];
  criteria: {
    shippingOrigin?: string[];
    maxDeliveryDays?: number;
    priceRange?: { min?: number; max?: number };
    currency?: string;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Validate inputs
  if (data.providers.length === 0) {
    throw new Error("At least one provider must be selected");
  }

  let sheetData: Array<Record<string, string | number>> = [];

  // Fetch and parse sheet if URL provided
  if (data.sheetUrl) {
    const parseResult = await fetchAndParseUrlServer(data.sheetUrl);
    if (parseResult.error) {
      throw new Error(`Failed to parse sheet: ${parseResult.error}`);
    }
    if (parseResult.rows.length === 0) {
      throw new Error("Sheet contains no data");
    }
    sheetData = parseResult.rows;
  } else if (data.sheetData && data.sheetData.length > 0) {
    sheetData = data.sheetData;
  } else {
    throw new Error("Either sheet URL or sheet data must be provided");
  }

  // Generate job name if not provided
  let jobName: string;
  if (!data.name || data.name.trim() === "") {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    jobName = `Product Search - ${dateStr} ${timeStr}`;
  } else {
    jobName = data.name.trim();
  }

  // Create job
  const [job] = await db
    .insert(productMatcherJobs)
    .values({
      userId: user.id,
      name: jobName,
      sheetUrl: data.sheetUrl || null,
      sheetData,
      providers: data.providers,
      criteria: data.criteria,
      status: "pending",
      progress: {
        processed: 0,
        total: sheetData.length,
      },
    })
    .returning();

  if (!job) {
    throw new Error("Failed to create job");
  }

  // Start processing job asynchronously (don't await)
  // In production, this would be handled by a queue worker
  processMatcherJob(job.id).catch((error) => {
    console.error(`Job ${job.id} processing error:`, error);
  });

  return {
    success: true,
    jobId: job.id,
  };
}

/**
 * Get matcher job with results
 */
export async function getMatcherJobAction(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const job = await getJobWithResults(jobId);

  if (!job) {
    throw new Error("Job not found");
  }

  // Verify user owns the job
  if (job.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  return job;
}

/**
 * Retry a failed matcher job
 */
export async function retryMatcherJobAction(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify job exists and user owns it
  const [job] = await db
    .select()
    .from(productMatcherJobs)
    .where(eq(productMatcherJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Reset job to pending
  await db
    .update(productMatcherJobs)
    .set({
      status: "pending",
      error: null,
      progress: {
        processed: 0,
        total: job.sheetData?.length || 0,
      },
    })
    .where(eq(productMatcherJobs.id, jobId));

  // Delete existing results
  const { productMatchResults } = await import("@/db/schema");
  await db
    .delete(productMatchResults)
    .where(eq(productMatchResults.jobId, jobId));

  // Start processing again
  processMatcherJob(jobId).catch((error) => {
    console.error(`Job ${jobId} retry processing error:`, error);
  });

  return {
    success: true,
  };
}

/**
 * Delete a matcher job
 */
export async function deleteMatcherJobAction(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify job exists and user owns it
  const [job] = await db
    .select()
    .from(productMatcherJobs)
    .where(eq(productMatcherJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Delete job (results will be cascade deleted)
  await db.delete(productMatcherJobs).where(eq(productMatcherJobs.id, jobId));

  return {
    success: true,
  };
}

/**
 * Send a match result to drafts
 */
export async function sendToDraftAction(data: {
  matchResultId: string;
  useBestMatch?: boolean;
  matchIndex?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get match result
  const { productMatchResults } = await import("@/db/schema");
  const [result] = await db
    .select()
    .from(productMatchResults)
    .where(eq(productMatchResults.id, data.matchResultId))
    .limit(1);

  if (!result) {
    throw new Error("Match result not found");
  }

  // Verify user owns the job
  const [job] = await db
    .select()
    .from(productMatcherJobs)
    .where(eq(productMatcherJobs.id, result.jobId))
    .limit(1);

  if (!job || job.userId !== user.id) {
    throw new Error("Unauthorized");
  }

  // Get suppliers
  const suppliers = await getAllSuppliers();
  if (suppliers.length === 0) {
    throw new Error("No suppliers found. Please create a supplier first.");
  }

  // Get the match to use
  const matches = result.matches || [];
  let selectedMatch: typeof matches[0] | null = null;

  if (data.useBestMatch && result.bestMatchId) {
    selectedMatch = matches.find((m) => m.productId === result.bestMatchId) || null;
  } else if (data.matchIndex !== undefined) {
    selectedMatch = matches[data.matchIndex] || null;
  }

  if (!selectedMatch) {
    throw new Error("No match selected");
  }

  // Create draft from match
  const draft = await saveDraft(null, {
    supplierId: suppliers[0].id, // Use first supplier - could be improved to match by provider
    titleEn: selectedMatch.title,
    descriptionEn: selectedMatch.description,
    images: selectedMatch.images,
    cost: String(selectedMatch.price),
    specifications: {
      ...selectedMatch.specs,
      providerId: selectedMatch.providerId,
      providerName: selectedMatch.providerName,
      supplierUrl: selectedMatch.supplierUrl,
      shippingOrigin: selectedMatch.shippingOrigin,
      estimatedDeliveryDays: selectedMatch.estimatedDeliveryDays,
      matchScore: selectedMatch.matchScore,
    },
    status: "draft",
  });

  return {
    success: true,
    draftId: draft.id,
  };
}

/**
 * Get all matcher jobs for current user
 */
export async function getMatcherJobsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { desc } = await import("drizzle-orm");
  const jobs = await db
    .select()
    .from(productMatcherJobs)
    .where(eq(productMatcherJobs.userId, user.id))
    .orderBy(desc(productMatcherJobs.createdAt));

  return jobs;
}

