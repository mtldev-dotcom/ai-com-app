"use client";

/**
 * Expandable Matches Component
 * Shows all matches for a product result with expand/collapse functionality
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchScoreIndicator } from "./match-score-indicator";
import { ProviderBadge } from "./provider-badge";
import { ChevronDown, ChevronUp, ExternalLink, Send } from "lucide-react";
import { formatPrice, formatDeliveryTime } from "../utils/data-formatters";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { MatchResult } from "../types";

interface ExpandableMatchesProps {
  result: MatchResult;
  onSendToDraft?: (matchResultId: string, useBestMatch: boolean, matchIndex?: number) => void;
  onViewProduct?: (url: string) => void;
  isLoading?: boolean;
}

export function ExpandableMatches({
  result,
  onSendToDraft,
  onViewProduct,
  isLoading = false,
}: ExpandableMatchesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const matches = result.matches || [];
  const bestMatch = matches.find((m) => m.productId === result.bestMatchId) || matches[0];
  const otherMatches = matches.filter((m) => m.productId !== result.bestMatchId);

  if (matches.length === 0) {
    return null;
  }

  return (
    <>
      {/* Main row with expand button */}
      <tr className="border-b hover:bg-muted/50 transition-colors">
        <td colSpan={9} className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                {matches.length} match{matches.length !== 1 ? "es" : ""} found
                {otherMatches.length > 0 && ` (${otherMatches.length} alternative${otherMatches.length !== 1 ? "s" : ""})`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? "Hide" : "View All"} Matches
            </Button>
          </div>
        </td>
      </tr>

      {/* Expanded matches */}
      {isExpanded && (
        <>
          {matches.map((match, index) => {
            const isBestMatch = match.productId === result.bestMatchId;
            return (
              <tr
                key={`${result.id}-match-${match.productId}-${index}`}
                className={cn(
                  "border-b hover:bg-muted/30 transition-colors",
                  isBestMatch && "bg-primary/5"
                )}
              >
                <td className="px-4 py-3 pl-12">
                  <div className="flex items-center gap-3">
                    {match.images?.[0] && (
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={match.images[0]}
                          alt={match.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate text-sm">{match.title}</div>
                      {match.description && (
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {match.description.substring(0, 80)}
                          {match.description.length > 80 ? "..." : ""}
                        </div>
                      )}
                      {isBestMatch && (
                        <Badge variant="default" className="mt-1 text-xs">
                          Best Match
                        </Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {match.specs?.sku ? (
                    <span className="font-mono text-xs">{String(match.specs.sku)}</span>
                  ) : match.sku ? (
                    <span className="font-mono text-xs">{match.sku}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <MatchScoreIndicator score={match.matchScore} size="sm" showProgress={false} />
                </td>
                <td className="px-4 py-3">
                  <ProviderBadge provider={match.providerName} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-sm">
                    {formatPrice(match.price, match.currency)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {match.landedCost ? (
                    <div>
                      <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">
                        {formatPrice(match.landedCost.totalLandedCostUsd, match.landedCost.currency)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground text-xs">{match.shippingOrigin}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground text-xs">
                    {formatDeliveryTime(
                      match.landedCost?.etaDays || match.estimatedDeliveryDays || 0
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSendToDraft?.(result.id, false, index)}
                      disabled={isLoading}
                      className="h-7 w-7 p-0"
                      title="Send to draft"
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewProduct?.(match.supplierUrl)}
                      className="h-7 w-7 p-0"
                      title="View product"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </>
      )}
    </>
  );
}

