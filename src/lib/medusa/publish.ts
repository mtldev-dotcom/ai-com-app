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

    // Extract Medusa-specific fields from specifications
    const specs = (product.specifications as Record<string, unknown>) || {};
    const currencyCode = (specs.currency_code as string) || "CAD";
    const handle = (specs.handle as string) || undefined;
    const sku = (specs.sku as string) || undefined;
    const weight = (specs.weight as number) || undefined;
    const length = (specs.length as number) || undefined;
    const categoryIds = Array.isArray(specs.category_ids)
      ? (specs.category_ids as string[])
      : specs.category_id
        ? [specs.category_id as string]
        : [];
    const height = (specs.height as number) || undefined;
    const width = (specs.width as number) || undefined;
    const originCountry = (specs.origin_country as string) || undefined;
    const hsCode = (specs.hs_code as string) || undefined;
    const midCode = (specs.mid_code as string) || undefined;
    const material = (specs.material as string) || undefined;
    const type = (specs.type as string) || undefined;
    const collectionId = (specs.collection_id as string) || undefined;
    const tagsArray = specs.tags
      ? Array.isArray(specs.tags)
        ? (specs.tags as string[])
        : []
      : undefined;

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
        const variantPrice =
          parseFloat(product.sellingPrice || "0") +
          parseFloat(variant.priceAdjustment || "0");

        return {
          title: variant.name || `Variant ${index + 1}`,
          options: {
            Default: `Variant ${index + 1}`,
          },
          prices: [
            {
              amount: Math.round(variantPrice * 100), // Convert to cents
              currency_code: currencyCode,
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

      productVariants = [
        {
          title: "Default",
          options: {
            Default: "Default Option",
          },
          prices: [
            {
              amount: Math.round(parseFloat(product.sellingPrice || "0") * 100), // Convert to cents
              currency_code: currencyCode,
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
      categories:
        categoryIds.length > 0 ? categoryIds.map((id) => ({ id })) : undefined,
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
