/**
 * Landed Cost & ETA Calculation Service
 * Calculates total landed cost including unit price, shipping, duties, and estimates delivery time
 */

/**
 * Landed cost estimate structure
 */
export interface LandedCostEstimate {
  unitPriceUsd: number;
  shippingCostUsd: number;
  dutiesUsd: number;
  totalLandedCostUsd: number;
  currency: string;
  confidence: "low" | "medium" | "high";
  etaDays?: number;
  etaConfidence: "low" | "medium" | "high";
}

/**
 * Duty rates by origin/destination country pairs
 * Rates are percentages (e.g., 7.5 means 7.5%)
 */
const DUTY_RATES: Record<string, number> = {
  "CN-US": 7.5,
  "CN-EU": 6.0,
  "CN-GB": 5.0,
  "CN-AU": 5.0,
  "CN-CA": 6.5,
  "US-US": 0.0,
  "US-EU": 2.5,
  "US-GB": 2.0,
  "US-AU": 0.0,
  "US-CA": 0.0,
  "EU-US": 3.0,
  "EU-EU": 0.0,
  "EU-GB": 0.0,
  "EU-AU": 5.0,
  "GB-US": 2.5,
  "GB-GB": 0.0,
  "GB-EU": 0.0,
  "GB-AU": 5.0,
};

/**
 * Shipping time estimates by route
 * Format: (min_days, max_days)
 */
const SHIPPING_TIME_ROUTES: Record<string, [number, number]> = {
  "CN-US": [10, 25],
  "CN-EU": [12, 30],
  "CN-GB": [12, 28],
  "CN-AU": [15, 35],
  "CN-CA": [12, 28],
  "US-US": [2, 7],
  "US-EU": [5, 12],
  "US-GB": [5, 10],
  "US-AU": [7, 15],
  "US-CA": [3, 8],
  "EU-US": [5, 12],
  "EU-EU": [2, 5],
  "EU-GB": [2, 4],
  "EU-AU": [10, 20],
  "GB-US": [5, 10],
  "GB-GB": [1, 3],
  "GB-EU": [2, 5],
  "GB-AU": [10, 20],
};

/**
 * Default shipping cost estimates by route (USD)
 * Used when shipping cost is not provided
 */
const DEFAULT_SHIPPING_COSTS: Record<string, number> = {
  "CN-US": 15.0,
  "CN-EU": 12.0,
  "CN-GB": 10.0,
  "CN-AU": 18.0,
  "CN-CA": 14.0,
  "US-US": 5.0,
  "US-EU": 8.0,
  "US-GB": 7.0,
  "US-AU": 15.0,
  "US-CA": 6.0,
  "EU-US": 8.0,
  "EU-EU": 5.0,
  "EU-GB": 4.0,
  "EU-AU": 12.0,
  "GB-US": 7.0,
  "GB-GB": 2.0,
  "GB-EU": 4.0,
  "GB-AU": 12.0,
};

/**
 * Get duty rate for origin/destination pair
 */
function getDutyRate(originCountry: string, destinationCountry: string): number {
  const key = `${originCountry}-${destinationCountry}`;
  return DUTY_RATES[key] ?? 5.0; // Default 5% if route not found
}

/**
 * Estimate shipping time for route
 */
function estimateShippingTime(
  originCountry: string,
  destinationCountry: string
): [number, "low" | "medium" | "high"] {
  const key = `${originCountry}-${destinationCountry}`;
  const timeRange = SHIPPING_TIME_ROUTES[key];
  
  if (!timeRange) {
    // Default estimate: 15-30 days
    return [20, "low"];
  }

  const [minDays, maxDays] = timeRange;
  const avgDays = Math.round((minDays + maxDays) / 2);
  
  // Confidence based on range size
  let confidence: "low" | "medium" | "high" = "medium";
  const range = maxDays - minDays;
  if (range <= 7) {
    confidence = "high";
  } else if (range <= 15) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return [avgDays, confidence];
}

/**
 * Extract shipping cost from various sources
 */
