"use client";

/**
 * Imports page
 * Upload, map, and import product data from CSV/XLSX/URL
 */
import React, { useState, useEffect } from "react";
import { FileUpload } from "@/components/imports/file-upload";
import { UrlInput } from "@/components/imports/url-input";
import { ColumnMapper } from "@/components/imports/column-mapper";
import { MedusaSync } from "@/components/imports/medusa-sync";
import { CJBrowser } from "@/components/imports/cj-browser";
import { Button } from "@/components/ui/button";
import { parseFile } from "@/lib/imports/parse-file";
import { fetchAndParseUrl } from "@/lib/imports/fetch-url";
import { createImport, saveDraftsFromImport } from "@/app/actions/imports";
import { getSuppliersList } from "@/app/actions/suppliers";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ParsedRow } from "@/lib/imports/parse-file";

type ImportSource = "file" | "url" | "medusa" | "cj";

export default function ImportsPage() {
  const [sourceType, setSourceType] = useState<ImportSource>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mappedColumns, setMappedColumns] = useState<Record<string, string>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string>("");
  const [suppliers, setSuppliers] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Load suppliers on mount
  useEffect(() => {
    getSuppliersList().then((supplierList) => {
      setSuppliers(supplierList);
      // Default to empty string to show "Select a supplier (optional)"
      setSupplierId("");
    });
  }, []);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await parseFile(file);
      if (result.error) {
        setError(result.error);
        setColumns([]);
        setRows([]);
      } else {
        setColumns(result.columns);
        setRows(result.rows);
        setMappedColumns({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setColumns([]);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = async (urlString: string) => {
    setUrl(urlString);
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await fetchAndParseUrl(urlString);
      // Only show error if it's not just warnings about trailing quotes
      if (result.error && !result.error.includes("Trailing quote")) {
        setError(result.error);
        setColumns([]);
        setRows([]);
      } else if (result.columns.length > 0 && result.rows.length > 0) {
        // Successfully parsed despite warnings
        setColumns(result.columns);
        setRows(result.rows);
        setMappedColumns({});
      } else if (result.error) {
        // Only show error if we didn't get any data
        setError(result.error);
        setColumns([]);
        setRows([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch URL");
      setColumns([]);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) {
      setError("No data to import");
      return;
    }

    // Validate required mappings
    const requiredFields = ["title_en", "cost"];
    const mappedFields = Object.values(mappedColumns);
    const missingFields = requiredFields.filter(
      (field) => !mappedFields.includes(field)
    );

    if (missingFields.length > 0) {
      setError(`Missing required field mappings: ${missingFields.join(", ")}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log("Starting import...", {
        rowsCount: rows.length,
        mappedColumns,
      });

      // Create import record
      const fileType = selectedFile
        ? selectedFile.name.endsWith(".xlsx") ||
          selectedFile.name.endsWith(".xls")
          ? "xlsx"
          : "csv"
        : "url";

      console.log("Creating import record...", {
        fileType,
        filename: selectedFile?.name,
      });
      const importRecord = await createImport({
        sourceType: fileType,
        sourceUrl: sourceType === "url" ? url : undefined,
        filename: selectedFile?.name,
        mappedColumns,
      });

      console.log("Import record created:", importRecord.id);

      // Save drafts (supplierId is optional)
      console.log("Saving drafts...", {
        importId: importRecord.id,
        rowsCount: rows.length,
      });
      const result = await saveDraftsFromImport({
        importId: importRecord.id,
        rows,
        mappedColumns,
        supplierId: supplierId || undefined,
      });

      console.log("Import result:", result);

      if (result.success) {
        setSuccess(
          `Successfully imported ${result.processedRows} products. ${result.failedRows} failed.`
        );
        if (result.errors && result.errors.length > 0) {
          console.warn("Import errors:", result.errors);
        }
        // Reset form
        setSelectedFile(null);
        setUrl("");
        setColumns([]);
        setRows([]);
        setMappedColumns({});
      } else {
        setError(
          "Import completed but no products were imported. Check the errors."
        );
      }
    } catch (err) {
      console.error("Import error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to import products";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Imports</h1>
          <p className="text-muted-foreground">
            Upload and map product data from CSV/URL
          </p>
        </div>

        <div className="space-y-6">
          {/* Supplier Selection */}
          <div className="space-y-2">
            <label htmlFor="supplier" className="text-sm font-medium">
              Supplier (Optional)
            </label>
            <select
              id="supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a supplier (optional)</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              If no supplier is selected, a default supplier will be created
              automatically
            </p>
          </div>

          {/* Source Type Tabs */}
          <Tabs
            value={sourceType}
            onValueChange={(v) => setSourceType(v as ImportSource)}
          >
            <TabsList>
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="url">Import from URL</TabsTrigger>
              <TabsTrigger value="cj">CJ Dropshipping</TabsTrigger>
              <TabsTrigger value="medusa">Sync from Medusa</TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <FileUpload onFileSelect={handleFileSelect} />
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <UrlInput onUrlSubmit={handleUrlSubmit} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="cj" className="space-y-4">
              <CJBrowser />
            </TabsContent>

            <TabsContent value="medusa" className="space-y-4">
              <MedusaSync />
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

          {/* Column Mapper */}
          {columns.length > 0 && rows.length > 0 && (
            <div className="space-y-4 rounded-lg border bg-card p-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Found {rows.length} rows with {columns.length} columns
                </p>
              </div>

              <ColumnMapper
                sourceColumns={columns}
                mappedColumns={mappedColumns}
                onMappingChange={setMappedColumns}
              />

              <Button
                onClick={handleImport}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  `Import ${rows.length} Products`
                )}
              </Button>
            </div>
          )}

          {/* Preview Table */}
          {rows.length > 0 && columns.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Preview (First 5 Rows)</h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="border-b px-4 py-2 text-left font-medium"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b">
                        {columns.map((col) => (
                          <td key={col} className="px-4 py-2">
                            {String(row[col] || "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
