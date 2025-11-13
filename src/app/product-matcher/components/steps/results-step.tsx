"use client";

/**
 * Results Step Component
 * Complete results view with filtering, sorting, and multiple view modes
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatisticsDashboard } from "../statistics-dashboard";
import { AdvancedFilters, type FilterState } from "../advanced-filters";
import { SortSelector, type SortState } from "../sort-selector";
import { ResultsGridView } from "../results-grid-view";
import { ResultsListView } from "../results-list-view";
import { LoadingSkeleton } from "../loading-skeleton";
import {
  TrendingUp,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { ViewSelector } from "../view-selector";
import { cn } from "@/lib/utils";
import type { MatcherJob } from "../types";
import type { ViewMode } from "../view-selector";

interface ResultsStepProps {
  job: MatcherJob;
  onSendToDraft?: (matchResultId: string, useBestMatch: boolean, matchIndex?: number) => void;
  onViewProduct?: (url: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ResultsStep({
  job,
  onSendToDraft,
  onViewProduct,
  isLoading = false,
  className,
}: ResultsStepProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    providers: [],
    shippingOrigin: [],
    priceRange: {},
  });
  const [sort, setSort] = useState<SortState>({
    field: "matchScore",
    direction: "desc",
  });

  const stats = useMemo(() => {
    const results = job.results || [];
    return {
      total: results.length,
      found: results.filter((r) => r.status === "found").length,
      notFound: results.filter((r) => r.status === "not_found").length,
      error: results.filter((r) => r.status === "error").length,
    };
  }, [job.results]);

  const filteredAndSortedResults = useMemo(() => {
    let results = job.results || [];

    // Apply filters
    if (filters.status.length > 0) {
      results = results.filter((r) => filters.status.includes(r.status));
    }

    if (filters.shippingOrigin.length > 0) {
      results = results.filter((r) => {
        const bestMatch = r.matches.find((m) => m.productId === r.bestMatchId) || r.matches[0];
        return bestMatch && filters.shippingOrigin.includes(bestMatch.shippingOrigin);
      });
    }

    if (filters.priceRange.min !== undefined || filters.priceRange.max !== undefined) {
      results = results.filter((r) => {
        const bestMatch = r.matches.find((m) => m.productId === r.bestMatchId) || r.matches[0];
        if (!bestMatch) return false;
        if (filters.priceRange.min !== undefined && bestMatch.price < filters.priceRange.min) {
          return false;
        }
        if (filters.priceRange.max !== undefined && bestMatch.price > filters.priceRange.max) {
          return false;
        }
        return true;
      });
    }

    if (filters.matchScore !== undefined) {
      results = results.filter((r) => {
        const bestMatch = r.matches.find((m) => m.productId === r.bestMatchId) || r.matches[0];
        return bestMatch && bestMatch.matchScore >= filters.matchScore!;
      });
    }

    // Apply sorting
    results = [...results].sort((a, b) => {
      const matchA = a.matches.find((m) => m.productId === a.bestMatchId) || a.matches[0];
      const matchB = b.matches.find((m) => m.productId === b.bestMatchId) || b.matches[0];

      if (!matchA || !matchB) return 0;

      let valueA: number;
      let valueB: number;

      switch (sort.field) {
        case "matchScore":
          valueA = matchA.matchScore;
          valueB = matchB.matchScore;
          break;
        case "price":
          valueA = matchA.price;
          valueB = matchB.price;
          break;
        case "delivery":
          valueA = matchA.estimatedDeliveryDays || 999;
          valueB = matchB.estimatedDeliveryDays || 999;
          break;
        case "inventory":
          valueA = matchA.warehouseInventoryNum || 0;
          valueB = matchB.warehouseInventoryNum || 0;
          break;
        default:
          return 0;
      }

      if (sort.direction === "asc") {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });

    return results;
  }, [job.results, filters, sort]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      case "processing":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const resetFilters = () => {
    setFilters({
      status: [],
      providers: [],
      shippingOrigin: [],
      priceRange: {},
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Job Header */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {job.name}
              </CardTitle>
              <CardDescription className="mt-2">
                {job.progress &&
                  `${job.progress.processed} / ${job.progress.total} products searched`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn("flex items-center gap-2", getStatusColor(job.status))}>
                {getStatusIcon(job.status)}
                <span className="text-sm font-medium capitalize">{job.status}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          {job.progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {Math.round((job.progress.processed / job.progress.total) * 100)}%
                </span>
              </div>
              <Progress
                value={(job.progress.processed / job.progress.total) * 100}
                className="h-3"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Dashboard */}
      {job.status === "completed" && stats.total > 0 && (
        <StatisticsDashboard results={job.results || []} />
      )}

      {/* Filters and Controls */}
      {job.status === "completed" && stats.total > 0 && (
        <div className="space-y-4">
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={resetFilters}
            stats={stats}
          />

          {/* View Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredAndSortedResults.length} of {stats.total} results
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <SortSelector sort={sort} onSortChange={setSort} />
              <ViewSelector viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {job.status === "processing" && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Searching for products...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {job.status === "completed" && (
        <>
          {filteredAndSortedResults.length > 0 ? (
            viewMode === "grid" ? (
              <ResultsGridView
                results={filteredAndSortedResults}
                onSendToDraft={onSendToDraft}
                onViewProduct={onViewProduct}
                isLoading={isLoading}
              />
            ) : (
              <ResultsListView
                results={filteredAndSortedResults}
                onSendToDraft={onSendToDraft}
                onViewProduct={onViewProduct}
                isLoading={isLoading}
              />
            )
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">No results match the current filters</p>
                  <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

