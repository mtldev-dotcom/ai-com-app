/**
 * CJ Product Card Component
 * Displays a CJ product with selection checkbox
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CJProduct } from "@/types/cj-schemas";
import Image from "next/image";
import { RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { getCJProductRefreshDataAction } from "@/app/actions/cj";

interface CJProductCardProps {
  product: CJProduct;
  selected: boolean;
  onToggleSelect: (pid: string) => void;
  onImageClick?: (product: CJProduct) => void;
}

interface RefreshData {
  price?: number;
  inventory: Array<{
    areaEn: string;
    areaId: string;
    countryCode: string;
    totalInventoryNum: number;
    cjInventoryNum: number;
    factoryInventoryNum: number;
  }>;
  shippingOptions: Array<{
    logisticName: string;
    logisticPrice: number;
    logisticAging: string;
    destinationCountry?: string; // Country code (CA, US, GB, etc.)
  }>;
  avgDeliveryDays: number | null;
}

export function CJProductCard({
  product,
  selected,
  onToggleSelect,
  onImageClick,
}: CJProductCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshData, setRefreshData] = useState<RefreshData | null>(null);
  const [isShippingExpanded, setIsShippingExpanded] = useState(false);

  const imageUrl = product.productImage || "/placeholder-product.png";
  const hasVariants =
    product.variantList && product.variantList.length > 0;
  const variantCount = hasVariants ? product.variantList!.length : 0;

  // Get first variant vid for freight calculation
  // Try variant list first, then check if product has vid directly (for My Product Lists)
  const firstVid = hasVariants && product.variantList![0]?.vid 
    ? product.variantList![0].vid 
    : (product as any).vid // My Product Lists products have vid directly on product
    ? (product as any).vid
    : undefined;

  console.log("Product vid check:", {
    hasVariants,
    variantVid: hasVariants ? product.variantList![0]?.vid : undefined,
    productVid: (product as any).vid,
    firstVid,
  });

  const handleRefreshData = async (isManual = true, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent card selection
    }
    
    if (!product.productSku) {
      if (isManual) {
        console.warn("Cannot refresh: product has no SKU");
      }
      return;
    }

    setIsRefreshing(true);
    try {
      if (isManual) {
        console.log("Refreshing product:", {
          pid: product.pid,
          sku: product.productSku,
          vid: firstVid,
        });
      }

      const result = await getCJProductRefreshDataAction(
        product.pid,
        product.productSku,
        firstVid
      );

      if (isManual) {
        console.log("Refresh result:", result);
      }

      if (result.success) {
        setRefreshData({
          price: result.price,
          inventory: result.inventory || [],
          shippingOptions: result.shippingOptions || [],
          avgDeliveryDays: result.avgDeliveryDays,
        });
        // Reset accordion state when new data is loaded
        setIsShippingExpanded(false);
        
        // Log any errors from individual API calls
        if (result.errors) {
          if (result.errors.freight) {
            console.warn("Freight calculation error:", result.errors.freight);
          }
          if (result.errors.inventory) {
            console.warn("Inventory fetch error:", result.errors.inventory);
          }
          if (result.errors.product) {
            console.warn("Product fetch error:", result.errors.product);
          }
        }
      } else {
        if (isManual) {
          console.error("Failed to refresh product data:", result.error);
        }
      }
    } catch (error) {
      if (isManual) {
        console.error("Error refreshing product:", error);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async (e: React.MouseEvent) => {
    await handleRefreshData(true, e);
  };

  // Use refreshed price if available, otherwise use original
  const displayPrice = refreshData?.price !== undefined 
    ? refreshData.price 
    : product.sellPrice;

  // Calculate total inventory across all warehouses
  const totalInventory = refreshData?.inventory.reduce(
    (sum, item) => sum + item.totalInventoryNum,
    0
  ) || 0;

  return (
    <Card
      className={`group cursor-pointer transition-all duration-200 hover:shadow-md ${
        selected ? "ring-2 ring-primary shadow-md" : "hover:border-primary/50"
      }`}
      onClick={() => onToggleSelect(product.pid)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Checkbox */}
          <div className="flex items-start pt-1">
            <Checkbox 
              checked={selected} 
              onCheckedChange={() => onToggleSelect(product.pid)}
              className="transition-all"
            />
          </div>

          {/* Product Image */}
          <div 
            className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card selection when clicking image
              onImageClick?.(product);
            }}
          >
            <Image
              src={imageUrl}
              alt={product.productNameEn}
              fill
              className="object-cover"
              unoptimized
              onError={(e) => {
                // Fallback to placeholder on error
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-product.png";
              }}
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm line-clamp-2 flex-1 leading-tight group-hover:text-primary transition-colors">
                {product.productNameEn}
              </h3>
              
              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10"
                onClick={handleRefresh}
                disabled={isRefreshing || !product.productSku}
                title="Refresh to monitor changes"
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </Button>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-2.5">
              {displayPrice !== undefined && (
                <span className="text-xl font-bold text-primary">
                  ${displayPrice.toFixed(2)}
                </span>
              )}
              {product.listPrice !== undefined &&
                product.listPrice > (displayPrice || 0) && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.listPrice.toFixed(2)}
                  </span>
                )}
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {hasVariants && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {variantCount} variant{variantCount > 1 ? "s" : ""}
                </Badge>
              )}
              {product.categoryName && (
                <Badge variant="outline" className="text-xs">
                  {product.categoryName}
                </Badge>
              )}
              {product.sourceFrom && (
                <Badge variant="outline" className="text-xs">
                  {product.sourceFrom}
                </Badge>
              )}
            </div>

            {/* Refreshed Data Display */}
            {refreshData && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2.5">
                {/* Inventory Section */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Inventory</span>
                    {totalInventory > 0 && (
                      <Badge variant="outline" className="text-xs font-semibold bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                        {totalInventory} in stock
                      </Badge>
                    )}
                  </div>
                  {totalInventory > 0 && refreshData.inventory.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {refreshData.inventory.map((inv, idx) => (
                        <div key={idx} className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-xs">
                          <span className="font-medium">{inv.countryCode}</span>
                          <span className="text-muted-foreground">:</span>
                          <span className="font-semibold">{inv.totalInventoryNum}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                      Out of stock
                    </div>
                  )}
                </div>

                {/* Shipping Options Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Shipping Options</span>
                    {refreshData.avgDeliveryDays !== null && (
                      <Badge variant="secondary" className="text-xs">
                        Avg {refreshData.avgDeliveryDays} days
                      </Badge>
                    )}
                  </div>
                  
                  {refreshData.shippingOptions.length > 0 ? (
                    <div className="space-y-1.5">
                      {/* First shipping option (always visible) */}
                      {refreshData.shippingOptions.length > 0 && (() => {
                        const firstOption = refreshData.shippingOptions[0];
                        const isCanada = firstOption.destinationCountry === "CA" ||
                                       firstOption.logisticName?.toLowerCase().includes('canada') || 
                                       firstOption.logisticName?.toLowerCase().includes(' ca ');
                        
                        return (
                          <div 
                            className={`p-2.5 rounded-lg border text-xs transition-all ${
                              isCanada 
                                ? 'bg-blue-50/80 border-blue-300 dark:bg-blue-950/50 dark:border-blue-700 shadow-sm' 
                                : 'bg-muted/40 border-border/50 hover:bg-muted/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-foreground text-sm">
                                {firstOption.logisticName}
                              </span>
                              {isCanada && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold border-blue-400 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-600">
                                  🇨🇦 CA
                                </Badge>
                              )}
                              {firstOption.destinationCountry && !isCanada && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                  {firstOption.destinationCountry}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-primary text-base">
                                ${firstOption.logisticPrice.toFixed(2)}
                              </span>
                              <span className="text-muted-foreground/60">•</span>
                              <span className="text-xs text-muted-foreground font-medium">
                                {firstOption.logisticAging} days
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Accordion for remaining options */}
                      {refreshData.shippingOptions.length > 1 && (
                        <div className="border-t border-border/30 pt-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-between h-auto py-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsShippingExpanded(!isShippingExpanded);
                            }}
                          >
                            <span>
                              {isShippingExpanded 
                                ? `Hide ${refreshData.shippingOptions.length - 1} more option${refreshData.shippingOptions.length - 1 > 1 ? 's' : ''}`
                                : `Show ${refreshData.shippingOptions.length - 1} more option${refreshData.shippingOptions.length - 1 > 1 ? 's' : ''}`
                              }
                            </span>
                            {isShippingExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>

                          {isShippingExpanded && (
                            <div className="mt-1.5 space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                              {refreshData.shippingOptions.slice(1).map((option, idx) => {
                                const isCanada = option.destinationCountry === "CA" ||
                                               option.logisticName?.toLowerCase().includes('canada') || 
                                               option.logisticName?.toLowerCase().includes(' ca ');
                                
                                return (
                                  <div 
                                    key={idx + 1} 
                                    className={`p-2.5 rounded-lg border text-xs transition-all ${
                                      isCanada 
                                        ? 'bg-blue-50/80 border-blue-300 dark:bg-blue-950/50 dark:border-blue-700 shadow-sm' 
                                        : 'bg-muted/40 border-border/50 hover:bg-muted/60'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="font-semibold text-foreground text-sm">
                                        {option.logisticName}
                                      </span>
                                      {isCanada && (
                                        <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold border-blue-400 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-600">
                                          🇨🇦 CA
                                        </Badge>
                                      )}
                                      {option.destinationCountry && !isCanada && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                          {option.destinationCountry}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                      <span className="font-bold text-primary text-base">
                                        ${option.logisticPrice.toFixed(2)}
                                      </span>
                                      <span className="text-muted-foreground/60">•</span>
                                      <span className="text-xs text-muted-foreground font-medium">
                                        {option.logisticAging} days
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-2 rounded-md bg-muted/30 border border-dashed border-border/50 text-xs text-muted-foreground text-center">
                      {!firstVid ? (
                        <span>Variant ID required for shipping calculation</span>
                      ) : (
                        <span>No shipping options available for this product</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SKU */}
            {product.productSku && (
              <div className="mt-2 pt-2 border-t border-border/30">
                <p className="text-xs text-muted-foreground font-mono">
                  SKU: <span className="font-semibold text-foreground">{product.productSku}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

