/**
 * Medusa Sync Jobs Server Actions
 * Server-side actions for managing sync jobs
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { medusaSyncJobs } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { MedusaEntityType, SyncOperation } from "@/lib/medusa/sync";

/**
 * Create a new sync job
 */
export async function createSyncJob(params: {
  entityType: MedusaEntityType;
  operation: SyncOperation;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [job] = await db
    .insert(medusaSyncJobs)
    .values({
      entityType: params.entityType,
      operation: params.operation,
      status: "queued",
    })
    .returning();

  revalidatePath("/monitoring");
  return job;
}

/**
 * Get all sync jobs
 */
export async function getSyncJobs(params?: {
  entityType?: MedusaEntityType;
  status?: "queued" | "running" | "done" | "error";
  limit?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const conditions = [];
  if (params?.entityType) {
    conditions.push(eq(medusaSyncJobs.entityType, params.entityType));
  }
  if (params?.status) {
    conditions.push(eq(medusaSyncJobs.status, params.status));
  }

  const jobs = await db
    .select()
    .from(medusaSyncJobs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(medusaSyncJobs.startedAt))
    .limit(params?.limit || 50);

  return jobs;
}

/**
 * Get a specific sync job
 */
export async function getSyncJob(jobId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [job] = await db
    .select()
    .from(medusaSyncJobs)
    .where(eq(medusaSyncJobs.id, jobId))
    .limit(1);

  return job || null;
}

/**
 * Update sync job status
 */
export async function updateSyncJobStatus(
  jobId: string,
  status: "queued" | "running" | "done" | "error",
  updates?: {
    recordCount?: number;
    logText?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const updateData: {
    status: typeof status;
    recordCount?: number;
    logText?: string;
    startedAt?: Date;
    completedAt?: Date;
  } = {
    status,
  };

  if (status === "running" && !updates?.logText) {
    updateData.startedAt = new Date();
  }

  if (status === "done" || status === "error") {
    updateData.completedAt = new Date();
  }

  if (updates?.recordCount !== undefined) {
    updateData.recordCount = updates.recordCount;
  }

  if (updates?.logText !== undefined) {
    updateData.logText = updates.logText;
  }

  const [updated] = await db
    .update(medusaSyncJobs)
    .set(updateData)
    .where(eq(medusaSyncJobs.id, jobId))
    .returning();

  revalidatePath("/monitoring");
  return updated;
}
