/**
 * Price Monitoring Function
 * Checks prices for all published products and compares against price rules
 * Creates price_check records and generates alerts
 */

import { db } from "@/db";
import { productsDraft, priceRules, priceChecks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getActivePriceRules } from "@/app/actions/price-rules";
import { createPriceCheck } from "@/app/actions/price-checks";
import { convertCurrency } from "@/lib/fx/converter";
import type { PriceRule } from "@/db/schema/price-rules";

/**
 * Run price monitoring check
 * Computes margins for all published products and creates price_checks
 */
export async function runPriceMonitoring(): Promise<{
  checked: number;
  alerts: number;
  errors: string[];
}> {
  const results = {
    checked: 0,
    alerts: 0,
    errors: [] as string[],
  };

  try {
    // Get all published products
    const publishedProducts = await db
      .select()
      .from(productsDraft)
      .where(eq(productsDraft.status, "published"));

    // Get active price rules
    const activeRules = await getActivePriceRules();

    if (activeRules.length === 0) {
      return {
        ...results,
        errors: ["No active price rules found"],
      };
    }

    // Use first active rule (or implement rule matching logic)
    const rule = activeRules[0] as PriceRule;
    const targetMargin = parseFloat(rule.targetMarginPct);
    const minMargin = rule.minMarginPct
      ? parseFloat(rule.minMarginPct)
      : undefined;

    // Check each product
    for (const product of publishedProducts) {
      try {
        const cost = parseFloat(product.cost || "0");
        const sellingPrice = parseFloat(product.sellingPrice || "0");

        if (cost <= 0 || sellingPrice <= 0) {
          continue; // Skip products without valid pricing
        }

        // Calculate margin
        const margin = ((sellingPrice - cost) / cost) * 100;

        // Convert currencies if needed (assuming cost is in supplier currency, selling in target)
        // For now, assume same currency - FX conversion can be added later
        const supplierCurrency = "CAD"; // Default
        const sellingCurrency = "CAD"; // Default

        // Calculate delta from target
        const delta = margin - targetMargin;

        // Create price check record
        await createPriceCheck({
          productDraftId: product.id,
          supplierPriceAmount: cost,
          supplierPriceCurrency: supplierCurrency,
          sellingPriceAmount: sellingPrice,
          sellingPriceCurrency: sellingCurrency,
          marginPct: margin,
          deltaPct: delta,
        });

        results.checked++;

        // Check if alert needed (margin below minimum or delta too large)
        if (minMargin && margin < minMargin) {
          results.alerts++;
        } else if (Math.abs(delta) > 10) {
          // Alert if delta > 10%
          results.alerts++;
        }
      } catch (error) {
        const errorMsg = `Error checking product ${product.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        results.errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    return results;
  } catch (error) {
    const errorMsg = `Price monitoring failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    results.errors.push(errorMsg);
    console.error(errorMsg, error);
    return results;
  }
}
