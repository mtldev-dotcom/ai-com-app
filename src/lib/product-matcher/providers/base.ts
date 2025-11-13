/**
 * Product Matcher Provider Interfaces
 * Defines the contract for all product search providers
 */

/**
 * Query parameters for searching a product
 */
export interface ProductQuery {
  name: string;
  description?: string;
  price?: number;
  specs?: Record<string, string>;
}

/**
 * Search criteria for filtering results
 */
export interface SearchCriteria {
  shippingOrigin?: string[];
  maxDeliveryDays?: number;
  priceRange?: { min?: number; max?: number };
  currency?: string;
  maxResults?: number; // 1-200
  minMoq?: number;
  maxMoq?: number;
  maxLeadTimeDays?: number;
  shipFrom?: string; // Country code
  shipTo?: string; // Country code
  maxShippingCost?: number;
}

/**
 * Standardized provider result format
 * All providers must return results in this format
 */
export interface ProviderResult {
  providerId: string; // e.g., "cj", "web"
  providerName: string; // e.g., "CJ Dropshipping"
  productId: string; // Provider's product ID
  title: string; // Product title
  description: string; // Product description
  price: number; // Price in base currency
  currency: string; // Currency code (USD, CAD, etc.)
  images: string[]; // Array of image URLs
  shippingOrigin: string; // Country code (US, CN, etc.)
  estimatedDeliveryDays?: number; // Estimated delivery time in days
  supplierUrl: string; // URL to product page
  specs?: Record<string, string>; // Product specifications
  sku?: string; // Product SKU
  moq?: number; // Minimum order quantity
  leadTimeDays?: number; // Lead time in days
  rawData?: Record<string, unknown>; // Raw provider response data
}

/**
 * Abstract product search provider interface
 * All providers must implement this interface
 */
export interface ProductSearchProvider {
  /**
   * Provider identifier (e.g., "cj", "web")
   */
  name: string;

  /**
   * Human-readable provider name
   */
  displayName: string;

  /**
   * Search for products matching the query
   * @param query - Product search query
   * @param criteria - Search criteria filters
   * @returns Array of matching products
   */
  search(
    query: ProductQuery,
    criteria: SearchCriteria
  ): Promise<ProviderResult[]>;
}

