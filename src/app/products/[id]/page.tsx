"use client";

/**
 * Product Detail Page
 * Edit product draft with FR/EN tabs, images, specs, and price calculator
 */
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAutoSave } from "@/hooks/use-auto-save";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceCalculator } from "@/components/drafts/price-calculator";
import { ImageManager } from "@/components/drafts/image-manager";
import {
  saveDraft,
  deleteDraft,
  enrichDraft,
  getProductDraftAction,
  syncDraftFromMedusa,
  updateDraftToMedusaAction,
  unpublishDraftAction,
} from "@/app/actions/drafts";
import { publishDraftAction } from "@/app/actions/medusa";
import {
  Sparkles,
  Save,
  Trash2,
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Upload,
  Languages,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { AIFillButton } from "@/components/drafts/ai-fill-button";
import { MedusaEntitySelector } from "@/components/drafts/medusa-entity-selector";
import { MedusaCategoryMultiSelect } from "@/components/drafts/medusa-category-multiselect";
import { MedusaMultiSelect } from "@/components/drafts/medusa-multiselect";
import { LocationInventoryManager } from "@/components/drafts/location-inventory-manager";
import {
  generateTitleAction,
  generateDescriptionAction,
  generateSubtitleAction,
  generateHandleAction,
  generateTagsAction,
  generateMaterialTypeAction,
} from "@/app/actions/field-enrich";
import { translateTextAction } from "@/app/actions/ai";
import { generateSEOAction } from "@/app/actions/ai";
import { hasDraftChanges } from "./utils";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [updatingToMedusa, setUpdatingToMedusa] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [syncingToMedusa, setSyncingToMedusa] = useState(false);
  const [syncingFromMedusa, setSyncingFromMedusa] = useState(false);
  const [medusaProductId, setMedusaProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const previousStatusRef = useRef<
    "draft" | "enriched" | "ready" | "published" | "archived" | ""
  >("");
  const isManualPublishRef = useRef(false);
  const initialDraftDataRef = useRef<ReturnType<typeof getDraftData> | null>(null);

  const [supplierId, setSupplierId] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [descriptionFr, setDescriptionFr] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [subtitle, setSubtitle] = useState("");
  const [cost, setCost] = useState("");
  const [margin, setMargin] = useState(30);
  const [sellingPrice, setSellingPrice] = useState("");
  // CAD pricing fields
  const [cadExchangeRate, setCadExchangeRate] = useState("1.35"); // Default USD to CAD rate
  const [cadSellingPrice, setCadSellingPrice] = useState("");
  // Product identification fields (dedicated columns)
  const [handle, setHandle] = useState("");
  const [currency, setCurrency] = useState("USD"); // All currency is USD
  const [sku, setSku] = useState("");
  // Supplier fields (dedicated columns)
  const [supplierProductId, setSupplierProductId] = useState("");
  const [supplierVariantId, setSupplierVariantId] = useState("");
  const [marketplaceUrl, setMarketplaceUrl] = useState("");
  // Physical attributes (dedicated columns)
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [material, setMaterial] = useState("");
  // Shipping & Customs (dedicated columns)
  const [originCountry, setOriginCountry] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [midCode, setMidCode] = useState("");
  // Product organization (dedicated columns)
  const [typeId, setTypeId] = useState(""); // For product type ID from Medusa
  const [type, setType] = useState(""); // For custom type string (legacy)
  const [collectionId, setCollectionId] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]); // Multiple categories
  const [salesChannelIds, setSalesChannelIds] = useState<string[]>([]); // Multiple sales channels
  const [stockLocationIds, setStockLocationIds] = useState<string[]>([]); // Multiple stock locations
  const [locationInventory, setLocationInventory] = useState<Record<string, number>>({}); // Inventory quantities per location
  const [tags, setTags] = useState("");
  const [specifications, setSpecifications] = useState<Record<string, unknown>>(
    {}
  );
  const [status, setStatus] = useState<
    "draft" | "enriched" | "ready" | "published" | "archived"
  >("draft");

  // Helper function to load draft data into state
  const loadDraftData = (product: {
    supplierId: string;
    titleEn?: string | null;
    titleFr?: string | null;
    subtitle?: string | null;
    descriptionEn?: string | null;
    descriptionFr?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    images?: string[] | null;
    cost?: string | null;
    margin?: string | null;
    sellingPrice?: string | null;
    handle?: string | null;
    currency?: string | null;
    sku?: string | null;
    supplierProductId?: string | null;
    supplierVariantId?: string | null;
    marketplaceUrl?: string | null;
    weight?: string | null;
    length?: string | null;
    height?: string | null;
    width?: string | null;
    originCountry?: string | null;
    hsCode?: string | null;
    midCode?: string | null;
    material?: string | null;
    type?: string | null;
    collectionId?: string | null;
    categoryIds?: string[] | null;
    salesChannelIds?: string[] | null;
    stockLocationIds?: string[] | null;
    locationInventory?: Record<string, number> | null;
    tags?: string[] | null;
    specifications?: Record<string, unknown> | null;
    status: "draft" | "enriched" | "ready" | "published" | "archived";
    medusaProductId?: string | null;
  }) => {
    setSupplierId(product.supplierId);
    setTitleEn(product.titleEn || "");
    setTitleFr(product.titleFr || "");
    setSubtitle(product.subtitle || "");
    setDescriptionEn(product.descriptionEn || "");
    setDescriptionFr(product.descriptionFr || "");
    setMetaTitle(product.metaTitle || "");
    setMetaDescription(product.metaDescription || "");
    setImages(product.images || []);
    setCost(product.cost || "0");
    const marginValue = product.margin ? parseFloat(product.margin) : 30;
    setMargin(marginValue);
    // Calculate default selling price if not set
    const existingSellingPrice = product.sellingPrice || "";
    if (!existingSellingPrice && product.cost) {
      const costNum = parseFloat(product.cost) || 0;
      const calculatedPrice = costNum * (1 + marginValue / 100);
      // Round to 2 decimal places to avoid floating point precision issues
      const roundedPrice = Math.round(calculatedPrice * 100) / 100;
      setSellingPrice(roundedPrice.toFixed(2));
    } else {
      setSellingPrice(existingSellingPrice);
    }
    // Read from dedicated columns (not specifications)
    setHandle(product.handle || "");
    setCurrency(product.currency || "USD"); // Default to USD
    setSku(product.sku || "");
    setSupplierProductId(product.supplierProductId || "");
    setSupplierVariantId(product.supplierVariantId || "");
    setMarketplaceUrl(product.marketplaceUrl || "");
    setWeight(product.weight || "");
    setLength(product.length || "");
    setHeight(product.height || "");
    setWidth(product.width || "");
    setOriginCountry(product.originCountry || "");
    setHsCode(product.hsCode || "");
    setMidCode(product.midCode || "");
    setMaterial(product.material || "");
    setType(product.type || "");
    setTypeId(""); // Type ID is not stored in dedicated column, check specs if needed
    setCollectionId(product.collectionId || "");
    setCategoryIds(product.categoryIds || []);
    setSalesChannelIds(product.salesChannelIds || []);
    setStockLocationIds(product.stockLocationIds || []);
    setLocationInventory(product.locationInventory || {});
    setTags(
      Array.isArray(product.tags)
        ? product.tags.join(", ")
        : product.tags || ""
    );
    // Keep specifications for backward compatibility and additional fields
    const specs =
      (product.specifications as Record<string, unknown>) || {};
    setSpecifications(specs);
    // Extract type_id from specifications if needed
    if (!type && specs.type_id) {
      setTypeId(specs.type_id as string);
    }
    setStatus(product.status);
    setMedusaProductId(product.medusaProductId || null);
    previousStatusRef.current = product.status;
    
    // Store initial draft data for change detection
    // Use setTimeout to ensure all state is set before capturing
    setTimeout(() => {
      initialDraftDataRef.current = getDraftData();
    }, 0);
  };

  useEffect(() => {
    if (id) {
      // First, sync from Medusa if product is published
      const loadDraft = async () => {
        try {
          // Get draft data first
          const draftData = await getProductDraftAction(id);
          if (!draftData) {
            setError("Product not found");
            setLoading(false);
            return;
          }

          // If product is published to Medusa, sync changes from Medusa
          if (draftData.product.medusaProductId) {
            const syncResult = await syncDraftFromMedusa(id);
            if (syncResult.success) {
              if (syncResult.deleted) {
                setSuccess("Product was deleted in Medusa. Status updated to draft.");
                setTimeout(() => setSuccess(null), 5000);
                // Reload draft data after sync
                const updatedDraftData = await getProductDraftAction(id);
                if (updatedDraftData) {
                  loadDraftData(updatedDraftData.product);
                }
              } else if (syncResult.synced) {
                setSuccess("Product synced from Medusa. Changes have been updated.");
                setTimeout(() => setSuccess(null), 5000);
                // Reload draft data after sync
                const updatedDraftData = await getProductDraftAction(id);
                if (updatedDraftData) {
                  loadDraftData(updatedDraftData.product);
                }
              } else {
                // No sync needed or sync failed silently, just load draft
                loadDraftData(draftData.product);
              }
            } else {
              // Sync failed, but still load draft data
              console.warn("Failed to sync from Medusa:", syncResult.error);
              loadDraftData(draftData.product);
            }
          } else {
            // Not published, just load draft data
            loadDraftData(draftData.product);
          }
        } catch (err) {
          console.error("Failed to load product:", err);
          setError("Failed to load product");
        } finally {
          setLoading(false);
        }
      };

      loadDraft();
    } else {
      setLoading(false);
    }
  }, [id]);

  // Auto-calculate selling price when cost or margin changes
  // This ensures the selling price input always defaults to the calculated margin total
  useEffect(() => {
    const costNum = parseFloat(cost) || 0;
    if (costNum > 0 && margin >= 0) {
      const calculatedPrice = costNum * (1 + margin / 100);
      // Round to 2 decimal places to avoid floating point precision issues
      const roundedPrice = Math.round(calculatedPrice * 100) / 100;
      // Update selling price to match calculated price from margin
      // The PriceCalculator component also updates this via onSellingPriceChange,
      // but this ensures it's set immediately when cost/margin changes
      setSellingPrice(roundedPrice.toFixed(2));
    }
  }, [cost, margin]);

  // Auto-calculate CAD selling price when USD selling price or exchange rate changes
  useEffect(() => {
    const usdPrice = parseFloat(sellingPrice) || 0;
    const exchangeRate = parseFloat(cadExchangeRate) || 1.35;
    if (usdPrice > 0 && exchangeRate > 0) {
      const cadPrice = usdPrice * exchangeRate;
      // Round to 2 decimal places to avoid floating point precision issues
      const roundedCadPrice = Math.round(cadPrice * 100) / 100;
      setCadSellingPrice(roundedCadPrice.toFixed(2));
    } else {
      setCadSellingPrice("");
    }
  }, [sellingPrice, cadExchangeRate]);

  // Auto-sync to Medusa when status changes to "published" or "ready"
  useEffect(() => {
    // Skip on initial load or if loading
    if (loading || !id) {
      return;
    }

    // Skip if this is a manual publish operation
    if (isManualPublishRef.current) {
      isManualPublishRef.current = false;
      previousStatusRef.current = status;
      return;
    }

    // Skip if product is already published (has medusaProductId)
    if (medusaProductId) {
      previousStatusRef.current = status;
      return;
    }

    const shouldAutoSync =
      (status === "published" || status === "ready") &&
      previousStatusRef.current !== status &&
      previousStatusRef.current !== "published" && // Don't re-sync if already published
      previousStatusRef.current !== ""; // Don't sync on initial load

    if (shouldAutoSync) {
      const syncToMedusa = async () => {
        setSyncingToMedusa(true);
        try {
          // First, ensure draft is saved
          const draftData = getDraftData();
          await saveDraft(id, draftData);

          // Then sync to Medusa
          if (status === "published") {
            const result = await publishDraftAction(id);
            if (result.success) {
              setMedusaProductId(result.medusaProductId || null);
              setSuccess(
                `Product auto-synced to Medusa! Product ID: ${result.medusaProductId}`
              );
              setTimeout(() => setSuccess(null), 5000);
            } else {
              // Only log if it's not the "already published" error (which is expected in some cases)
              if (result.error?.includes("already been published")) {
                // This is expected if product was published manually, just update the ref
                const draftData = await getProductDraftAction(id);
                if (draftData?.product.medusaProductId) {
                  setMedusaProductId(draftData.product.medusaProductId);
                }
              } else {
                console.error("Auto-sync to Medusa failed:", result.error);
              }
            }
          } else if (status === "ready") {
            // For "ready" status, we might want to prepare the product but not publish yet
            // For now, we'll just save the draft
            console.log("Product marked as ready, saved to database");
          }
        } catch (err) {
          console.error("Auto-sync error:", err);
          // Don't show error for auto-sync failures
        } finally {
          setSyncingToMedusa(false);
        }
      };

      syncToMedusa();
    }
    
    // Update previous status
    previousStatusRef.current = status;
  }, [status, id, loading, medusaProductId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prepare draft data object for saving
  const getDraftData = () => {
    const updatedSpecifications = {
      ...specifications,
      pid: supplierProductId || specifications.pid,
      vid: supplierVariantId || specifications.vid,
      marketplace_url: marketplaceUrl || specifications.marketplace_url,
      subtitle: subtitle || specifications.subtitle,
      type_id: typeId || specifications.type_id,
    };

    return {
      supplierId,
      titleEn,
      titleFr,
      subtitle,
      descriptionEn,
      descriptionFr,
      metaTitle,
      metaDescription,
      images,
      cost,
      sellingPrice,
      margin: margin.toString(),
      sku,
      handle,
      currency: "USD",
      supplierProductId,
      supplierVariantId,
      marketplaceUrl,
      weight,
      length,
      width,
      height,
      material,
      originCountry,
      hsCode,
      midCode,
      type,
      collectionId,
      categoryIds,
      salesChannelIds,
      stockLocationIds,
      locationInventory,
      tags: tags
        ? tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        : [],
      specifications: updatedSpecifications,
      status,
    };
  };

  // Auto-save function
  const autoSaveFn = async () => {
    if (!id) return; // Don't auto-save new drafts
    
    setAutoSaving(true);
    try {
      const draftData = getDraftData();
      await saveDraft(id, draftData);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Auto-save error:", err);
      // Don't show error for auto-save failures, just log them
    } finally {
      setAutoSaving(false);
    }
  };

  // Enable auto-save when draft is loaded
  const draftDataForAutoSave = getDraftData();
  useAutoSave(autoSaveFn, draftDataForAutoSave, 2000, !!id && !loading);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const draftData = getDraftData();
      await saveDraft(id || null, draftData);
      setSuccess("Product saved successfully");
      setLastSaved(new Date());
      // Update initial data ref after successful save
      initialDraftDataRef.current = draftData;
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleEnrich = async () => {
    if (!id) return;

    setEnriching(true);
    setError(null);
    setSuccess(null);

    try {
      await enrichDraft(id, "openai");
      setSuccess("Product enriched with AI content");

      // Reload draft data
      const draftData = await getProductDraftAction(id);
      if (draftData) {
        const product = draftData.product;
        setTitleEn(product.titleEn || titleEn);
        setTitleFr(product.titleFr || titleFr);
        setSubtitle(product.subtitle || subtitle);
        setDescriptionEn(product.descriptionEn || descriptionEn);
        setDescriptionFr(product.descriptionFr || descriptionFr);
        setSpecifications(
          (product.specifications as Record<string, unknown>) || specifications
        );
        setStatus("enriched");
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enrich product");
    } finally {
      setEnriching(false);
    }
  };

  // AI Fill Handlers
  const handleAIFillTitle = async (language: "en" | "fr") => {
    if (!id) return;
    const result = await generateTitleAction(id, language);
    if (result.success && result.title) {
      if (language === "en") {
        setTitleEn(result.title);
      } else {
        setTitleFr(result.title);
      }
      setSuccess(`${language === "en" ? "English" : "French"} title generated`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Failed to generate title");
    }
  };

  const handleAIFillSubtitle = async () => {
    if (!id) return;
    const result = await generateSubtitleAction(id);
    if (result.success && result.subtitle) {
      setSubtitle(result.subtitle);
      setSuccess("Subtitle generated");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Failed to generate subtitle");
    }
  };

  const handleAIFillDescription = async (language: "en" | "fr") => {
    if (!id) return;
    const result = await generateDescriptionAction(id, language);
    if (result.success && result.description) {
      if (language === "en") {
        setDescriptionEn(result.description);
      } else {
        setDescriptionFr(result.description);
      }
      setSuccess(
        `${language === "en" ? "English" : "French"} description generated`
      );
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Failed to generate description");
    }
  };

  const handleTranslateTitle = async (from: "en" | "fr", to: "en" | "fr") => {
    const sourceText = from === "en" ? titleEn : titleFr;
    if (!sourceText.trim()) {
      setError(
        `Please enter a ${from === "en" ? "English" : "French"} title first`
      );
      return;
    }
    try {
      const result = await translateTextAction({
        text: sourceText,
        targetLanguage: to,
        sourceLanguage: from,
        provider: "openai",
      });
      if (to === "en") {
        setTitleEn(result.translatedText);
      } else {
        setTitleFr(result.translatedText);
      }
      setSuccess("Title translated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to translate title");
    }
  };

  const handleTranslateDescription = async (
    from: "en" | "fr",
    to: "en" | "fr"
  ) => {
    const sourceText = from === "en" ? descriptionEn : descriptionFr;
    if (!sourceText.trim()) {
      setError(
        `Please enter a ${from === "en" ? "English" : "French"} description first`
      );
      return;
    }
    try {
      const result = await translateTextAction({
        text: sourceText,
        targetLanguage: to,
        sourceLanguage: from,
        provider: "openai",
      });
      if (to === "en") {
        setDescriptionEn(result.translatedText);
      } else {
        setDescriptionFr(result.translatedText);
      }
      setSuccess("Description translated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to translate description");
    }
  };

  const handleAIFillHandle = async () => {
    const title = titleEn || titleFr;
    if (!title.trim()) {
      setError("Please enter a title first");
      return;
    }
    const result = await generateHandleAction(title);
    if (result.success && result.handle) {
      setHandle(result.handle);
      setSuccess("Handle generated");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Failed to generate handle");
    }
  };

  const handleAIFillSEO = async () => {
    if (!id) return;
    const title = titleEn || titleFr || "";
    const description = descriptionEn || descriptionFr || "";
    try {
      const result = await generateSEOAction({
        title,
        description,
        provider: "openai",
      });
      setMetaTitle(result.metaTitle);
      setMetaDescription(result.metaDescription);
      setSuccess("SEO metadata generated");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to generate SEO metadata");
    }
  };

  const handleAIFillTags = async () => {
    if (!id) return;
    const title = titleEn || titleFr || "";
    const description = descriptionEn || descriptionFr || "";
    const result = await generateTagsAction(title, description);
    if (result.success && result.tags) {
      setTags(result.tags.join(", "));
      setSuccess("Tags generated");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Failed to generate tags");
    }
  };

  const handleAIFillMaterialType = async () => {
    if (!id) return;
    const title = titleEn || titleFr || "";
    const description = descriptionEn || descriptionFr || "";
    const result = await generateMaterialTypeAction(title, description);
    if (result.success) {
      if (result.material) setMaterial(result.material);
      if (result.type) setType(result.type);
      setSuccess("Material and type generated");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Failed to generate material/type");
    }
  };

  const handlePublish = async () => {
    if (!id) return;

    if (
      !confirm(
        "Are you sure you want to publish this product to Medusa? This action cannot be undone."
      )
    ) {
      return;
    }

    // Mark as manual publish to prevent auto-sync from running
    isManualPublishRef.current = true;
    setPublishing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await publishDraftAction(id);

      if (result.success) {
        setMedusaProductId(result.medusaProductId || null);
        setSuccess(
          `Product published successfully! Medusa Product ID: ${result.medusaProductId}`
        );

        // Reload draft data to show updated status
        const draftData = await getProductDraftAction(id);
        if (draftData) {
          setStatus("published");
          setMedusaProductId(draftData.product.medusaProductId || null);
          previousStatusRef.current = "published";
        }
      } else {
        setError(result.error || "Failed to publish product to Medusa");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish to Medusa"
      );
    } finally {
      setPublishing(false);
      // Reset manual publish flag after a short delay to ensure status update completes
      setTimeout(() => {
        isManualPublishRef.current = false;
      }, 100);
    }
  };

  const handleUpdateToMedusa = async () => {
    if (!id || !medusaProductId) return;

    setUpdatingToMedusa(true);
    setError(null);
    setSuccess(null);

    try {
      // First, ensure draft is saved
      const draftData = getDraftData();
      await saveDraft(id, draftData);

      // Then update to Medusa
      const result = await updateDraftToMedusaAction(id);
      if (result.success) {
        setSuccess("Product updated in Medusa successfully!");
        // Update initial data ref after successful update
        initialDraftDataRef.current = draftData;
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.error || "Failed to update product in Medusa");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update to Medusa");
    } finally {
      setUpdatingToMedusa(false);
    }
  };

  const handleUnpublish = async () => {
    if (!id || !medusaProductId) return;

    // Confirm before unpublishing
    if (
      !confirm(
        "Are you sure you want to unpublish this product? This will delete it from Medusa and reset the status to draft."
      )
    ) {
      return;
    }

    setUnpublishing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await unpublishDraftAction(id);
      if (result.success) {
        setMedusaProductId(null);
        setStatus("draft");
        setSuccess("Product unpublished from Medusa. Status reset to draft.");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.error || "Failed to unpublish product from Medusa");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish");
    } finally {
      setUnpublishing(false);
    }
  };

  const handleSyncFromMedusa = async () => {
    if (!id) return;

    setSyncingFromMedusa(true);
    setError(null);
    setSuccess(null);

    try {
      const syncResult = await syncDraftFromMedusa(id);
      if (syncResult.success) {
        if (syncResult.deleted) {
          setSuccess("Product was deleted in Medusa. Status updated to draft.");
          setTimeout(() => setSuccess(null), 5000);
        } else if (syncResult.synced) {
          setSuccess("Product synced from Medusa. Changes have been updated.");
          setTimeout(() => setSuccess(null), 5000);
        } else {
          setSuccess("Product is up to date with Medusa.");
          setTimeout(() => setSuccess(null), 3000);
        }

        // Reload draft data after sync
        const updatedDraftData = await getProductDraftAction(id);
        if (updatedDraftData) {
          loadDraftData(updatedDraftData.product);
          // Update initial data ref after sync
          setTimeout(() => {
            initialDraftDataRef.current = getDraftData();
          }, 100);
        }
      } else {
        setError(syncResult.error || "Failed to sync from Medusa");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync from Medusa");
    } finally {
      setSyncingFromMedusa(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDraft(id);
      router.push("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/products")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {id ? "Edit Product" : "New Product"}
              </h1>
              <p className="text-muted-foreground">
                {id
                  ? "Edit product details"
                  : "Create a new product"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-save status indicator */}
            {id && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {autoSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Auto-saving...</span>
                  </>
                ) : updatingToMedusa ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Updating to Medusa...</span>
                  </>
                ) : unpublishing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Unpublishing...</span>
                  </>
                ) : syncingToMedusa ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Syncing to Medusa...</span>
                  </>
                ) : syncingFromMedusa ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Syncing from Medusa...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                    <span>
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  </>
                ) : null}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleEnrich}
                disabled={
                  !id || enriching || publishing || status === "published"
                }
                variant="outline"
              >
                {enriching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Enrich
                  </>
                )}
              </Button>
              {(() => {
                const currentData = getDraftData();
                const hasChanges = hasDraftChanges(currentData, initialDraftDataRef.current);
                return (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={saving || publishing || autoSaving || !hasChanges}
                      title={!hasChanges ? "No changes to save" : "Save product"}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                    {medusaProductId && (
                      <Button
                        onClick={handleUpdateToMedusa}
                        disabled={updatingToMedusa || unpublishing || !id || !hasChanges}
                        variant="default"
                        title={!hasChanges ? "No changes to push" : "Push local changes to Medusa"}
                      >
                        {updatingToMedusa ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Push to Medusa
                          </>
                        )}
                      </Button>
                    )}
                  </>
                );
              })()}
              {medusaProductId && (
                <>
                  <Button
                    onClick={handleUnpublish}
                    disabled={unpublishing || updatingToMedusa || !id}
                    variant="destructive"
                    title="Unpublish product from Medusa"
                  >
                    {unpublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Unpublishing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Unpublish
                      </>
                    )}
                  </Button>
                  {id && (
                    <Button
                      onClick={handleSyncFromMedusa}
                      disabled={syncingFromMedusa || updatingToMedusa || unpublishing || saving}
                      variant="outline"
                      title="Sync changes from Medusa"
                    >
                      {syncingFromMedusa ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync from Medusa
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
              {!medusaProductId && (
                <>
                  <Button
                    onClick={handlePublish}
                    disabled={publishing || updatingToMedusa || unpublishing || !id}
                    variant="default"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Publish
                      </>
                    )}
                  </Button>
                </>
              )}
              {id && status === "published" && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Published</span>
                </div>
              )}
              {id && (
                <Button onClick={handleDelete} variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

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

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="en" className="space-y-4">
              <TabsList>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="fr">Français</TabsTrigger>
              </TabsList>

              <TabsContent value="en" className="space-y-4">
                <Card className="border-2 border-border shadow-md">
                  <CardHeader className="border-b-2 border-border bg-muted/30">
                    <CardTitle>English Content</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="titleEn">Title *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="titleEn"
                          value={titleEn}
                          onChange={(e) => setTitleEn(e.target.value)}
                          placeholder="Product title in English"
                          className="flex-1"
                        />
                        <AIFillButton
                          onClick={() => handleAIFillTitle("en")}
                          disabled={!id}
                          title="Generate English title"
                        />
                        {titleFr && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                            onClick={() => handleTranslateTitle("fr", "en")}
                            title="Translate from French"
                          >
                            <Languages className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="subtitle"
                          value={subtitle}
                          onChange={(e) => setSubtitle(e.target.value)}
                          placeholder="Product subtitle (optional)"
                          className="flex-1"
                        />
                        <AIFillButton
                          onClick={handleAIFillSubtitle}
                          disabled={!id}
                          title="Generate subtitle"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Short product subtitle or tagline
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descriptionEn">Description</Label>
                      <div className="relative">
                        <Textarea
                          id="descriptionEn"
                          value={descriptionEn}
                          onChange={(e) => setDescriptionEn(e.target.value)}
                          placeholder="Product description in English"
                          rows={6}
                          className="pr-10"
                        />
                        <div className="absolute right-2 top-2 flex gap-1">
                          <AIFillButton
                            onClick={() => handleAIFillDescription("en")}
                            disabled={!id}
                            title="Generate English description"
                          />
                          {descriptionFr && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                              onClick={() =>
                                handleTranslateDescription("fr", "en")
                              }
                              title="Translate from French"
                            >
                              <Languages className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fr" className="space-y-4">
                <Card className="border-2 border-border shadow-md">
                  <CardHeader className="border-b-2 border-border bg-muted/30">
                    <CardTitle>Contenu Français</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="titleFr">Titre</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="titleFr"
                          value={titleFr}
                          onChange={(e) => setTitleFr(e.target.value)}
                          placeholder="Titre du produit en français"
                          className="flex-1"
                        />
                        <AIFillButton
                          onClick={() => handleAIFillTitle("fr")}
                          disabled={!id}
                          title="Générer le titre en français"
                        />
                        {titleEn && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                            onClick={() => handleTranslateTitle("en", "fr")}
                            title="Traduire de l'anglais"
                          >
                            <Languages className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descriptionFr">Description</Label>
                      <div className="relative">
                        <Textarea
                          id="descriptionFr"
                          value={descriptionFr}
                          onChange={(e) => setDescriptionFr(e.target.value)}
                          placeholder="Description du produit en français"
                          rows={6}
                          className="pr-10"
                        />
                        <div className="absolute right-2 top-2 flex gap-1">
                          <AIFillButton
                            onClick={() => handleAIFillDescription("fr")}
                            disabled={!id}
                            title="Générer la description en français"
                          />
                          {descriptionEn && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                              onClick={() =>
                                handleTranslateDescription("en", "fr")
                              }
                              title="Traduire de l'anglais"
                            >
                              <Languages className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="border-2 border-border shadow-md">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageManager images={images} onImagesChange={setImages} />
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-md">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierProductId">Supplier Product ID (PID)</Label>
                  <Input
                    id="supplierProductId"
                    value={supplierProductId}
                    onChange={(e) => setSupplierProductId(e.target.value)}
                    placeholder="Supplier's product identifier"
                  />
                  <p className="text-xs text-muted-foreground">
                    Product ID from supplier system
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierVariantId">Supplier Variant ID (VID)</Label>
                  <Input
                    id="supplierVariantId"
                    value={supplierVariantId}
                    onChange={(e) => setSupplierVariantId(e.target.value)}
                    placeholder="Supplier's variant identifier"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variant ID from supplier system
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketplaceUrl">Marketplace URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="marketplaceUrl"
                      value={marketplaceUrl}
                      onChange={(e) => setMarketplaceUrl(e.target.value)}
                      placeholder="https://www.supplier.com/product/123"
                      type="url"
                      className="flex-1"
                    />
                    {marketplaceUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          window.open(marketplaceUrl, "_blank", "noopener,noreferrer");
                        }}
                        title="Open marketplace URL in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL to product on supplier's marketplace site
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-md">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={JSON.stringify(specifications, null, 2)}
                  onChange={(e) => {
                    try {
                      setSpecifications(JSON.parse(e.target.value));
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder='{"key": "value"}'
                  rows={8}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <PriceCalculator
              cost={parseFloat(cost) || 0}
              margin={margin}
              onCostChange={(value) => setCost(value.toString())}
              onMarginChange={setMargin}
              onSellingPriceChange={(value) =>
                setSellingPrice(value.toString())
              }
            />

            <Card className="border-2 border-primary/50 shadow-lg">
              <CardHeader className="border-b-2 border-primary/50 bg-primary/5">
                <CardTitle className="text-primary">Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">
                    Selling Price (USD) *
                  </Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for publishing to Medusa. All prices are in USD.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cadExchangeRate">
                    CAD Exchange Rate
                  </Label>
                  <Input
                    id="cadExchangeRate"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={cadExchangeRate}
                    onChange={(e) => setCadExchangeRate(e.target.value)}
                    placeholder="1.35"
                  />
                  <p className="text-xs text-muted-foreground">
                    USD to CAD exchange rate (e.g., 1.35 means $1 USD = $1.35 CAD)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cadSellingPrice">
                    Selling Price (CAD)
                  </Label>
                  <Input
                    id="cadSellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cadSellingPrice}
                    placeholder="0.00"
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Automatically calculated from USD price and exchange rate
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Product SKU (e.g., PROD-001)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Stock Keeping Unit (optional)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-md">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="handle">Handle (Slug)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="handle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="product-url-slug"
                      className="flex-1"
                    />
                    <AIFillButton
                      onClick={handleAIFillHandle}
                      disabled={!titleEn && !titleFr}
                      title="Generate handle from title"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL-friendly identifier (e.g.,
                    &quot;ultrasonic-diffuser&quot;). If left empty, will be
                    generated from title.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Product Type</Label>
                  <div className="flex items-center gap-2">
                    <MedusaEntitySelector
                      entityType="type"
                      value={typeId}
                      onValueChange={setTypeId}
                      placeholder="Select product type from Medusa"
                    />
                    <AIFillButton
                      onClick={handleAIFillMaterialType}
                      disabled={!id}
                      title="Generate type and material"
                    />
                  </div>
                  {!typeId && (
                    <Input
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      placeholder="Or enter custom type (e.g., Electronics, Home)"
                      className="mt-2"
                    />
                  )}
                </div>

                <MedusaEntitySelector
                  entityType="collection"
                  value={collectionId}
                  onValueChange={setCollectionId}
                  label="Collection"
                  placeholder="Select collection from Medusa"
                />

                <div className="space-y-2">
                  <Label>Categories</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select categories from synced Medusa categories
                  </p>
                  <MedusaCategoryMultiSelect
                    value={categoryIds}
                    onValueChange={setCategoryIds}
                    placeholder="Select categories..."
                  />
                </div>

                <div className="space-y-2">
                  <MedusaMultiSelect
                    entityType="sales_channel"
                    value={salesChannelIds}
                    onValueChange={setSalesChannelIds}
                    label="Sales Channels"
                    placeholder="Select sales channels..."
                  />
                </div>

                <div className="space-y-2">
                  <MedusaMultiSelect
                    entityType="stock_location"
                    value={stockLocationIds}
                    onValueChange={setStockLocationIds}
                    label="Stock Locations"
                    placeholder="Select stock locations..."
                  />
                </div>

                {stockLocationIds.length > 0 && (
                  <div className="space-y-2">
                    <LocationInventoryManager
                      stockLocationIds={stockLocationIds}
                      locationInventory={locationInventory}
                      onLocationInventoryChange={setLocationInventory}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                      className="flex-1"
                    />
                    <AIFillButton
                      onClick={handleAIFillTags}
                      disabled={!id}
                      title="Generate tags from product"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of tags
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-md">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle>Shipping & Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (grams)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      min="0"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="length">Length (mm)</Label>
                    <Input
                      id="length"
                      type="number"
                      step="0.01"
                      min="0"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Height (mm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.01"
                      min="0"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="width">Width (mm)</Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.01"
                      min="0"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-md">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle>Customs & Classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="originCountry">Origin Country</Label>
                  <Input
                    id="originCountry"
                    value={originCountry}
                    onChange={(e) => setOriginCountry(e.target.value)}
                    placeholder="Country code (e.g., CA, US, CN)"
                  />
                  <p className="text-xs text-muted-foreground">
                    ISO country code (e.g., CA for Canada)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hsCode">HS Code</Label>
                  <Input
                    id="hsCode"
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    placeholder="Harmonized System code"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for customs classification
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="midCode">MID Code</Label>
                  <Input
                    id="midCode"
                    value={midCode}
                    onChange={(e) => setMidCode(e.target.value)}
                    placeholder="Manufacturer Identification code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Product material (e.g., Plastic, Metal)"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border shadow-md">
              <CardHeader className="border-b-2 border-border bg-muted/30">
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <AIFillButton
                      onClick={handleAIFillSEO}
                      disabled={!id}
                      title="Generate SEO metadata"
                    />
                  </div>
                  <Input
                    id="metaTitle"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="SEO meta title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="SEO meta description"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as
                        | "draft"
                        | "enriched"
                        | "ready"
                        | "published"
                        | "archived"
                      )
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="draft">Draft</option>
                    <option value="enriched">Enriched</option>
                    <option value="ready">Ready</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

