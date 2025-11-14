"use server";

/**
 * Draft Server Actions
 * Handles save, update, delete, and AI enrichment for product drafts
 */
import { db } from "@/db";
import { productsDraft } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { productDraftSchema } from "@/types/schemas";
import { enrichProductAction } from "./ai";
import {
  getAllProductDrafts,
  getProductDraftById,
} from "@/db/queries/products-draft";
import { deleteEntityInMedusa } from "@/lib/medusa/sync";
import { medusaClient, type MedusaProduct } from "@/lib/medusa/client";
import { updateDraftToMedusa } from "@/lib/medusa/update";
import { unpublishDraft } from "@/lib/medusa/unpublish";

/**
 * Get all product drafts (server action)
 */
export async function getAllProductDraftsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return await getAllProductDrafts();
}

/**
 * Get product draft by ID (server action)
 */
export async function getProductDraftAction(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return await getProductDraftById(id);
}

/**
 * Save or update product draft
 */
export async function saveDraft(
  id: string | null,
  data: {
    supplierId: string;
    titleEn?: string;
    titleFr?: string;
    subtitle?: string;
    descriptionEn?: string;
    descriptionFr?: string;
    metaTitle?: string;
    metaDescription?: string;
    images?: string[];
    cost: string;
    sellingPrice?: string;
    margin?: string;
    // Dedicated columns
    sku?: string;
    handle?: string;
    currency?: string;
    supplierProductId?: string;
    supplierVariantId?: string;
    marketplaceUrl?: string;
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
    material?: string;
    originCountry?: string;
    hsCode?: string;
    midCode?: string;
    type?: string;
    collectionId?: string;
    categoryIds?: string[];
    salesChannelIds?: string[];
    stockLocationIds?: string[];
    locationInventory?: Record<string, number>;
    tags?: string[];
    specifications?: Record<string, unknown>;
    status?: "draft" | "enriched" | "ready" | "published" | "archived";
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
    // Validate data
    // Convert null values to undefined for Zod validation (schema expects undefined, not null)
    const validated = productDraftSchema.parse({
      ...data,
      cost: parseFloat(data.cost),
      sellingPrice: data.sellingPrice
        ? parseFloat(data.sellingPrice)
        : undefined,
      margin: data.margin ? parseFloat(data.margin) : undefined,
      metaTitle: data.metaTitle ?? undefined,
      metaDescription: data.metaDescription ?? undefined,
      titleEn: data.titleEn ?? undefined,
      titleFr: data.titleFr ?? undefined,
      descriptionEn: data.descriptionEn ?? undefined,
      descriptionFr: data.descriptionFr ?? undefined,
    });

    if (id) {
      // Update existing draft
      // Convert numeric fields to strings for database (Drizzle uses string for numeric types)
      await db
        .update(productsDraft)
        .set({
          supplierId: validated.supplierId,
          titleEn: validated.titleEn,
          titleFr: validated.titleFr,
          subtitle: data.subtitle || undefined,
          descriptionEn: validated.descriptionEn,
          descriptionFr: validated.descriptionFr,
          metaTitle: validated.metaTitle,
          metaDescription: validated.metaDescription,
          images: validated.images,
          cost: validated.cost.toString(),
          sellingPrice: validated.sellingPrice?.toString(),
          margin: validated.margin?.toString(),
          // Dedicated columns
          sku: data.sku || undefined,
          handle: data.handle || undefined,
          currency: data.currency || "USD", // Always USD
          supplierProductId: data.supplierProductId || undefined,
          supplierVariantId: data.supplierVariantId || undefined,
          marketplaceUrl: data.marketplaceUrl || undefined,
          weight: data.weight ? data.weight.toString() : undefined,
          length: data.length ? data.length.toString() : undefined,
          width: data.width ? data.width.toString() : undefined,
          height: data.height ? data.height.toString() : undefined,
          material: data.material || undefined,
          originCountry: data.originCountry || undefined,
          hsCode: data.hsCode || undefined,
          midCode: data.midCode || undefined,
          type: data.type || undefined,
          collectionId: data.collectionId || undefined,
          categoryIds: data.categoryIds || undefined,
          salesChannelIds: data.salesChannelIds || undefined,
          stockLocationIds: data.stockLocationIds || undefined,
          locationInventory: data.locationInventory || undefined,
          tags: data.tags || undefined,
          specifications: validated.specifications,
          status: validated.status,
          updatedAt: new Date(),
        })
        .where(eq(productsDraft.id, id));

      revalidatePath(`/products/${id}`);
      revalidatePath("/products");
      return { success: true, id };
    } else {
      // Create new draft
      // Convert numeric fields to strings for database (Drizzle uses string for numeric types)
      const [newDraft] = await db
        .insert(productsDraft)
        .values({
          supplierId: validated.supplierId,
          titleEn: validated.titleEn,
          titleFr: validated.titleFr,
          subtitle: data.subtitle || undefined,
          descriptionEn: validated.descriptionEn,
          descriptionFr: validated.descriptionFr,
          metaTitle: validated.metaTitle,
          metaDescription: validated.metaDescription,
          images: validated.images,
          cost: validated.cost.toString(),
          sellingPrice: validated.sellingPrice?.toString(),
          margin: validated.margin?.toString(),
          // Dedicated columns
          sku: data.sku || undefined,
          handle: data.handle || undefined,
          currency: data.currency || "USD", // Always USD
          supplierProductId: data.supplierProductId || undefined,
          supplierVariantId: data.supplierVariantId || undefined,
          marketplaceUrl: data.marketplaceUrl || undefined,
          weight: data.weight ? data.weight.toString() : undefined,
          length: data.length ? data.length.toString() : undefined,
          width: data.width ? data.width.toString() : undefined,
          height: data.height ? data.height.toString() : undefined,
          material: data.material || undefined,
          originCountry: data.originCountry || undefined,
          hsCode: data.hsCode || undefined,
          midCode: data.midCode || undefined,
          type: data.type || undefined,
          collectionId: data.collectionId || undefined,
          categoryIds: data.categoryIds || undefined,
          salesChannelIds: data.salesChannelIds || undefined,
          stockLocationIds: data.stockLocationIds || undefined,
          locationInventory: data.locationInventory || undefined,
          tags: data.tags || undefined,
          specifications: validated.specifications,
          status: validated.status,
        })
        .returning();

      revalidatePath("/products");
      return { success: true, id: newDraft.id };
    }
  } catch (error) {
    console.error("Save draft error:", error);
    throw error;
  }
}

