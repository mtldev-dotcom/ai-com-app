/**
 * Medusa Sync Client
 * Handles bidirectional synchronization with Medusa store
 * Supports fetch (from Medusa), create, update, delete (to Medusa) operations
 */

import type { MedusaProduct } from "./client";
import { getSetting, SETTING_KEYS } from "@/lib/settings/get-settings";
import { decrypt } from "@/lib/encryption";

/**
 * Medusa entity types that can be synced
 */
export type MedusaEntityType =
  | "product"
  | "category"
  | "collection"
  | "type"
  | "tag"
  | "sales_channel";

/**
 * Sync operation types
 */
export type SyncOperation = "fetch" | "create" | "update" | "delete";

/**
 * Helper to get Medusa base URL
 */
async function getMedusaBaseUrl(): Promise<string> {
  const url = await getSetting<string>(SETTING_KEYS.MEDUSA_ADMIN_URL);
  if (url) {
    return url.replace(/\/$/, "");
  }
  const envUrl = process.env.MEDUSA_BASE_URL;
  if (!envUrl) {
    throw new Error("MEDUSA_ADMIN_URL not configured");
  }
  return envUrl.replace(/\/$/, "");
}

/**
 * Helper to get Medusa token
 */
async function getMedusaToken(): Promise<string> {
  const encryptedToken = await getSetting<string>(
    SETTING_KEYS.MEDUSA_ADMIN_TOKEN
  );
  if (encryptedToken) {
    try {
      return decrypt(encryptedToken);
    } catch (error) {
      throw new Error("Failed to decrypt Medusa token");
    }
  }
  const envToken = process.env.MEDUSA_ADMIN_API_TOKEN;
  if (!envToken) {
    throw new Error("MEDUSA_ADMIN_TOKEN not configured");
  }
  return envToken;
}

/**
 * Helper to get auth header
 */
async function getAuthHeader(): Promise<string> {
  const token = await getMedusaToken();
  const isJWT = token.includes(".") && token.split(".").length === 3;
  return isJWT
    ? `Bearer ${token}`
    : `Basic ${Buffer.from(`${token}:`).toString("base64")}`;
}

/**
 * Fetch products from Medusa
 * @param limit - Maximum number of products to fetch (default: 100)
 * @param offset - Pagination offset (default: 0)
 * @returns Array of products
 */
export async function fetchProducts(
  limit = 100,
  offset = 0
): Promise<MedusaProduct[]> {
  try {
    const baseUrl = await getMedusaBaseUrl();
    const authHeader = await getAuthHeader();

    const url = new URL("/admin/products", baseUrl);
    url.searchParams.set("limit", limit.toString());
    url.searchParams.set("offset", offset.toString());

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Failed to fetch products: ${res.statusText} - ${errorText}`
      );
    }

    const data = await res.json();
    return data.products || [];
  } catch (error) {
    console.error("Error fetching products from Medusa:", error);
    throw error;
  }
}

/**
 * Fetch categories from Medusa
 */
export async function fetchCategories() {
  try {
    const baseUrl = await getMedusaBaseUrl();
    const authHeader = await getAuthHeader();

    const res = await fetch(`${baseUrl}/admin/product-categories`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch categories: ${res.statusText}`);
    }

    const data = await res.json();
    return data.product_categories || [];
  } catch (error) {
    console.error("Error fetching categories from Medusa:", error);
    throw error;
  }
}

/**
 * Fetch collections from Medusa
 */
export async function fetchCollections() {
  try {
    const baseUrl = await getMedusaBaseUrl();
    const authHeader = await getAuthHeader();

    const res = await fetch(`${baseUrl}/admin/collections`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch collections: ${res.statusText}`);
    }

    const data = await res.json();
    return data.collections || [];
  } catch (error) {
    console.error("Error fetching collections from Medusa:", error);
    throw error;
  }
}

/**
 * Fetch product types from Medusa
 */
export async function fetchTypes() {
  try {
    const baseUrl = await getMedusaBaseUrl();
    const authHeader = await getAuthHeader();

    const res = await fetch(`${baseUrl}/admin/product-types`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch types: ${res.statusText}`);
    }

    const data = await res.json();
    return data.product_types || [];
  } catch (error) {
    console.error("Error fetching types from Medusa:", error);
    throw error;
  }
}

