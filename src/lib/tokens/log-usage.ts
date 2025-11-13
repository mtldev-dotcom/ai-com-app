/**
 * Token Usage Logging Helper
 * Logs token usage for governance and analytics
 */

import { db } from "@/db";
import { tokenUsageLogs, apiTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Log token usage after an API call
 * @param tokenId - ID of the token used
 * @param provider - Provider name (openai, gemini, medusa)
 * @param processName - Process name (e.g., "ai_enrich", "medusa_sync", "translate")
 * @param recordCount - Optional number of records processed
 * @param details - Optional additional metadata
 */
export async function logTokenUsage(params: {
  tokenId: string;
  provider: "openai" | "gemini" | "medusa";
  processName: string;
  recordCount?: number;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    // Verify token exists and is active
    const [token] = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.id, params.tokenId))
      .limit(1);

    if (!token || !token.active) {
      console.warn(
        `Token ${params.tokenId} not found or inactive, skipping usage log`
      );
      return;
    }

    // Create usage log entry
    await db.insert(tokenUsageLogs).values({
      tokenId: params.tokenId,
      provider: params.provider,
      processName: params.processName,
      recordCount: params.recordCount ?? null,
      details: params.details ?? null,
    });

    console.log(
      `Token usage logged: ${params.processName} using ${params.provider} token`
    );
  } catch (error) {
    // Log error but don't throw - token usage logging shouldn't break the main operation
    console.error("Failed to log token usage:", error);
  }
}

/**
 * Get token usage statistics
 * @param tokenId - Optional token ID to filter by
 * @param provider - Optional provider to filter by
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 */
export async function getTokenUsageStats(params?: {
  tokenId?: string;
  provider?: "openai" | "gemini" | "medusa";
  startDate?: Date;
  endDate?: Date;
}) {
  // This will be used by the analytics API route
  // For now, return a placeholder
  return {
    totalCalls: 0,
    totalRecords: 0,
    byProvider: {} as Record<string, number>,
  };
}
