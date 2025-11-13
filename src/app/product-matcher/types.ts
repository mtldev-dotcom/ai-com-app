/**
 * Product Matcher Types
 */

export type JobStatus = "pending" | "processing" | "completed" | "failed";
export type ResultStatus = "pending" | "searching" | "found" | "not_found" | "error";

export interface ProductMatch {
  providerId: string;
  providerName: string;
  productId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  shippingOrigin: string;
  estimatedDeliveryDays?: number;
  supplierUrl: string;
  specs?: Record<string, string>;
  matchScore: number;
  sku?: string;
  moq?: number;
  leadTimeDays?: number;
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
  reliabilityScore?: number;
  rankingScore?: number;
  // CJ API specific fields
  warehouseInventoryNum?: number;
  totalVerifiedInventory?: number;
  deliveryCycle?: string;
  categoryId?: string;
  threeCategoryName?: string;
  twoCategoryName?: string;
  oneCategoryName?: string;
  supplierName?: string;
}

export interface MatchResult {
  id: string;
  originalProduct: Record<string, unknown>;
  matches: ProductMatch[];
  bestMatchId: string | null;
  status: ResultStatus;
  error: string | null;
  sku?: string | null;
  landedCostValue?: string | null;
  landedCostCurrency?: string;
  etaDays?: number | null;
  reliabilityScore?: string | null;
  rankingScore?: string | null;
}

export interface MatcherJob {
  id: string;
  name: string;
  status: JobStatus;
  progress: { processed: number; total: number } | null;
  criteria?: {
    shippingOrigin?: string[];
    maxDeliveryDays?: number;
    priceRange?: { min?: number; max?: number };
    currency?: string;
    countryCode?: string;
    categoryId?: string;
    startWarehouseInventory?: number;
    endWarehouseInventory?: number;
    verifiedWarehouse?: number;
  };
  results?: MatchResult[];
}

