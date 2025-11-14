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
  createEntityInMedusa,
  deleteEntityInMedusa,
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

/**
 * Create a new collection in Medusa
 */
export async function createCollection(data: {
  title: string;
  handle?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await createEntityInMedusa("collection", {
      title: data.title,
      handle: data.handle,
      metadata: data.metadata || {},
    });

    // Sync collections to update local storage
    await syncAndStoreEntities("collection");

    return {
      success: true,
      collection: result,
    };
  } catch (error) {
    console.error("Create collection error:", error);
    throw error;
  }
}

/**
 * Create a new category in Medusa
 */
export async function createCategory(data: {
  name: string;
  parent_category_id?: string;
  handle?: string;
  description?: string;
  is_active?: boolean;
  is_internal?: boolean;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const payload: Record<string, unknown> = {
      name: data.name,
    };

    if (data.parent_category_id) {
      payload.parent_category_id = data.parent_category_id;
    }
    if (data.handle) {
      payload.handle = data.handle;
    }
    if (data.description) {
      payload.description = data.description;
    }
    if (data.is_active !== undefined) {
      payload.is_active = data.is_active;
    }
    if (data.is_internal !== undefined) {
      payload.is_internal = data.is_internal;
    }
    if (data.metadata) {
      payload.metadata = data.metadata;
    }

    const result = await createEntityInMedusa("category", payload);

    // Sync categories to update local storage
    await syncAndStoreEntities("category");

    return {
      success: true,
      category: result,
    };
  } catch (error) {
    console.error("Create category error:", error);
    throw error;
  }
}

/**
 * Delete a collection from Medusa
 */
export async function deleteCollection(collectionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await deleteEntityInMedusa("collection", collectionId);

    // Sync collections to update local storage
    await syncAndStoreEntities("collection");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete collection error:", error);
    throw error;
  }
}

/**
 * Delete a category from Medusa
 */
export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await deleteEntityInMedusa("category", categoryId);

    // Sync categories to update local storage
    await syncAndStoreEntities("category");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Delete category error:", error);
    throw error;
  }
}
