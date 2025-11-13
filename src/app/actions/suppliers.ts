"use server";

/**
 * Supplier Server Actions
 * CRUD operations for supplier management
 */
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { supplierSchema } from "@/types/schemas";
import { getAllSuppliers, getSupplierById } from "@/db/queries/suppliers";

/**
 * Calculate average rating from individual ratings
 */
function calculateAverageRating(
  qualityRating: string | null,
  speedRating: string | null,
  priceRating: string | null,
  supportRating: string | null
): number | null {
  const ratings = [
    qualityRating ? parseFloat(qualityRating) : null,
    speedRating ? parseFloat(speedRating) : null,
    priceRating ? parseFloat(priceRating) : null,
    supportRating ? parseFloat(supportRating) : null,
  ].filter((r) => r !== null && !isNaN(r)) as number[];

  if (ratings.length === 0) return null;

  const sum = ratings.reduce((acc, val) => acc + val, 0);
  const avg = sum / ratings.length;
  return Math.round(avg * 100) / 100; // Round to 2 decimal places
}

/**
 * Get all suppliers for dropdown selection
 */
export async function getSuppliersList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const supplierList = await getAllSuppliers();
  return supplierList.map((s) => ({
    id: s.id,
    name: s.name,
  }));
}

/**
 * Get all suppliers with full details including ratings
 */
export async function getAllSuppliersAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return await getAllSuppliers();
}

/**
 * Get supplier by ID with full details
 */
export async function getSupplierAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return await getSupplierById(id);
}

/**
 * Create a new supplier
 */
export async function createSupplier(data: {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  notes?: string;
  qualityRating?: number;
  speedRating?: number;
  priceRating?: number;
  supportRating?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Validate data
    const validated = supplierSchema.parse(data);

    // Calculate average rating
    const averageRating = calculateAverageRating(
      validated.qualityRating?.toString() || null,
      validated.speedRating?.toString() || null,
      validated.priceRating?.toString() || null,
      validated.supportRating?.toString() || null
    );

    // Create supplier
    const [newSupplier] = await db
      .insert(suppliers)
      .values({
        name: validated.name,
        contactEmail: validated.contactEmail || null,
        contactPhone: validated.contactPhone || null,
        website: validated.website || null,
        notes: validated.notes || null,
        qualityRating: validated.qualityRating?.toString() || null,
        speedRating: validated.speedRating?.toString() || null,
        priceRating: validated.priceRating?.toString() || null,
        supportRating: validated.supportRating?.toString() || null,
        averageRating: averageRating?.toString() || null,
      })
      .returning();

    revalidatePath("/suppliers");
    return { success: true, supplier: newSupplier };
  } catch (error) {
    console.error("Create supplier error:", error);
    throw error;
  }
}

/**
 * Update supplier
 */
export async function updateSupplier(
  id: string,
  data: {
    name?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    notes?: string;
    qualityRating?: number;
    speedRating?: number;
    priceRating?: number;
    supportRating?: number;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Get existing supplier to merge with new data
    const existing = await getSupplierById(id);
    if (!existing) {
      throw new Error("Supplier not found");
    }

    // Merge existing data with updates
    // Convert database string values to numbers for validation
    const updateData = {
      name: data.name ?? existing.name,
      contactEmail: data.contactEmail ?? existing.contactEmail,
      contactPhone: data.contactPhone ?? existing.contactPhone,
      website: data.website ?? existing.website,
      notes: data.notes ?? existing.notes,
      qualityRating:
        data.qualityRating !== undefined
          ? data.qualityRating
          : existing.qualityRating
            ? parseFloat(existing.qualityRating)
            : undefined,
      speedRating:
        data.speedRating !== undefined
          ? data.speedRating
          : existing.speedRating
            ? parseFloat(existing.speedRating)
            : undefined,
      priceRating:
        data.priceRating !== undefined
          ? data.priceRating
          : existing.priceRating
            ? parseFloat(existing.priceRating)
            : undefined,
      supportRating:
        data.supportRating !== undefined
          ? data.supportRating
          : existing.supportRating
            ? parseFloat(existing.supportRating)
            : undefined,
    };

    // Validate merged data
    const validated = supplierSchema.parse(updateData);

    // Calculate average rating
    const averageRating = calculateAverageRating(
      validated.qualityRating?.toString() || null,
      validated.speedRating?.toString() || null,
      validated.priceRating?.toString() || null,
      validated.supportRating?.toString() || null
    );

    // Update supplier
    await db
      .update(suppliers)
      .set({
        name: validated.name,
        contactEmail: validated.contactEmail || null,
        contactPhone: validated.contactPhone || null,
        website: validated.website || null,
        notes: validated.notes || null,
        qualityRating: validated.qualityRating?.toString() || null,
        speedRating: validated.speedRating?.toString() || null,
        priceRating: validated.priceRating?.toString() || null,
        supportRating: validated.supportRating?.toString() || null,
        averageRating: averageRating?.toString() || null,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id));

    revalidatePath("/suppliers");
    revalidatePath(`/suppliers/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Update supplier error:", error);
    throw error;
  }
}

/**
 * Delete supplier
 */
export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db.delete(suppliers).where(eq(suppliers.id, id));

    revalidatePath("/suppliers");
    return { success: true };
  } catch (error) {
    console.error("Delete supplier error:", error);
    throw error;
  }
}
