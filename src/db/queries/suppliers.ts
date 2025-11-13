import { db } from "../index";
import { suppliers } from "../schema";
import { eq } from "drizzle-orm";

/**
 * Query helper functions for suppliers table
 */

/**
 * Get all suppliers
 */
export async function getAllSuppliers() {
  return await db.select().from(suppliers);
}

/**
 * Get supplier by ID
 */
export async function getSupplierById(id: string) {
  const result = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, id))
    .limit(1);
  return result[0] || null;
}

/**
 * Get supplier with average rating calculated
 * Note: In a production setup, you might want to calculate this on-the-fly
 */
export async function getSupplierWithRating(id: string) {
  const supplier = await getSupplierById(id);
  if (!supplier) return null;

  // Calculate average rating if individual ratings exist
  const ratings = [
    supplier.qualityRating,
    supplier.speedRating,
    supplier.priceRating,
    supplier.supportRating,
  ].filter((r) => r !== null) as string[];

  if (ratings.length > 0) {
    const avg =
      ratings.reduce((sum, r) => sum + parseFloat(r), 0) / ratings.length;
    return { ...supplier, calculatedAverage: avg.toFixed(2) };
  }

  return supplier;
}
