/**
 * Data formatting utilities for Product Matcher
 */

import { colors, getMatchScoreColor } from "./design-tokens";

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currency: string = "USD"): string {
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CAD: "C$",
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${price.toFixed(2)}`;
}

/**
 * Format price range
 */
export function formatPriceRange(
  min: number,
  max: number,
  currency: string = "USD"
): string {
  return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
}

/**
 * Format delivery time
 */
export function formatDeliveryTime(days: number | string | undefined): string {
  if (!days) return "N/A";

  const daysNum = typeof days === "string" ? parseInt(days.split("-")[0]) : days;

  if (daysNum === 1) return "1 day";
  if (daysNum <= 7) return `${daysNum} days`;
  if (daysNum <= 14) return "1-2 weeks";
  if (daysNum <= 30) return "2-4 weeks";
  return "1+ month";
}

/**
 * Format inventory count
 */
export function formatInventory(count: number | undefined): string {
  if (!count) return "Out of stock";
  if (count < 10) return "Low stock";
  if (count < 100) return `${count} available`;
  if (count < 1000) return `${Math.floor(count / 100) * 100}+`;
  return `${Math.floor(count / 1000)}k+`;
}

/**
 * Extract product name from original product data
 */
export function extractProductName(
  product: Record<string, unknown>
): string {
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
  ];

  // Try exact matches first
  for (const key of nameKeys) {
    const value = product[key];
    if (value && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  // Try case-insensitive match
  const productLower = Object.keys(product).reduce((acc, k) => {
    acc[k.toLowerCase()] = product[k];
    return acc;
  }, {} as Record<string, unknown>);

  for (const key of nameKeys) {
    const value = productLower[key.toLowerCase()];
    if (value && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  // Try to find first non-empty string value
  for (const [key, value] of Object.entries(product)) {
    const strValue = String(value).trim();
    if (
      strValue.length > 2 &&
      !strValue.match(/^[\d.,]+$/) &&
      !key.toLowerCase().includes("id") &&
      !key.toLowerCase().includes("sku") &&
      !key.toLowerCase().includes("price")
    ) {
      return strValue;
    }
  }

  // Fallback
  const firstKey = Object.keys(product)[0];
  return firstKey && product[firstKey]
    ? String(product[firstKey])
    : "Unknown Product";
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Get match score badge variant
 */
export function getMatchScoreVariant(score: number): "default" | "secondary" | "destructive" {
  const color = getMatchScoreColor(score);
  if (color === "high") return "default";
  if (color === "medium") return "secondary";
  return "destructive";
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

