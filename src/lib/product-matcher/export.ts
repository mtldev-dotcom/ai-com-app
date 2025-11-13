/**
 * CSV Export Utility
 * Exports product match results to CSV format
 */

import type { ProductMatchResult } from "@/db/schema";

/**
 * Match result item for export
 */
export interface ExportableResult {
  id: string;
  productName: string;
  sku?: string | null;
  price?: number | null;
  currency?: string | null;
  moq?: number | null;
  leadTimeDays?: number | null;
  landedCostValue?: string | null;
  landedCostCurrency?: string | null;
  etaDays?: number | null;
  matchScore?: number | null;
  reliabilityScore?: string | null;
  rankingScore?: string | null;
  supplierName?: string;
  platform?: string;
  productUrl?: string;
  stock?: number | null;
  createdAt: Date;
  status: string;
  bestMatchId?: string | null;
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Extract product name from original product data
 */
function extractProductName(originalProduct: Record<string, unknown> | null): string {
  if (!originalProduct) return "";
  
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
  ];

  for (const key of nameKeys) {
    const value = originalProduct[key];
    if (value && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  // Fallback: use first non-empty string value
  for (const [key, value] of Object.entries(originalProduct)) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  return "";
}

/**
 * Extract stock information from matches
 */
function extractStock(matches: Array<Record<string, unknown>> | null): number | null {
  if (!matches || matches.length === 0) return null;
  
  const bestMatch = matches[0];
  if (bestMatch.specs && typeof bestMatch.specs === "object") {
    const specs = bestMatch.specs as Record<string, unknown>;
    const stock = specs.warehouse_inventory || specs.stock || specs.inventory;
    if (typeof stock === "number") return stock;
    if (typeof stock === "string") {
      const parsed = parseInt(stock);
      if (!isNaN(parsed)) return parsed;
    }
  }
  
  return null;
}

/**
 * Convert product match result to exportable format
 */
function convertToExportable(result: ProductMatchResult): ExportableResult {
  const productName = extractProductName(result.originalProduct);
  const matches = result.matches as Array<Record<string, unknown>> | null;
  const bestMatch = matches?.find((m) => m.productId === result.bestMatchId) || matches?.[0];

  return {
    id: result.id,
    productName,
    sku: result.sku,
    price: bestMatch?.price as number | undefined,
    currency: bestMatch?.currency as string | undefined,
    moq: bestMatch?.moq as number | undefined,
    leadTimeDays: bestMatch?.leadTimeDays as number | undefined,
    landedCostValue: result.landedCostValue ? String(result.landedCostValue) : null,
    landedCostCurrency: result.landedCostCurrency || null,
    etaDays: result.etaDays || null,
    matchScore: bestMatch?.matchScore as number | undefined,
    reliabilityScore: result.reliabilityScore ? String(result.reliabilityScore) : null,
    rankingScore: result.rankingScore ? String(result.rankingScore) : null,
    supplierName: bestMatch?.providerName as string | undefined,
    platform: bestMatch?.providerId as string | undefined,
    productUrl: bestMatch?.supplierUrl as string | undefined,
    stock: extractStock(matches),
    createdAt: result.createdAt,
    status: result.status,
    bestMatchId: result.bestMatchId,
  };
}

/**
 * Export results to CSV
 */
export function exportToCSV(results: ProductMatchResult[], filename?: string): void {
  // Convert results to exportable format
  const exportableResults = results.map(convertToExportable);

  // CSV Headers
  const headers = [
    "Product Name",
    "SKU",
    "Price",
    "Currency",
    "MOQ",
    "Lead Time (days)",
    "Landed Cost",
    "Landed Cost Currency",
    "ETA (days)",
    "Overall Score (%)",
    "Reliability Score (%)",
    "Ranking Score",
    "Supplier Name",
    "Platform",
    "Product URL",
    "Stock",
    "Created At",
    "Status",
  ];

  // Build CSV rows
  const rows = exportableResults.map((result) => {
    return [
      escapeCSV(result.productName),
      escapeCSV(result.sku),
      escapeCSV(result.price),
      escapeCSV(result.currency),
      escapeCSV(result.moq),
      escapeCSV(result.leadTimeDays),
      escapeCSV(result.landedCostValue),
      escapeCSV(result.landedCostCurrency),
      escapeCSV(result.etaDays),
      escapeCSV(result.matchScore ? (result.matchScore * 100).toFixed(2) : null),
      escapeCSV(result.reliabilityScore),
      escapeCSV(result.rankingScore),
      escapeCSV(result.supplierName),
      escapeCSV(result.platform),
      escapeCSV(result.productUrl),
      escapeCSV(result.stock),
      escapeCSV(result.createdAt.toLocaleString()),
      escapeCSV(result.status),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename || `product-matches-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export selected results to CSV
 */
export function exportSelectedToCSV(
  results: ProductMatchResult[],
  selectedIds: Set<string>,
  filename?: string
): void {
  const selectedResults = results.filter((r) => selectedIds.has(r.id));
  exportToCSV(selectedResults, filename);
}

