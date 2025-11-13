/**
 * Web Search Provider
 * Implements ProductSearchProvider for general web search
 * Uses AI research as a fallback - limited accuracy
 */

import { researchProduct } from "@/lib/ai/research";
import type {
  ProductQuery,
  ProductSearchProvider,
  ProviderResult,
  SearchCriteria,
} from "./base";

/**
 * Web Search Provider Implementation
 * Note: This is a simplified implementation using AI research
 * For production, consider integrating with a proper web search API (Google Custom Search, Bing, etc.)
 */
export class WebProvider implements ProductSearchProvider {
  name = "web";
  displayName = "Web Search";

  /**
   * Search web for products matching the query
   * Uses AI research function to extract product info
   */
  async search(
    query: ProductQuery,
    criteria: SearchCriteria
  ): Promise<ProviderResult[]> {
    try {
      // Build search query string
      const searchQuery = this.buildSearchQuery(query);

      // Use AI research to extract product information
      const researchResult = await researchProduct(searchQuery);

      // Convert research result to ProviderResult format
      // Note: This is a simplified conversion - web search has limited structured data
      const result: ProviderResult = {
        providerId: this.name,
        providerName: this.displayName,
        productId: `web-${Date.now()}`, // Generate temporary ID
        title: researchResult.title || query.name,
        description: researchResult.description || "",
        price: this.extractPrice(researchResult.estimatedPrice) || query.price || 0,
        currency: criteria.currency || "USD",
        images: [], // Web search doesn't provide images directly
        shippingOrigin: criteria.shippingOrigin?.[0] || "US", // Default to first criteria or US
        estimatedDeliveryDays: criteria.maxDeliveryDays || undefined,
        supplierUrl: `https://www.google.com/search?q=${encodeURIComponent(query.name)}`,
        specs: researchResult.specs || {},
      };

      // Filter by criteria
      if (!this.matchesCriteria(result, criteria)) {
        return [];
      }

      return [result];
    } catch (error) {
      console.error("Web provider search error:", error);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Build search query string from product query
   */
  private buildSearchQuery(query: ProductQuery): string {
    let searchText = query.name;

    if (query.description) {
      searchText += ` ${query.description}`;
    }

    if (query.specs) {
      const specsText = Object.values(query.specs).join(" ");
      searchText += ` ${specsText}`;
    }

    return searchText;
  }

  /**
   * Extract numeric price from estimated price string
   */
  private extractPrice(estimatedPrice?: string): number | null {
    if (!estimatedPrice) {
      return null;
    }

    // Try to extract numeric value from price string
    // Handles formats like "$29.99", "29.99 USD", "Price: $30-50", etc.
    const priceMatch = estimatedPrice.match(/\$?\s*(\d+\.?\d*)/);
    if (priceMatch) {
      return parseFloat(priceMatch[1]);
    }

    return null;
  }

  /**
   * Check if result matches search criteria
   */
  private matchesCriteria(
    result: ProviderResult,
    criteria: SearchCriteria
  ): boolean {
    // Check shipping origin
    if (
      criteria.shippingOrigin &&
      criteria.shippingOrigin.length > 0 &&
      !criteria.shippingOrigin.includes(result.shippingOrigin)
    ) {
      return false;
    }

    // Check delivery days
    if (
      criteria.maxDeliveryDays !== undefined &&
      result.estimatedDeliveryDays !== undefined &&
      result.estimatedDeliveryDays > criteria.maxDeliveryDays
    ) {
      return false;
    }

    // Check price range
    if (criteria.priceRange) {
      if (
        criteria.priceRange.min !== undefined &&
        result.price < criteria.priceRange.min
      ) {
        return false;
      }
      if (
        criteria.priceRange.max !== undefined &&
        result.price > criteria.priceRange.max
      ) {
        return false;
      }
    }

    return true;
  }
}

