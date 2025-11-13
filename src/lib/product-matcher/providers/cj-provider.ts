/**
 * CJ Dropshipping Provider
 * Implements ProductSearchProvider for CJ Dropshipping
 */

import { searchCJProductsV2 } from "@/lib/cj/client";
import type { CJProduct } from "@/types/cj-schemas";
import { extractSKU } from "../sku-extractor";
import type {
  ProductQuery,
  ProductSearchProvider,
  ProviderResult,
  SearchCriteria,
} from "./base";

/**
 * CJ Dropshipping Provider Implementation
 */
export class CJProvider implements ProductSearchProvider {
  name = "cj";
  displayName = "CJ Dropshipping";

  /**
   * Search CJ products matching the query
   * Ensures minimum 4-10 results per product through pagination
   */
  async search(
    query: ProductQuery,
    criteria: SearchCriteria
  ): Promise<ProviderResult[]> {
    try {
      // Validate query name
      if (!query.name || query.name.trim() === "") {
        console.warn("CJ provider: Empty product name provided");
        return [];
      }

      // Determine target minimum results (4-10 range)
      // Ensure we get at least 4 results, ideally 10, but respect maxResults if set
      const minResults = 4; // Minimum we want per product
      const desiredResults = 10; // Ideal number of results
      const maxResults = criteria.maxResults ? Math.min(criteria.maxResults, 100) : 100; // Cap at 100 (API limit)
      const targetResults = Math.max(minResults, Math.min(desiredResults, maxResults)); // Target between 4-10, up to maxResults

      // Build base CJ search request for listV2
      const baseQuery: Omit<Parameters<typeof searchCJProductsV2>[0], 'pageNum'> = {
        productNameEn: query.name.trim(),
        pageSize: 20, // Fetch 20 per page (balance between speed and completeness)
      };

      // Apply price filters
      if (criteria.priceRange) {
        if (criteria.priceRange.min !== undefined) {
          baseQuery.startSellPrice = criteria.priceRange.min;
        }
        if (criteria.priceRange.max !== undefined) {
          baseQuery.endSellPrice = criteria.priceRange.max;
        }
      }

      // Apply shipping origin filter
      if (criteria.shipFrom) {
        // Use shipFrom as countryCode (listV2 supports single country)
        baseQuery.countryCode = criteria.shipFrom;
      } else if (criteria.shippingOrigin && criteria.shippingOrigin.length > 0) {
        // Fallback to shippingOrigin array (use first)
        baseQuery.countryCode = criteria.shippingOrigin[0];
      }

      console.log(`CJ provider: Searching for "${query.name}" with target: ${targetResults} results`);

      // Fetch products with pagination until we have enough results
      const allProducts: CJProduct[] = [];
      let pageNum = 1;
      let totalAvailable = 0;
      const maxPages = 5; // Limit to 5 pages to avoid excessive API calls

      while (allProducts.length < targetResults && pageNum <= maxPages) {
        const cjQuery = { ...baseQuery, pageNum, pageSize: 20 };

        console.log(`CJ provider: Fetching page ${pageNum}...`);

        const { products, total } = await searchCJProductsV2(cjQuery);

        // Store total available on first page
        if (pageNum === 1) {
          totalAvailable = total;
          console.log(`CJ provider: Total available products: ${total}`);
        }

        // Add products to collection
        allProducts.push(...products);

        console.log(`CJ provider: Page ${pageNum} returned ${products.length} products, total so far: ${allProducts.length}`);

        // If we got fewer products than requested, we've reached the end
        if (products.length < 20) {
          console.log(`CJ provider: Reached end of results (got ${products.length} products)`);
          break;
        }

        // If we've fetched all available products
        if (totalAvailable > 0 && allProducts.length >= totalAvailable) {
          console.log(`CJ provider: Fetched all available products (${totalAvailable})`);
          break;
        }

        // If we have enough results, we can stop
        if (allProducts.length >= targetResults) {
          console.log(`CJ provider: Reached target of ${targetResults} results`);
          break;
        }

        pageNum++;

        // Small delay between pages to respect rate limits
        if (pageNum <= maxPages && allProducts.length < targetResults) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      console.log(`CJ provider: Fetched ${allProducts.length} products across ${pageNum} page(s)`);

      if (allProducts.length === 0) {
        console.warn(`CJ provider: No products found for query "${query.name}"`);
        return [];
      }

      // Convert CJ products to ProviderResult format
      const results: ProviderResult[] = allProducts
        .map((product) => this.normalizeCJProduct(product));

      console.log(`CJ provider: Normalized ${results.length} products`);

      // Apply post-processing filters
      const filteredResults = this._applyPostProcessingFilters(results, criteria);

      console.log(`CJ provider: After filtering, ${filteredResults.length} results remain`);

      // Ensure we return at least minResults if we have enough after filtering
      // If filtering removed too many, we might have fewer, but that's okay
      // Limit to maxResults if specified
      const finalResults = filteredResults.slice(0, maxResults);

      // Log warning if we couldn't get minimum results
      if (finalResults.length < minResults && totalAvailable >= minResults) {
        console.warn(
          `CJ provider: Only ${finalResults.length} results after filtering (target: ${minResults}). ` +
          `This may be due to strict filter criteria.`
        );
      }

      return finalResults;
    } catch (error) {
      console.error("CJ provider search error:", error);
      // Re-throw rate limit errors so they can be handled properly
      if (
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("rate limit"))
      ) {
        throw error;
      }
      // Return empty array on other errors (don't throw - let matcher handle gracefully)
      return [];
    }
  }

