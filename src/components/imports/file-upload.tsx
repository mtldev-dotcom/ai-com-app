"use client";

/**
 * File Upload Component
 * Handles CSV and XLSX file uploads with drag & drop
 */
import { useRef, useState } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
}

export function FileUpload({
  onFileSelect,
  acceptedTypes = [".csv", ".xlsx", ".xls"],
  maxSize = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      alert(`Invalid file type. Please upload: ${acceptedTypes.join(", ")}`);
      return;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      alert(`File size exceeds ${maxSize}MB limit`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-accent"
            : "border-muted-foreground/25 bg-muted/5 hover:border-primary/50",
          selectedFile && "border-primary bg-accent/50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

        {selectedFile ? (
          <div className="flex items-center gap-4">
            <File className="h-12 w-12 text-primary" />
            <div className="flex-1">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-4">
              <p className="text-sm font-medium">
                Drag and drop your file here, or click to browse
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Supported formats: {acceptedTypes.join(", ")} (max {maxSize}MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
