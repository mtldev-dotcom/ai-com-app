"use client";

/**
 * Results List View Component
 * Compact table format for product matches
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchScoreIndicator } from "./match-score-indicator";
import { ProviderBadge } from "./provider-badge";
import { ExternalLink, Send, ChevronRight, ChevronDown } from "lucide-react";
import { formatPrice, formatDeliveryTime, extractProductName } from "../utils/data-formatters";
import { cn } from "@/lib/utils";
import type { MatchResult } from "../types";
import Image from "next/image";
import { ExpandableMatches } from "./expandable-matches";

interface ResultsListViewProps {
  results: MatchResult[];
  onSendToDraft?: (matchResultId: string, useBestMatch: boolean, matchIndex?: number) => void;
  onViewProduct?: (url: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ResultsListView({
  results,
  onSendToDraft,
  onViewProduct,
  isLoading = false,
  className,
}: ResultsListViewProps) {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  const toggleExpanded = (resultId: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  };

  if (results.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <p className="text-muted-foreground">No results to display</p>
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-md border bg-background", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-semibold">Product</th>
            <th className="px-4 py-3 text-left font-semibold">SKU</th>
            <th className="px-4 py-3 text-left font-semibold">Match</th>
            <th className="px-4 py-3 text-left font-semibold">Provider</th>
            <th className="px-4 py-3 text-left font-semibold">Price</th>
            <th className="px-4 py-3 text-left font-semibold">Landed Cost</th>
            <th className="px-4 py-3 text-left font-semibold">Origin</th>
            <th className="px-4 py-3 text-left font-semibold">ETA</th>
            <th className="px-4 py-3 text-left font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const productName = extractProductName(result.originalProduct);
            const bestMatch =
              result.matches.find((m) => m.productId === result.bestMatchId) || result.matches[0];

            if (!bestMatch) {
              return (
                <tr key={result.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td colSpan={9} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{productName}</span>
                      <Badge variant="secondary" className="capitalize">
                        {result.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <>
                <tr key={result.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {result.matches && result.matches.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(result.id);
                          }}
                          className="h-6 w-6 p-0 flex-shrink-0 hover:bg-muted"
                          title={expandedResults.has(result.id) ? "Collapse matches" : `Expand ${result.matches.length} match${result.matches.length !== 1 ? "es" : ""}`}
                        >
                          {expandedResults.has(result.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {bestMatch.images?.[0] && (
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={bestMatch.images[0]}
                            alt={bestMatch.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{productName}</div>
                        <div className="text-xs text-muted-foreground truncate">{bestMatch.title}</div>
                        {result.matches && result.matches.length > 1 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.matches.length} match{result.matches.length !== 1 ? "es" : ""} found
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {result.sku ? (
                      <span className="font-mono text-xs">{result.sku}</span>
                    ) : bestMatch.specs?.sku ? (
                      <span className="font-mono text-xs">{String(bestMatch.specs.sku)}</span>
                    ) : bestMatch.sku ? (
                      <span className="font-mono text-xs">{bestMatch.sku}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <MatchScoreIndicator score={bestMatch.matchScore} size="sm" showProgress={false} />
                  </td>
                  <td className="px-4 py-3">
                    <ProviderBadge provider={bestMatch.providerName} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {formatPrice(bestMatch.price, bestMatch.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {result.landedCostValue ? (
                      <div>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {formatPrice(parseFloat(result.landedCostValue), result.landedCostCurrency || "USD")}
                        </span>
                      </div>
                    ) : bestMatch.landedCost ? (
                      <div>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {formatPrice(bestMatch.landedCost.totalLandedCostUsd, bestMatch.landedCost.currency)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">{bestMatch.shippingOrigin}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">
                      {formatDeliveryTime(
                        result.etaDays || bestMatch.landedCost?.etaDays || bestMatch.estimatedDeliveryDays || 0
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSendToDraft?.(result.id, true)}
                        disabled={isLoading}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewProduct?.(bestMatch.supplierUrl)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
                {result.matches && result.matches.length > 0 && expandedResults.has(result.id) && (
                  <ExpandableMatches
                    key={`expandable-${result.id}`}
                    result={result}
                    onSendToDraft={onSendToDraft}
                    onViewProduct={onViewProduct}
                    isLoading={isLoading}
                  />
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