  /**
   * Normalize CJ product to ProviderResult format
   * Uses all available data from API response (including V2 data)
   */
  private normalizeCJProduct(product: CJProduct): ProviderResult {
    // Extract images
    const images: string[] = [];
    if (product.productImage) {
      images.push(product.productImage);
    }
    if (product.productImageList) {
      product.productImageList.forEach((img) => {
        if (img.url && !images.includes(img.url)) {
          images.push(img.url);
        }
      });
    }

    // Get price from product - prioritize sellPrice (which comes from V2 API)
    let price = product.sellPrice;

    // Fallback to listPrice if sellPrice not available
    if (!price && product.listPrice) {
      price = product.listPrice;
    }

    // Fallback to first variant if still no price
    if (!price && product.variantList && product.variantList.length > 0) {
      const firstVariant = product.variantList[0];
      price = firstVariant.sellPrice || firstVariant.listPrice;
    }

    // Final fallback to 0
    if (!price) {
      price = 0;
    }

    // Ensure price is a number
    price = typeof price === "number" ? price : parseFloat(String(price)) || 0;

    // Generate product URL with slug
    const productUrl = this._generateProductUrl(product.pid, product.productNameEn);

    // Extract SKU - prioritize productSku from API response
    // The productSku field comes from V2 API (sku or spu field)
    let sku: string | null = null;

    // First try productSku from API response
    if (product.productSku && product.productSku.trim() !== "") {
      sku = product.productSku.trim();
      console.debug(`[CJ Provider] Found SKU in productSku: ${sku} for product: ${product.productNameEn}`);
    }

    // If not found, try extractSKU function as fallback
    if (!sku) {
      const rawProduct = product as unknown as Record<string, unknown>;
      
      // Try direct search in raw product data first
      const possibleSkuFields = ["sku", "SKU", "productSku", "product_sku", "spu", "SPU"];
      for (const field of possibleSkuFields) {
        const value = rawProduct[field];
        if (value && typeof value === "string" && value.trim() !== "") {
          sku = value.trim();
          console.debug(`[CJ Provider] Found SKU in rawData.${field}: ${sku} for product: ${product.productNameEn}`);
          break;
        }
        if (value && typeof value === "number") {
          sku = String(value).trim();
          console.debug(`[CJ Provider] Found SKU (numeric) in rawData.${field}: ${sku} for product: ${product.productNameEn}`);
          break;
        }
      }
      
      // If still not found, use extractSKU function
      if (!sku) {
        sku = extractSKU(
          undefined,
          undefined,
          rawProduct,
          product.productNameEn
        );
        if (sku) {
          console.debug(`[CJ Provider] Extracted SKU via extractSKU: ${sku} for product: ${product.productNameEn}`);
        }
      }
    }
    
    if (!sku) {
      console.warn(`[CJ Provider] No SKU found for product: ${product.productNameEn} (pid: ${product.pid})`);
    }

    // Extract MOQ from directMinOrderNum (from V2 API) or variant list
    let moq: number | undefined;
    const productRaw = product as unknown as Record<string, unknown>;
    const productWithV2 = product as CJProduct & {
      directMinOrderNum?: number;
      supplierName?: string;
      oneCategoryName?: string;
      twoCategoryName?: string;
      threeCategoryName?: string;
    };

    // Try directMinOrderNum from V2 API response
    if (productWithV2.directMinOrderNum !== undefined && productWithV2.directMinOrderNum !== null) {
      if (productWithV2.directMinOrderNum > 0) {
        moq = productWithV2.directMinOrderNum;
      }
    }

    // Fallback to variant list if still no MOQ
    if (!moq && product.variantList && product.variantList.length > 0) {
      // Try to find MOQ in variant data
      const firstVariant = product.variantList[0];
      // Check variant stock or min order quantity
      if (firstVariant.stock !== undefined) {
        const stock = typeof firstVariant.stock === "number"
          ? firstVariant.stock
          : parseFloat(String(firstVariant.stock)) || undefined;
        if (stock && stock > 0) {
          moq = Math.max(1, stock); // Use stock as minimum
        }
      }
    }

    // Extract specs from description or product fields
    const specs: Record<string, string> = {};
    if (sku) {
      specs["sku"] = sku;
    }
    if (product.descriptionEn) {
      // Try to extract basic specs from description
      if (product.packingWeight) {
        specs["Weight"] = `${product.packingWeight} kg`;
      }
      if (product.packingLength && product.packingWidth && product.packingHeight) {
        specs["Dimensions"] = `${product.packingLength}x${product.packingWidth}x${product.packingHeight} cm`;
      }
    }

    // Add category information if available (from V2 API or standard API)
    if (productWithV2.oneCategoryName) {
      specs["Category"] = productWithV2.oneCategoryName;
    } else if (productWithV2.twoCategoryName) {
      specs["Category"] = productWithV2.twoCategoryName;
    } else if (productWithV2.threeCategoryName) {
      specs["Category"] = productWithV2.threeCategoryName;
    } else if (product.categoryName) {
      specs["Category"] = product.categoryName;
    }

    // Add supplier name if available (from V2 API)
    if (productWithV2.supplierName) {
      specs["Supplier"] = productWithV2.supplierName;
    }

    return {
      providerId: this.name,
      providerName: this.displayName,
      productId: product.pid,
      title: product.productNameEn,
      description: product.descriptionEn || product.description || "",
      price,
      currency: "USD", // CJ API returns prices in USD
      images,
      shippingOrigin: product.sourceFrom === "1688" ? "CN" : "CN", // Default to CN for CJ products
      estimatedDeliveryDays: undefined, // CJ doesn't provide this in product list
      supplierUrl: productUrl,
      specs,
      sku: sku || undefined, // Convert null to undefined
      moq,
      rawData: product as unknown as Record<string, unknown>,
    };
  }

