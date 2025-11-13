"use server";

/**
 * Image Upload Server Actions
 * Handles image uploads to S3 for product drafts
 */
import { createClient } from "@/lib/supabase/server";
import { uploadDraftImage, copyImagesToPublished } from "@/lib/s3/upload";

export interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image file to S3
 * @param formData - FormData containing the image file
 * @returns Upload result with URL or error
 */
export async function uploadImageAction(
  formData: FormData
): Promise<UploadImageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const file = formData.get("file") as File;
    if (!file) {
      return {
        success: false,
        error: "No file provided",
      };
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "File must be an image",
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "Image size must be less than 10MB",
      };
    }

    // Convert File to Blob (preserve original type)
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    // Upload to S3 with filename and content type
    // Pass fileName to ensure correct extension is used
    const url = await uploadDraftImage(blob, file.type, file.name);

    return {
      success: true,
      url,
    };
  } catch (error) {
    console.error("Upload image error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload image to S3",
    };
  }
}

/**
 * Copy images from drafts folder to published folder
 * @param imageUrls - Array of image URLs to copy
 * @returns Result with published URLs or error
 */
export async function copyImagesToPublishedAction(
  imageUrls: string[]
): Promise<{
  success: boolean;
  urls?: string[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  try {
    const publishedUrls = await copyImagesToPublished(imageUrls);
    return {
      success: true,
      urls: publishedUrls,
    };
  } catch (error) {
    console.error("Copy images error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to copy images to published folder",
    };
  }
}
