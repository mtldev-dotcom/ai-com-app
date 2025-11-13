"use client";

/**
 * Configure Step Component
 * Enhanced configuration step with wizard layout, rich provider cards, and smart defaults
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProviderBadge } from "../provider-badge";
import {
  Settings,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Clock,
  MapPin,
  ShoppingBag,
  Globe,
  Info,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParsedRow } from "@/lib/imports/parse-file";

interface ConfigureStepProps {
  columns: string[];
  rows: ParsedRow[];
  providers: string[];
  onProvidersChange: (providers: string[]) => void;
  shippingOrigin: string[];
  onShippingOriginChange: (origins: string[]) => void;
  maxDeliveryDays?: number;
  onMaxDeliveryDaysChange: (days?: number) => void;
  priceMin: string;
  onPriceMinChange: (min: string) => void;
  priceMax: string;
  onPriceMaxChange: (max: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  jobName: string;
  onJobNameChange: (name: string) => void;
  onBack: () => void;
  onStart: () => void;
  isLoading?: boolean;
}

const AVAILABLE_PROVIDERS = [
  {
    id: "cj",
    name: "CJ Dropshipping",
    description: "Access to millions of products with verified inventory",
    icon: ShoppingBag,
    color: "bg-indigo-500",
    features: ["Verified inventory", "Fast shipping", "Global warehouses"],
  },
  {
    id: "web",
    name: "Web Search",
    description: "General web search fallback",
    icon: Globe,
    color: "bg-gray-500",
    features: ["Broad coverage", "Alternative sources"],
  },
];

const SHIPPING_ORIGINS = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "EU", name: "European Union" },
  { code: "CN", name: "China" },
  { code: "UK", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
];

export function ConfigureStep({
  columns,
  rows,
  providers,
  onProvidersChange,
  shippingOrigin,
  onShippingOriginChange,
  maxDeliveryDays,
  onMaxDeliveryDaysChange,
  priceMin,
  onPriceMinChange,
  priceMax,
  onPriceMaxChange,
  currency,
  onCurrencyChange,
  jobName,
  onJobNameChange,
  onBack,
  onStart,
  isLoading = false,
}: ConfigureStepProps) {
  const toggleProvider = (providerId: string) => {
    if (providers.includes(providerId)) {
      onProvidersChange(providers.filter((p) => p !== providerId));
    } else {
      onProvidersChange([...providers, providerId]);
    }
  };

  const toggleShippingOrigin = (origin: string) => {
    if (shippingOrigin.includes(origin)) {
      onShippingOriginChange(shippingOrigin.filter((o) => o !== origin));
    } else {
      onShippingOriginChange([...shippingOrigin, origin]);
    }
  };

  const isValid = providers.length > 0; // Job name is optional

  return (
    <div className="space-y-6">
      {/* Product List Preview */}
      {columns.length > 0 && rows.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Imported Products ({rows.length})
                </CardTitle>
                <CardDescription>
                  Review your product list before configuring the search
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {columns.length} columns
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border bg-background">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {columns.slice(0, 5).map((col) => (
                      <th key={col} className="px-4 py-3 text-left font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      {columns.slice(0, 5).map((col) => (
                        <td key={col} className="px-4 py-3 text-muted-foreground">
                          {String(row[col] || "").slice(0, 50)}
                          {String(row[col] || "").length > 50 ? "..." : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && (
              <p className="text-xs text-muted-foreground text-center mt-3">
                Showing 5 of {rows.length} products
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Search
          </CardTitle>
          <CardDescription>
            Select providers and set search criteria to find the best matches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Name */}
          <div className="space-y-2">
            <Label htmlFor="jobName" className="text-base font-semibold">
              Job Name <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id="jobName"
              value={jobName}
              onChange={(e) => onJobNameChange(e.target.value)}
              placeholder="My Product Search - Q1 2024 (leave empty to auto-generate)"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Give your search job a descriptive name to track it later. If left empty, a name will be automatically generated.
            </p>
          </div>

          {/* Providers */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Search Providers</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_PROVIDERS.map((provider) => {
                const Icon = provider.icon;
                const isSelected = providers.includes(provider.id);
                return (
                  <div
                    key={provider.id}
                    className={cn(
                      "flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                    onClick={() => toggleProvider(provider.id)}
                  >
                    <Checkbox
                      id={`provider-${provider.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleProvider(provider.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-2 rounded-lg", provider.color, "text-white")}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <Label htmlFor={`provider-${provider.id}`} className="cursor-pointer font-medium text-base">
                          {provider.name}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping Origin */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Shipping Origin (Optional)
            </Label>
            <div className="flex flex-wrap gap-2">
              {SHIPPING_ORIGINS.map((origin) => (
                <Button
                  key={origin.code}
                  variant={shippingOrigin.includes(origin.code) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleShippingOrigin(origin.code)}
                  className="h-9"
                >
                  {shippingOrigin.includes(origin.code) && (
                    <MapPin className="mr-1 h-3 w-3" />
                  )}
                  {origin.code}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Filter results by shipping origin country. CJ products typically ship from CN.
            </p>
          </div>

          {/* Price & Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxDeliveryDays" className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Max Delivery Days
              </Label>
              <Input
                id="maxDeliveryDays"
                type="number"
                min="1"
                max="60"
                value={maxDeliveryDays || ""}
                onChange={(e) =>
                  onMaxDeliveryDaysChange(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="10"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </Label>
              <Select value={currency} onValueChange={onCurrencyChange}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price Range (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="priceMin"
                type="number"
                min="0"
                value={priceMin}
                onChange={(e) => onPriceMinChange(e.target.value)}
                placeholder="Min price"
                className="h-11"
              />
              <Input
                id="priceMax"
                type="number"
                min="0"
                value={priceMax}
                onChange={(e) => onPriceMaxChange(e.target.value)}
                placeholder="Max price"
                className="h-11"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onBack} variant="outline" size="lg" className="flex-1">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={onStart}
              disabled={isLoading || !isValid}
              size="lg"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

