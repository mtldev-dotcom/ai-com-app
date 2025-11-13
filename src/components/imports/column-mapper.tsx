"use client";

/**
 * Column Mapper Component
 * Maps source columns to target product fields with suggestions
 * Enhanced with all product option parameters and improved UI/UX
 */
import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Using native details element instead of Collapsible to avoid dependency
import { Badge } from "@/components/ui/badge";

interface ColumnMapperProps {
  sourceColumns: string[];
  mappedColumns: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

// Field categories for better organization
interface FieldCategory {
  label: string;
  fields: Array<{
    value: string;
    label: string;
    required: boolean;
    description?: string;
  }>;
}

const fieldCategories: FieldCategory[] = [
  {
    label: "Basic Information",
    fields: [
      {
        value: "title_en",
        label: "Title (English)",
        required: true,
        description: "Product name in English",
      },
      {
        value: "title_fr",
        label: "Title (French)",
        required: false,
        description: "Product name in French",
      },
      {
        value: "description_en",
        label: "Description (English)",
        required: false,
        description: "Product description in English",
      },
      {
        value: "description_fr",
        label: "Description (French)",
        required: false,
        description: "Product description in French",
      },
    ],
  },
  {
    label: "Pricing",
    fields: [
      {
        value: "cost",
        label: "Cost (USD)",
        required: true,
        description: "Supplier cost price",
      },
      {
        value: "selling_price",
        label: "Selling Price (USD)",
        required: false,
        description: "Retail selling price",
      },
      {
        value: "margin",
        label: "Margin (%)",
        required: false,
        description: "Profit margin percentage",
      },
    ],
  },
  {
    label: "SEO & Metadata",
    fields: [
      {
        value: "meta_title",
        label: "Meta Title",
        required: false,
        description: "SEO meta title",
      },
      {
        value: "meta_description",
        label: "Meta Description",
        required: false,
        description: "SEO meta description",
      },
      {
        value: "handle",
        label: "Handle/Slug",
        required: false,
        description: "URL-friendly product identifier",
      },
    ],
  },
  {
    label: "Physical Attributes",
    fields: [
      {
        value: "weight",
        label: "Weight",
        required: false,
        description: "Product weight (kg or lbs)",
      },
      {
        value: "length",
        label: "Length",
        required: false,
        description: "Product length (cm or inches)",
      },
      {
        value: "width",
        label: "Width",
        required: false,
        description: "Product width (cm or inches)",
      },
      {
        value: "height",
        label: "Height",
        required: false,
        description: "Product height (cm or inches)",
      },
      {
        value: "material",
        label: "Material",
        required: false,
        description: "Product material composition",
      },
    ],
  },
  {
    label: "Inventory & Identification",
    fields: [
      {
        value: "sku",
        label: "SKU",
        required: false,
        description: "Stock Keeping Unit identifier",
      },
      {
        value: "currency",
        label: "Currency",
        required: false,
        description: "Currency code (e.g., CAD, USD)",
      },
      {
        value: "status",
        label: "Status",
        required: false,
        description: "Product status (draft, ready, published, etc.)",
      },
    ],
  },
  {
    label: "Product Organization",
    fields: [
      {
        value: "type",
        label: "Product Type",
        required: false,
        description: "Product type/category",
      },
      {
        value: "collection_id",
        label: "Collection ID",
        required: false,
        description: "Medusa collection identifier",
      },
      {
        value: "category_ids",
        label: "Category IDs",
        required: false,
        description: "Comma-separated category identifiers",
      },
      {
        value: "tags",
        label: "Tags",
        required: false,
        description: "Comma-separated product tags",
      },
    ],
  },
  {
    label: "Shipping & Customs",
    fields: [
      {
        value: "origin_country",
        label: "Origin Country",
        required: false,
        description: "Country of origin (ISO code)",
      },
      {
        value: "hs_code",
        label: "HS Code",
        required: false,
        description: "Harmonized System customs code",
      },
      {
        value: "mid_code",
        label: "MID Code",
        required: false,
        description: "Manufacturer ID code",
      },
    ],
  },
  {
    label: "Media",
    fields: [
      {
        value: "images",
        label: "Images (URLs)",
        required: false,
        description: "Comma-separated image URLs",
      },
    ],
  },
  {
    label: "Variants & Options",
    fields: [
      {
        value: "variant_size",
        label: "Variant: Size",
        required: false,
        description: "Product size option (e.g., S, M, L, XL)",
      },
      {
        value: "variant_color",
        label: "Variant: Color",
        required: false,
        description: "Product color option",
      },
      {
        value: "variant_material",
        label: "Variant: Material",
        required: false,
        description: "Material variant option",
      },
      {
        value: "variant_style",
        label: "Variant: Style",
        required: false,
        description: "Style variant option",
      },
      {
        value: "variant_options",
        label: "Variant Options (JSON)",
        required: false,
        description: "All variant options as JSON object",
      },
    ],
  },
  {
    label: "Advanced",
    fields: [
      {
        value: "specifications",
        label: "Specifications (JSON)",
        required: false,
        description: "Additional specifications as JSON",
      },
    ],
  },
  {
    label: "Supplier Fields",
    fields: [
      {
        value: "supplier_pid",
        label: "Supplier Product ID (pid)",
        required: false,
        description: "Supplier's product identifier",
      },
      {
        value: "supplier_vid",
        label: "Supplier Variant ID (vid)",
        required: false,
        description: "Supplier's variant identifier",
      },
      {
        value: "supplier_subtitle",
        label: "Subtitle",
        required: false,
        description: "Product subtitle from supplier",
      },
      {
        value: "marketplace_url",
        label: "Marketplace URL",
        required: false,
        description: "URL to product on supplier's marketplace site",
      },
      {
        value: "supplier_option_map",
        label: "Option Map (option_map_json)",
        required: false,
        description: "Variant option mapping as JSON",
      },
      {
        value: "supplier_metadata",
        label: "Metadata (metadata_json)",
        required: false,
        description: "Product metadata as JSON",
      },
      {
        value: "supplier_option_axes",
        label: "Option Axes",
        required: false,
        description: "Variant option axes",
      },
      {
        value: "supplier_variant_title",
        label: "Variant Title",
        required: false,
        description: "Variant-specific title",
      },
      {
        value: "supplier_thumbnail",
        label: "Thumbnail",
        required: false,
        description: "Product thumbnail image URL",
      },
      {
        value: "supplier_images_json",
        label: "Images JSON (images_json)",
        required: false,
        description: "Product images as JSON object",
      },
    ],
  },
];

// Flatten all fields for easier lookup
const allTargetFields = fieldCategories.flatMap((cat) => cat.fields);

// Smart column matching suggestions
function suggestMapping(sourceColumn: string): string | null {
  const lower = sourceColumn.toLowerCase();

  // Subtitle mappings (from suppliers) - check BEFORE title (since subtitle contains "title")
  if (lower.includes("subtitle")) {
    return "supplier_subtitle"; // Map subtitle to subtitle field
  }

  // Title mappings (including supplier format)
  if (
    lower.includes("title") ||
    lower.includes("name") ||
    lower.includes("product")
  ) {
    if (lower.includes("fr") || lower.includes("french")) return "title_fr";
    if (lower.includes("variant_title")) return "title_en"; // Supplier variant_title
    return "title_en";
  }

  // Description mappings
  if (
    lower.includes("desc") ||
    lower.includes("detail") ||
    lower.includes("about")
  ) {
    if (lower.includes("fr") || lower.includes("french"))
      return "description_fr";
    return "description_en";
  }

  // Price/Cost mappings (including supplier amount_minor)
  // Cost is always stored in USD in the database
  if (
    lower.includes("cost") ||
    lower.includes("supplier price") ||
    lower.includes("amount_minor") ||
    (lower.includes("amount") && lower.includes("minor"))
  ) {
    return "cost";
  }
  if (lower.includes("selling") || lower.includes("retail") || lower.includes("price")) {
    return "selling_price";
  }
  if (lower.includes("margin") || lower.includes("profit")) {
    return "margin";
  }

  // SEO mappings
  if (lower.includes("meta title") || lower.includes("seo title")) {
    return "meta_title";
  }
  if (lower.includes("meta desc") || lower.includes("seo desc")) {
    return "meta_description";
  }

  // Supplier URLs - check BEFORE handle/slug to avoid false matches
  if (
    lower.includes("marketplace_url") ||
    lower.includes("marketplace url") ||
    (lower.includes("marketplace") && lower.includes("url")) ||
    (lower.includes("supplier") && lower.includes("url")) ||
    (lower.includes("product") && lower.includes("url") && !lower.includes("image"))
  ) {
    return "marketplace_url";
  }

  if (lower.includes("handle") || lower.includes("slug") || lower.includes("url")) {
    return "handle";
  }

  // Physical attributes (including supplier format with units)
  if (lower.includes("weight") || lower.includes("weight_grams")) {
    return "weight";
  }
  if (
    lower.includes("length") ||
    lower.includes("long") ||
    lower.includes("length_mm")
  ) {
    return "length";
  }
  if (
    lower.includes("width") ||
    lower.includes("wide") ||
    lower.includes("width_mm")
  ) {
    return "width";
  }
  if (
    lower.includes("height") ||
    lower.includes("tall") ||
    lower.includes("high") ||
    lower.includes("height_mm")
  ) {
    return "height";
  }
  if (lower.includes("material") || lower.includes("fabric")) return "material";

  // Inventory (including supplier format)
  if (lower.includes("sku") || lower === "sku") return "sku";
  if (
    lower.includes("currency") ||
    lower.includes("curr") ||
    lower.includes("currency_code")
  ) {
    return "currency";
  }
  if (lower.includes("status") || lower.includes("state")) return "status";

  // Organization
  if (lower.includes("type") || lower.includes("category")) return "type";
  if (lower.includes("collection")) return "collection_id";
  if (lower.includes("category id") || lower.includes("category_ids")) {
    return "category_ids";
  }
  if (lower.includes("tag")) return "tags";

  // Shipping (including supplier format)
  if (
    lower.includes("origin") ||
    lower.includes("country") ||
    lower.includes("origin_country")
  ) {
    return "origin_country";
  }
  if (lower.includes("hs code") || lower.includes("hs_code")) return "hs_code";
  if (lower.includes("mid code") || lower.includes("mid_code")) return "mid_code";

  // Images - handle different image fields
  if (lower.includes("thumbnail")) {
    return "supplier_thumbnail";
  }
  if (lower.includes("images_json") || (lower.includes("images") && lower.includes("json"))) {
    return "supplier_images_json";
  }
  if (
    lower.includes("image") ||
    lower.includes("photo") ||
    lower.includes("picture") ||
    lower.includes("img")
  ) {
    return "images";
  }

  // Variants
  if (lower.includes("size") && !lower.includes("specification")) {
    return "variant_size";
  }
  if (lower.includes("color") || lower.includes("colour")) {
    return "variant_color";
  }
  if (lower.includes("variant material") || lower.includes("material variant")) {
    return "variant_material";
  }
  if (lower.includes("style") || lower.includes("variant style")) {
    return "variant_style";
  }
  if (lower.includes("variant") && lower.includes("option")) {
    return "variant_options";
  }

  // Specs
  if (
    lower.includes("spec") ||
    lower.includes("attribute") ||
    lower.includes("property") ||
    lower.includes("feature")
  ) {
    return "specifications";
  }

  // Supplier specific fields
  if (lower === "pid" || lower.includes("pid")) return "supplier_pid";
  if (lower === "vid" || lower.includes("vid")) return "supplier_vid";
  if (lower.includes("option_map_json") || lower.includes("option_map")) {
    return "supplier_option_map";
  }
  if (lower.includes("metadata_json") || (lower.includes("metadata") && lower.includes("json"))) {
    return "supplier_metadata";
  }
  if (lower.includes("option_axes")) return "supplier_option_axes";
  if (lower.includes("variant_title")) return "supplier_variant_title";

  return null;
}

export function ColumnMapper({
  sourceColumns,
  mappedColumns,
  onMappingChange,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>(mappedColumns);

  // Auto-suggest mappings on mount or when source columns change
  useEffect(() => {
    const suggestions: Record<string, string> = {};
    const usedFields = new Set<string>();

    sourceColumns.forEach((col) => {
      const suggested = suggestMapping(col);
      if (suggested && !usedFields.has(suggested)) {
        suggestions[col] = suggested;
        usedFields.add(suggested);
      }
    });
    setMapping((prev) => ({ ...prev, ...suggestions }));
  }, [sourceColumns]);

  useEffect(() => {
    onMappingChange(mapping);
  }, [mapping, onMappingChange]);

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setMapping((prev) => ({
      ...prev,
      [sourceColumn]: targetField || "",
    }));
  };

  // Check if required fields are mapped
  const requiredFields = allTargetFields.filter((f) => f.required);
  const mappedRequiredFields = requiredFields.filter((field) =>
    Object.values(mapping).includes(field.value)
  );
  const allRequiredMapped =
    mappedRequiredFields.length === requiredFields.length;

  // Get field by value
  const getFieldByValue = (value: string) => {
    return allTargetFields.find((f) => f.value === value);
  };

  // Get count of mapped fields per category
  const getCategoryMappingCount = (category: FieldCategory) => {
    const mappedFields = category.fields.filter((field) =>
      Object.values(mapping).includes(field.value)
    );
    return `${mappedFields.length}/${category.fields.length}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Map Columns</h3>
          <p className="text-sm text-muted-foreground">
            Map your spreadsheet columns to product fields
          </p>
        </div>
        {allRequiredMapped && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>All required fields mapped</span>
          </div>
        )}
      </div>

      {/* Source Columns Mapping */}
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-medium text-muted-foreground">
          Source Columns ({sourceColumns.length})
        </div>
        {sourceColumns.map((sourceCol) => {
          const currentMapping = mapping[sourceCol] || "";
          const suggested = suggestMapping(sourceCol);
          const mappedField = currentMapping
            ? getFieldByValue(currentMapping)
            : null;

          return (
            <div
              key={sourceCol}
              className="flex flex-col gap-2 rounded-md border bg-background p-3 sm:flex-row sm:items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">{sourceCol}</label>
                  {mappedField && (
                    <Badge variant="secondary" className="text-xs">
                      {mappedField.label}
                    </Badge>
                  )}
                </div>
                {suggested && suggested !== currentMapping && (
                  <p className="text-xs text-muted-foreground">
                    Suggested:{" "}
                    {allTargetFields.find((f) => f.value === suggested)?.label}
                  </p>
                )}
                {mappedField?.description && (
                  <p className="text-xs text-muted-foreground">
                    {mappedField.description}
                  </p>
                )}
              </div>
              <div className="flex-1 sm:max-w-xs">
                <Select
                  value={currentMapping}
                  onValueChange={(value) =>
                    handleMappingChange(sourceCol, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Select field --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {fieldCategories.map((category) => (
                      <div key={category.label}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {category.label}
                        </div>
                        {category.fields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            <div className="flex items-center gap-2">
                              <span>{field.label}</span>
                              {field.required && (
                                <span className="text-destructive">*</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Field Reference Guide */}
      <details className="rounded-lg border bg-muted/50">
        <summary className="flex cursor-pointer items-center justify-between p-3 text-sm font-medium hover:bg-muted">
          <span>View Available Fields Reference</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-2 space-y-2 border-t bg-card p-4">
          {fieldCategories.map((category) => (
            <details key={category.label} className="rounded-md border bg-background">
              <summary className="flex cursor-pointer items-center justify-between p-2 text-sm font-medium hover:bg-muted">
                <div className="flex items-center gap-2">
                  <span>{category.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {getCategoryMappingCount(category)}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-1 space-y-1 border-t pl-4 pt-2">
                {category.fields.map((field) => {
                  const isMapped = Object.values(mapping).includes(
                    field.value
                  );
                  return (
                    <div
                      key={field.value}
                      className={`rounded-md border p-2 text-xs ${isMapped
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20"
                        : "bg-background"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <span className="text-destructive">*</span>
                        )}
                        {isMapped && (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      {field.description && (
                        <p className="mt-1 text-muted-foreground">
                          {field.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </details>

      {!allRequiredMapped && (
        <div className="flex items-center gap-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <AlertCircle className="h-4 w-4" />
          <span>
            Missing required fields:{" "}
            {requiredFields
              .filter((f) => !Object.values(mapping).includes(f.value))
              .map((f) => f.label)
              .join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}
