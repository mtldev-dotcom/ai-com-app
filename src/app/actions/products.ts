"use server";

/**
 * Products Server Actions
 * Handles fetching products from both Supabase (local drafts) and Medusa store
 */
import { createClient } from "@/lib/supabase/server";
import { getAllProductDrafts } from "@/db/queries/products-draft";
import { fetchProducts } from "@/lib/medusa/sync";
import { db } from "@/db";
import { productsDraft, suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { MedusaProduct } from "@/lib/medusa/client";

/**
 * Get all local products from Supabase database
 * @returns Array of product drafts with supplier information
 */
export async function getAllLocalProducts() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    return await getAllProductDrafts();
  } catch (error) {
    console.error("Error fetching local products:", error);
    throw new Error("Failed to fetch local products");
  }
}

/**
 * Get all products from Medusa store
 * @param limit - Maximum number of products to fetch (default: 100)
 * @param offset - Pagination offset (default: 0)
 * @returns Array of Medusa products
 */
export async function getAllMedusaProducts(limit = 100, offset = 0) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    return await fetchProducts(limit, offset);
  } catch (error) {
    console.error("Error fetching Medusa products:", error);
    // Return empty array if Medusa is not configured or connection fails
    // This allows the UI to show an empty state rather than erroring
    if (error instanceof Error && error.message.includes("not configured")) {
      return [];
    }
    throw new Error("Failed to fetch Medusa products. Please check your Medusa configuration.");
  }
}

/**
 * Get or create a default "Medusa" supplier for synced products
 */
async function getOrCreateMedusaSupplier(): Promise<string> {
  // Check if "Medusa" supplier exists
  const existingSuppliers = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.name, "Medusa"))
    .limit(1);

  if (existingSuppliers.length > 0) {
    return existingSuppliers[0].id;
  }

  // Create Medusa supplier if it doesn't exist
  const [medusaSupplier] = await db
    .insert(suppliers)
    .values({
      name: "Medusa",
      notes: "Default supplier for products synced from Medusa store",
    })
    .returning();

  return medusaSupplier.id;
}

/**
 * Sync a Medusa product to Supabase product draft
 * @param medusaProduct - Medusa product to sync
 * @returns Created product draft ID
 */
export async function syncMedusaProductToDraft(
  medusaProduct: MedusaProduct
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Check if product already exists (by medusa_product_id)
    const existing = await db
      .select()
      .from(productsDraft)
      .where(eq(productsDraft.medusaProductId, medusaProduct.id))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: false,
        error: "Product already synced",
        draftId: existing[0].id,
      };
    }

    // Get or create Medusa supplier
    const supplierId = await getOrCreateMedusaSupplier();

    // Extract images from Medusa product
    const imageUrls: string[] =
      medusaProduct.images?.map((img) => img.url) || [];

    // Calculate selling price from variants (use first variant or average)
    let sellingPrice: string | undefined;
    if (medusaProduct.variants && medusaProduct.variants.length > 0) {
      const prices = medusaProduct.variants
        .map((v) => v.price)
        .filter((p) => p > 0);
      if (prices.length > 0) {
        const avgPrice =
          prices.reduce((sum, p) => sum + p, 0) / prices.length;
        sellingPrice = avgPrice.toString();
      }
    }

    // Estimate cost as 50% of selling price (user can update later)
    let cost: string;
    if (sellingPrice) {
      cost = (parseFloat(sellingPrice) * 0.5).toFixed(2);
    } else {
      cost = "0.01"; // Minimum value
    }

    // Extract variant IDs
    const variantIds: string[] =
      medusaProduct.variants?.map((v) => v.id) || [];

    // Store metadata in specifications field
    const specifications: Record<string, unknown> = {
      medusa_handle: medusaProduct.handle,
      ...(medusaProduct.metadata || {}),
    };

    // Create product draft with status "published" since it's already in Medusa
    const [newDraft] = await db
      .insert(productsDraft)
      .values({
        supplierId,
        titleEn: medusaProduct.title,
        descriptionEn: medusaProduct.description || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        cost,
        sellingPrice,
        medusaProductId: medusaProduct.id,
        medusaVariantIds: variantIds.length > 0 ? variantIds : undefined,
        specifications,
        status: "published", // Set to published since product already exists in Medusa
      })
      .returning();

    revalidatePath("/products");

    return {
      success: true,
      draftId: newDraft.id,
    };
  } catch (error) {
    console.error("Error syncing Medusa product to draft:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to sync product to database"
    );
  }
}

