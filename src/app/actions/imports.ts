"use server";

/**
 * Import Server Actions
 * Handles file parsing, column mapping, and saving draft products
 */
import { db } from "@/db";
import { imports, productsDraft, suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { downloadAndUploadImages } from "@/lib/s3/upload";
import type { ParsedRow } from "@/lib/imports/parse-file";
import { batchMapCJProductsToDrafts, isCJProductImported } from "@/lib/cj/mapper";
import type { CJProduct } from "@/types/cj-schemas";

interface CreateImportParams {
  sourceType: "csv" | "xlsx" | "url" | "cj";
  sourceUrl?: string;
  filename?: string;
  mappedColumns?: Record<string, string>;
}

interface SaveDraftsParams {
  importId: string;
  rows: ParsedRow[];
  mappedColumns: Record<string, string>;
  supplierId?: string;
}

/**
 * Create import record
 */
export async function createImport(params: CreateImportParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    console.log("createImport called", params);

    const [importRecord] = await db
      .insert(imports)
      .values({
        sourceType: params.sourceType,
        sourceUrl: params.sourceUrl,
        filename: params.filename,
        mappedColumns: params.mappedColumns,
        status: "pending",
      })
      .returning();

    console.log("Import record created:", importRecord.id);
    return importRecord;
  } catch (error) {
    console.error("createImport error:", error);
    throw error;
  }
}

/**
 * Normalize row data based on column mapping
 * Handles all product option parameters
 */
function normalizeRow(
  row: ParsedRow,
  mappedColumns: Record<string, string>
): {
  titleEn?: string;
  titleFr?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  cost?: string;
  sellingPrice?: string;
  margin?: string;
  metaTitle?: string;
  metaDescription?: string;
  handle?: string;
  sku?: string;
  currency?: string;
  status?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  material?: string;
  type?: string;
  collectionId?: string;
  categoryIds?: string[];
  tags?: string[];
  originCountry?: string;
  hsCode?: string;
  midCode?: string;
  images?: string[];
  variantOptions?: Record<string, unknown>;
  specifications?: Record<string, unknown>;
} {
  const normalized: {
    titleEn?: string;
    titleFr?: string;
    descriptionEn?: string;
    descriptionFr?: string;
    cost?: string;
    sellingPrice?: string;
    margin?: string;
    metaTitle?: string;
    metaDescription?: string;
    handle?: string;
    sku?: string;
    currency?: string;
    status?: string;
    weight?: string;
    length?: string;
    width?: string;
    height?: string;
    material?: string;
    type?: string;
    collectionId?: string;
    categoryIds?: string[];
    tags?: string[];
    originCountry?: string;
    hsCode?: string;
    midCode?: string;
    images?: string[];
    variantOptions?: Record<string, unknown>;
    specifications?: Record<string, unknown>;
  } = {};

  Object.entries(mappedColumns).forEach(([sourceCol, targetField]) => {
    const value = row[sourceCol];
    if (value === undefined || value === null || value === "") return;

    switch (targetField) {
      // Basic Information
      case "title_en":
        normalized.titleEn = String(value);
        break;
      case "title_fr":
        normalized.titleFr = String(value);
        break;
      case "description_en":
        normalized.descriptionEn = String(value);
        break;
      case "description_fr":
        normalized.descriptionFr = String(value);
        break;

      // Pricing
      case "cost":
        normalized.cost = String(value);
        break;
      case "selling_price":
        normalized.sellingPrice = String(value);
        break;
      case "margin":
        normalized.margin = String(value);
        break;

      // SEO & Metadata
      case "meta_title":
        normalized.metaTitle = String(value);
        break;
      case "meta_description":
        normalized.metaDescription = String(value);
        break;
      case "handle":
        normalized.handle = String(value);
        break;

      // Physical Attributes
      case "weight":
        normalized.weight = String(value);
        break;
      case "length":
        normalized.length = String(value);
        break;
      case "width":
        normalized.width = String(value);
        break;
      case "height":
        normalized.height = String(value);
        break;
      case "material":
        normalized.material = String(value);
        break;

      // Inventory & Identification
      case "sku":
        normalized.sku = String(value);
        break;
      case "currency":
        normalized.currency = String(value);
        break;
      case "status":
        normalized.status = String(value);
        break;

      // Product Organization
      case "type":
        normalized.type = String(value);
        break;
      case "collection_id":
        normalized.collectionId = String(value);
        break;
      case "category_ids":
        // Handle comma-separated category IDs
        const categoryIdsValue = String(value);
        normalized.categoryIds = categoryIdsValue
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        break;
      case "tags":
        // Handle comma-separated tags
        const tagsValue = String(value);
        normalized.tags = tagsValue
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
        break;

      // Shipping & Customs
      case "origin_country":
        normalized.originCountry = String(value);
        break;
      case "hs_code":
        normalized.hsCode = String(value);
        break;
      case "mid_code":
        normalized.midCode = String(value);
        break;

      // Media
      case "images":
        // Handle comma-separated URLs or single URL
        const imageValue = String(value);
        normalized.images = imageValue.includes(",")
          ? imageValue.split(",").map((url) => url.trim())
          : [imageValue.trim()];
        break;

      // Variants & Options
      case "variant_size":
      case "variant_color":
      case "variant_material":
      case "variant_style":
        // Build variant options object
        if (!normalized.variantOptions) {
          normalized.variantOptions = {};
        }
        const variantKey = targetField.replace("variant_", "");
        normalized.variantOptions[variantKey] = String(value);
        break;
      case "variant_options":
        // Parse variant options JSON
        try {
          normalized.variantOptions = JSON.parse(String(value));
        } catch {
          normalized.variantOptions = { [sourceCol]: String(value) };
        }
        break;

      // Advanced
      case "specifications":
        try {
          // Try parsing as JSON, otherwise create object
          normalized.specifications = JSON.parse(String(value));
        } catch {
          normalized.specifications = { [sourceCol]: String(value) };
        }
        break;
    }
  });

  return normalized;
}

