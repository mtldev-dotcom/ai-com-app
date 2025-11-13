"use client";

/**
 * Enhanced File Upload Zone Component
 * Drag & drop zone with preview and validation feedback
 */

import { useCallback, useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSkeleton } from "./loading-skeleton";
import { cn } from "@/lib/utils";
import { formatFileSize } from "../utils/data-formatters";
import type { ParsedRow } from "@/lib/imports/parse-file";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  selectedFile?: File | null;
  columns?: string[];
  rows?: ParsedRow[];
  error?: string | null;
  className?: string;
}

export function FileUploadZone({
  onFileSelect,
  isLoading = false,
  selectedFile,
  columns = [],
  rows = [],
  error,
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && (file.type === "text/csv" || file.name.endsWith(".csv") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drag & Drop Zone */}
      <label
        htmlFor="file-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : selectedFile
            ? "border-green-500/50 bg-green-500/5"
            : "border-muted-foreground/25 bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/50",
          isLoading && "pointer-events-none opacity-50"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-6">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3" />
              <p className="mb-1 text-sm font-medium">Processing file...</p>
            </>
          ) : selectedFile ? (
            <>
              <CheckCircle2 className="w-10 h-10 mb-3 text-green-600 dark:text-green-400" />
              <p className="mb-1 text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </>
          ) : (
            <>
              <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">CSV, XLSX (Max 10MB)</p>
            </>
          )}
        </div>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={isLoading}
        />
      </label>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {/* File Preview */}
      {columns.length > 0 && rows.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-semibold">
                  {rows.length} {rows.length === 1 ? "product" : "products"} found
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {columns.length} columns detected
              </Badge>
            </div>

            {/* Columns Preview */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Detected Columns:</p>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <Badge key={col} variant="outline" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sample Rows Preview */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Sample Data:</p>
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
                <p className="text-xs text-muted-foreground text-center">
                  + {rows.length - 5} more rows will be processed
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

