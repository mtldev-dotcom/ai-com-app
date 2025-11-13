/**
 * CJ Product Mapper
 * Transforms CJ product data to draft product schema
 */

import type { CJProduct, CJProductVariant } from "@/types/cj-schemas";
import { downloadAndUploadImages } from "@/lib/s3/upload";
import type { NewProductDraft } from "@/db/schema/products-draft";

/**
 * Map CJ product to draft product data
 * @param cjProduct - CJ product data
 * @param supplierId - Supplier ID to associate with
 * @returns Draft product data ready for insertion
 */
export async function mapCJProductToDraft(
  cjProduct: CJProduct,
  supplierId: string
): Promise<Omit<NewProductDraft, "id" | "createdAt" | "updatedAt">> {
  try {
    // Extract and upload images
    const imageUrls = extractImageUrls(cjProduct);
    let uploadedImages: string[] = [];

    if (imageUrls.length > 0) {
      try {
        console.log(
          `Downloading and uploading ${imageUrls.length} images for CJ product ${cjProduct.pid}`
        );
        uploadedImages = await downloadAndUploadImages(imageUrls);
        console.log(`Successfully uploaded ${uploadedImages.length} images to R2`);
      } catch (error) {
        console.error("Error uploading images for CJ product:", error);
        // Fall back to original URLs if upload fails
        uploadedImages = imageUrls;
      }
    }

    // Calculate cost from sell price (CJ provides prices in USD)
    const cost = cjProduct.sellPrice || 0;

    // Build specifications object with all CJ-specific data
    const specifications: Record<string, unknown> = {
      // CJ identifiers
      cj_product_id: cjProduct.pid,
      cj_product_sku: cjProduct.productSku,
      cj_source: cjProduct.sourceFrom || "cj_dropshipping",

      // Product type and category
      ...(cjProduct.productType && { product_type: cjProduct.productType }),
      ...(cjProduct.categoryId && { category_id: cjProduct.categoryId }),
      ...(cjProduct.categoryName && { category_name: cjProduct.categoryName }),

      // Physical attributes (in cm and grams)
      ...(cjProduct.packingWeight && { weight: cjProduct.packingWeight }),
      ...(cjProduct.packingLength && { length: cjProduct.packingLength }),
      ...(cjProduct.packingWidth && { width: cjProduct.packingWidth }),
      ...(cjProduct.packingHeight && { height: cjProduct.packingHeight }),

      // Pricing
      ...(cjProduct.listPrice && { list_price: cjProduct.listPrice }),
      currency_code: "USD", // CJ prices are in USD

      // Additional flags
      ...(cjProduct.isSupportCustomization !== undefined && {
        supports_customization: cjProduct.isSupportCustomization,
      }),
      ...(cjProduct.entryTime && { cj_entry_time: cjProduct.entryTime }),

      // Variants data
      ...(cjProduct.variantList &&
        cjProduct.variantList.length > 0 && {
          variants: mapCJVariants(cjProduct.variantList),
        }),
    };

    // Extract title (use English name)
    const titleEn = cleanProductTitle(cjProduct.productNameEn);

    // Extract description (prefer English, fallback to any description)
    const descriptionEn =
      cleanDescription(cjProduct.descriptionEn) ||
      cleanDescription(cjProduct.description);

    // Build draft product data
    const draftData: Omit<NewProductDraft, "id" | "createdAt" | "updatedAt"> = {
      supplierId,
      titleEn,
      titleFr: undefined, // Leave French title empty for AI enrichment
      descriptionEn,
      descriptionFr: undefined, // Leave French description empty for AI enrichment
      cost: cost.toFixed(2),
      sellingPrice: undefined, // Will be calculated based on margin
      margin: undefined, // Will be set by user or use default
      metaTitle: titleEn, // Use title as default meta title
      metaDescription: descriptionEn
        ? truncateForMeta(descriptionEn, 160)
        : undefined,
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      status: "draft",
      medusaProductId: undefined,
      medusaVariantIds: undefined,
    };

    return draftData;
  } catch (error) {
    console.error("Error mapping CJ product to draft:", error);
    throw new Error(
      `Failed to map CJ product ${cjProduct.pid}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Extract image URLs from CJ product
 * @param cjProduct - CJ product data
 * @returns Array of image URLs
 */
function extractImageUrls(cjProduct: CJProduct): string[] {
  const urls: string[] = [];

  // Add main product image
  if (cjProduct.productImage) {
    urls.push(cjProduct.productImage);
  }

  // Add additional images from image list
  if (cjProduct.productImageList && cjProduct.productImageList.length > 0) {
    cjProduct.productImageList.forEach((img) => {
      if (img.url && !urls.includes(img.url)) {
        urls.push(img.url);
      }
    });
  }

  // Add variant images if available
  if (cjProduct.variantList && cjProduct.variantList.length > 0) {
    cjProduct.variantList.forEach((variant) => {
      if (variant.variantImage && !urls.includes(variant.variantImage)) {
        urls.push(variant.variantImage);
      }
    });
  }

  return urls;
}

/**
 * Map CJ variants to structured data
 * @param variants - CJ variant list
 * @returns Structured variant data
 */
function mapCJVariants(
  variants: CJProductVariant[]
): Array<Record<string, unknown>> {
  return variants.map((variant) => ({
    vid: variant.vid,
    sku: variant.variantSku || variant.productSku,
    name_en: variant.variantNameEn,
    image: variant.variantImage,
    options: parseVariantOptions(variant.variantKey),
    price: variant.sellPrice,
    list_price: variant.listPrice,
    weight: variant.weight,
    length: variant.length,
    width: variant.width,
    height: variant.height,
    stock: variant.stock,
  }));
}

/**
 * Parse variant options from key string
 * Example: "Color:Red|Size:M" -> { Color: "Red", Size: "M" }
 * @param variantKey - Variant key string
 * @returns Parsed options object
 */
function parseVariantOptions(
  variantKey?: string
): Record<string, string> | undefined {
  if (!variantKey) return undefined;

  try {
    const options: Record<string, string> = {};
    const pairs = variantKey.split("|");

    pairs.forEach((pair) => {
      const [key, value] = pair.split(":");
      if (key && value) {
        options[key.trim()] = value.trim();
      }
    });

    return Object.keys(options).length > 0 ? options : undefined;
  } catch (error) {
    console.warn("Failed to parse variant options:", variantKey, error);
    return undefined;
  }
}

/**
 * Clean product title
 * Removes excessive whitespace, special characters, etc.
 * @param title - Raw title
 * @returns Cleaned title
 */
function cleanProductTitle(title: string): string {
  if (!title) return "";

  return (
    title
      // Remove multiple spaces
      .replace(/\s+/g, " ")
      // Remove leading/trailing whitespace
      .trim()
      // Limit length to 200 characters
      .substring(0, 200)
  );
}

/**
 * Clean description text
 * Removes HTML tags, excessive whitespace, etc.
 * @param description - Raw description
 * @returns Cleaned description
 */
function cleanDescription(description?: string): string | undefined {
  if (!description) return undefined;

  return (
    description
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove multiple spaces
      .replace(/\s+/g, " ")
      // Remove leading/trailing whitespace
      .trim()
      // Return undefined if empty
      || undefined
  );
}

/**
 * Truncate text for meta descriptions
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
function truncateForMeta(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Batch map multiple CJ products to drafts
 * @param cjProducts - Array of CJ products
 * @param supplierId - Supplier ID to associate with
 * @returns Array of draft product data and errors
 */
export async function batchMapCJProductsToDrafts(
  cjProducts: CJProduct[],
  supplierId: string
): Promise<{
  drafts: Array<Omit<NewProductDraft, "id" | "createdAt" | "updatedAt">>;
  errors: Array<{ productId: string; error: string }>;
}> {
  const drafts: Array<Omit<NewProductDraft, "id" | "createdAt" | "updatedAt">> = [];
  const errors: Array<{ productId: string; error: string }> = [];

  for (const product of cjProducts) {
    try {
      const draft = await mapCJProductToDraft(product, supplierId);
      drafts.push(draft);
    } catch (error) {
      console.error(`Failed to map product ${product.pid}:`, error);
      errors.push({
        productId: product.pid,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return { drafts, errors };
}

/**
 * Check if a CJ product already exists in drafts
 * @param cjProductId - CJ Product ID
 * @param existingDrafts - Existing draft products
 * @returns true if product exists
 */
export function isCJProductImported(
  cjProductId: string,
  existingDrafts: Array<{ specifications?: Record<string, unknown> | null }>
): boolean {
  return existingDrafts.some(
    (draft) =>
      draft.specifications &&
      typeof draft.specifications === "object" &&
      "cj_product_id" in draft.specifications &&
      draft.specifications.cj_product_id === cjProductId
  );
}

