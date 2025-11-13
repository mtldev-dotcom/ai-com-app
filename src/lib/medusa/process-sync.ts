/**
 * Sync Job Processor
 * Processes sync jobs and updates their status
 */

import {
  fetchEntities,
  createEntityInMedusa,
  updateEntityInMedusa,
  deleteEntityInMedusa,
  type MedusaEntityType,
  type SyncOperation,
} from "./sync";
import { updateSyncJobStatus } from "@/app/actions/sync-jobs";
import { storeSyncedEntities } from "./store-entities";

/**
 * Process a sync job
 * @param jobId - Sync job ID
 * @param entityType - Entity type to sync
 * @param operation - Operation to perform
 */
export async function processSyncJob(
  jobId: string,
  entityType: MedusaEntityType,
  operation: SyncOperation
): Promise<void> {
  try {
    // Update status to running
    await updateSyncJobStatus(jobId, "running");

    let recordCount = 0;
    let logText = "";

    if (operation === "fetch") {
      // Fetch entities from Medusa
      const entities = await fetchEntities(entityType);
      recordCount = entities.length;
      logText = `Successfully fetched ${recordCount} ${entityType}(s) from Medusa`;

      // Store entities in database for use in product forms
      if (
        entityType === "category" ||
        entityType === "collection" ||
        entityType === "type" ||
        entityType === "tag" ||
        entityType === "sales_channel"
      ) {
        await storeSyncedEntities(
          entityType as
            | "category"
            | "collection"
            | "type"
            | "tag"
            | "sales_channel",
          entities
        );
      }

      // Update status to done
      await updateSyncJobStatus(jobId, "done", {
        recordCount,
        logText,
      });
    } else if (operation === "create") {
      // This would typically be called with a payload
      // For now, we'll mark it as an error since payload is needed
      throw new Error("Create operation requires payload");
    } else if (operation === "update") {
      // This would typically be called with entity ID and payload
      throw new Error("Update operation requires entity ID and payload");
    } else if (operation === "delete") {
      // This would typically be called with entity ID
      throw new Error("Delete operation requires entity ID");
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Sync job ${jobId} failed:`, error);

    // Update status to error
    await updateSyncJobStatus(jobId, "error", {
      logText: errorMessage,
    });

    throw error;
  }
}

/**
 * Process fetch sync job with pagination
 */
export async function processFetchSyncJob(
  jobId: string,
  entityType: MedusaEntityType,
  options?: { limit?: number; offset?: number }
): Promise<void> {
  try {
    await updateSyncJobStatus(jobId, "running");

    const entities = await fetchEntities(entityType, options);
    const recordCount = entities.length;
    const logText = `Successfully fetched ${recordCount} ${entityType}(s) from Medusa`;

    // Store entities in database for use in product forms
    if (
      entityType === "category" ||
      entityType === "collection" ||
      entityType === "type" ||
      entityType === "tag" ||
      entityType === "sales_channel"
    ) {
      await storeSyncedEntities(
        entityType as
          | "category"
          | "collection"
          | "type"
          | "tag"
          | "sales_channel",
        entities
      );
    }

    await updateSyncJobStatus(jobId, "done", {
      recordCount,
      logText,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    await updateSyncJobStatus(jobId, "error", {
      logText: errorMessage,
    });
    throw error;
  }
}
