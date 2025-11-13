"use client";

/**
 * Products Page (Merged with Drafts functionality)
 * Displays produits (products) from both Supabase (local database) and Medusa store
 * Uses tabs to separate the two sources, with status-based filtering for local produits
 */
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DraftFilters } from "@/components/drafts/draft-filters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Package,
  ExternalLink,
  Globe,
  Database,
  AlertCircle,
  RefreshCw,
  Download,
  CheckCircle2,
  Edit,
  Trash2,
  MoreVertical,
  Languages,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getAllLocalProducts,
  getAllMedusaProducts,
  syncMedusaProductToDraft,
} from "@/app/actions/products";
import { getSuppliersList } from "@/app/actions/suppliers";
import {
  getAllProductDraftsAction,
  saveDraft,
  deleteDraft,
  enrichDraft,
} from "@/app/actions/drafts";
import type { ProductDraft } from "@/db/schema/products-draft";
import type { MedusaProduct } from "@/lib/medusa/client";

type LocalProduct = {
  product: ProductDraft;
  supplier: { id: string; name: string } | null;
};

export default function ProductsPage() {
  // Local products state (merged from drafts)
  const [localProducts, setLocalProducts] = useState<LocalProduct[]>([]);
  const [allLocalProducts, setAllLocalProducts] = useState<LocalProduct[]>([]); // Store unfiltered list
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [editingProduct, setEditingProduct] = useState<ProductDraft | null>(
    null
  );
  const [editForm, setEditForm] = useState<{
    titleEn: string;
    titleFr: string;
    cost: string;
    status: "draft" | "enriched" | "ready" | "published" | "archived";
  }>({
    titleEn: "",
    titleFr: "",
    cost: "",
    status: "draft",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkEnriching, setIsBulkEnriching] = useState(false);
  const [enrichmentProgress, setEnrichmentProgress] = useState<{
    isOpen: boolean;
    current: number;
    total: number;
    currentProduct: { id: string; title: string } | null;
    currentStep: string;
    results: Array<{
      id: string;
      title: string;
      status: "pending" | "processing" | "success" | "error";
      error?: string;
    }>;
  }>({
    isOpen: false,
    current: 0,
    total: 0,
    currentProduct: null,
    currentStep: "",
    results: [],
  });

  // Medusa products state
  const [medusaProducts, setMedusaProducts] = useState<MedusaProduct[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [loadingMedusa, setLoadingMedusa] = useState(true);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [errorMedusa, setErrorMedusa] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"local" | "medusa">("local");
  const [syncingProductId, setSyncingProductId] = useState<string | null>(
    null
  );
  const [syncMessages, setSyncMessages] = useState<
    Record<string, { type: "success" | "error"; message: string }>
  >({});
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState<{
    current: number;
    total: number;
    currentProduct: string;
  } | null>(null);

  useEffect(() => {
    if (activeTab === "local") {
      loadLocalProducts();
    } else {
      // Load both to check sync status
      loadLocalProducts();
      loadMedusaProducts();
    }
  }, [activeTab]);

  const loadLocalProducts = async () => {
    try {
      setLoadingLocal(true);
      setErrorLocal(null);
      const [productsData, suppliersData] = await Promise.all([
        getAllProductDraftsAction(),
        getSuppliersList(),
      ]);
      setAllLocalProducts(productsData);
      setLocalProducts(productsData);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error("Failed to load local products:", err);
      setErrorLocal(
        err instanceof Error ? err.message : "Failed to load local products"
      );
    } finally {
      setLoadingLocal(false);
    }
  };

  const loadMedusaProducts = async () => {
    try {
      setLoadingMedusa(true);
      setErrorMedusa(null);
      const data = await getAllMedusaProducts(100, 0);
      setMedusaProducts(data);
    } catch (err) {
      console.error("Failed to load Medusa products:", err);
      setErrorMedusa(
        err instanceof Error
          ? err.message
          : "Failed to load Medusa products. Please check your Medusa configuration."
      );
    } finally {
      setLoadingMedusa(false);
    }
  };

  /**
   * Handle filter changes - filter local products by status, supplier, date
   */
  const handleFilterChange = (filters: {
    status?: string;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    let filtered = [...allLocalProducts];

    if (filters.status) {
      filtered = filtered.filter((d) => d.product.status === filters.status);
    }

    if (filters.supplierId) {
      filtered = filtered.filter(
        (d) => d.supplier?.id === filters.supplierId
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter((d) => {
        if (!d.product.createdAt) return false;
        return new Date(d.product.createdAt) >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((d) => {
        if (!d.product.createdAt) return false;
        return new Date(d.product.createdAt) <= toDate;
      });
    }

    setLocalProducts(filtered);
    // Clear selections when filtering
    setSelectedProducts(new Set());
  };

  /**
   * Quick edit handlers
   */
  const handleEditClick = (product: ProductDraft) => {
    setEditingProduct(product);
    setEditForm({
      titleEn: product.titleEn || "",
      titleFr: product.titleFr || "",
      cost: product.cost || "0",
      status: product.status || "draft",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    setIsSaving(true);
    try {
      await saveDraft(editingProduct.id, {
        supplierId: editingProduct.supplierId,
        titleEn: editForm.titleEn,
        titleFr: editForm.titleFr,
        cost: editForm.cost,
        status: editForm.status,
      });

      // Refresh products list
      await loadLocalProducts();
      setEditingProduct(null);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this produit?")) {
      return;
    }

    setIsDeleting(productId);
    try {
      await deleteDraft(productId);
      await loadLocalProducts();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete produit. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * Bulk selection handlers
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(localProducts.map((d) => d.product.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const isAllSelected =
    localProducts.length > 0 && selectedProducts.size === localProducts.length;

  /**
   * Bulk delete handler
   */
  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;

    const count = selectedProducts.size;
    if (
      !confirm(
        `Are you sure you want to delete ${count} produit${count > 1 ? "s" : ""}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedProducts).map((id) => deleteDraft(id))
      );

      setSelectedProducts(new Set());
      await loadLocalProducts();
    } catch (error) {
      console.error("Failed to delete produits:", error);
      alert("Failed to delete some produits. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  /**
   * Bulk enrich handler
   */
  const handleBulkEnrich = async () => {
    if (selectedProducts.size === 0) return;

    const selectedIds = Array.from(selectedProducts);
    const selectedDrafts = localProducts
      .filter((d) => selectedIds.includes(d.product.id))
      .map((d) => ({
        id: d.product.id,
        title: d.product.titleEn || d.product.titleFr || "Untitled Produit",
      }));

    // Initialize progress
    setEnrichmentProgress({
      isOpen: true,
      current: 0,
      total: selectedIds.length,
      currentProduct: null,
      currentStep: "Initializing...",
      results: selectedDrafts.map((d) => ({
        id: d.id,
        title: d.title,
        status: "pending",
      })),
    });

    setIsBulkEnriching(true);

    // Process produits sequentially to show progress
    for (let i = 0; i < selectedIds.length; i++) {
      const productId = selectedIds[i];
      const product = selectedDrafts.find((d) => d.id === productId)!;

      setEnrichmentProgress((prev) => ({
        ...prev,
        current: i + 1,
        currentProduct: product,
        currentStep: "Fetching produit data...",
        results: prev.results.map((r) =>
          r.id === productId ? { ...r, status: "processing" } : r
        ),
      }));

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

        setEnrichmentProgress((prev) => ({
          ...prev,
          currentStep: "Enriching with AI...",
        }));

        await enrichDraft(productId, "openai");

        // Reload product data to get latest after enrichment
        const refreshedProducts = await getAllProductDraftsAction();
        const refreshedProduct = refreshedProducts.find((p) => p.product.id === productId);
        
        // Calculate 30% margin and selling price
        if (refreshedProduct?.product.cost) {
          const cost = parseFloat(refreshedProduct.product.cost) || 0;
          if (cost > 0) {
            const marginPercent = 30;
            const calculatedPrice = cost * (1 + marginPercent / 100);
            const roundedPrice = Math.round(calculatedPrice * 100) / 100;

            setEnrichmentProgress((prev) => ({
              ...prev,
              currentStep: "Calculating pricing (30% margin)...",
            }));

            // Update with 30% margin and calculated selling price
            // Convert null to undefined for optional fields
            await saveDraft(productId, {
              supplierId: refreshedProduct.product.supplierId,
              titleEn: refreshedProduct.product.titleEn ?? undefined,
              titleFr: refreshedProduct.product.titleFr ?? undefined,
              descriptionEn: refreshedProduct.product.descriptionEn ?? undefined,
              descriptionFr: refreshedProduct.product.descriptionFr ?? undefined,
              cost: refreshedProduct.product.cost,
              sellingPrice: roundedPrice.toFixed(2),
              margin: marginPercent.toFixed(2),
              metaTitle: refreshedProduct.product.metaTitle ?? undefined,
              metaDescription: refreshedProduct.product.metaDescription ?? undefined,
              images: refreshedProduct.product.images ?? undefined,
              specifications: refreshedProduct.product.specifications as Record<string, unknown> | undefined,
              status: refreshedProduct.product.status || "enriched",
            });
          }
        }

        setEnrichmentProgress((prev) => ({
          ...prev,
          currentStep: "Updating database...",
        }));

        await new Promise((resolve) => setTimeout(resolve, 200));

        setEnrichmentProgress((prev) => ({
          ...prev,
          currentStep: "Completed!",
          results: prev.results.map((r) =>
            r.id === productId ? { ...r, status: "success" } : r
          ),
        }));

        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Failed to enrich produit ${productId}:`, error);
        setEnrichmentProgress((prev) => ({
          ...prev,
          currentStep: "Error occurred",
          results: prev.results.map((r) =>
            r.id === productId
              ? {
                  ...r,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                }
              : r
          ),
        }));

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    await loadLocalProducts();

    setTimeout(() => {
      setIsBulkEnriching(false);
      setEnrichmentProgress({
        isOpen: false,
        current: 0,
        total: 0,
        currentProduct: null,
        currentStep: "",
        results: [],
      });
      setSelectedProducts(new Set());
    }, 2000);
  };

  /**
   * Medusa sync handlers
   */
  const isProductSynced = (medusaProductId: string): boolean => {
    return allLocalProducts.some(
      (lp) => lp.product.medusaProductId === medusaProductId
    );
  };

  const getSyncedDraftId = (medusaProductId: string): string | null => {
    const localProduct = allLocalProducts.find(
      (lp) => lp.product.medusaProductId === medusaProductId
    );
    return localProduct?.product.id || null;
  };

  const handleSyncProduct = async (product: MedusaProduct) => {
    if (isProductSynced(product.id)) {
      setSyncMessages({
        ...syncMessages,
        [product.id]: {
          type: "error",
          message: "Already synced",
        },
      });
      return;
    }

    setSyncingProductId(product.id);
    setSyncMessages({
      ...syncMessages,
      [product.id]: { type: "success", message: "" },
    });

    try {
      const result = await syncMedusaProductToDraft(product);
      if (result.success) {
        setSyncMessages({
          ...syncMessages,
          [product.id]: {
            type: "success",
            message: "Synced successfully!",
          },
        });
        await loadLocalProducts();
        setTimeout(() => {
          setSyncMessages((prev) => {
            const newMessages = { ...prev };
            delete newMessages[product.id];
            return newMessages;
          });
        }, 3000);
      } else {
        setSyncMessages({
          ...syncMessages,
          [product.id]: {
            type: "error",
            message: result.error || "Sync failed",
          },
        });
      }
    } catch (error) {
      console.error("Sync error:", error);
      setSyncMessages({
        ...syncMessages,
        [product.id]: {
          type: "error",
          message:
            error instanceof Error ? error.message : "Failed to sync product",
        },
      });
    } finally {
      setSyncingProductId(null);
    }
  };

  const handleBulkImport = async () => {
    const unsyncedProducts = medusaProducts.filter(
      (p) => !isProductSynced(p.id)
    );

    if (unsyncedProducts.length === 0) {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to import ${unsyncedProducts.length} product${
          unsyncedProducts.length !== 1 ? "s" : ""
        }?`
      )
    ) {
      return;
    }

    setBulkImporting(true);
    setBulkImportProgress({
      current: 0,
      total: unsyncedProducts.length,
      currentProduct: "",
    });

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < unsyncedProducts.length; i++) {
        const product = unsyncedProducts[i];
        setBulkImportProgress({
          current: i + 1,
          total: unsyncedProducts.length,
          currentProduct: product.title,
        });

        try {
          const result = await syncMedusaProductToDraft(product);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error syncing product ${product.id}:`, error);
          errorCount++;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      await loadLocalProducts();

      if (errorCount === 0) {
        alert(
          `Successfully imported ${successCount} product${
            successCount !== 1 ? "s" : ""
          }!`
        );
      } else {
        alert(
          `Import completed: ${successCount} successful, ${errorCount} failed.`
        );
      }
    } catch (error) {
      console.error("Bulk import error:", error);
      alert("An error occurred during bulk import. Please try again.");
    } finally {
      setBulkImporting(false);
      setBulkImportProgress(null);
    }
  };

  const formatCurrency = (value: string | null | undefined): string => {
    if (!value) return "$0.00";
    return `$${parseFloat(value).toFixed(2)}`;
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeColor = (
    status: string
  ): "bg-gray-500" | "bg-blue-500" | "bg-green-500" | "bg-yellow-500" => {
    switch (status) {
      case "published":
        return "bg-green-500";
      case "ready":
        return "bg-blue-500";
      case "enriched":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Produits</h1>
            <p className="text-muted-foreground">
              Manage your produits by status ({localProducts.length} shown,{" "}
              {allLocalProducts.length} total)
            </p>
          </div>
          {activeTab === "local" && (
            <div className="flex items-center gap-2">
              {selectedProducts.size > 0 && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkEnrich}
                    disabled={isBulkEnriching || isBulkDeleting}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isBulkEnriching
                      ? "Enriching..."
                      : `Enrich ${selectedProducts.size} with AI`}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting || isBulkEnriching}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isBulkDeleting
                      ? "Deleting..."
                      : `Delete ${selectedProducts.size} Selected`}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "en" ? "fr" : "en")}
              >
                <Languages className="mr-2 h-4 w-4" />
                {language === "en" ? "EN" : "FR"}
              </Button>
            </div>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "local" | "medusa")}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Produits ({localProducts.length})
            </TabsTrigger>
            <TabsTrigger value="medusa" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Medusa Products (
              {
                medusaProducts.filter((p) => !isProductSynced(p.id)).length
              }
              )
            </TabsTrigger>
          </TabsList>

          {/* Local Produits Tab */}
          <TabsContent value="local" className="space-y-4">
            {/* Filters */}
            <Suspense fallback={<div className="h-20 rounded-lg border bg-muted animate-pulse" />}>
              <DraftFilters
                suppliers={suppliers}
                onFilterChange={handleFilterChange}
              />
            </Suspense>

            {loadingLocal ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : errorLocal ? (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Error Loading Produits</h3>
                </div>
                <p className="mt-2 text-sm text-destructive/80">
                  {errorLocal}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadLocalProducts}
                  className="mt-4"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : localProducts.length === 0 ? (
              <div className="rounded-lg border p-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Produits</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  No produits found. Import products from the Imports page or
                  sync from Medusa.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted">
                      <tr>
                        <th className="w-12 px-4 py-3">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={(checked) =>
                              handleSelectAll(checked === true)
                            }
                            aria-label="Select all produits"
                          />
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Title
                        </th>
                        <th className="w-20 px-4 py-3 text-left font-medium">
                          Image
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Supplier
                        </th>
                        <th className="px-4 py-3 text-left font-medium">Cost</th>
                        <th className="px-4 py-3 text-left font-medium">
                          Selling Price
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {localProducts.map(({ product, supplier }) => (
                        <tr
                          key={product.id}
                          className={`border-b transition-colors ${
                            selectedProducts.has(product.id)
                              ? "bg-muted"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <td className="w-12 px-4 py-3">
                            <Checkbox
                              checked={selectedProducts.has(product.id)}
                              onCheckedChange={(checked) =>
                                handleSelectProduct(
                                  product.id,
                                  checked === true
                                )
                              }
                              aria-label={`Select ${product.titleEn || product.titleFr || "produit"}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {language === "en"
                                ? product.titleEn || product.titleFr || "Untitled"
                                : product.titleFr ||
                                  product.titleEn ||
                                  "Sans titre"}
                            </div>
                            {(language === "en"
                              ? product.descriptionEn
                              : product.descriptionFr) && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {language === "en"
                                  ? product.descriptionEn
                                  : product.descriptionFr}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {product.images && product.images.length > 0 ? (
                              <div className="relative h-16 w-16 overflow-hidden rounded border bg-muted">
                                <img
                                  src={product.images[0]}
                                  alt={
                                    language === "en"
                                      ? product.titleEn || product.titleFr || "Product"
                                      : product.titleFr ||
                                        product.titleEn ||
                                        "Produit"
                                  }
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    // Hide broken images and show placeholder
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                                {product.images.length > 1 && (
                                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground shadow-sm">
                                    +{product.images.length - 1}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded border bg-muted">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {supplier?.name ? (
                              <Link
                                href={`/suppliers/${supplier.id}`}
                                className="text-primary hover:underline"
                              >
                                {supplier.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">
                                Unknown
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(product.cost)}
                          </td>
                          <td className="px-4 py-3">
                            {formatCurrency(product.sellingPrice)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white ${getStatusBadgeColor(
                                product.status
                              )}`}
                            >
                              {product.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {product.createdAt
                              ? formatDate(product.createdAt)
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Link href={`/drafts/${product.id}`}>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                              {product.medusaProductId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Published to Medusa"
                                  disabled
                                >
                                  <Globe className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isDeleting === product.id}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleEditClick(product)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Quick Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/drafts/${product.id}`}>
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Full Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(product.id)}
                                    className="text-destructive focus:text-destructive"
                                    disabled={isDeleting === product.id}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {isDeleting === product.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Medusa Products Tab */}
          <TabsContent value="medusa" className="space-y-4">
            {medusaProducts.filter((p) => !isProductSynced(p.id)).length >
              0 && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                <div>
                  <p className="text-sm font-medium">
                    {medusaProducts.filter((p) => !isProductSynced(p.id))
                      .length}{" "}
                    product
                    {medusaProducts.filter((p) => !isProductSynced(p.id))
                      .length !== 1
                      ? "s"
                      : ""}{" "}
                    available to import
                  </p>
                  {bulkImportProgress && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Importing: {bulkImportProgress.currentProduct} (
                      {bulkImportProgress.current}/{bulkImportProgress.total})
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleBulkImport}
                  disabled={bulkImporting}
                  size="sm"
                >
                  {bulkImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Import All
                    </>
                  )}
                </Button>
              </div>
            )}
            {loadingMedusa ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : errorMedusa ? (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-semibold">Error Loading Medusa Products</h3>
                </div>
                <p className="mt-2 text-sm text-destructive/80">
                  {errorMedusa}
                </p>
                <p className="mt-2 text-xs text-destructive/60">
                  Make sure Medusa is configured in Settings with the correct
                  Admin URL and API token.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMedusaProducts}
                  className="mt-4"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            ) : medusaProducts.length === 0 ? (
              <div className="rounded-lg border p-12 text-center">
                <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No Medusa Products
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  No products found in your Medusa store, or Medusa is not
                  configured.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href="/settings">Configure Medusa</Link>
                </Button>
              </div>
            ) : medusaProducts.filter((p) => !isProductSynced(p.id))
                .length === 0 ? (
              <div className="rounded-lg border p-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-semibold">All Products Synced</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  All Medusa products have been imported to your database.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {medusaProducts.length} product
                  {medusaProducts.length !== 1 ? "s" : ""} already synced
                </p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Handle
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Variants
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          Created
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {medusaProducts
                        .filter((product) => !isProductSynced(product.id))
                        .map((product) => (
                          <tr
                            key={product.id}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium">{product.title}</div>
                              {product.description && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {product.description}
                                </div>
                              )}
                              {product.images && product.images.length > 0 && (
                                <div className="mt-1">
                                  <img
                                    src={product.images[0].url}
                                    alt={product.title}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <code className="rounded bg-muted px-2 py-1 text-xs">
                                {product.handle || "N/A"}
                              </code>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm">
                                {product.variants?.length || 0} variant
                                {product.variants?.length !== 1 ? "s" : ""}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatDate(product.created_at)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleSyncProduct(product)}
                                  disabled={
                                    syncingProductId === product.id ||
                                    !!syncMessages[product.id]
                                  }
                                  title="Sync to Database"
                                >
                                  {syncingProductId === product.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                </Button>
                                {syncMessages[product.id] && (
                                  <span
                                    className={`text-xs ${
                                      syncMessages[product.id].type === "success"
                                        ? "text-green-600"
                                        : "text-destructive"
                                    }`}
                                  >
                                    {syncMessages[product.id].message}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Edit Dialog */}
      <Dialog
        open={editingProduct !== null}
        onOpenChange={(open) => !open && setEditingProduct(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Edit Produit</DialogTitle>
            <DialogDescription>
              Update produit details quickly. For full editing, use the detail
              page.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titleEn">Title (English)</Label>
              <Input
                id="titleEn"
                value={editForm.titleEn}
                onChange={(e) =>
                  setEditForm({ ...editForm, titleEn: e.target.value })
                }
                placeholder="Enter English title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="titleFr">Title (French)</Label>
              <Input
                id="titleFr"
                value={editForm.titleFr}
                onChange={(e) =>
                  setEditForm({ ...editForm, titleFr: e.target.value })
                }
                placeholder="Enter French title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={editForm.cost}
                onChange={(e) =>
                  setEditForm({ ...editForm, cost: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    status: value as typeof editForm.status,
                  })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="enriched">Enriched</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingProduct(null)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Enrichment Progress Dialog */}
      <Dialog
        open={enrichmentProgress.isOpen}
        onOpenChange={(open) => {
          if (!isBulkEnriching && !open) {
            setEnrichmentProgress({
              isOpen: false,
              current: 0,
              total: 0,
              currentProduct: null,
              currentStep: "",
              results: [],
            });
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Enrichment in Progress
            </DialogTitle>
            <DialogDescription>
              Enriching {enrichmentProgress.total} produit
              {enrichmentProgress.total !== 1 ? "s" : ""} with AI-generated
              content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Overall Progress: {enrichmentProgress.current} /{" "}
                  {enrichmentProgress.total}
                </span>
                <span className="text-muted-foreground">
                  {enrichmentProgress.total > 0
                    ? Math.round(
                        (enrichmentProgress.current /
                          enrichmentProgress.total) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${
                      enrichmentProgress.total > 0
                        ? (enrichmentProgress.current /
                            enrichmentProgress.total) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Current Produit Status */}
            {enrichmentProgress.currentProduct && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {enrichmentProgress.currentStep === "Completed!" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : enrichmentProgress.currentStep === "Error occurred" ? (
                      <XCircle className="h-5 w-5 text-destructive" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">
                      {enrichmentProgress.currentProduct.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {enrichmentProgress.currentStep}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step Indicators */}
            {enrichmentProgress.currentProduct &&
              enrichmentProgress.currentStep !== "Error occurred" && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "Fetching data",
                    "Enriching with AI",
                    "Updating database",
                  ].map((step, index) => {
                    const stepNames = [
                      "Fetching produit data...",
                      "Enriching with AI...",
                      "Updating database...",
                    ];
                    const isActive =
                      enrichmentProgress.currentStep === stepNames[index];
                    const currentStepIndex = stepNames.findIndex(
                      (s) => s === enrichmentProgress.currentStep
                    );
                    const isCompleted =
                      enrichmentProgress.currentStep === "Completed!" ||
                      (currentStepIndex >= 0 && index < currentStepIndex);

                    return (
                      <div
                        key={step}
                        className={`flex flex-col items-center gap-2 rounded-md border p-3 ${
                          isActive
                            ? "border-primary bg-primary/5"
                            : isCompleted
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : "border-muted bg-muted/50"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            isActive
                              ? "text-primary"
                              : isCompleted
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* Results List */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Produits Status</p>
              <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border p-2">
                {enrichmentProgress.results.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50"
                  >
                    <span className="truncate text-sm">{result.title}</span>
                    <div className="ml-2 flex-shrink-0">
                      {result.status === "success" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                      {result.status === "error" && (
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-destructive" />
                          {result.error && (
                            <span className="text-xs text-destructive">
                              {result.error.length > 20
                                ? `${result.error.substring(0, 20)}...`
                                : result.error}
                            </span>
                          )}
                        </div>
                      )}
                      {result.status === "processing" && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      {result.status === "pending" && (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!isBulkEnriching) {
                  setEnrichmentProgress({
                    isOpen: false,
                    current: 0,
                    total: 0,
                    currentProduct: null,
                    currentStep: "",
                    results: [],
                  });
                }
              }}
              disabled={isBulkEnriching}
            >
              {isBulkEnriching ? "Processing..." : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
