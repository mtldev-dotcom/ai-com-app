"use client";

/**
 * Advanced Filters Component
 * Comprehensive filter panel with multi-select, sliders, and real-time validation
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  X,
  DollarSign,
  MapPin,
  Clock,
  Package,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  status: ("found" | "not_found" | "error")[];
  providers: string[];
  shippingOrigin: string[];
  priceRange: { min?: number; max?: number };
  deliveryDays?: number;
  matchScore?: number;
  minMoq?: number;
  maxMoq?: number;
  maxShippingCost?: number;
  shipFrom?: string;
  shipTo?: string;
  maxResults?: number;
  currency?: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  stats?: {
    total: number;
    found: number;
    notFound: number;
    error: number;
  };
  className?: string;
}

const SHIPPING_ORIGINS = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "EU", name: "European Union" },
  { code: "CN", name: "China" },
  { code: "UK", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
];

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onReset,
  stats,
  className,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleStatus = (status: "found" | "not_found" | "error") => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    updateFilter("status", newStatus);
  };

  const toggleShippingOrigin = (origin: string) => {
    const newOrigins = filters.shippingOrigin.includes(origin)
      ? filters.shippingOrigin.filter((o) => o !== origin)
      : [...filters.shippingOrigin, origin];
    updateFilter("shippingOrigin", newOrigins);
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.providers.length > 0 ||
    filters.shippingOrigin.length > 0 ||
    filters.priceRange.min !== undefined ||
    filters.priceRange.max !== undefined ||
    filters.deliveryDays !== undefined ||
    filters.matchScore !== undefined ||
    filters.minMoq !== undefined ||
    filters.maxMoq !== undefined ||
    filters.maxShippingCost !== undefined ||
    filters.shipFrom !== undefined ||
    filters.shipTo !== undefined ||
    filters.maxResults !== undefined;

  return (
    <Card className={cn("border-2", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).reduce((acc, val) => {
                  if (Array.isArray(val)) return acc + val.length;
                  if (typeof val === "object" && val !== null) {
                    return acc + (val.min !== undefined ? 1 : 0) + (val.max !== undefined ? 1 : 0);
                  }
                  return acc + (val !== undefined ? 1 : 0);
                }, 0)} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {(isExpanded || hasActiveFilters) && (
        <CardContent className="space-y-4">
          {/* Status Filter */}
          {stats && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Status</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filters.status.includes("found") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStatus("found")}
                  className="min-h-[44px] sm:min-h-0"
                  aria-label={`Filter by found status, ${stats.found} items`}
                >
                  Found ({stats.found})
                </Button>
                <Button
                  variant={filters.status.includes("not_found") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStatus("not_found")}
                  className="min-h-[44px] sm:min-h-0"
                  aria-label={`Filter by not found status, ${stats.notFound} items`}
                >
                  Not Found ({stats.notFound})
                </Button>
                <Button
                  variant={filters.status.includes("error") ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStatus("error")}
                  className="min-h-[44px] sm:min-h-0"
                  aria-label={`Filter by error status, ${stats.error} items`}
                >
                  Errors ({stats.error})
                </Button>
              </div>
            </div>
          )}

          {/* Shipping Origin */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Shipping Origin
            </Label>
            <div className="flex flex-wrap gap-2">
              {SHIPPING_ORIGINS.map((origin) => (
                <Button
                  key={origin.code}
                  variant={filters.shippingOrigin.includes(origin.code) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleShippingOrigin(origin.code)}
                  className="h-9 min-h-[44px] sm:min-h-0"
                  aria-label={`Filter by ${origin.name} shipping origin`}
                >
                  {origin.code}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.priceRange.min || ""}
                onChange={(e) =>
                  updateFilter("priceRange", {
                    ...filters.priceRange,
                    min: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="h-11 min-h-[44px] sm:min-h-0"
                aria-label="Minimum price filter"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.priceRange.max || ""}
                onChange={(e) =>
                  updateFilter("priceRange", {
                    ...filters.priceRange,
                    max: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="h-11 min-h-[44px] sm:min-h-0"
                aria-label="Maximum price filter"
              />
            </div>
          </div>

          {/* Delivery Days */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Max Delivery Days
            </Label>
            <Input
              type="number"
              placeholder="e.g., 10"
              value={filters.deliveryDays || ""}
              onChange={(e) =>
                updateFilter("deliveryDays", e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="h-11 min-h-[44px] sm:min-h-0"
              aria-label="Maximum delivery days filter"
            />
          </div>

          {/* Match Score */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Min Match Score</Label>
            <Input
              type="number"
              placeholder="e.g., 50"
              min="0"
              max="100"
              value={filters.matchScore || ""}
              onChange={(e) =>
                updateFilter("matchScore", e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="h-11 min-h-[44px] sm:min-h-0"
              aria-label="Minimum match score filter"
            />
          </div>

          {/* MOQ Range */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Minimum Order Quantity (MOQ)
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                min="1"
                value={filters.minMoq || ""}
                onChange={(e) =>
                  updateFilter("minMoq", e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="h-11 min-h-[44px] sm:min-h-0"
                aria-label="Minimum MOQ filter"
              />
              <Input
                type="number"
                placeholder="Max"
                min="1"
                value={filters.maxMoq || ""}
                onChange={(e) =>
                  updateFilter("maxMoq", e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="h-11 min-h-[44px] sm:min-h-0"
                aria-label="Maximum MOQ filter"
              />
            </div>
          </div>

          {/* Max Shipping Cost */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Max Shipping Cost (USD)
            </Label>
            <Input
              type="number"
              placeholder="e.g., 20"
              min="0"
              step="0.01"
              value={filters.maxShippingCost || ""}
              onChange={(e) =>
                updateFilter("maxShippingCost", e.target.value ? parseFloat(e.target.value) : undefined)
              }
              className="h-11 min-h-[44px] sm:min-h-0"
              aria-label="Maximum shipping cost filter"
            />
          </div>

          {/* Ship From */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ship From
            </Label>
            <Select
              value={filters.shipFrom || ""}
              onValueChange={(value) => updateFilter("shipFrom", value || undefined)}
            >
              <SelectTrigger className="h-11 min-h-[44px] sm:min-h-0">
                <SelectValue placeholder="Select origin country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                {SHIPPING_ORIGINS.map((origin) => (
                  <SelectItem key={origin.code} value={origin.code}>
                    {origin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ship To */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ship To
            </Label>
            <Select
              value={filters.shipTo || ""}
              onValueChange={(value) => updateFilter("shipTo", value || undefined)}
            >
              <SelectTrigger className="h-11 min-h-[44px] sm:min-h-0">
                <SelectValue placeholder="Select destination country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                {SHIPPING_ORIGINS.map((origin) => (
                  <SelectItem key={origin.code} value={origin.code}>
                    {origin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max Results */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Max Results</Label>
            <Input
              type="number"
              placeholder="e.g., 50"
              min="1"
              max="200"
              value={filters.maxResults || ""}
              onChange={(e) =>
                updateFilter("maxResults", e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="h-11 min-h-[44px] sm:min-h-0"
              aria-label="Maximum results filter"
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Currency
            </Label>
            <Select
              value={filters.currency || "USD"}
              onValueChange={(value) => updateFilter("currency", value)}
            >
              <SelectTrigger className="h-11 min-h-[44px] sm:min-h-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CAD">CAD</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
                <SelectItem value="CNY">CNY</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