function extractShippingCost(
  rawData?: Record<string, unknown>,
  constraints?: {
    maxShippingCost?: number;
    shipFrom?: string;
    shipTo?: string;
  }
): number {
  // Try to extract from raw data
  if (rawData) {
    const shippingFields = [
      "shippingCost",
      "shipping_cost",
      "shippingPrice",
      "freightCost",
      "logisticsCost",
    ];

    for (const field of shippingFields) {
      const value = rawData[field];
      if (typeof value === "number" && value > 0) {
        return value;
      }
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
  }

  // Use default estimate based on route
  const origin = constraints?.shipFrom || "CN";
  const destination = constraints?.shipTo || "US";
  const key = `${origin}-${destination}`;
  return DEFAULT_SHIPPING_COSTS[key] ?? 10.0; // Default $10
}

/**
 * Convert price to USD
 * Simple conversion - in production, use FX API
 */
function convertToUSD(
  amount: number,
  currency: string,
  constraints?: { currency?: string }
): number {
  if (currency.toUpperCase() === "USD") {
    return amount;
  }

  // Simple hardcoded rates (in production, use FX API)
  const rates: Record<string, number> = {
    EUR: 1.1,
    GBP: 1.27,
    CAD: 0.73,
    AUD: 0.65,
    CNY: 0.14,
  };

  const rate = rates[currency.toUpperCase()] ?? 1.0;
  return amount * rate;
}

/**
 * Calculate total landed cost for a product result
 * 
 * @param resultData - Product result data with price and currency
 * @param normalizedData - Normalized product data
 * @param constraints - Search constraints with origin/destination
 * @returns Landed cost estimate or null if calculation fails
 */
export function calculateLandedCost(
  resultData: {
    price: number;
    currency: string;
    rawData?: Record<string, unknown>;
    shippingOrigin?: string;
    estimatedDeliveryDays?: number;
  },
  normalizedData?: Record<string, unknown>,
  constraints?: {
    shipFrom?: string;
    shipTo?: string;
    maxShippingCost?: number;
    currency?: string;
  }
): LandedCostEstimate | null {
  try {
    // Get origin and destination
    const originCountry = constraints?.shipFrom || resultData.shippingOrigin || "CN";
    const destinationCountry = constraints?.shipTo || "US";

    // Extract unit price (convert to USD if needed)
    const unitPriceUsd = convertToUSD(
      resultData.price,
      resultData.currency,
      constraints
    );

    if (unitPriceUsd <= 0) {
      console.warn("[Landed Cost] Invalid unit price, skipping calculation");
      return null;
    }

    // Extract shipping cost
    const shippingCostUsd = extractShippingCost(
      resultData.rawData,
      constraints
    );

    // Calculate duties
    const dutyRate = getDutyRate(originCountry, destinationCountry);
    const dutiesUsd = (unitPriceUsd * dutyRate) / 100;

    // Calculate total landed cost
    const totalLandedCostUsd = unitPriceUsd + shippingCostUsd + dutiesUsd;

    // Estimate ETA
    let etaDays: number | undefined = resultData.estimatedDeliveryDays;
    let etaConfidence: "low" | "medium" | "high" = "low";

    if (!etaDays) {
      [etaDays, etaConfidence] = estimateShippingTime(
        originCountry,
        destinationCountry
      );
    } else {
      // If ETA provided, use medium confidence
      etaConfidence = "medium";
    }

    // Determine confidence level
    let confidence: "low" | "medium" | "high" = "medium";
    if (!resultData.rawData || !resultData.shippingOrigin) {
      confidence = "low";
    }

    return {
      unitPriceUsd,
      shippingCostUsd,
      dutiesUsd,
      totalLandedCostUsd,
      currency: "USD",
      confidence,
      etaDays,
      etaConfidence,
    };
  } catch (error) {
    console.error("[Landed Cost] Error calculating landed cost:", error);
    return null;
  }
}

/**
 * Calculate landed cost from provider result
 * Convenience wrapper for standardized ProviderResult format
 */
export function calculateLandedCostForResult(
  result: {
    price: number;
    currency: string;
    shippingOrigin: string;
    estimatedDeliveryDays?: number;
    rawData?: Record<string, unknown>;
  },
  constraints?: {
    shipFrom?: string;
    shipTo?: string;
    maxShippingCost?: number;
    currency?: string;
  }
): LandedCostEstimate | null {
  return calculateLandedCost(
    {
      price: result.price,
      currency: result.currency,
      shippingOrigin: result.shippingOrigin,
      estimatedDeliveryDays: result.estimatedDeliveryDays,
      rawData: result.rawData,
    },
    undefined,
    constraints
  );
}

