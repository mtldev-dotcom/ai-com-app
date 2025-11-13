"use client";

/**
 * Product Match Card Component (Redesigned)
 * Modern, data-dense product card optimized for AI product sourcing dashboards
 * Inspired by Shopify and Notion card designs
 */

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Tooltip component - will use native title attributes for now
import { MatchScoreIndicator } from "./match-score-indicator";
import { ProviderBadge } from "./provider-badge";
import {
  ExternalLink,
  Send,
  Clock,
  DollarSign,
  Package,
  MapPin,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Eye,
  Heart,
  Scale,
  Info,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatDeliveryTime, extractProductName } from "../utils/data-formatters";
import type { MatchResult } from "../types";

interface ProductMatchCardProps {
  result: MatchResult;
  onSendToDraft?: (matchResultId: string, useBestMatch: boolean, matchIndex?: number) => void;
  onViewProduct?: (url: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ProductMatchCard({
  result,
  onSendToDraft,
  onViewProduct,
  isLoading = false,
  className,
}: ProductMatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const productName = extractProductName(result.originalProduct);
  const bestMatch = result.matches.find((m) => m.productId === result.bestMatchId) || result.matches[0];

  if (!bestMatch) {
    return (
      <Card className={cn("border border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-2">{productName}</h3>
              <Badge variant="secondary" className="capitalize">
                {result.status.replace("_", " ")}
              </Badge>
            </div>
            {result.error && (
              <div className="text-sm text-destructive">{result.error}</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const mainImage = bestMatch.images?.[0];
  const hasAlternatives = result.matches.length > 1;
  const matchScore = bestMatch.matchScore;
  const landedCost = result.landedCostValue
    ? parseFloat(result.landedCostValue)
    : bestMatch.landedCost?.totalLandedCostUsd;
  const landedCostCurrency = result.landedCostCurrency || bestMatch.landedCost?.currency || "USD";

  // Get SKU from multiple sources
  const sku = result.sku || bestMatch.specs?.sku || bestMatch.sku;

  // Get category from specs
  const category = bestMatch.specs?.Category || bestMatch.specs?.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card
        className={cn(
          "group relative h-full flex flex-col overflow-hidden",
          "border border-border/50 bg-card/50 backdrop-blur-sm",
          "transition-all duration-300 ease-out",
          "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5",
          "hover:-translate-y-1",
          result.status === "found" && "border-green-500/20 bg-green-500/5",
          result.status === "not_found" && "border-yellow-500/20 bg-yellow-500/5",
          result.status === "error" && "border-red-500/20 bg-red-500/5",
          className
        )}
      >
        <CardContent className="p-0 h-full flex flex-col">
          {/* Top Section: Provider & Status */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2">
            {/* Provider Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <ProviderBadge provider={bestMatch.providerName} size="sm" />
              {/* Match Score Circle */}
              <div className="relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "text-xs font-bold backdrop-blur-md text-black",
                    matchScore >= 70
                      ? "bg-green-500/20 border border-green-500/30"
                      : matchScore >= 40
                        ? "bg-yellow-500/20 border border-yellow-500/30"
                        : "bg-red-500/20 border border-red-500/30"
                  )}
                >
                  {matchScore}%
                </div>
                {/* Animated ring */}
                <motion.div
                  className={cn(
                    "absolute inset-0 rounded-full border-2 border-transparent",
                    matchScore >= 70
                      ? "border-green-500/30"
                      : matchScore >= 40
                        ? "border-yellow-500/30"
                        : "border-red-500/30"
                  )}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 0.3, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </div>

            {/* Status Badge */}
            <Badge
              variant={
                result.status === "found"
                  ? "default"
                  : result.status === "not_found"
                    ? "secondary"
                    : "destructive"
              }
              className={cn(
                "capitalize text-xs px-2 py-0.5 backdrop-blur-md",
                result.status === "found" &&
                "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
                result.status === "not_found" &&
                "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
              )}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {result.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Two-Column Two-Row Grid Layout */}
          <div className="grid grid-cols-2 grid-rows-2 gap-0 flex-1 min-h-0">
            {/* Top Left: Product Image (Square 1:1) */}
            <div className="relative w-full aspect-square bg-gradient-to-br from-muted/50 to-muted/30 overflow-hidden flex-shrink-0">
              {mainImage ? (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full relative"
                  >
                    <Image
                      src={mainImage}
                      alt={bestMatch.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 180px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                      priority={false}
                      loading="lazy"
                    />
                    {/* Image overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                  {bestMatch.images && bestMatch.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 z-10">
                      <ImageIcon className="h-3 w-3" />
                      {bestMatch.images.length}
                    </div>
                  )}
                  {/* Quick Preview Button */}
                  <button
                    onClick={() => onViewProduct?.(bestMatch.supplierUrl)}
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10"
                    aria-label="Quick preview"
                  >
                    <Eye className="h-6 w-6 text-white" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Top Right: Product Info */}
            <div className="p-4 md:p-5 flex flex-col min-h-0 overflow-hidden">
              {/* Product Name & Description */}
              <div className="flex-shrink-0 mb-4">
                <h3 className="font-semibold text-base md:text-lg leading-tight line-clamp-2 mb-2 text-foreground">
                  {productName}
                </h3>
                {bestMatch.title && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {bestMatch.title}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Row: Metrics Grid + Landed Cost + Actions (merged, spans 2 columns) */}
            <div className="col-span-2 px-4 md:px-5 pt-3 pb-4 md:pb-5 flex flex-col gap-3 border-t border-border/50">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mb-2 flex-shrink-0">
                <div
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-help"
                  title="Unit price from supplier"
                >
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Price</div>
                    <div className="font-semibold text-sm truncate">
                      {formatPrice(bestMatch.price, bestMatch.currency)}
                    </div>
                  </div>
                </div>

                {sku && (
                  <div
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-help"
                    title={`Product SKU: ${sku}`}
                  >
                    <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">SKU</div>
                      <div className="font-semibold text-sm font-mono text-xs truncate">
                        {String(sku)}
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-help"
                  title="Shipping origin country"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Origin</div>
                    <div className="font-semibold text-sm truncate">
                      {bestMatch.shippingOrigin}
                    </div>
                  </div>
                </div>

                {(result.etaDays || bestMatch.landedCost?.etaDays || bestMatch.estimatedDeliveryDays) && (
                  <div
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-help"
                    title="Estimated delivery time"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">ETA</div>
                      <div className="font-semibold text-sm truncate">
                        {formatDeliveryTime(
                          result.etaDays ||
                          bestMatch.landedCost?.etaDays ||
                          bestMatch.estimatedDeliveryDays ||
                          0
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Landed Cost */}
              {landedCost && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                        Total Landed Cost
                      </span>
                      <span
                        className="cursor-help"
                        title="Includes unit price, shipping costs, and import duties"
                      >
                        <Info
                          className="h-3 w-3 text-blue-600 dark:text-blue-400"
                        />
                      </span>
                    </div>
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                      {formatPrice(landedCost, landedCostCurrency)}
                    </span>
                  </div>
                  {bestMatch.landedCost && (
                    <div className="grid grid-cols-3 gap-2 text-xs text-blue-700 dark:text-blue-300 mt-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                      <div className="truncate">
                        <span className="opacity-70">Unit:</span>{" "}
                        <span className="font-medium">
                          {formatPrice(
                            bestMatch.landedCost.unitPriceUsd,
                            bestMatch.landedCost.currency
                          )}
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="opacity-70">Ship:</span>{" "}
                        <span className="font-medium">
                          {formatPrice(
                            bestMatch.landedCost.shippingCostUsd,
                            bestMatch.landedCost.currency
                          )}
                        </span>
                      </div>
                      <div className="truncate">
                        <span className="opacity-70">Duty:</span>{" "}
                        <span className="font-medium">
                          {formatPrice(
                            bestMatch.landedCost.dutiesUsd,
                            bestMatch.landedCost.currency
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => onSendToDraft?.(result.id, true)}
                  disabled={isLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  <Send className="mr-2 h-3.5 w-3.5" />
                  Send to Drafts
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewProduct?.(bestMatch.supplierUrl)}
                  className="h-9 w-9 p-0 border-border/50 hover:bg-muted/50"
                  title="Quick view"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={cn(
                    "h-9 w-9 p-0 border-border/50 hover:bg-muted/50",
                    isFavorited && "text-red-500 border-red-500/50 bg-red-500/10"
                  )}
                  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={cn(
                      "h-4 w-4",
                      isFavorited && "fill-current"
                    )}
                  />
                </Button>
                {hasAlternatives && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-9 w-9 p-0 border-border/50 hover:bg-muted/50"
                    title={
                      isExpanded
                        ? "Hide alternatives"
                        : `View ${result.matches.length - 1} alternatives`
                    }
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Alternative Matches */}
          {isExpanded && hasAlternatives && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-border/50 bg-muted/20"
            >
              <div className="p-4 space-y-2">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Alternative Matches ({result.matches.length - 1})
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.matches
                    .filter((m) => m.productId !== bestMatch.productId)
                    .map((match) => {
                      // Find the index of this match in the original matches array
                      const matchIndex = result.matches.findIndex((m) => m.productId === match.productId);
                      return (
                        <div
                          key={match.productId}
                          className="p-2.5 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm truncate">
                                  {match.title}
                                </span>
                                <MatchScoreIndicator
                                  score={match.matchScore}
                                  size="sm"
                                  showProgress={false}
                                  showLabel={false}
                                />
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatPrice(match.price, match.currency)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {match.shippingOrigin}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onSendToDraft?.(result.id, false, matchIndex)}
                              disabled={isLoading}
                              className="h-7 px-2 text-xs"
                            >
                              Use
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