/**
 * Save draft products from imported rows
 */
export async function saveDraftsFromImport(params: SaveDraftsParams) {
  const {
    importId,
    rows,
    mappedColumns,
    supplierId: providedSupplierId,
  } = params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    console.log("saveDraftsFromImport called", {
      importId,
      rowsCount: rows.length,
      providedSupplierId,
    });

    // Get or create default supplier if none provided
    let supplierId = providedSupplierId;
    if (!supplierId) {
      // Check if a default supplier exists
      const existingSuppliers = await db.select().from(suppliers).limit(1);

      if (existingSuppliers.length > 0) {
        supplierId = existingSuppliers[0].id;
        console.log("Using existing supplier:", supplierId);
      } else {
        // Create a default supplier
        const [defaultSupplier] = await db
          .insert(suppliers)
          .values({
            name: "Default Supplier",
            notes:
              "Automatically created for imports without supplier selection",
          })
          .returning();
        supplierId = defaultSupplier.id;
        console.log("Created default supplier:", supplierId);
      }
    }

    // Update import status to processing
    await db
      .update(imports)
      .set({ status: "processing", totalRows: rows.length })
      .where(eq(imports.id, importId));

    let processedRows = 0;
    let failedRows = 0;
    const errors: string[] = [];

    console.log("Processing rows...", { totalRows: rows.length });

    // Process each row
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      try {
        console.log(`Processing row ${rowIndex + 1}/${rows.length}:`, row);
        const normalized = normalizeRow(row, mappedColumns);
        console.log(`Normalized row ${rowIndex + 1}:`, normalized);

        // Validate required fields
        if (!normalized.titleEn || !normalized.cost) {
          failedRows++;
          const errorMsg = `Row ${rowIndex + 1}: Missing required fields - titleEn: ${!!normalized.titleEn}, cost: ${!!normalized.cost}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        // Parse cost as number (strip currency symbols and whitespace)
        const costString = String(normalized.cost).replace(/[$€£¥,\s]/g, '').trim();
        const cost = parseFloat(costString);
        if (isNaN(cost) || cost <= 0) {
          failedRows++;
          const errorMsg = `Row ${rowIndex + 1}: Invalid cost value "${normalized.cost}" (parsed as "${costString}")`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        // Download and upload images to R2 drafts folder if provided
        let uploadedImages: string[] = [];
        if (normalized.images && normalized.images.length > 0) {
          try {
            console.log(
              `Downloading and uploading ${normalized.images.length} image(s) for product: ${normalized.titleEn}`
            );
            uploadedImages = await downloadAndUploadImages(normalized.images);
            console.log(
              `Successfully uploaded ${uploadedImages.length} image(s) to R2 drafts folder`
            );
          } catch (error) {
            console.error("Error processing images:", error);
            // Continue with import even if image upload fails
            // Use original URLs as fallback
            uploadedImages = normalized.images;
            errors.push(
              `Row ${processedRows + failedRows + 1}: Some images failed to upload, using original URLs`
            );
          }
        }

        // Build specifications object with all additional fields
        const specs: Record<string, unknown> = {
          ...(normalized.specifications || {}),
          // Add Medusa fields to specifications
          ...(normalized.handle && { handle: normalized.handle }),
          ...(normalized.sku && { sku: normalized.sku }),
          ...(normalized.currency && { currency_code: normalized.currency }),
          ...(normalized.weight && { weight: parseFloat(normalized.weight) || normalized.weight }),
          ...(normalized.length && { length: parseFloat(normalized.length) || normalized.length }),
          ...(normalized.width && { width: parseFloat(normalized.width) || normalized.width }),
          ...(normalized.height && { height: parseFloat(normalized.height) || normalized.height }),
          ...(normalized.material && { material: normalized.material }),
          ...(normalized.type && { type: normalized.type }),
          ...(normalized.collectionId && { collection_id: normalized.collectionId }),
          ...(normalized.categoryIds && normalized.categoryIds.length > 0 && {
            category_ids: normalized.categoryIds,
          }),
          ...(normalized.tags && normalized.tags.length > 0 && { tags: normalized.tags }),
          ...(normalized.originCountry && { origin_country: normalized.originCountry }),
          ...(normalized.hsCode && { hs_code: normalized.hsCode }),
          ...(normalized.midCode && { mid_code: normalized.midCode }),
          ...(normalized.variantOptions && { variant_options: normalized.variantOptions }),
        };

        // Create draft product
        const draftData = {
          supplierId,
          titleEn: normalized.titleEn,
          titleFr: normalized.titleFr,
          descriptionEn: normalized.descriptionEn,
          descriptionFr: normalized.descriptionFr,
          cost: cost.toFixed(2),
          ...(normalized.sellingPrice && {
            sellingPrice: parseFloat(normalized.sellingPrice).toFixed(2),
          }),
          ...(normalized.margin && {
            margin: parseFloat(normalized.margin).toFixed(2),
          }),
          ...(normalized.metaTitle && { metaTitle: normalized.metaTitle }),
          ...(normalized.metaDescription && { metaDescription: normalized.metaDescription }),
          images: uploadedImages.length > 0 ? uploadedImages : normalized.images,
          specifications: Object.keys(specs).length > 0 ? specs : undefined,
          status: (normalized.status as "draft" | "enriched" | "ready" | "published" | "archived") || ("draft" as const),
        };

        console.log(`Inserting draft ${rowIndex + 1}:`, {
          titleEn: draftData.titleEn,
          cost: draftData.cost,
          supplierId: draftData.supplierId,
        });
        
        const result = await db.insert(productsDraft).values(draftData).returning();
        console.log(`Successfully inserted draft ${rowIndex + 1}:`, result[0]?.id);

        processedRows++;
      } catch (error) {
        failedRows++;
        const errorDetails = error instanceof Error 
          ? { message: error.message, stack: error.stack, name: error.name }
          : { error: String(error) };
        const errorMsg = `Row ${rowIndex + 1}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(`Row ${rowIndex + 1} processing error:`, errorMsg, errorDetails);
        console.error("Full error object:", error);
        errors.push(errorMsg);
      }
    }

    console.log("Processing complete", { processedRows, failedRows });

    // Update import record with results
    await db
      .update(imports)
      .set({
        status: processedRows > 0 ? "completed" : "failed",
        processedRows,
        failedRows,
        errors: errors.length > 0 ? errors : null,
      })
      .where(eq(imports.id, importId));

    revalidatePath("/imports");
    revalidatePath("/drafts");

    console.log("Import completed successfully", { processedRows, failedRows });

    return {
      success: true,
      processedRows,
      failedRows,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("saveDraftsFromImport error:", error);
    await db
      .update(imports)
      .set({
        status: "failed",
        failedRows: rows.length,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      })
      .where(eq(imports.id, importId));

    throw error;
  }
}

