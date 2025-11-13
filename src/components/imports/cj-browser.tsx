/**
 * CJ Browser Component
 * Browse and select products from CJ Dropshipping
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CJProductCard } from "./cj-product-card";
import {
  searchCJProductsAction,
  getCJInventoryAction,
  getCJProductByUrlAction,
  getCJCategoriesAction,
  getCJMyProductsAction,
  getCJProductRefreshDataAction,
} from "@/app/actions/cj";
import { importCJProducts } from "@/app/actions/imports";
import type { CJProduct, CJCategory } from "@/types/cj-schemas";
import {
  Loader2,
  Search,
  Package,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  List,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import Image from "next/image";

export function CJBrowser() {
  // State
  const [activeTab, setActiveTab] = useState<"search" | "inventory" | "url" | "mylists">(
    "search"
  );
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search state
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [categories, setCategories] = useState<CJCategory[]>([]);

  // Products state
  const [products, setProducts] = useState<CJProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 20;
  
  // Store all products for client-side pagination (My Product Lists)
  const [allMyProducts, setAllMyProducts] = useState<CJProduct[]>([]);
  const [myProductsLoaded, setMyProductsLoaded] = useState(false);
  const [myProductsPageSize, setMyProductsPageSize] = useState(20);
  
  // Product details modal state
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<CJProduct | null>(null);
  const [modalRefreshData, setModalRefreshData] = useState<{
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
      destinationCountry?: string;
    }>;
    avgDeliveryDays: number | null;
  } | null>(null);
  const [isModalRefreshing, setIsModalRefreshing] = useState(false);

  // URL import state
  const [productUrl, setProductUrl] = useState("");

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await getCJCategoriesAction();
      if (result.success) {
        setCategories(result.categories);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const handleSearch = async (page = 1) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setCurrentPage(page);

    try {
      const result = await searchCJProductsAction({
        productNameEn: searchKeyword || undefined,
        categoryId: selectedCategory || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        pageNum: page,
        pageSize,
      });

      if (result.success) {
        setProducts(result.products);
        setTotalProducts(result.total);
      } else {
        setError(result.error || "Search failed");
        setProducts([]);
        setTotalProducts(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadInventory = async (page = 1) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setCurrentPage(page);

    try {
      const result = await getCJInventoryAction(page, pageSize);

      if (result.success) {
        // Convert inventory products to regular products
        // Note: The schema might be different, adjust as needed
        setProducts(result.products as unknown as CJProduct[]);
        setTotalProducts(result.total);
      } else {
        setError(result.error || "Failed to load inventory");
        setProducts([]);
        setTotalProducts(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMyProducts = async (page = 1) => {
    // If we haven't loaded all products yet, fetch them all
    if (!myProductsLoaded) {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const result = await getCJMyProductsAction();

        if (result.success) {
          setAllMyProducts(result.products);
          setTotalProducts(result.total);
          setMyProductsLoaded(true);
          
          // Now apply client-side pagination
          const startIndex = (page - 1) * myProductsPageSize;
          const endIndex = startIndex + myProductsPageSize;
          setProducts(result.products.slice(startIndex, endIndex));
          setCurrentPage(page);
        } else {
          setError(result.error || "Failed to load my product lists");
          setProducts([]);
          setTotalProducts(0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load my product lists");
        setProducts([]);
        setTotalProducts(0);
      } finally {
        setLoading(false);
      }
    } else {
      // Already loaded, just paginate client-side
      const startIndex = (page - 1) * myProductsPageSize;
      const endIndex = startIndex + myProductsPageSize;
      setProducts(allMyProducts.slice(startIndex, endIndex));
      setCurrentPage(page);
    }
  };
  
  // Handle page size change for My Product Lists
  const handleMyProductsPageSizeChange = (newPageSize: number) => {
    setMyProductsPageSize(newPageSize);
    
    // If products are already loaded, re-paginate immediately with new page size
    if (myProductsLoaded && allMyProducts.length > 0) {
      const startIndex = 0; // Reset to page 1
      const endIndex = newPageSize;
      setProducts(allMyProducts.slice(startIndex, endIndex));
      setCurrentPage(1);
    } else {
      // If not loaded yet, just update the state (will be used when loading)
      setCurrentPage(1);
    }
  };
  
  // Reset My Products state when switching tabs
  useEffect(() => {
    if (activeTab !== "mylists") {
      setAllMyProducts([]);
      setMyProductsLoaded(false);
    }
  }, [activeTab]);

  const handleImportByUrl = async () => {
    if (!productUrl) {
      setError("Please enter a product URL");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await getCJProductByUrlAction(productUrl);

      if (result.success && result.product) {
        setProducts([result.product]);
        setTotalProducts(1);
        // Auto-select the product
        setSelectedProducts(new Set([result.product.pid]));
      } else {
        setError(result.error || "Failed to fetch product from URL");
        setProducts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch product");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (pid: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(pid)) {
      newSelected.delete(pid);
    } else {
      newSelected.add(pid);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p) => p.pid)));
    }
  };

  const handleDeleteProduct = (pid: string) => {
    // Remove from allMyProducts if it exists (for My Product Lists)
    if (allMyProducts.length > 0) {
      const updatedAllProducts = allMyProducts.filter(p => p.pid !== pid);
      setAllMyProducts(updatedAllProducts);
      
      // Recalculate pagination for current page
      const startIndex = (currentPage - 1) * myProductsPageSize;
      const endIndex = startIndex + myProductsPageSize;
      setProducts(updatedAllProducts.slice(startIndex, endIndex));
      setTotalProducts(updatedAllProducts.length);
    } else {
      // Remove from products list (for other tabs)
      setProducts(products.filter(p => p.pid !== pid));
      setTotalProducts(prev => Math.max(0, prev - 1));
    }
    
    // Remove from selected products
    const newSelected = new Set(selectedProducts);
    newSelected.delete(pid);
    setSelectedProducts(newSelected);
    
    // Close modal if deleted product is currently shown
    if (selectedProductForDetails?.pid === pid) {
      setSelectedProductForDetails(null);
      setModalRefreshData(null);
    }
  };

  const handleModalRefresh = async () => {
    if (!selectedProductForDetails?.productSku) {
      return;
    }

    setIsModalRefreshing(true);
    try {
      const firstVid = selectedProductForDetails.variantList?.[0]?.vid || 
                      (selectedProductForDetails as any).vid || 
                      undefined;

      const result = await getCJProductRefreshDataAction(
        selectedProductForDetails.pid,
        selectedProductForDetails.productSku,
        firstVid
      );

      if (result.success) {
        setModalRefreshData({
          price: result.price,
          inventory: result.inventory || [],
          shippingOptions: result.shippingOptions || [],
          avgDeliveryDays: result.avgDeliveryDays,
        });
      }
    } catch (error) {
      console.error("Error refreshing product in modal:", error);
    } finally {
      setIsModalRefreshing(false);
    }
  };

  const handleImport = async () => {
    if (selectedProducts.size === 0) {
      setError("Please select at least one product to import");
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const productsToImport = products.filter((p) =>
        selectedProducts.has(p.pid)
      );

      const result = await importCJProducts(productsToImport);

      if (result.success) {
        setSuccess(
          `Successfully imported ${result.processedProducts} product(s). ${result.failedProducts > 0 ? `${result.failedProducts} failed.` : ""}`
        );
        setSelectedProducts(new Set());

        // Clear products after successful import
        setTimeout(() => {
          setProducts([]);
          setTotalProducts(0);
        }, 2000);
      } else {
        setError(
          result.errors?.join(", ") || "Import failed. Please try again."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  // Calculate total pages - use dynamic page size for mylists tab
  const effectivePageSize = activeTab === "mylists" && myProductsLoaded 
    ? myProductsPageSize 
    : pageSize;
  const totalPages = Math.ceil(totalProducts / effectivePageSize);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search Catalog
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            My Inventory
          </TabsTrigger>
          <TabsTrigger value="mylists">
            <List className="h-4 w-4 mr-2" />
            My Product Lists
          </TabsTrigger>
          <TabsTrigger value="url">
            <LinkIcon className="h-4 w-4 mr-2" />
            Import by URL
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="searchKeyword">Search Keywords</Label>
              <Input
                id="searchKeyword"
                placeholder="Enter product name..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(1)}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? "" : v)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.slice(0, 50).map((cat) => (
                    <SelectItem key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="minPrice">Min Price ($)</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="maxPrice">Max Price ($)</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="999"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button onClick={() => handleSearch(1)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Products
              </>
            )}
          </Button>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-900">
                  How to Import Your CJ "My Products"
                </p>
                <p className="text-xs text-amber-700 font-medium">
                  Products in your CJ account may not be accessible via API search. Best method:
                </p>
                <ol className="text-xs text-amber-700 space-y-1.5 ml-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>Go to <strong>Catalog Search</strong> tab and search by the product name (e.g., "Mobile Phone Case" or "MAX18 Smartwatch")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>Or try the <strong>From URL</strong> tab with the PID (numeric ID) if you have it</span>
                  </li>
                </ol>
                <div className="mt-2 pt-2 border-t border-amber-300">
                  <p className="text-xs text-amber-600 italic">
                    ℹ️ The "Browse CJ Catalog" button below shows CJ's general product catalog (not your saved products)
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => handleLoadInventory(1)} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Browse CJ Catalog
              </>
            )}
          </Button>
        </TabsContent>

        {/* My Product Lists Tab */}
        <TabsContent value="mylists" className="space-y-4">
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">
                  Import from My Product Lists
                </p>
                <p className="text-xs text-blue-700">
                  This will load products from your saved CJ Dropshipping product lists.
                  Click the button below to fetch your products.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button onClick={() => handleLoadMyProducts(1)} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <List className="mr-2 h-4 w-4" />
                  Load My Product Lists
                </>
              )}
            </Button>
            
            {myProductsLoaded && (
              <div className="flex items-center gap-2">
                <Label htmlFor="pageSize" className="text-sm">
                  Items per page:
                </Label>
                <Select
                  value={myProductsPageSize.toString()}
                  onValueChange={(value) => handleMyProductsPageSizeChange(parseInt(value))}
                >
                  <SelectTrigger id="pageSize" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TabsContent>

        {/* URL Tab */}
        <TabsContent value="url" className="space-y-4">
          <div>
            <Label htmlFor="productUrl">CJ Product SKU, PID, or URL</Label>
            <Input
              id="productUrl"
              placeholder="e.g., CJJBHP0082 or 1234567890 or https://cjdropshipping.com/product/?pid=..."
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImportByUrl()}
            />
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">
                <strong>From Your CJ "My Products":</strong>
              </p>
              <ul className="text-xs text-muted-foreground list-disc list-inside ml-2 space-y-0.5">
                <li>Copy the SKU (e.g., CJJBHP0082) from your product list</li>
                <li>Or copy the numeric PID from the product URL</li>
                <li>Or paste the full CJ product URL</li>
              </ul>
            </div>
          </div>
          <Button onClick={handleImportByUrl} disabled={loading || !productUrl}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Fetch Product
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Products List */}
      {products.length > 0 && (
        <div className="space-y-4">
          {/* Header with Select All and Import */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedProducts.size === products.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedProducts.size} of {totalProducts} selected
              </span>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing || selectedProducts.size === 0}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${selectedProducts.size} Product${selectedProducts.size !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <CJProductCard
                key={product.pid}
                product={product}
                selected={selectedProducts.has(product.pid)}
                onToggleSelect={handleToggleSelect}
                onImageClick={setSelectedProductForDetails}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeTab === "inventory") {
                    handleLoadInventory(currentPage - 1);
                  } else if (activeTab === "mylists") {
                    handleLoadMyProducts(currentPage - 1);
                  } else {
                    handleSearch(currentPage - 1);
                  }
                }}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeTab === "inventory") {
                    handleLoadInventory(currentPage + 1);
                  } else if (activeTab === "mylists") {
                    handleLoadMyProducts(currentPage + 1);
                  } else {
                    handleSearch(currentPage + 1);
                  }
                }}
                disabled={currentPage === totalPages || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && products.length === 0 && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && !error && (
        <div className="text-center p-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No products found. Try searching or loading your inventory.</p>
        </div>
      )}

      {/* Product Details Modal */}
      <Dialog open={!!selectedProductForDetails} onOpenChange={(open) => {
        if (!open) {
          setSelectedProductForDetails(null);
          setModalRefreshData(null); // Reset refresh data when closing
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto my-8">
          {selectedProductForDetails && (() => {
            // Find current product index in the products array
            const currentIndex = products.findIndex(p => p.pid === selectedProductForDetails.pid);
            const hasPrevious = currentIndex > 0;
            const hasNext = currentIndex < products.length - 1;
            const previousProduct = hasPrevious ? products[currentIndex - 1] : null;
            const nextProduct = hasNext ? products[currentIndex + 1] : null;

            const handlePrevious = () => {
              if (previousProduct) {
                setSelectedProductForDetails(previousProduct);
                setModalRefreshData(null); // Reset refresh data when navigating
              }
            };

            const handleNext = () => {
              if (nextProduct) {
                setSelectedProductForDetails(nextProduct);
                setModalRefreshData(null); // Reset refresh data when navigating
              }
            };

            // Handle keyboard navigation
            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === "ArrowLeft" && hasPrevious) {
                handlePrevious();
              } else if (e.key === "ArrowRight" && hasNext) {
                handleNext();
              }
            };

            return (
              <div onKeyDown={handleKeyDown} tabIndex={0} className="relative">
                {/* Navigation Arrows */}
                {products.length > 1 && (
                  <>
                    {/* Previous Button */}
                    {hasPrevious && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full shadow-lg bg-background/95 hover:bg-background border-2"
                        onClick={handlePrevious}
                        title={`Previous: ${previousProduct?.productNameEn || ""}`}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    )}

                    {/* Next Button */}
                    {hasNext && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="fixed right-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full shadow-lg bg-background/95 hover:bg-background border-2"
                        onClick={handleNext}
                        title={`Next: ${nextProduct?.productNameEn || ""}`}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    )}

                    {/* Product Counter */}
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {currentIndex + 1} / {products.length}
                      </Badge>
                    </div>
                  </>
                )}

                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <DialogTitle>{selectedProductForDetails.productNameEn}</DialogTitle>
                      <DialogDescription>
                        Product Details
                      </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Select/Deselect Button */}
                      <Button
                        variant={selectedProducts.has(selectedProductForDetails.pid) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          handleToggleSelect(selectedProductForDetails.pid);
                        }}
                        className="gap-2"
                      >
                        {selectedProducts.has(selectedProductForDetails.pid) ? (
                          <>
                            <CheckSquare className="h-4 w-4" />
                            Selected
                          </>
                        ) : (
                          <>
                            <Square className="h-4 w-4" />
                            Select
                          </>
                        )}
                      </Button>

                      {/* Refresh Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleModalRefresh}
                        disabled={isModalRefreshing || !selectedProductForDetails.productSku}
                        className="gap-2"
                        title="Refresh inventory and shipping"
                      >
                        {isModalRefreshing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove "${selectedProductForDetails.productNameEn}" from the list?`)) {
                            handleDeleteProduct(selectedProductForDetails.pid);
                          }
                        }}
                        className="gap-2"
                        title="Delete product from list"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
              
              <div className="space-y-4">
                {/* Product Image */}
                {selectedProductForDetails.productImage && (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={selectedProductForDetails.productImage}
                      alt={selectedProductForDetails.productNameEn}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}

                {/* Product Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Basic Information</h3>
                    <div className="space-y-1 text-sm">
                      {selectedProductForDetails.productSku && (
                        <div>
                          <span className="text-muted-foreground">SKU:</span>{" "}
                          <span className="font-mono">{selectedProductForDetails.productSku}</span>
                        </div>
                      )}
                      {selectedProductForDetails.pid && (
                        <div>
                          <span className="text-muted-foreground">Product ID:</span>{" "}
                          <span className="font-mono text-xs">{selectedProductForDetails.pid}</span>
                        </div>
                      )}
                      {selectedProductForDetails.productNameCn && (
                        <div>
                          <span className="text-muted-foreground">Chinese Name:</span>{" "}
                          {selectedProductForDetails.productNameCn}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Pricing</h3>
                    <div className="space-y-1 text-sm">
                      {(modalRefreshData?.price !== undefined ? modalRefreshData.price : selectedProductForDetails.sellPrice) !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Sell Price:</span>{" "}
                          <span className="font-bold text-lg text-primary">
                            ${(modalRefreshData?.price !== undefined ? modalRefreshData.price : selectedProductForDetails.sellPrice || 0).toFixed(2)}
                          </span>
                          {modalRefreshData?.price !== undefined && modalRefreshData.price !== selectedProductForDetails.sellPrice && (
                            <span className="text-xs text-muted-foreground ml-2">(updated)</span>
                          )}
                        </div>
                      )}
                      {selectedProductForDetails.listPrice !== undefined && (
                        <div>
                          <span className="text-muted-foreground">List Price:</span>{" "}
                          <span className="line-through">
                            ${selectedProductForDetails.listPrice.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category & Type */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Category & Type</h3>
                    <div className="space-y-1 text-sm">
                      {selectedProductForDetails.categoryName && (
                        <div>
                          <span className="text-muted-foreground">Category:</span>{" "}
                          {selectedProductForDetails.categoryName}
                        </div>
                      )}
                      {selectedProductForDetails.productType && (
                        <div>
                          <span className="text-muted-foreground">Type:</span>{" "}
                          {selectedProductForDetails.productType}
                        </div>
                      )}
                      {selectedProductForDetails.sourceFrom && (
                        <div>
                          <span className="text-muted-foreground">Source:</span>{" "}
                          {selectedProductForDetails.sourceFrom}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dimensions & Weight */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Dimensions & Weight</h3>
                    <div className="space-y-1 text-sm">
                      {selectedProductForDetails.packingWeight !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Weight:</span>{" "}
                          {selectedProductForDetails.packingWeight}g
                        </div>
                      )}
                      {(selectedProductForDetails.packingLength || 
                        selectedProductForDetails.packingWidth || 
                        selectedProductForDetails.packingHeight) && (
                        <div>
                          <span className="text-muted-foreground">Dimensions:</span>{" "}
                          {[
                            selectedProductForDetails.packingLength && `${selectedProductForDetails.packingLength}cm`,
                            selectedProductForDetails.packingWidth && `${selectedProductForDetails.packingWidth}cm`,
                            selectedProductForDetails.packingHeight && `${selectedProductForDetails.packingHeight}cm`,
                          ].filter(Boolean).join(" × ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {(selectedProductForDetails.description || selectedProductForDetails.descriptionEn) && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedProductForDetails.descriptionEn || selectedProductForDetails.description}
                    </p>
                  </div>
                )}

                {/* Variants */}
                {selectedProductForDetails.variantList && selectedProductForDetails.variantList.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">
                      Variants ({selectedProductForDetails.variantList.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedProductForDetails.variantList.map((variant, idx) => (
                        <div key={variant.vid || idx} className="p-2 border rounded text-sm">
                          <div className="font-medium">{variant.variantNameEn || variant.productSku}</div>
                          {variant.variantSku && (
                            <div className="text-muted-foreground text-xs">SKU: {variant.variantSku}</div>
                          )}
                          {variant.sellPrice !== undefined && (
                            <div className="text-primary font-medium">
                              ${variant.sellPrice.toFixed(2)}
                            </div>
                          )}
                          {variant.variantKey && (
                            <div className="text-muted-foreground text-xs">{variant.variantKey}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Images */}
                {selectedProductForDetails.productImageList && selectedProductForDetails.productImageList.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Additional Images</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProductForDetails.productImageList.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded overflow-hidden bg-muted">
                          <Image
                            src={img.url}
                            alt={`${selectedProductForDetails.productNameEn} - Image ${idx + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Refreshed Inventory & Shipping Data */}
                {modalRefreshData && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Inventory Section */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Inventory</h3>
                      {modalRefreshData.inventory.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {modalRefreshData.inventory.map((inv, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {inv.countryCode}: {inv.totalInventoryNum}
                            </Badge>
                          ))}
                          <Badge variant="secondary" className="text-xs font-semibold">
                            Total: {modalRefreshData.inventory.reduce((sum, inv) => sum + inv.totalInventoryNum, 0)}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No inventory data available</p>
                      )}
                    </div>

                    {/* Shipping Options Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Shipping Options</h3>
                        {modalRefreshData.avgDeliveryDays !== null && (
                          <Badge variant="secondary" className="text-xs">
                            Avg {modalRefreshData.avgDeliveryDays} days
                          </Badge>
                        )}
                      </div>
                      {modalRefreshData.shippingOptions.length > 0 ? (
                        <div className="space-y-2">
                          {modalRefreshData.shippingOptions.slice(0, 3).map((option, idx) => {
                            const isCanada = option.destinationCountry === "CA";
                            return (
                              <div
                                key={idx}
                                className={`p-2 rounded-md border text-xs ${
                                  isCanada
                                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                                    : "bg-muted/30 border-border/50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{option.logisticName}</span>
                                  {isCanada && (
                                    <Badge variant="outline" className="text-[10px]">🇨🇦 CA</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="font-bold text-primary">${option.logisticPrice.toFixed(2)}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground">{option.logisticAging} days</span>
                                </div>
                              </div>
                            );
                          })}
                          {modalRefreshData.shippingOptions.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center">
                              +{modalRefreshData.shippingOptions.length - 3} more options
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No shipping options available</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