/**
 * Delete product draft
 * If product is published to Medusa, also deletes it from Medusa
 */
export async function deleteDraft(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // First, get the draft to check if it has a Medusa product ID
    const draftData = await getProductDraftById(id);
    
    if (!draftData) {
      throw new Error("Product draft not found");
    }

    const medusaProductId = draftData.product.medusaProductId;

    // If product is published to Medusa, delete it from Medusa first
    if (medusaProductId) {
      try {
        await deleteEntityInMedusa("product", medusaProductId);
        console.log(`Product ${medusaProductId} deleted from Medusa`);
      } catch (medusaError) {
        console.error("Error deleting product from Medusa:", medusaError);
        // Continue with local deletion even if Medusa deletion fails
        // This allows users to clean up local database even if Medusa is unreachable
        const errorMessage =
          medusaError instanceof Error
            ? medusaError.message
            : "Unknown error";
        throw new Error(
          `Failed to delete product from Medusa: ${errorMessage}. Local product not deleted.`
        );
      }
    }

    // Delete from local database
    await db.delete(productsDraft).where(eq(productsDraft.id, id));

    revalidatePath("/drafts");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Delete draft error:", error);
    throw error;
  }
}

/**
 * Enrich draft with AI and update it
 */
export async function enrichDraft(
  id: string,
  provider: "openai" | "gemini" = "openai"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Get draft
    const draft = await db
      .select()
      .from(productsDraft)
      .where(eq(productsDraft.id, id))
      .limit(1);

    if (!draft[0]) {
      throw new Error("Draft not found");
    }

    // Enrich with AI
    const enriched = await enrichProductAction({
      productId: id,
      provider,
    });

    // Update draft with enriched data
    await db
      .update(productsDraft)
      .set({
        titleEn: enriched.titleEn || draft[0].titleEn,
        titleFr: enriched.titleFr || draft[0].titleFr,
        subtitle: enriched.subtitle || draft[0].subtitle,
        descriptionEn: enriched.descriptionEn || draft[0].descriptionEn,
        descriptionFr: enriched.descriptionFr || draft[0].descriptionFr,
        specifications: enriched.specifications || draft[0].specifications,
        status: "enriched",
        updatedAt: new Date(),
      })
      .where(eq(productsDraft.id, id));

    revalidatePath(`/products/${id}`);
    revalidatePath("/products");

    return { success: true, enriched };
  } catch (error) {
    console.error("Enrich draft error:", error);
    throw error;
  }
}

/**
 * Sync product from Medusa to local database
 * Fetches latest data from Medusa and updates local draft
 * Handles product deletion (if product was deleted in Medusa)
 */
