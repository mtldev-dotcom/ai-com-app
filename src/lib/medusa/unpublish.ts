/**
 * Unpublish Draft from Medusa
 * Deletes product from Medusa and resets local draft status
 */
import { medusaClient } from "./client";
import { getProductDraftById } from "@/db/queries/products-draft";
import { db } from "@/db";
import { productsDraft } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteEntityInMedusa } from "./sync";

export interface UnpublishResult {
  success: boolean;
  error?: string;
}

/**
 * Unpublish a product draft from Medusa
 * Deletes the product from Medusa and resets local status to draft
 */
export async function unpublishDraft(
  productDraftId: string
): Promise<UnpublishResult> {
  try {
    // Fetch draft
    const draftData = await getProductDraftById(productDraftId);
    if (!draftData) {
      return {
        success: false,
        error: "Product draft not found",
      };
    }

    const product = draftData.product;

    // Check if product is published
    if (!product.medusaProductId) {
      return {
        success: false,
        error: "Product is not published to Medusa",
      };
    }

    const medusaProductId = product.medusaProductId;

    // Delete product from Medusa
    try {
      await deleteEntityInMedusa("product", medusaProductId);
    } catch (error) {
      // If product already deleted in Medusa, that's okay
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        !errorMessage.includes("404") &&
        !errorMessage.includes("not found") &&
        !errorMessage.includes("Product not found")
      ) {
        // Re-throw if it's not a "not found" error
        throw error;
      }
      console.warn(
        "Product already deleted in Medusa, continuing with local cleanup"
      );
    }

    // Reset local draft status and clear Medusa IDs
    await db
      .update(productsDraft)
      .set({
        status: "draft",
        medusaProductId: null,
        medusaVariantIds: null,
        updatedAt: new Date(),
      })
      .where(eq(productsDraft.id, productDraftId));

    return { success: true };
  } catch (error) {
    console.error("Error unpublishing draft from Medusa:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to unpublish product from Medusa",
    };
  }
}