/**
 * Import products from CJ Dropshipping
 * @param cjProducts - Array of CJ products to import
 * @returns Import result
 */
export async function importCJProducts(
  cjProducts: CJProduct[]
): Promise<{
  success: boolean;
  processedProducts: number;
  failedProducts: number;
  errors?: string[];
  importId?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    if (!cjProducts || cjProducts.length === 0) {
      return {
        success: false,
        processedProducts: 0,
        failedProducts: 0,
        errors: ["No products to import"],
      };
    }

    console.log(`Starting CJ import for ${cjProducts.length} products`);

    // Create import record
    const [importRecord] = await db
      .insert(imports)
      .values({
        sourceType: "cj",
        sourceUrl: undefined,
        filename: undefined,
        mappedColumns: {}, // No column mapping needed for CJ
        status: "pending",
        totalRows: cjProducts.length,
      })
      .returning();

    console.log("Import record created:", importRecord.id);

    // Update status to processing
    await db
      .update(imports)
      .set({ status: "processing" })
      .where(eq(imports.id, importRecord.id));

    // Get or create CJ Dropshipping supplier
    let cjSupplier = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.name, "CJ Dropshipping"))
      .limit(1);

    if (cjSupplier.length === 0) {
      console.log("Creating CJ Dropshipping supplier...");
      const [newSupplier] = await db
        .insert(suppliers)
        .values({
          name: "CJ Dropshipping",
          website: "https://cjdropshipping.com",
          notes: "Automatically created for CJ product imports",
        })
        .returning();
      cjSupplier = [newSupplier];
    }

    const supplierId = cjSupplier[0].id;
    console.log("Using CJ supplier:", supplierId);

    // Check for duplicate imports (products already in drafts)
    const existingDrafts = await db
      .select({
        id: productsDraft.id,
        specifications: productsDraft.specifications,
      })
      .from(productsDraft)
      .where(eq(productsDraft.supplierId, supplierId));

    const productsToImport = cjProducts.filter(
      (product) => !isCJProductImported(product.pid, existingDrafts)
    );

    const skippedCount = cjProducts.length - productsToImport.length;
    if (skippedCount > 0) {
      console.log(
        `Skipping ${skippedCount} products (already imported)`
      );
    }

    // Map CJ products to drafts
    console.log(`Mapping ${productsToImport.length} products to drafts...`);
    const { drafts, errors } = await batchMapCJProductsToDrafts(
      productsToImport,
      supplierId
    );

    console.log(
      `Mapped ${drafts.length} products, ${errors.length} errors`
    );

    // Insert drafts into database
    let processedCount = 0;
    const insertErrors: string[] = [...errors.map((e) => e.error)];

    for (const draft of drafts) {
      try {
        await db.insert(productsDraft).values(draft);
        processedCount++;
      } catch (error) {
        console.error("Error inserting draft:", error);
        insertErrors.push(
          error instanceof Error ? error.message : "Unknown insertion error"
        );
      }
    }

    console.log(`Inserted ${processedCount} draft products`);

    const failedCount = cjProducts.length - processedCount - skippedCount;

    // Update import record
    await db
      .update(imports)
      .set({
        status: processedCount > 0 ? "completed" : "failed",
        processedRows: processedCount,
        failedRows: failedCount,
        errors: insertErrors.length > 0 ? insertErrors : null,
      })
      .where(eq(imports.id, importRecord.id));

    revalidatePath("/imports");
    revalidatePath("/drafts");

    console.log("CJ import completed successfully");

    return {
      success: true,
      processedProducts: processedCount,
      failedProducts: failedCount,
      errors: insertErrors.length > 0 ? insertErrors : undefined,
      importId: importRecord.id,
    };
  } catch (error) {
    console.error("CJ import error:", error);
    return {
      success: false,
      processedProducts: 0,
      failedProducts: cjProducts.length,
      errors: [error instanceof Error ? error.message : "Import failed"],
    };
  }
}
