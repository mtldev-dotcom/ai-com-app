/**
 * Product Matcher Processor
 * Orchestrates bulk product search jobs with progress tracking
 */

import { db } from "@/db";
import {
  productMatcherJobs,
  productMatchResults,
  type ProductMatcherJob,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { CJProvider } from "./providers/cj-provider";
import { WebProvider } from "./providers/web-provider";
import type { ProductSearchProvider } from "./providers/base";
import { calculateMatchScore, findBestMatch } from "./matcher";
import type { ProductQuery, SearchCriteria } from "./providers/base";
import { CJAPIError } from "@/lib/cj/client";
import { extractSKU } from "./sku-extractor";
import {
  calculateLandedCostForResult,
  type LandedCostEstimate,
} from "./costing";
import { calculateRankingScore, calculateReliabilityScore } from "./scoring";

/**
 * Initialize providers based on provider names
 */
function getProviders(providerNames: string[]): ProductSearchProvider[] {
  const providers: ProductSearchProvider[] = [];

  if (providerNames.includes("cj")) {
    providers.push(new CJProvider());
  }

  if (providerNames.includes("web")) {
    providers.push(new WebProvider());
  }

  return providers;
}

/**
 * Extract product name from row data
 * Tries multiple common column name variations
 */
function extractProductName(product: Record<string, string | number>): string {
  // Common column name variations (case-insensitive)
  const nameKeys = [
    "name",
    "productname",
    "product name",
    "product_name",
    "title",
    "product title",
    "producttitle",
    "product_title",
    "item",
    "item name",
    "itemname",
    "item_name",
    "product",
    "product description",
    "productdescription",
  ];

  // Try exact matches first (case-insensitive)
  const productLower = Object.keys(product).reduce((acc, key) => {
    acc[key.toLowerCase()] = product[key];
    return acc;
  }, {} as Record<string, string | number>);

  for (const key of nameKeys) {
    const value = productLower[key.toLowerCase()];
    if (value && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  // If no match found, try to find the first non-empty column that looks like a name
  // (longer than 2 characters, not a number, not a URL)
  for (const [key, value] of Object.entries(product)) {
    const strValue = String(value).trim();
    if (
      strValue.length > 2 &&
      !strValue.match(/^[\d.,]+$/) && // Not just numbers
      !strValue.match(/^https?:\/\//) && // Not a URL
      !key.toLowerCase().includes("id") && // Not an ID field
      !key.toLowerCase().includes("sku") && // Not an SKU field
      !key.toLowerCase().includes("price") && // Not a price field
      !key.toLowerCase().includes("quantity") && // Not a quantity field
      !key.toLowerCase().includes("stock") // Not a stock field
    ) {
      return strValue;
    }
  }

  return "";
}

/**
 * Process a single product search
 */
async function processProduct(
  jobId: string,
  product: Record<string, string | number>,
  providers: ProductSearchProvider[],
  criteria: SearchCriteria,
  productIndex: number
): Promise<void> {
  // Extract product name using improved detection
  const productName = extractProductName(product);

  console.log(`Processing product ${productIndex + 1}:`, {
    extractedName: productName,
    availableColumns: Object.keys(product),
    sampleData: Object.fromEntries(
      Object.entries(product).slice(0, 3).map(([k, v]) => [k, String(v).slice(0, 50)])
    ),
  });

  // Extract product query from sheet data
  const query: ProductQuery = {
    name: productName,
    description: product["description"]
      ? String(product["description"])
      : undefined,
    price: product["price"]
      ? typeof product["price"] === "number"
        ? product["price"]
        : parseFloat(String(product["price"]))
      : undefined,
    specs: extractSpecs(product),
  };

  // Create result record first
  const [result] = await db
    .insert(productMatchResults)
    .values({
      jobId,
      originalProduct: product,
      matches: [],
      status: query.name && query.name.trim() !== "" ? "searching" : "error",
      error:
        query.name && query.name.trim() !== ""
          ? null
          : `Product name not found. Available columns: ${Object.keys(product).join(", ")}`,
    })
    .returning();

  // If no product name, return early
  if (!query.name || query.name.trim() === "") {
    return;
  }

  try {
    // Search providers sequentially to avoid rate limits
    // CJ API has strict rate limits, so we process one at a time
    const allResults: Awaited<ReturnType<ProductSearchProvider["search"]>> = [];
    
    for (const provider of providers) {
      try {
        const results = await provider.search(query, criteria);
        allResults.push(...results);
        
        // Add small delay between providers to avoid rate limits
        if (providers.length > 1 && provider !== providers[providers.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Provider ${provider.name} error:`, error);
        // Check if it's a rate limit error
        if (
          error instanceof CJAPIError &&
          error.code === 429
        ) {
          // Mark result with rate limit error
          await db
            .update(productMatchResults)
            .set({
              status: "error",
              error: `Rate limit exceeded for ${provider.displayName}. Please try again later or reduce the number of products.`,
            })
            .where(eq(productMatchResults.id, result.id));
          return; // Stop processing this product
        }
        // Continue with other providers even if one fails
      }
    }

    console.log(`Product "${query.name}": Found ${allResults.length} results from providers`);

    // Calculate match scores for each result
    const matchesWithScores = allResults.map((providerResult) => ({
      ...providerResult,
      matchScore: calculateMatchScore(query, providerResult, criteria),
    }));

    // Calculate landed costs for all matches
    const matchesWithCosts = matchesWithScores.map((match) => {
      const landedCost = calculateLandedCostForResult(match, {
        shipFrom: criteria.shipFrom,
        shipTo: criteria.shipTo,
        maxShippingCost: criteria.maxShippingCost,
        currency: criteria.currency,
      });

      return {
        ...match,
        landedCost,
      };
    });

    // Filter by shipping cost if specified
    let filteredMatches = matchesWithCosts;
    if (criteria.maxShippingCost !== undefined) {
      filteredMatches = matchesWithCosts.filter((match) => {
        if (!match.landedCost) return true; // Include if no cost calculated
        return match.landedCost.shippingCostUsd <= criteria.maxShippingCost!;
      });
    }

    // Calculate ranking scores
    const matchesWithRanking = filteredMatches.map((match) => {
      const rankingScore = calculateRankingScore(match, query);
      return {
        ...match,
        rankingScore,
      };
    });

    // Find best match (highest ranking score)
    const bestMatch = matchesWithRanking.reduce((best, current) => {
      if (!best) return current;
      const bestRanking = best.rankingScore || 0;
      const currentRanking = current.rankingScore || 0;
      return currentRanking > bestRanking ? current : best;
    }, null as typeof matchesWithRanking[0] | null);

    console.log(`Product "${query.name}": Best match score: ${bestMatch?.matchScore || "N/A"}, Ranking: ${bestMatch?.rankingScore || "N/A"}`);

    // Extract SKU from best match - prioritize sku field from ProviderResult
    let sku: string | null = null;
    if (bestMatch) {
      // First try the sku field directly from ProviderResult (from API response)
      if (bestMatch.sku) {
        sku = bestMatch.sku;
        console.log(`[SKU] Using SKU from ProviderResult: ${sku} for product: ${bestMatch.title}`);
      } 
      // Second try specs.sku (set by provider during normalization)
      else if (bestMatch.specs?.sku && typeof bestMatch.specs.sku === "string") {
        sku = bestMatch.specs.sku.trim();
        if (sku) {
          console.log(`[SKU] Using SKU from specs: ${sku} for product: ${bestMatch.title}`);
        }
      }
      // Fallback to extraction from specs/rawData
      if (!sku) {
        sku = extractSKU(
          undefined,
          bestMatch.specs,
          bestMatch.rawData,
          bestMatch.title
        );
        if (sku) {
          console.log(`[SKU] Extracted SKU via fallback: ${sku} for product: ${bestMatch.title}`);
        }
      }
    }
    
    if (!sku && bestMatch) {
      console.warn(`[SKU] No SKU found for product: ${bestMatch.title}`);
      // Log available data for debugging
      if (bestMatch.rawData) {
        console.warn(`[SKU] Available rawData keys:`, Object.keys(bestMatch.rawData));
        if (bestMatch.rawData.productSku) {
          console.warn(`[SKU] Found productSku in rawData:`, bestMatch.rawData.productSku);
        }
      }
    }

    // Extract landed cost and ETA from best match
    const landedCostData = bestMatch?.landedCost;
    const landedCostValue = landedCostData?.totalLandedCostUsd
      ? String(landedCostData.totalLandedCostUsd)
      : null;
    const landedCostCurrency = landedCostData?.currency || "USD";
    const etaDays = landedCostData?.etaDays || bestMatch?.estimatedDeliveryDays || null;

    // Calculate reliability score (simplified - can be enhanced)
    const reliabilityScore = bestMatch
      ? calculateReliabilityScore(bestMatch)
      : null;

    // Update result with matches and calculated fields
    await db
      .update(productMatchResults)
      .set({
        matches: matchesWithRanking.map((m) => ({
          ...m,
          landedCost: m.landedCost,
        })),
        bestMatchId: bestMatch?.productId || null,
        sku,
        landedCostValue,
        landedCostCurrency,
        etaDays,
        reliabilityScore: reliabilityScore ? String(reliabilityScore) : null,
        rankingScore: bestMatch?.rankingScore ? String(bestMatch.rankingScore) : null,
        status: matchesWithRanking.length > 0 ? "found" : "not_found",
      })
      .where(eq(productMatchResults.id, result.id));
  } catch (error) {
    // Update result with error
    await db
      .update(productMatchResults)
      .set({
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(productMatchResults.id, result.id));
  }
}

/**
 * Extract specs from product data
 */
function extractSpecs(
  product: Record<string, string | number>
): Record<string, string> | undefined {
  const specs: Record<string, string> = {};
  const specKeys = [
    "specs",
    "specifications",
    "dimensions",
    "weight",
    "material",
    "color",
    "size",
  ];

  for (const key of specKeys) {
    if (product[key]) {
      specs[key] = String(product[key]);
    }
  }

  return Object.keys(specs).length > 0 ? specs : undefined;
}

/**
 * Process a product matcher job
 * This function handles the async processing of bulk searches
 */
export async function processMatcherJob(jobId: string): Promise<void> {
  // Fetch job
  const [job] = await db
    .select()
    .from(productMatcherJobs)
    .where(eq(productMatcherJobs.id, jobId))
    .limit(1);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (job.status !== "pending") {
    console.log(`Job ${jobId} is not pending, skipping`);
    return;
  }

  // Update job status to processing
  await db
    .update(productMatcherJobs)
    .set({
      status: "processing",
      progress: { processed: 0, total: job.sheetData?.length || 0 },
    })
    .where(eq(productMatcherJobs.id, jobId));

  try {
    const products = job.sheetData || [];
    const providers = getProviders(job.providers || []);
    const criteria = job.criteria || {};

    if (providers.length === 0) {
      throw new Error("No providers configured");
    }

    // Process products sequentially with delays to avoid rate limits
    // Add delay between products to respect API rate limits (especially for CJ)
    const DELAY_BETWEEN_PRODUCTS_MS = 2000; // 2 seconds between products
    
    for (let i = 0; i < products.length; i++) {
      await processProduct(jobId, products[i], providers, criteria, i);

      // Update progress
      await db
        .update(productMatcherJobs)
        .set({
          progress: {
            processed: i + 1,
            total: products.length,
          },
        })
        .where(eq(productMatcherJobs.id, jobId));

      // Add delay between products (except for the last one)
      if (i < products.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_PRODUCTS_MS));
      }
    }

    // Mark job as completed
    await db
      .update(productMatcherJobs)
      .set({
        status: "completed",
        progress: {
          processed: products.length,
          total: products.length,
        },
      })
      .where(eq(productMatcherJobs.id, jobId));
  } catch (error) {
    // Mark job as failed
    await db
      .update(productMatcherJobs)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(productMatcherJobs.id, jobId));
    throw error;
  }
}

/**
 * Get job with results
 */
export async function getJobWithResults(
  jobId: string
): Promise<
  | (ProductMatcherJob & {
      results: Array<{
        id: string;
        originalProduct: Record<string, unknown>;
        matches: Array<{
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
        }>;
        bestMatchId: string | null;
        status: string;
        error: string | null;
        createdAt: Date;
      }>;
    })
  | null
> {
  const [job] = await db
    .select()
    .from(productMatcherJobs)
    .where(eq(productMatcherJobs.id, jobId))
    .limit(1);

  if (!job) {
    return null;
  }

  const results = await db
    .select()
    .from(productMatchResults)
    .where(eq(productMatchResults.jobId, jobId))
    .orderBy(productMatchResults.createdAt);

  return {
    ...job,
    results: results.map((r) => ({
      id: r.id,
      originalProduct: r.originalProduct || {},
      matches: r.matches || [],
      bestMatchId: r.bestMatchId,
      status: r.status,
      error: r.error,
      createdAt: r.createdAt,
    })),
  };
}

