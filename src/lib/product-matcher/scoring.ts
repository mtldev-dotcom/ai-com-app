/**
 * Scoring Utilities
 * Calculates ranking scores and reliability scores for product matches
 */

import type { ProviderResult } from "./providers/base";
import type { ProductQuery } from "./providers/base";

/**
 * Calculate composite ranking score for a match
 * Based on multiple factors weighted by importance
 */
export function calculateRankingScore(
  match: ProviderResult & {
    matchScore?: number;
    landedCost?: {
      unitPriceUsd: number;
      shippingCostUsd: number;
      dutiesUsd: number;
      totalLandedCostUsd: number;
      currency: string;
      confidence: "low" | "medium" | "high";
      etaDays?: number;
      etaConfidence: "low" | "medium" | "high";
    };
    rankingScore?: number;
  },
  query: ProductQuery
): number {
  let score = 0;

  // Match score (40% weight) - normalized to 0-1
  if (match.matchScore !== undefined) {
    score += (match.matchScore / 100) * 0.4;
  }

  // Landed cost competitiveness (20% weight)
  // Lower cost = higher score
  if (match.landedCost && query.price) {
    const costRatio = match.landedCost.totalLandedCostUsd / query.price;
    // If cost is similar or lower, give high score
    // If cost is much higher, penalize
    const costScore = costRatio <= 1 ? 1.0 : Math.max(0, 1 - (costRatio - 1) * 0.5);
    score += costScore * 0.2;
  } else {
    // Neutral if no price info
    score += 0.5 * 0.2;
  }

  // ETA attractiveness (15% weight)
  // Shorter delivery = higher score
  if (match.landedCost?.etaDays) {
    const etaDays = match.landedCost.etaDays;
    // Scale: 0-10 days = 1.0, 10-20 = 0.8, 20-30 = 0.6, 30+ = 0.4
    let etaScore = 1.0;
    if (etaDays > 30) {
      etaScore = 0.4;
    } else if (etaDays > 20) {
      etaScore = 0.6;
    } else if (etaDays > 10) {
      etaScore = 0.8;
    }
    score += etaScore * 0.15;
  } else {
    // Neutral if no ETA
    score += 0.5 * 0.15;
  }

  // Reliability score (15% weight)
  // This is calculated separately and normalized to 0-1
  const reliabilityScore = calculateReliabilityScore(match);
  score += (reliabilityScore / 100) * 0.15;

  // Stock availability (10% weight)
  // Better stock = higher score
  const stockScore = calculateStockScore(match);
  score += stockScore * 0.1;

  // Normalize to 0-100 range
  return Math.round(score * 100);
}

/**
 * Calculate reliability score for a match
 * Based on provider trust, data completeness, and confidence
 */
export function calculateReliabilityScore(
  match: ProviderResult & {
    landedCost?: {
      confidence: "low" | "medium" | "high";
      etaConfidence: "low" | "medium" | "high";
    };
    rawData?: Record<string, unknown>;
  }
): number {
  let score = 50; // Base score

  // Provider reliability (known providers get higher scores)
  if (match.providerId === "cj") {
    score += 20; // CJ is a trusted provider
  } else if (match.providerId === "web") {
    score += 10; // Web scraping is less reliable
  }

  // Data completeness
  if (match.sku) score += 10;
  if (match.specs && Object.keys(match.specs).length > 0) score += 5;
  if (match.images && match.images.length > 0) score += 5;
  if (match.description && match.description.length > 50) score += 5;

  // Landed cost confidence
  if (match.landedCost) {
    const confidenceMap = { high: 5, medium: 3, low: 1 };
    score += confidenceMap[match.landedCost.confidence];
    score += confidenceMap[match.landedCost.etaConfidence];
  }

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Calculate stock availability score
 */
function calculateStockScore(
  match: ProviderResult & {
    rawData?: Record<string, unknown>;
    specs?: Record<string, string | unknown>;
  }
): number {
  // Try to extract stock information
  let stock: number | null = null;

  if (match.specs) {
    const stockValue =
      match.specs.warehouse_inventory ||
      match.specs.stock ||
      match.specs.inventory;
    if (typeof stockValue === "number") {
      stock = stockValue;
    } else if (typeof stockValue === "string") {
      const parsed = parseInt(stockValue);
      if (!isNaN(parsed)) stock = parsed;
    }
  }

  if (stock === null && match.rawData) {
    const stockValue =
      match.rawData.warehouseInventoryNum ||
      match.rawData.stock ||
      match.rawData.inventory;
    if (typeof stockValue === "number") {
      stock = stockValue;
    }
  }

  // Score based on stock availability
  if (stock === null) {
    return 0.5; // Unknown stock = neutral
  } else if (stock > 100) {
    return 1.0; // Good stock
  } else if (stock > 50) {
    return 0.8; // Moderate stock
  } else if (stock > 10) {
    return 0.6; // Low stock
  } else {
    return 0.3; // Very low stock
  }
}

