/**
 * Store and retrieve synced Medusa entities
 * Keeps a local cache/reference of synced entities for use in product forms
 */

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Store synced entities in settings (as JSONB)
 */
export async function storeSyncedEntities(
  entityType: "category" | "collection" | "type" | "tag" | "sales_channel" | "stock_location",
  entities: unknown[]
): Promise<void> {
  const key = `medusa_${entityType}s`;

  // Get existing setting or create new
  const [existing] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  if (existing) {
    await db
      .update(settings)
      .set({
        valueJsonb: entities,
        updatedAt: new Date(),
      })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({
      key,
      valueJsonb: entities,
    });
  }
}

/**
 * Get stored synced entities
 */
export async function getSyncedEntities(
  entityType: "category" | "collection" | "type" | "tag" | "sales_channel" | "stock_location"
): Promise<unknown[]> {
  const key = `medusa_${entityType}s`;

  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  if (!setting || !Array.isArray(setting.valueJsonb)) {
    return [];
  }

  return setting.valueJsonb;
}
