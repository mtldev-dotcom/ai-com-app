/**
 * FX Conversion Service
 * Fetches and caches exchange rates for currency conversion
 * Uses exchangerate.host API (free tier) or configured provider
 */

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Simple in-memory cache (can be upgraded to Redis later)
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get exchange rate from cache or fetch from API
 * @param fromCurrency - Source currency (e.g., "CAD")
 * @param toCurrency - Target currency (e.g., "USD")
 * @returns Exchange rate (e.g., 1.35 means 1 CAD = 1.35 USD)
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return 1.0;
  }

  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = rateCache.get(cacheKey);

  // Check cache first
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rate;
  }

  try {
    // Fetch from exchangerate.host (free API)
    // API: https://api.exchangerate.host/convert?from=CAD&to=USD
    const response = await fetch(
      `https://api.exchangerate.host/convert?from=${fromCurrency}&to=${toCurrency}`,
      {
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success || !data.result) {
      throw new Error("Invalid exchange rate response");
    }

    const rate = data.result as number;

    // Update cache
    rateCache.set(cacheKey, {
      rate,
      timestamp: Date.now(),
    });

    // Also cache reverse rate
    rateCache.set(`${toCurrency}_${fromCurrency}`, {
      rate: 1 / rate,
      timestamp: Date.now(),
    });

    return rate;
  } catch (error) {
    console.error(
      `Error fetching exchange rate ${fromCurrency} to ${toCurrency}:`,
      error
    );

    // If cache exists but expired, use it as fallback
    if (cached) {
      console.warn("Using expired cache as fallback");
      return cached.rate;
    }

    // Last resort: return 1.0 (no conversion)
    console.warn("No rate available, using 1.0");
    return 1.0;
  }
}

/**
 * Convert amount from one currency to another
 * @param amount - Amount to convert
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns Converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency);
  return amount * rate;
}

/**
 * Store exchange rates in database (for persistence across restarts)
 */
export async function storeExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number
): Promise<void> {
  const key = `fx_rate_${fromCurrency}_${toCurrency}`;

  const [existing] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  if (existing) {
    await db
      .update(settings)
      .set({
        valueJsonb: { rate, timestamp: Date.now() },
        updatedAt: new Date(),
      })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({
      key,
      valueJsonb: { rate, timestamp: Date.now() },
    });
  }
}

/**
 * Get stored exchange rate from database
 */
export async function getStoredExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  const key = `fx_rate_${fromCurrency}_${toCurrency}`;

  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  if (!setting || typeof setting.valueJsonb !== "object") {
    return null;
  }

  const data = setting.valueJsonb as { rate: number; timestamp: number };

  // Check if stored rate is still fresh (within 1 hour)
  if (Date.now() - data.timestamp > CACHE_TTL) {
    return null; // Expired
  }

  return data.rate;
}
