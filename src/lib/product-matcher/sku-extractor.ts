/**
 * SKU Extraction Service
 * Extracts SKU from multiple sources with fallback strategies
 */

/**
 * Extract SKU from normalized data, specifications, or raw data
 * Uses multiple fallback strategies to find SKU
 * 
 * Priority order:
 * 1. Normalized data (specifications_normalized.sku)
 * 2. Provider result specifications (specifications.sku)
 * 3. Raw data (productSku, sku, SKU, product_sku)
 * 
 * @param normalizedData - Normalized product data with specifications_normalized
 * @param specifications - Product specifications object
 * @param rawData - Raw provider response data
 * @param productName - Product name for logging
 * @returns Extracted SKU or null if not found
 */
export function extractSKU(
  normalizedData?: Record<string, unknown>,
  specifications?: Record<string, string | unknown>,
  rawData?: Record<string, unknown>,
  productName?: string
): string | null {
  let sku: string | null = null;

  // Strategy 1: Try normalized data first
  if (normalizedData?.specifications_normalized) {
    const normalizedSpecs = normalizedData.specifications_normalized as Record<string, unknown>;
    if (normalizedSpecs?.sku && typeof normalizedSpecs.sku === "string") {
      sku = normalizedSpecs.sku.trim();
      if (sku) {
        console.debug(`[SKU Extraction] Found SKU in normalized data: ${sku} for product: ${productName || "unknown"}`);
        return sku;
      }
    }
  }

  // Strategy 2: Try search result specifications
  if (!sku && specifications) {
    const specsSku = specifications.sku;
    if (specsSku && typeof specsSku === "string") {
      sku = specsSku.trim();
      if (sku) {
        console.debug(`[SKU Extraction] Found SKU in specifications: ${sku} for product: ${productName || "unknown"}`);
        return sku;
      }
    }
  }

  // Strategy 3: Try raw_data (most reliable for CJ)
  if (!sku && rawData) {
    // Try multiple possible field names
    const possibleSkuFields = [
      "productSku",
      "sku",
      "SKU",
      "product_sku",
      "productSkuNumber",
      "skuCode",
    ];

    for (const field of possibleSkuFields) {
      const value = rawData[field];
      if (value && typeof value === "string") {
        sku = value.trim();
        if (sku) {
          console.debug(`[SKU Extraction] Found SKU in raw_data.${field}: ${sku} for product: ${productName || "unknown"}`);
          return sku;
        }
      }
      // Also check if it's a number (convert to string)
      if (value && typeof value === "number") {
        sku = String(value).trim();
        if (sku) {
          console.debug(`[SKU Extraction] Found SKU (numeric) in raw_data.${field}: ${sku} for product: ${productName || "unknown"}`);
          return sku;
        }
      }
    }
  }

  // Log if SKU is missing
  if (!sku && productName) {
    console.warn(`[SKU Extraction] No SKU found for product: ${productName}`);
  }

  return sku;
}

/**
 * Extract SKU from a provider result object
 * Convenience wrapper for extracting SKU from the standardized ProviderResult format
 * 
 * @param result - Provider result with specs and raw data
 * @returns Extracted SKU or null
 */
export function extractSKUFromResult(
  result: {
    specs?: Record<string, string | unknown>;
    rawData?: Record<string, unknown>;
    title?: string;
  }
): string | null {
  return extractSKU(
    undefined,
    result.specs,
    result.rawData,
    result.title
  );
}

