"use client";

/**
 * Import Step Component
 * Enhanced import step with drag & drop, file preview, and validation
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUploadZone } from "../file-upload-zone";
import { FileText, Search, Loader2, ChevronRight, Plus, Edit2, Trash2, X } from "lucide-react";
import { parseFile } from "@/lib/imports/parse-file";
import { fetchAndParseUrl } from "@/lib/imports/fetch-url";
import type { ParsedRow } from "@/lib/imports/parse-file";

interface ImportStepProps {
  onNext: (columns: string[], rows: ParsedRow[]) => void;
  isLoading?: boolean;
  error?: string | null;
  success?: string | null;
}

interface ManualProduct {
  id: string;
  name: string;
  description?: string;
  price?: string;
}

export function ImportStep({ onNext, isLoading = false, error, success }: ImportStepProps) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Manual product entry state
  const [manualProducts, setManualProducts] = useState<ManualProduct[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ManualProduct | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", price: "" });

  const handleLoadUrl = async () => {
    if (!sheetUrl.trim()) {
      setUrlError("Please enter a sheet URL");
      return;
    }

    setLoadingUrl(true);
    setUrlError(null);

    try {
      const result = await fetchAndParseUrl(sheetUrl);
      if (result.error) {
        setUrlError(result.error);
        setColumns([]);
        setRows([]);
      } else {
        setColumns(result.columns);
        setRows(result.rows);
        setUrlError(null);
      }
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Failed to load sheet");
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setLoadingFile(true);
    setFileError(null);

    try {
      const result = await parseFile(file);
      if (result.error) {
        setFileError(result.error);
        setColumns([]);
        setRows([]);
      } else {
        setColumns(result.columns);
        setRows(result.rows);
        setFileError(null);
      }
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoadingFile(false);
    }
  };

  // Convert manual products to ParsedRow format
  const manualProductsAsRows: ParsedRow[] = manualProducts.map((product) => {
    const row: ParsedRow = { name: product.name };
    if (product.description) row.description = product.description;
    if (product.price) row.price = parseFloat(product.price) || 0;
    return row;
  });

  // Merge CSV rows with manual products
  const allRows = [...rows, ...manualProductsAsRows];
  
  // Ensure columns include all fields from manual products
  const allColumns = Array.from(
    new Set([
      ...columns,
      ...manualProductsAsRows.flatMap((row) => Object.keys(row)),
    ])
  );

  const hasData = (columns.length > 0 && rows.length > 0) || manualProducts.length > 0;
  const totalProducts = rows.length + manualProducts.length;

  // Handle manual product addition
  const handleAddManualProduct = () => {
    if (!formData.name.trim()) return;

    if (editingProduct) {
      // Update existing product
      setManualProducts(
        manualProducts.map((p) =>
          p.id === editingProduct.id
            ? {
                id: p.id,
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                price: formData.price.trim() || undefined,
              }
            : p
        )
      );
      setEditingProduct(null);
    } else {
      // Add new product
      const newProduct: ManualProduct = {
        id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: formData.price.trim() || undefined,
      };
      setManualProducts([...manualProducts, newProduct]);
    }

    // Reset form
    setFormData({ name: "", description: "", price: "" });
    setShowManualForm(false);
  };

  // Handle manual product edit
  const handleEditManualProduct = (product: ManualProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price || "",
    });
    setShowManualForm(true);
  };

  // Handle manual product delete
  const handleDeleteManualProduct = (id: string) => {
    setManualProducts(manualProducts.filter((p) => p.id !== id));
  };

  // Handle continue button
  const handleContinue = () => {
    onNext(allColumns, allRows);
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Product List
        </CardTitle>
        <CardDescription>
          Upload a CSV file, paste a Google Sheets URL, or add products manually
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Google Sheets URL */}
        <div className="space-y-2">
          <Label htmlFor="sheetUrl" className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Google Sheets URL
          </Label>
          <div className="flex gap-2">
            <Input
              id="sheetUrl"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="h-11"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loadingUrl) {
                  handleLoadUrl();
                }
              }}
              disabled={loadingUrl || loadingFile}
            />
            <Button onClick={handleLoadUrl} disabled={loadingUrl || loadingFile} size="lg" className="px-6">
              {loadingUrl ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Load
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Make sure your Google Sheet is set to "Anyone with the link can view"
          </p>
          {urlError && (
            <p className="text-xs text-destructive mt-1">{urlError}</p>
          )}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-4 text-muted-foreground font-medium">
              Or
            </span>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="text-base font-semibold flex items-center gap-2">
            Upload CSV File
          </Label>
          <FileUploadZone
            onFileSelect={handleFileSelect}
            isLoading={loadingFile}
            selectedFile={selectedFile}
            columns={columns}
            rows={rows}
            error={fileError}
          />
        </div>

        {/* Divider */}
        {(columns.length > 0 || manualProducts.length > 0) && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                Or
              </span>
            </div>
          </div>
        )}

        {/* Manual Entry Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Products Manually
            </Label>
            {manualProducts.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {manualProducts.length} product{manualProducts.length !== 1 ? "s" : ""} added
              </span>
            )}
          </div>

          {/* Manual Products List */}
          {manualProducts.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 max-h-60 overflow-y-auto">
              {manualProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 rounded bg-background border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-muted-foreground truncate">{product.description}</div>
                    )}
                    {product.price && (
                      <div className="text-xs text-muted-foreground">${product.price}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditManualProduct(product)}
                      className="h-8 w-8 p-0"
                      aria-label={`Edit ${product.name}`}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteManualProduct(product.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Manual Entry Form */}
          {showManualForm ? (
            <Card className="border-2">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowManualForm(false);
                      setEditingProduct(null);
                      setFormData({ name: "", description: "", price: "" });
                    }}
                    className="h-8 w-8 p-0"
                    aria-label="Close form"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="productName" className="text-sm font-medium">
                      Product Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="productName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Wireless Bluetooth Earbuds"
                      className="h-10 mt-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && formData.name.trim()) {
                          handleAddManualProduct();
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="productDescription" className="text-sm font-medium">
                      Description (optional)
                    </Label>
                    <Input
                      id="productDescription"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Product description or specifications"
                      className="h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productPrice" className="text-sm font-medium">
                      Price (optional)
                    </Label>
                    <Input
                      id="productPrice"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="h-10 mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleAddManualProduct}
                      disabled={!formData.name.trim()}
                      className="flex-1"
                      size="sm"
                    >
                      {editingProduct ? "Save Changes" : "Add Product"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowManualForm(false);
                        setEditingProduct(null);
                        setFormData({ name: "", description: "", price: "" });
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowManualForm(true)}
              className="w-full"
              size="lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product Manually
            </Button>
          )}
        </div>

        {/* Summary */}
        {hasData && (
          <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                  Ready to Continue
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {totalProducts} product{totalProducts !== 1 ? "s" : ""} loaded
                  {rows.length > 0 && manualProducts.length > 0 && (
                    <span> ({rows.length} from {selectedFile ? "file" : "sheet"}, {manualProducts.length} manual)</span>
                  )}
                </div>
              </div>
              <Button
                onClick={handleContinue}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
                disabled={loadingUrl || loadingFile}
              >
                Continue to Configuration
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

