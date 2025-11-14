/**
 * Update Draft to Medusa
 * Updates an existing product in Medusa from draft data
 */
import { medusaClient } from "./client";
import { getProductDraftById } from "@/db/queries/products-draft";
import { db } from "@/db";
import { productsDraft } from "@/db/schema";
import { eq } from "drizzle-orm";
import { copyImagesToPublished } from "@/lib/s3/upload";
import { getMedusaBaseUrl, getAuthHeader } from "./sync";

export interface UpdateResult {
  success: boolean;
  error?: string;
}

/**
 * Update a product draft to Medusa (for already published products)
 */
export async function updateDraftToMedusa(
  productDraftId: string
): Promise<UpdateResult> {
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
        error: "Product is not published to Medusa. Use 'Publish' instead.",
      };
    }

    const medusaProductId = product.medusaProductId;

    // Prepare product data for update
    const productTitle = product.titleEn || product.titleFr || "Untitled";
    const productDescription =
      product.descriptionEn || product.descriptionFr || "";

    // Copy images from drafts/ to published/ folder in S3 (if changed)
    let publishedImageUrls: string[] = [];
    if (product.images && product.images.length > 0) {
      try {
        publishedImageUrls = await copyImagesToPublished(product.images);
      } catch (error) {
        console.warn("Failed to copy images:", error);
        // Continue with update even if image copy fails
      }
    }

    // Prepare Medusa image format
    const medusaImages =
      publishedImageUrls.length > 0
        ? publishedImageUrls.map((url) => ({ url }))
        : undefined;

    // Extract metadata
    const specs = product.specifications || {};
    const metadata: Record<string, unknown> = {
      ...specs,
      supplier_id: product.supplierId || undefined,
      supplier_product_id: product.supplierProductId || undefined,
      supplier_variant_id: product.supplierVariantId || undefined,
      marketplace_url: product.marketplaceUrl || undefined,
      cost: product.cost || undefined,
      margin: product.margin || undefined,
    };

    // Extract collection and categories
    const collectionId =
      product.collectionId ||
      (specs.collection_id as string | undefined) ||
      undefined;

    const categoryIds =
      product.categoryIds && product.categoryIds.length > 0
        ? product.categoryIds
        : Array.isArray(specs.category_ids)
          ? (specs.category_ids as string[])
          : specs.category_id
            ? [specs.category_id as string]
            : [];

    // Prepare categories array for Medusa
    const medusaCategories =
      categoryIds.length > 0 ? categoryIds.map((id) => ({ id })) : undefined;

    // Extract tags
    const tagsArray =
      product.tags && product.tags.length > 0
        ? product.tags
        : specs.tags
          ? Array.isArray(specs.tags)
            ? (specs.tags as string[])
            : [specs.tags as string]
          : [];

    const medusaTags =
      tagsArray.length > 0
        ? tagsArray.map((tag) => ({ value: tag }))
        : undefined;

    // Extract dimensions and weight
    const weight = product.weight ? parseFloat(product.weight) : undefined;
    const length = product.length ? parseFloat(product.length) : undefined;
    const height = product.height ? parseFloat(product.height) : undefined;
    const width = product.width ? parseFloat(product.width) : undefined;
    const originCountry = product.originCountry || undefined;
    const hsCode = product.hsCode || undefined;
    const midCode = product.midCode || undefined;
    const material = product.material || undefined;

    // Update product in Medusa
    await medusaClient.updateProduct(medusaProductId, {
      title: productTitle,
      description: productDescription,
      handle: product.handle || undefined,
      images: medusaImages,
      metadata,
      collection_id: collectionId || undefined,
      categories: medusaCategories,
      tags: medusaTags,
      weight: weight ? Math.round(weight * 1000) : undefined, // Convert kg to grams
      length: length ? Math.round(length * 10) : undefined, // Convert cm to mm
      height: height ? Math.round(height * 10) : undefined, // Convert cm to mm
      width: width ? Math.round(width * 10) : undefined, // Convert cm to mm
      origin_country: originCountry || undefined,
      hs_code: hsCode || undefined,
      mid_code: midCode || undefined,
      material: material || undefined,
    });

    // Update sales channels if changed
    const salesChannelIds =
      product.salesChannelIds && product.salesChannelIds.length > 0
        ? product.salesChannelIds
        : Array.isArray(specs.sales_channel_ids)
          ? (specs.sales_channel_ids as string[])
          : specs.sales_channel_id
            ? [specs.sales_channel_id as string]
            : [];

    if (salesChannelIds.length > 0) {
      try {
        const baseUrl = await getMedusaBaseUrl();
        const authHeader = await getAuthHeader();

        // First, get current sales channels
        const currentProduct = await medusaClient.getProduct(medusaProductId);
        const currentSalesChannelIds =
          currentProduct.sales_channels?.map((sc) => sc.id) || [];

        // Remove channels not in new list
        const channelsToRemove = currentSalesChannelIds.filter(
          (id) => !salesChannelIds.includes(id)
        );
        for (const channelId of channelsToRemove) {
          await fetch(
            `${baseUrl}/admin/products/${medusaProductId}/sales-channels`,
            {
              method: "POST",
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                remove: [channelId],
              }),
            }
          );
        }

        // Add new channels
        const channelsToAdd = salesChannelIds.filter(
          (id) => !currentSalesChannelIds.includes(id)
        );
        for (const channelId of channelsToAdd) {
          await fetch(
            `${baseUrl}/admin/products/${medusaProductId}/sales-channels`,
            {
              method: "POST",
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                add: [channelId],
              }),
            }
          );
        }
      } catch (error) {
        console.warn("Failed to update sales channels:", error);
        // Don't fail the entire update if sales channel update fails
      }
    }

    // Update inventory location levels if changed
    const stockLocationIds =
      product.stockLocationIds && product.stockLocationIds.length > 0
        ? product.stockLocationIds
        : Array.isArray(specs.stock_location_ids)
          ? (specs.stock_location_ids as string[])
          : specs.stock_location_id
            ? [specs.stock_location_id as string]
            : [];

    const locationInventory =
      product.locationInventory ||
      (specs.location_inventory as Record<string, number>) ||
      {};

    if (
      stockLocationIds.length > 0 &&
      Object.keys(locationInventory).length > 0
    ) {
      try {
        const baseUrl = await getMedusaBaseUrl();
        const authHeader = await getAuthHeader();

        // Get current product variants
        const currentProduct = await medusaClient.getProduct(medusaProductId);
        const variantIds =
          currentProduct.variants?.map((v) => v.id) || [];

        // Update inventory for each variant
        for (const variantId of variantIds) {
          // Get variant to find inventory item
          const variantRes = await fetch(
            `${baseUrl}/admin/products/${medusaProductId}/variants/${variantId}`,
            {
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
              },
            }
          );

          if (!variantRes.ok) continue;

          const variantData = await variantRes.json();
          const variant = variantData.variant;

          let inventoryItemId: string | null = null;
          if (variant.inventory_items && variant.inventory_items.length > 0) {
            inventoryItemId = variant.inventory_items[0].id;
          } else if (variant.inventory_item_id) {
            inventoryItemId = variant.inventory_item_id;
          }

          if (inventoryItemId) {
            // Update location levels
            const locationLevels = stockLocationIds
              .filter(
                (locId) =>
                  locationInventory[locId] !== undefined &&
                  locationInventory[locId] > 0
              )
              .map((locId) => ({
                location_id: locId,
                stocked_quantity: locationInventory[locId],
              }));

            if (locationLevels.length > 0) {
              await fetch(
                `${baseUrl}/admin/inventory-items/${inventoryItemId}/location-levels/batch`,
                {
                  method: "POST",
                  headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    create: locationLevels,
                    update: locationLevels, // Update existing levels
                  }),
                }
              );
            }
          }
        }
      } catch (error) {
        console.warn("Failed to update inventory location levels:", error);
        // Don't fail the entire update if inventory update fails
      }
    }

    // Update draft with published image URLs
    await db
      .update(productsDraft)
      .set({
        images:
          publishedImageUrls.length > 0
            ? publishedImageUrls
            : product.images || undefined,
        updatedAt: new Date(),
      })
      .where(eq(productsDraft.id, productDraftId));

    return { success: true };
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

