/**
 * Publish Draft to Medusa
 * Creates product and variants in Medusa from draft data
 */
import { medusaClient } from "./client";
import { getProductDraftById } from "@/db/queries/products-draft";
import { db } from "@/db";
import { productsDraft, variantsDraft } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { VariantDraft } from "@/db/schema/variants-draft";
import { copyImagesToPublished } from "@/lib/s3/upload";
import { getMedusaBaseUrl, getAuthHeader } from "./sync";

export interface PublishResult {
  success: boolean;
  medusaProductId?: string;
  medusaVariantIds?: string[];
  error?: string;
}

/**
 * Get variants for a product draft
 */
async function getDraftVariants(
  productDraftId: string
): Promise<VariantDraft[]> {
  return await db
    .select()
    .from(variantsDraft)
    .where(eq(variantsDraft.productDraftId, productDraftId));
}

/**
 * Publish a product draft to Medusa
 */
export async function publishDraft(
  productDraftId: string
): Promise<PublishResult> {
  try {
    // Fetch draft and variants
    const draftData = await getProductDraftById(productDraftId);
    if (!draftData) {
      return {
        success: false,
        error: "Product draft not found",
      };
    }

    const product = draftData.product;
    const variants = await getDraftVariants(productDraftId);

    // Check if already published
    if (product.medusaProductId) {
      return {
        success: false,
        error: "Product has already been published to Medusa",
      };
    }

    // Validate required fields
    if (!product.titleEn && !product.titleFr) {
      return {
        success: false,
        error: "Product must have at least one title (EN or FR)",
      };
    }

    if (!product.sellingPrice || parseFloat(product.sellingPrice) <= 0) {
      return {
        success: false,
        error: "Product must have a selling price greater than 0",
      };
    }

    // Prepare product payload for Medusa
    const productTitle = product.titleEn || product.titleFr || "Untitled";
    const productDescription =
      product.descriptionEn || product.descriptionFr || "";

    // Copy images from drafts/ to published/ folder in S3
    let publishedImageUrls: string[] = [];
    if (product.images && product.images.length > 0) {
      try {
        console.log(
          "Processing images for publish. Total images:",
          product.images.length
        );

        // Filter S3 URLs (those that contain "drafts" in the path)
        // Check for both "/drafts/" and "/drafts" patterns to handle different URL formats
        const s3DraftUrls = product.images.filter((url) => {
          try {
            const urlObj = new URL(url);
            return urlObj.pathname.includes("/drafts");
          } catch {
            // If URL parsing fails, use simple string check
            return url.includes("/drafts");
          }
        });

        const externalUrls = product.images.filter((url) => {
          try {
            const urlObj = new URL(url);
            return !urlObj.pathname.includes("/drafts");
          } catch {
            return !url.includes("/drafts");
          }
        });

        console.log("S3 draft URLs to copy:", s3DraftUrls.length);
        console.log("External URLs to keep:", externalUrls.length);

        if (s3DraftUrls.length > 0) {
          // Copy S3 images from drafts to published
          console.log("Copying images from drafts to published folder...");
          publishedImageUrls = await copyImagesToPublished(s3DraftUrls);
          console.log(
            "Successfully copied",
            publishedImageUrls.length,
            "images"
          );
        } else {
          console.log("No S3 draft images to copy");
        }

        // Keep external URLs as-is
        publishedImageUrls = [...publishedImageUrls, ...externalUrls];
        console.log("Final published image URLs:", publishedImageUrls.length);
      } catch (error) {
        console.error("Failed to copy images to published folder:", error);
        console.error(
          "Error details:",
          error instanceof Error ? error.stack : error
        );
        // Continue with original images if copy fails - but this means images won't be in published folder
        publishedImageUrls = product.images;
        // Don't throw - we want to continue publishing even if image copy fails
        // But log the error so we know what happened
      }
    } else {
      console.log("No images to process for this product");
    }

    // Convert images array to Medusa format
    // Use publishedImageUrls if available, otherwise fall back to original images
    const imagesForMedusa =
      publishedImageUrls.length > 0 ? publishedImageUrls : product.images || [];

    console.log("Images to send to Medusa:", imagesForMedusa.length);
    console.log("Image URLs:", imagesForMedusa);

    const medusaImages = imagesForMedusa.map((url) => ({ url }));

    // Extract Medusa-specific fields from dedicated columns first, then fallback to specifications
    const specs = (product.specifications as Record<string, unknown>) || {};
    
    // Use dedicated columns for these fields (preferred)
    const handle = product.handle || (specs.handle as string) || undefined;
    const sku = product.sku || (specs.sku as string) || undefined;
    const weight = product.weight ? parseFloat(product.weight) : (specs.weight as number) || undefined;
    const length = product.length ? parseFloat(product.length) : (specs.length as number) || undefined;
    const height = product.height ? parseFloat(product.height) : (specs.height as number) || undefined;
    const width = product.width ? parseFloat(product.width) : (specs.width as number) || undefined;
    const originCountry = product.originCountry || (specs.origin_country as string) || undefined;
    const hsCode = product.hsCode || (specs.hs_code as string) || undefined;
    const midCode = product.midCode || (specs.mid_code as string) || undefined;
    const material = product.material || (specs.material as string) || undefined;
    
    // Categories: Use dedicated column first, then fallback to specifications
    const categoryIds = product.categoryIds && product.categoryIds.length > 0
      ? product.categoryIds
      : Array.isArray(specs.category_ids)
        ? (specs.category_ids as string[])
        : specs.category_id
          ? [specs.category_id as string]
          : [];
    
    // Collection: Use dedicated column first, then fallback to specifications
    const collectionId = product.collectionId || (specs.collection_id as string) || undefined;
    
    // Sales Channels: Use dedicated column first, then fallback to specifications
    const salesChannelIds = product.salesChannelIds && product.salesChannelIds.length > 0
      ? product.salesChannelIds
      : Array.isArray(specs.sales_channel_ids)
        ? (specs.sales_channel_ids as string[])
        : specs.sales_channel_id
          ? [specs.sales_channel_id as string]
          : [];
    
    // Stock Locations: Use dedicated column first, then fallback to specifications
    const stockLocationIds = product.stockLocationIds && product.stockLocationIds.length > 0
      ? product.stockLocationIds
      : Array.isArray(specs.stock_location_ids)
        ? (specs.stock_location_ids as string[])
        : specs.stock_location_id
          ? [specs.stock_location_id as string]
          : [];
    
    // Location Inventory: Inventory quantities per location
    const locationInventory = product.locationInventory || (specs.location_inventory as Record<string, number>) || {};
    
    // Tags: Use dedicated column first, then fallback to specifications
    const tagsArray = product.tags && product.tags.length > 0
      ? product.tags
      : specs.tags
        ? Array.isArray(specs.tags)
          ? (specs.tags as string[])
          : []
        : undefined;
    
    // Currency is always USD
    const currencyCode = "USD";

    // Generate handle from title if not provided
    let productHandle = handle;
    if (!productHandle && productTitle) {
      productHandle = productTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100); // Limit length
    }

    // Prepare metadata with supplier and cost info
    // Exclude Medusa-specific fields from metadata (they go directly to product)
    const metadata: Record<string, unknown> = {
      supplier_id: product.supplierId,
      cost: product.cost,
      margin: product.margin,
      draft_id: productDraftId,
    };

    // Copy other non-Medusa fields from specifications to metadata
    Object.keys(specs).forEach((key) => {
      if (
        ![
          "currency_code",
          "handle",
          "sku",
          "weight",
          "length",
          "height",
          "width",
          "origin_country",
          "category_ids",
          "category_id",
          "type_id",
          "hs_code",
          "mid_code",
          "material",
          "type",
          "collection_id",
          "tags",
        ].includes(key)
      ) {
        metadata[key] = specs[key];
      }
    });

    // Prepare product options and variants for Medusa v2
    // Medusa requires options and variants to be provided when creating a product
    let productOptions: Array<{ title: string; values: string[] }> = [];
    let productVariants: Array<{
      title: string;
      options?: Record<string, string>;
      prices: Array<{ amount: number; currency_code: string }>;
      sku?: string;
    }> = [];

    if (variants.length > 0) {
      // If we have variants, create options from them
      // For simplicity, we'll create a single "Default" option
      productOptions = [
        {
          title: "Default",
          values: variants.map((v, i) => `Variant ${i + 1}`),
        },
      ];

      // Create variants with their prices
      productVariants = variants.map((variant, index) => {
        const variantPriceInDollars =
          parseFloat(product.sellingPrice || "0") +
          parseFloat(variant.priceAdjustment || "0");
        const variantPriceInCents = Math.round(variantPriceInDollars * 100);
        
        console.log(`Variant ${index + 1} price conversion: $${variantPriceInDollars} USD = ${variantPriceInCents} cents`);

        return {
          title: variant.name || `Variant ${index + 1}`,
          options: {
            Default: `Variant ${index + 1}`,
          },
          prices: [
            {
              amount: variantPriceInCents, // Price in cents
              currency_code: currencyCode, // USD
            },
          ],
          sku: variant.sku || sku || undefined,
        };
      });
    } else {
      // If no variants exist, create a default option and variant
      productOptions = [
        {
          title: "Default",
          values: ["Default Option"],
        },
      ];

      // Convert selling price from dollars to cents (Medusa expects prices in cents)
      const sellingPriceInDollars = parseFloat(product.sellingPrice || "0");
      const sellingPriceInCents = Math.round(sellingPriceInDollars * 100);
      
      console.log(`Price conversion: $${sellingPriceInDollars} USD = ${sellingPriceInCents} cents`);
      
      productVariants = [
        {
          title: "Default",
          options: {
            Default: "Default Option",
          },
          prices: [
            {
              amount: sellingPriceInCents, // Price in cents
              currency_code: currencyCode, // USD
            },
          ],
          sku: sku || undefined,
        },
      ];
    }

    // Prepare tags array for Medusa (tags should be objects with value property)
    const medusaTags = tagsArray
      ? tagsArray.map((tag) => ({ value: tag.trim() }))
      : undefined;

    // Prepare categories array for Medusa (must be array of objects with id property)
    const medusaCategories = categoryIds.length > 0 
      ? categoryIds.map((id) => ({ id }))
      : undefined;
    
    // Log categories, collection, sales channels, stock locations, and inventory for debugging
    console.log("Publishing product with:", {
      collectionId,
      categoryIds,
      medusaCategories,
      salesChannelIds: salesChannelIds.length > 0 ? salesChannelIds : "none",
      stockLocationIds: stockLocationIds.length > 0 ? stockLocationIds : "none",
      locationInventory: Object.keys(locationInventory).length > 0 ? locationInventory : "none",
      currencyCode,
      variantCount: medusaVariantIds.length,
    });

    // Create product in Medusa with options and variants
    // Note: 'type' field is not supported by Medusa API - removed to prevent errors
    const medusaProduct = await medusaClient.createProduct({
      title: productTitle,
      description: productDescription,
      handle: productHandle,
      images: medusaImages.length > 0 ? medusaImages : undefined,
      metadata,
      status: "published",
      discountable: true,
      options: productOptions,
      variants: productVariants,
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

    // Extract variant IDs from the created product response
    // Medusa v2 creates variants along with the product
    let medusaVariantIds: string[] = [];

    // Try to get variants from the created product response
    if (medusaProduct.variants && medusaProduct.variants.length > 0) {
      medusaVariantIds = medusaProduct.variants.map((v) => v.id);
    } else {
      // If variants not in response, fetch the product to get them
      try {
        const fullProduct = await medusaClient.getProduct(medusaProduct.id);
        if (fullProduct.variants && fullProduct.variants.length > 0) {
          medusaVariantIds = fullProduct.variants.map((v) => v.id);
        }
      } catch (error) {
        console.warn("Could not fetch product variants:", error);
        // Variants should be created with the product, so this shouldn't happen
        // But we'll continue anyway
      }
    }

    // Associate sales channels with product (if any)
    // Medusa requires a separate API call to associate sales channels
    if (salesChannelIds.length > 0) {
      try {
        const baseUrl = await getMedusaBaseUrl();
        const authHeader = await getAuthHeader();
        
        console.log(`Associating ${salesChannelIds.length} sales channel(s) with product ${medusaProduct.id}`);
        
        for (const salesChannelId of salesChannelIds) {
          const res = await fetch(
            `${baseUrl}/admin/products/${medusaProduct.id}/sales-channels`,
            {
              method: "POST",
              headers: {
                Authorization: authHeader,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                add: [salesChannelId],
              }),
            }
          );

          if (!res.ok) {
            const errorText = await res.text();
            console.error(
              `Failed to associate sales channel ${salesChannelId} with product:`,
              res.status,
              res.statusText,
              errorText
            );
            // Continue with other sales channels even if one fails
          } else {
            console.log(`Successfully associated sales channel ${salesChannelId}`);
          }
        }
        console.log(
          `Completed sales channel association for product ${medusaProduct.id}`
        );
      } catch (error) {
        console.error("Failed to associate sales channels with product:", error);
        // Don't fail the entire publish operation if sales channel association fails
      }
    } else {
      console.log("No sales channels to associate");
    }

    // Create inventory items and set location levels for each variant
    // Medusa requires: 1) Create inventory item for variant, 2) Set location levels
    // Note: We need at least stock locations OR inventory quantities to proceed
    if ((stockLocationIds.length > 0 || Object.keys(locationInventory).length > 0) && medusaVariantIds.length > 0) {
      try {
        const baseUrl = await getMedusaBaseUrl();
        const authHeader = await getAuthHeader();
        
        console.log(`Setting up inventory for ${medusaVariantIds.length} variant(s) with ${stockLocationIds.length} location(s)`);
        
        // For each variant, create inventory item and set location levels
        for (const variantId of medusaVariantIds) {
          // Step 1: Create inventory item for the variant (if not exists)
          // First, try to get existing inventory item for this variant
          let inventoryItemId: string | null = null;
          
          try {
            // Check if variant already has an inventory item
            const variantRes = await fetch(
              `${baseUrl}/admin/products/${medusaProduct.id}/variants/${variantId}`,
              {
                headers: {
                  Authorization: authHeader,
                  "Content-Type": "application/json",
                },
              }
            );
            
            if (variantRes.ok) {
              const variantData = await variantRes.json();
              const variant = variantData.variant;
              
              // Get inventory item ID from variant (if it exists)
              if (variant.inventory_items && variant.inventory_items.length > 0) {
                inventoryItemId = variant.inventory_items[0].id;
              } else if (variant.inventory_item_id) {
                inventoryItemId = variant.inventory_item_id;
              }
            }
          } catch (error) {
            console.warn(`Could not fetch variant ${variantId}:`, error);
          }
          
          // If no inventory item exists, create one
          if (!inventoryItemId) {
            try {
              // Get variant SKU for inventory item
              const variantSku = variants.find(v => {
                // Match variant by checking if it's the first/default variant
                return true; // For now, use the product SKU or generate one
              })?.sku || sku || `${productHandle || "product"}-variant`;
              
              const createInventoryRes = await fetch(
                `${baseUrl}/admin/inventory-items`,
                {
                  method: "POST",
                  headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    sku: variantSku,
                    ...(weight ? { weight: Math.round(weight * 1000) } : {}), // Convert kg to grams
                    ...(length ? { length: Math.round(length * 10) } : {}), // Convert cm to mm
                    ...(height ? { height: Math.round(height * 10) } : {}), // Convert cm to mm
                    ...(width ? { width: Math.round(width * 10) } : {}), // Convert cm to mm
                    ...(originCountry ? { origin_country: originCountry } : {}),
                    ...(hsCode ? { hs_code: hsCode } : {}),
                  }),
                }
              );
              
              if (createInventoryRes.ok) {
                const inventoryData = await createInventoryRes.json();
                inventoryItemId = inventoryData.inventory_item.id;
                console.log(`Created inventory item ${inventoryItemId} for variant ${variantId}`);
                
                // Associate inventory item with variant
                const associateRes = await fetch(
                  `${baseUrl}/admin/products/${medusaProduct.id}/variants/${variantId}/inventory-items/${inventoryItemId}`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: authHeader,
                      "Content-Type": "application/json",
                    },
                  }
                );
                
                if (!associateRes.ok) {
                  const errorText = await associateRes.text();
                  console.error(
                    `Failed to associate inventory item ${inventoryItemId} with variant ${variantId}:`,
                    associateRes.status,
                    associateRes.statusText,
                    errorText
                  );
                } else {
                  console.log(`Successfully associated inventory item ${inventoryItemId} with variant ${variantId}`);
                }
              } else {
                const errorText = await createInventoryRes.text();
                console.error(
                  `Failed to create inventory item for variant ${variantId}:`,
                  createInventoryRes.status,
                  createInventoryRes.statusText,
                  errorText
                );
                continue; // Skip this variant if inventory item creation fails
              }
            } catch (error) {
              console.error(`Failed to create inventory item for variant ${variantId}:`, error);
              continue; // Skip this variant if inventory item creation fails
            }
          }
          
          // Step 2: Set location levels for this inventory item
          if (inventoryItemId) {
            // Build location levels: use inventory quantities if available, otherwise set to 0
            const locationLevels = stockLocationIds.length > 0
              ? stockLocationIds.map((locId) => ({
                  location_id: locId,
                  stocked_quantity: locationInventory[locId] !== undefined && locationInventory[locId] > 0
                    ? locationInventory[locId]
                    : 0, // Default to 0 if no quantity specified
                }))
              : // If no stock locations but we have inventory data, use those locations
                Object.keys(locationInventory).map((locId) => ({
                  location_id: locId,
                  stocked_quantity: locationInventory[locId] || 0,
                }));
            
            if (locationLevels.length > 0) {
              try {
                console.log(`Setting ${locationLevels.length} location level(s) for inventory item ${inventoryItemId} (variant ${variantId})`);
                
                const locationLevelsRes = await fetch(
                  `${baseUrl}/admin/inventory-items/${inventoryItemId}/location-levels/batch`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: authHeader,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      create: locationLevels,
                    }),
                  }
                );
                
                if (!locationLevelsRes.ok) {
                  const errorText = await locationLevelsRes.text();
                  console.error(
                    `Failed to set location levels for inventory item ${inventoryItemId}:`,
                    locationLevelsRes.status,
                    locationLevelsRes.statusText,
                    errorText
                  );
                } else {
                  const result = await locationLevelsRes.json();
                  console.log(
                    `Successfully set ${locationLevels.length} location level(s) for variant ${variantId}`,
                    result
                  );
                }
              } catch (error) {
                console.error(
                  `Failed to set location levels for inventory item ${inventoryItemId}:`,
                  error
                );
              }
            } else {
              console.warn(`No location levels to set for variant ${variantId} (no stock locations or inventory data)`);
            }
          } else {
            console.warn(`No inventory item ID for variant ${variantId}, skipping location levels`);
          }
        }
        
        console.log(
          `Completed inventory setup for ${medusaVariantIds.length} variant(s) with ${stockLocationIds.length > 0 ? stockLocationIds.length : Object.keys(locationInventory).length} location(s)`
        );
      } catch (error) {
        console.error("Failed to set inventory location levels:", error);
        // Don't fail the entire publish operation if inventory setup fails
      }
    } else {
      if (medusaVariantIds.length === 0) {
        console.warn("No variants found, skipping inventory setup");
      } else if (stockLocationIds.length === 0 && Object.keys(locationInventory).length === 0) {
        console.warn("No stock locations or inventory data provided, skipping inventory setup");
      }
    }

    // Update draft with Medusa IDs, status, and published image URLs
    await db
      .update(productsDraft)
      .set({
        medusaProductId: medusaProduct.id,
        medusaVariantIds,
        status: "published",
        images:
          publishedImageUrls.length > 0 ? publishedImageUrls : product.images, // Update with published URLs
        updatedAt: new Date(),
      })
      .where(eq(productsDraft.id, productDraftId));

    return {
      success: true,
      medusaProductId: medusaProduct.id,
      medusaVariantIds,
    };
  } catch (error) {
    console.error("Publish draft error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to publish to Medusa",
    };
  }
}
