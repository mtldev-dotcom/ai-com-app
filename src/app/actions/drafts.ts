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
    descriptionEn?: string;
    descriptionFr?: string;
    metaTitle?: string;
    metaDescription?: string;
    images?: string[];
    cost: string;
    sellingPrice?: string;
    margin?: string;
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
          descriptionEn: validated.descriptionEn,
          descriptionFr: validated.descriptionFr,
          metaTitle: validated.metaTitle,
          metaDescription: validated.metaDescription,
          images: validated.images,
          cost: validated.cost.toString(),
          sellingPrice: validated.sellingPrice?.toString(),
          margin: validated.margin?.toString(),
          specifications: validated.specifications,
          status: validated.status,
          updatedAt: new Date(),
        })
        .where(eq(productsDraft.id, id));

      revalidatePath(`/drafts/${id}`);
      revalidatePath("/drafts");
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
          descriptionEn: validated.descriptionEn,
          descriptionFr: validated.descriptionFr,
          metaTitle: validated.metaTitle,
          metaDescription: validated.metaDescription,
          images: validated.images,
          cost: validated.cost.toString(),
          sellingPrice: validated.sellingPrice?.toString(),
          margin: validated.margin?.toString(),
          specifications: validated.specifications,
          status: validated.status,
        })
        .returning();

      revalidatePath("/drafts");
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
        descriptionEn: enriched.descriptionEn || draft[0].descriptionEn,
        descriptionFr: enriched.descriptionFr || draft[0].descriptionFr,
        specifications: enriched.specifications || draft[0].specifications,
        status: "enriched",
        updatedAt: new Date(),
      })
      .where(eq(productsDraft.id, id));

    revalidatePath(`/drafts/${id}`);
    revalidatePath("/drafts");

    return { success: true, enriched };
  } catch (error) {
    console.error("Enrich draft error:", error);
    throw error;
  }
}