  /**
   * Generate CJ product URL with product name slug
   * Format: https://cjdropshipping.com/product/{slug}-p-{product_id}.html
   */
  private _generateProductUrl(productId: string, productName: string): string {
    // Create URL-friendly slug from product name
    let slug = productName.toLowerCase();
    slug = slug.replace(/\s+/g, "-"); // Replace spaces with hyphens
    slug = slug.replace(/[^a-z0-9\-]/g, ""); // Remove special chars, keep only alphanumeric and hyphens
    slug = slug.replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
    slug = slug.replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
    slug = slug.substring(0, 100); // Truncate to 100 chars

    // Format: https://cjdropshipping.com/product/{slug}-p-{product_id}.html
    return `https://cjdropshipping.com/product/${slug}-p-${productId}.html`;
  }

  /**
   * Apply post-processing filters that cannot be done at API level
   */
  private _applyPostProcessingFilters(
    results: ProviderResult[],
    criteria: SearchCriteria
  ): ProviderResult[] {
    let filtered = results;

    // MOQ filtering
    if (criteria.minMoq !== undefined) {
      filtered = filtered.filter(
        (r) => r.moq === undefined || r.moq >= criteria.minMoq!
      );
    }
    if (criteria.maxMoq !== undefined) {
      filtered = filtered.filter(
        (r) => r.moq === undefined || r.moq <= criteria.maxMoq!
      );
    }

    // Lead time filtering
    if (criteria.maxLeadTimeDays !== undefined) {
      filtered = filtered.filter(
        (r) =>
          r.leadTimeDays === undefined ||
          r.leadTimeDays <= criteria.maxLeadTimeDays!
      );
    }

    // Delivery days filtering (estimatedDeliveryDays)
    if (criteria.maxDeliveryDays !== undefined) {
      filtered = filtered.filter(
        (r) =>
          r.estimatedDeliveryDays === undefined ||
          r.estimatedDeliveryDays <= criteria.maxDeliveryDays!
      );
    }

    // Shipping origin filtering (for multiple origins)
    if (criteria.shippingOrigin && criteria.shippingOrigin.length > 0) {
      filtered = filtered.filter((r) =>
        criteria.shippingOrigin!.includes(r.shippingOrigin)
      );
    }

    // Shipping cost filtering (would need to calculate landed cost first)
    // This is handled in the processor after landed cost calculation

    // Result count limit
    if (criteria.maxResults !== undefined) {
      filtered = filtered.slice(0, criteria.maxResults);
    }

    return filtered;
  }
}