export async function syncDraftFromMedusa(draftId: string): Promise<{
  success: boolean;
  synced?: boolean;
  deleted?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // Get draft to check if it has a Medusa product ID
    const draftData = await getProductDraftById(draftId);
    if (!draftData) {
      return { success: false, error: "Draft not found" };
    }

    const medusaProductId = draftData.product.medusaProductId;
    if (!medusaProductId) {
      return { success: false, error: "Product is not published to Medusa" };
    }

    // Fetch product from Medusa
    let medusaProduct: MedusaProduct;
    try {
      medusaProduct = await medusaClient.getProduct(medusaProductId);
    } catch (error) {
      // Handle product deletion (404 error or "not found" message)
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : "";
      const isNotFound = 
        errorMessage.includes("404") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("product not found");
      
      if (isNotFound) {
        // Product was deleted in Medusa, mark status back to draft
        await db
          .update(productsDraft)
          .set({
            status: "draft",
            medusaProductId: null,
            medusaVariantIds: null,
            updatedAt: new Date(),
          })
          .where(eq(productsDraft.id, draftId));

        revalidatePath(`/drafts/${draftId}`);
        revalidatePath("/products");
        return { success: true, deleted: true };
      }
      throw error;
    }

    // Extract data from Medusa product
    const imageUrls = medusaProduct.images?.map((img) => img.url) || [];
    
    // Get selling price from first variant (or use existing)
    let sellingPrice: string | undefined;
    if (medusaProduct.variants && medusaProduct.variants.length > 0) {
      const firstVariant = medusaProduct.variants[0];
      if (firstVariant.price) {
        sellingPrice = firstVariant.price.toString();
      }
    }

    // Extract variant IDs
    const variantIds = medusaProduct.variants?.map((v) => v.id) || [];

    // Extract categories and collection from product structure
    const categoryIds = medusaProduct.categories?.map((cat) => cat.id) || undefined;
    const collectionId = medusaProduct.collection_id || undefined;
    
    // Extract sales channels from product (if available in response)
    // Note: Sales channels might not be in product response, may need separate API call
    const salesChannelIds = medusaProduct.sales_channels?.map((sc) => sc.id) || undefined;
    
    // Stock locations are typically associated with inventory items/variants, not products directly
    // We'll keep the local stockLocationIds but won't sync them from product response

    // Update local draft with Medusa data
    await db
      .update(productsDraft)
      .set({
        // Update title if changed (preserve EN/FR split if exists)
        titleEn: medusaProduct.title || draftData.product.titleEn,
        // Update description
        descriptionEn: medusaProduct.description || draftData.product.descriptionEn,
        // Update images
        images: imageUrls.length > 0 ? imageUrls : draftData.product.images,
        // Update selling price if available
        sellingPrice: sellingPrice || draftData.product.sellingPrice,
        // Update handle
        handle: medusaProduct.handle || draftData.product.handle,
        // Update variant IDs
        medusaVariantIds: variantIds.length > 0 ? variantIds : draftData.product.medusaVariantIds,
        // Update categories if available (only update if we got categories from Medusa)
        categoryIds: categoryIds !== undefined ? categoryIds : draftData.product.categoryIds,
        // Update collection if available (only update if we got collection from Medusa)
        collectionId: collectionId !== undefined ? collectionId : draftData.product.collectionId,
        // Update sales channels if available (only update if we got sales channels from Medusa)
        salesChannelIds: salesChannelIds !== undefined ? salesChannelIds : draftData.product.salesChannelIds,
        // Update specifications with Medusa metadata
        specifications: {
          ...(draftData.product.specifications as Record<string, unknown> || {}),
          medusa_handle: medusaProduct.handle,
          medusa_updated_at: medusaProduct.updated_at,
          ...(medusaProduct.metadata || {}),
        },
        updatedAt: new Date(),
      })
      .where(eq(productsDraft.id, draftId));

        revalidatePath(`/products/${draftId}`);
        revalidatePath("/products");

    return { success: true, synced: true };
  } catch (error) {
    console.error("Sync draft from Medusa error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync from Medusa",
    };
  }
}

/**
 * Update draft to Medusa (push changes to existing published product)
 */
export async function updateDraftToMedusaAction(
  draftId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await updateDraftToMedusa(draftId);
    return result;
  } catch (error) {
    console.error("Error updating draft to Medusa:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update product in Medusa",
    };
  }
}

/**
 * Unpublish draft from Medusa (delete from Medusa and reset local status)
 */
export async function unpublishDraftAction(
  draftId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await unpublishDraft(draftId);
    return result;
  } catch (error) {
    console.error("Error unpublishing draft:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to unpublish product from Medusa",
    };
  }
}
