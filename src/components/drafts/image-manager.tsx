"use client";

/**
 * Image Manager Component
 * Manages product images (add, remove, reorder)
 * Supports both URL input, S3 file upload, paste from clipboard, and multiple file uploads
 */
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageManagerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function ImageManager({ images, onImagesChange }: ImageManagerProps) {
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addImage = () => {
    if (newImageUrl.trim()) {
      onImagesChange([...images, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const processFiles = async (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select image files only");
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`Image ${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    const uploadedUrls: string[] = [];
    const totalFiles = validFiles.length;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const url = await uploadSingleFile(file);
        if (url) {
          uploadedUrls.push(url);
        }
        setUploadProgress(((i + 1) / totalFiles) * 100);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        setUploadError(
          `Failed to upload ${file.name}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    if (uploadedUrls.length > 0) {
      onImagesChange([...images, ...uploadedUrls]);
    }

    setUploading(false);
    setUploadProgress(0);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadSingleFile = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      // Compress and resize image before upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          // Create canvas to resize/compress image
          const canvas = document.createElement("canvas");
          const maxWidth = 1920;
          const maxHeight = 1920;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to process image"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas to Blob (for S3 upload)
          // Preserve original file extension from file.name for proper file naming
          const originalExtension =
            file.name.split(".").pop()?.toLowerCase() || "jpg";
          // Use PNG only if original was PNG (for transparency), otherwise use JPEG
          // canvas.toBlob supports "image/png" and "image/jpeg"
          const mimeType =
            originalExtension === "png" ? "image/png" : "image/jpeg";

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error("Failed to process image"));
                return;
              }

              try {
                // Upload to S3 via API route (handles large files better than server actions)
                // Preserve original filename extension (even if content is JPEG)
                // This ensures files are saved with correct extension in S3
                const fileName = file.name || `image.${originalExtension}`;
                const formData = new FormData();
                // Create a new Blob with the original filename extension preserved
                // and correct content type
                const typedBlob = new Blob([blob], { type: mimeType });
                formData.append("file", typedBlob, fileName);

                // Use API route instead of server action for better large file handling
                const response = await fetch("/api/upload/image", {
                  method: "POST",
                  body: formData,
                });

                const result = await response.json();

                if (result.success && result.url) {
                  resolve(result.url);
                } else {
                  reject(new Error(result.error || "Failed to upload image"));
                }
              } catch (error) {
                reject(
                  error instanceof Error
                    ? error
                    : new Error("Failed to upload image")
                );
              }
            },
            mimeType, // Use the correct MIME type based on original file
            0.85 // Quality: 0.85
          );
        };
        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error("Failed to read image file"));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    await processFiles(fileArray);
  };

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        await processFiles(imageFiles);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("paste", handlePaste);
      // Make container focusable for paste events
      container.setAttribute("tabIndex", "-1");
    }

    return () => {
      if (container) {
        container.removeEventListener("paste", handlePaste);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - processFiles uses latest images through closure

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newImages.length) {
      [newImages[index], newImages[targetIndex]] = [
        newImages[targetIndex],
        newImages[index],
      ];
      onImagesChange(newImages);
    }
  };

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="space-y-2">
        <Label>Add Image from URL</Label>
        <div className="flex items-center gap-2">
          <Input
            type="url"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImage();
              }
            }}
          />
          <Button onClick={addImage} size="icon" disabled={!newImageUrl.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Upload Images from Computer</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          {uploading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : "Uploading..."}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          You can select multiple images or paste images from clipboard (click here first, then paste)
        </p>
        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((url, index) => (
          <div key={index} className="group relative">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {url ? (
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index > 0 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-1 top-1"
                  onClick={() => moveImage(index, "up")}
                >
                  ↑
                </Button>
              )}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Image {index + 1}
            </p>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="rounded-lg border border-dashed bg-muted/50 p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No images added yet
          </p>
        </div>
      )}
    </div>
  );
}
