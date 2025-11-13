/**
 * Medusa Entities Server Actions
 * Server-side actions for managing synced Medusa entities
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  fetchCategories,
  fetchCollections,
  fetchTypes,
  fetchTags,
  fetchSalesChannels,
} from "@/lib/medusa/sync";
import {
  storeSyncedEntities,
  getSyncedEntities,
} from "@/lib/medusa/store-entities";
import type { MedusaEntityType } from "@/lib/medusa/sync";

/**
 * Sync and store entities
 */
export async function syncAndStoreEntities(
  entityType: "category" | "collection" | "type" | "tag" | "sales_channel"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let entities: unknown[] = [];

  switch (entityType) {
    case "category":
      entities = await fetchCategories();
      break;
    case "collection":
      entities = await fetchCollections();
      break;
    case "type":
      entities = await fetchTypes();
      break;
    case "tag":
      entities = await fetchTags();
      break;
    case "sales_channel":
      entities = await fetchSalesChannels();
      break;
  }

  // Store in database
  await storeSyncedEntities(entityType, entities);

  return {
    success: true,
    count: entities.length,
    entities,
  };
}

/**
 * Get stored entities
 */
export async function getStoredEntities(
  entityType: "category" | "collection" | "type" | "tag" | "sales_channel"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const entities = await getSyncedEntities(entityType);
  return entities;
}
