import { db } from "../index";
import { productsDraft, suppliers } from "../schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * Query helper functions for products_draft table
 */

/**
 * Get all product drafts with supplier info
 */
export async function getAllProductDrafts() {
  return await db
    .select({
      product: productsDraft,
      supplier: suppliers,
    })
    .from(productsDraft)
    .leftJoin(suppliers, eq(productsDraft.supplierId, suppliers.id))
    .orderBy(desc(productsDraft.createdAt));
}

/**
 * Get product draft by ID with supplier info
 */
export async function getProductDraftById(id: string) {
  const result = await db
    .select({
      product: productsDraft,
      supplier: suppliers,
    })
    .from(productsDraft)
    .leftJoin(suppliers, eq(productsDraft.supplierId, suppliers.id))
    .where(eq(productsDraft.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * Get product drafts by status
 */
export async function getProductDraftsByStatus(
  status: "draft" | "enriched" | "ready" | "published" | "archived"
) {
  return await db
    .select({
      product: productsDraft,
      supplier: suppliers,
    })
    .from(productsDraft)
    .leftJoin(suppliers, eq(productsDraft.supplierId, suppliers.id))
    .where(eq(productsDraft.status, status))
    .orderBy(desc(productsDraft.createdAt));
}

/**
 * Get product drafts by supplier ID
 */
export async function getProductDraftsBySupplierId(supplierId: string) {
  return await db
    .select()
    .from(productsDraft)
    .where(eq(productsDraft.supplierId, supplierId))
    .orderBy(desc(productsDraft.createdAt));
}