/**
 * Fetch product tags from Medusa
 */
export async function fetchTags() {
  try {
    const baseUrl = await getMedusaBaseUrl();
    const authHeader = await getAuthHeader();

    const res = await fetch(`${baseUrl}/admin/product-tags`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch tags: ${res.statusText}`);
    }

    const data = await res.json();
    return data.product_tags || [];
  } catch (error) {
    console.error("Error fetching tags from Medusa:", error);
    throw error;
  }
}

/**
 * Fetch sales channels from Medusa
 */
export async function fetchSalesChannels() {
  try {
    const baseUrl = await getMedusaBaseUrl();
    const authHeader = await getAuthHeader();

    const res = await fetch(`${baseUrl}/admin/sales-channels`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch sales channels: ${res.statusText}`);
    }

    const data = await res.json();
    return data.sales_channels || [];
  } catch (error) {
    console.error("Error fetching sales channels from Medusa:", error);
    throw error;
  }
}

/**
 * Fetch entities based on type
 */
export async function fetchEntities(
  entityType: MedusaEntityType,
  options?: { limit?: number; offset?: number }
): Promise<unknown[]> {
  switch (entityType) {
    case "product":
      return await fetchProducts(options?.limit, options?.offset);
    case "category":
      return await fetchCategories();
    case "collection":
      return await fetchCollections();
    case "type":
      return await fetchTypes();
    case "tag":
      return await fetchTags();
    case "sales_channel":
      return await fetchSalesChannels();
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Create entity in Medusa
 */
export async function createEntityInMedusa(
  entityType: MedusaEntityType,
  payload: unknown
): Promise<unknown> {
  const baseUrl = await getMedusaBaseUrl();
  const authHeader = await getAuthHeader();

  // Map entity type to endpoint
  const endpoints: Record<MedusaEntityType, string> = {
    product: "/admin/products",
    category: "/admin/product-categories",
    collection: "/admin/collections",
    type: "/admin/product-types",
    tag: "/admin/product-tags",
    sales_channel: "/admin/sales-channels",
  };

  const endpoint = endpoints[entityType];
  if (!endpoint) {
    throw new Error(`Unsupported entity type for create: ${entityType}`);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to create ${entityType}: ${res.statusText} - ${errorText}`
    );
  }

  return await res.json();
}

/**
 * Update entity in Medusa
 */
export async function updateEntityInMedusa(
  entityType: MedusaEntityType,
  entityId: string,
  payload: unknown
): Promise<unknown> {
  const baseUrl = await getMedusaBaseUrl();
  const authHeader = await getAuthHeader();

  // Map entity type to endpoint
  const endpoints: Record<MedusaEntityType, string> = {
    product: `/admin/products/${entityId}`,
    category: `/admin/product-categories/${entityId}`,
    collection: `/admin/collections/${entityId}`,
    type: `/admin/product-types/${entityId}`,
    tag: `/admin/product-tags/${entityId}`,
    sales_channel: `/admin/sales-channels/${entityId}`,
  };

  const endpoint = endpoints[entityType];
  if (!endpoint) {
    throw new Error(`Unsupported entity type for update: ${entityType}`);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST", // Medusa uses POST for updates
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to update ${entityType}: ${res.statusText} - ${errorText}`
    );
  }

  return await res.json();
}

/**
 * Delete entity in Medusa
 */
export async function deleteEntityInMedusa(
  entityType: MedusaEntityType,
  entityId: string
): Promise<void> {
  const baseUrl = await getMedusaBaseUrl();
  const authHeader = await getAuthHeader();

  // Map entity type to endpoint
  const endpoints: Record<MedusaEntityType, string> = {
    product: `/admin/products/${entityId}`,
    category: `/admin/product-categories/${entityId}`,
    collection: `/admin/collections/${entityId}`,
    type: `/admin/product-types/${entityId}`,
    tag: `/admin/product-tags/${entityId}`,
    sales_channel: `/admin/sales-channels/${entityId}`,
  };

  const endpoint = endpoints[entityType];
  if (!endpoint) {
    throw new Error(`Unsupported entity type for delete: ${entityType}`);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to delete ${entityType}: ${res.statusText} - ${errorText}`
    );
  }
}
