"use client";

/**
 * Statistics Dashboard Component
 * Charts and metrics showing match quality, price distribution, and provider metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, DollarSign, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchResult } from "../types";

interface StatisticsDashboardProps {
  results: MatchResult[];
  className?: string;
}

export function StatisticsDashboard({ results, className }: StatisticsDashboardProps) {
  const stats = {
    total: results.length,
    found: results.filter((r) => r.status === "found").length,
    notFound: results.filter((r) => r.status === "not_found").length,
    error: results.filter((r) => r.status === "error").length,
  };

  const foundResults = results.filter((r) => r.status === "found");
  const matchScores = foundResults
    .flatMap((r) => r.matches.map((m) => m.matchScore))
    .filter((score) => score > 0);

  const avgMatchScore =
    matchScores.length > 0
      ? matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length
      : 0;

  const prices = foundResults
    .flatMap((r) => r.matches.map((m) => m.price))
    .filter((price) => price > 0);

  const avgPrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  const successRate = stats.total > 0 ? (stats.found / stats.total) * 100 : 0;

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {/* Total Products */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{stats.total}</div>
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Found */}
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Found</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.found}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {successRate.toFixed(1)}% success rate
              </div>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </CardContent>
      </Card>

      {/* Not Found */}
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.notFound}
            </div>
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      <Card className="border-red-500/50 bg-red-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.error}</div>
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        </CardContent>
      </Card>

      {/* Average Match Score */}
      {matchScores.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Match Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{Math.round(avgMatchScore)}%</div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Average Price */}
      {prices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${avgPrice.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
                </div>
              </div>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

