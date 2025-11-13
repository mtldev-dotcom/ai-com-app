/**
 * S3 Upload Service
 * Handles uploading files to S3 (Cloudflare R2)
 */
import { s3Client, S3_CONFIG } from "./client";
import { PutObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export interface UploadOptions {
  folder?: string; // Folder path in S3 bucket (e.g., "drafts", "published")
  fileName?: string; // Optional custom file name
  contentType?: string; // MIME type (e.g., "image/jpeg")
  publicRead?: boolean; // Whether the file should be publicly readable
}

/**
 * Upload a buffer or file to S3
 * @param file - File buffer or Blob
 * @param options - Upload options
 * @returns Public URL of the uploaded file
 */
export async function uploadToS3(
  file: Buffer | Uint8Array | Blob,
  options: UploadOptions = {}
): Promise<string> {
  const {
    folder = "uploads",
    fileName,
    contentType = "application/octet-stream",
    publicRead = true,
  } = options;

  // Generate file name if not provided
  // Preserve original filename with extension if provided, otherwise generate UUID with correct extension
  let uniqueFileName: string;
  if (fileName) {
    // Use original filename, but ensure it has a UUID prefix to avoid conflicts
    const fileExtension = fileName.split(".").pop() || "jpg";
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, ""); // Remove extension
    uniqueFileName = `${randomUUID()}-${nameWithoutExt}.${fileExtension}`;
  } else {
    // Determine file extension from contentType
    const contentTypeMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
      "image/bmp": "bmp",
    };
    const fileExtension =
      contentTypeMap[contentType.toLowerCase()] ||
      contentType.split("/")[1]?.split(";")[0] ||
      "jpg"; // Default to jpg for images
    uniqueFileName = `${randomUUID()}.${fileExtension}`;
  }

  // Construct S3 key (path)
  const s3Key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

  // Convert Blob to Buffer if needed
  let fileBuffer: Buffer;
  if (file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else if (file instanceof Uint8Array) {
    fileBuffer = Buffer.from(file);
  } else {
    fileBuffer = file;
  }

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: S3_CONFIG.bucket,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: publicRead ? "public-read" : undefined,
  });

  await s3Client.send(command);

  // Construct public URL
  // If S3_FILE_URL is provided, use it, otherwise construct from endpoint
  const baseUrl = S3_CONFIG.fileUrl?.replace(/\/$/, "") || S3_CONFIG.bucket;
  const publicUrl = `${baseUrl}/${s3Key}`;

  return publicUrl;
}

/**
 * Upload an image file to S3 in the drafts folder
 * @param file - Image file buffer or Blob
 * @param contentType - Image MIME type
 * @param fileName - Optional original filename (preserves extension)
 * @returns Public URL of the uploaded image
 */
export async function uploadDraftImage(
  file: Buffer | Uint8Array | Blob,
  contentType: string = "image/jpeg",
  fileName?: string
): Promise<string> {
  return uploadToS3(file, {
    folder: "drafts",
    contentType,
    fileName, // Pass filename to preserve extension
    publicRead: true,
  });
}

/**
 * Upload an image file to S3 in the published folder
 * @param file - Image file buffer or Blob
 * @param contentType - Image MIME type
 * @returns Public URL of the uploaded image
 */
export async function uploadPublishedImage(
  file: Buffer | Uint8Array | Blob,
  contentType: string = "image/jpeg"
): Promise<string> {
  return uploadToS3(file, {
    folder: "published",
    contentType,
    publicRead: true,
  });
}

/**
 * Copy an image from drafts folder to published folder in S3
 * @param draftImageUrl - The S3 URL of the image in drafts folder
 * @returns Public URL of the copied image in published folder
 */
export async function copyImageToPublished(
  draftImageUrl: string
): Promise<string> {
  try {
    // Extract the S3 key from the URL
    // URL format: https://pub-xxx.r2.dev/drafts/uuid.jpg or https://pub-xxx.r2.dev/drafts/uuid.jpg
    console.log("Copying image from:", draftImageUrl);

    // More robust URL parsing
    const url = new URL(draftImageUrl);
    const pathParts = url.pathname.split("/").filter(Boolean); // Remove empty strings
    const folderPart = pathParts[0];
    const fileName = pathParts[pathParts.length - 1];

    console.log("Parsed URL - folder:", folderPart, "fileName:", fileName);

    // Only copy if it's in drafts folder
    if (folderPart !== "drafts") {
      console.log("Image is not in drafts folder, returning as-is");
      // If already in published or other folder, return as-is
      return draftImageUrl;
    }

    const sourceKey = `drafts/${fileName}`;
    const destKey = `published/${fileName}`;

    console.log("Copying from:", sourceKey, "to:", destKey);

    // Copy object from drafts to published
    // For R2 with forcePathStyle, CopySource format should be: bucket/key
    // Note: R2 doesn't support ACL in CopyObject, but files should inherit public-read from bucket settings
    const copyCommand = new CopyObjectCommand({
      Bucket: S3_CONFIG.bucket,
      CopySource: `${S3_CONFIG.bucket}/${sourceKey}`,
      Key: destKey,
      // Preserve content type from source
      MetadataDirective: "COPY",
      // For R2, ACL might not be supported, so we'll rely on bucket-level public access
      // ACL: "public-read", // Commented out as R2 may not support this
    });

    await s3Client.send(copyCommand);
    console.log("Image copied successfully to:", destKey);

    // Construct new URL using the same base URL as the source
    const baseUrl = S3_CONFIG.fileUrl?.replace(/\/$/, "") || url.origin;
    const publishedUrl = `${baseUrl}/${destKey}`;

    console.log("Published URL:", publishedUrl);
    return publishedUrl;
  } catch (error) {
    console.error("Error copying image to published folder:", error);
    console.error("Failed URL:", draftImageUrl);
    // Re-throw to let caller handle
    throw error;
  }
}

/**
 * Copy multiple images from drafts to published folder
 * @param draftImageUrls - Array of S3 URLs in drafts folder
 * @returns Array of public URLs in published folder
 */
export async function copyImagesToPublished(
  draftImageUrls: string[]
): Promise<string[]> {
  const publishedUrls = await Promise.all(
    draftImageUrls.map((url) => copyImageToPublished(url))
  );
  return publishedUrls;
}

/**
 * Download an image from a URL and upload it to S3 drafts folder
 * @param imageUrl - URL of the image to download
 * @returns Public URL of the uploaded image in R2 drafts folder
 */
export async function downloadAndUploadImage(
  imageUrl: string
): Promise<string> {
  try {
    console.log("Downloading image from URL:", imageUrl);

    // Download the image
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to download image: ${response.status} ${response.statusText}`
      );
    }

    // Get content type from response headers or infer from URL
    const contentType =
      response.headers.get("content-type") ||
      (imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)
        ? `image/${imageUrl.split(".").pop()?.toLowerCase()}`
        : "image/jpeg");

    // Validate it's an image
    if (!contentType.startsWith("image/")) {
      throw new Error(`URL does not point to an image: ${contentType}`);
    }

    // Get image as buffer
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Extract filename from URL for better naming (optional, used for extension detection)
    const urlPath = new URL(imageUrl).pathname;
    const urlFileName = urlPath.split("/").pop() || "image.jpg";

    // Upload to S3 drafts folder (folder will be created automatically if it doesn't exist)
    console.log(
      `Uploading image to R2 drafts folder (${imageBuffer.length} bytes, ${contentType})`
    );
    const uploadedUrl = await uploadDraftImage(
      imageBuffer,
      contentType,
      urlFileName
    );

    console.log("Image uploaded successfully to:", uploadedUrl);
    return uploadedUrl;
  } catch (error) {
    console.error("Error downloading/uploading image:", error);
    throw new Error(
      `Failed to download and upload image from ${imageUrl}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Download multiple images from URLs and upload them to S3 drafts folder
 * @param imageUrls - Array of image URLs to download and upload
 * @returns Array of public URLs in R2 drafts folder
 */
export async function downloadAndUploadImages(
  imageUrls: string[]
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const url of imageUrls) {
    try {
      // Skip empty URLs
      if (!url || url.trim() === "") {
        console.log("Skipping empty image URL");
        continue;
      }

      // Skip URLs that are already in R2 (to avoid re-downloading)
      // Check if URL contains the R2 file URL or endpoint
      const isR2Url =
        S3_CONFIG.fileUrl &&
        (url.includes(S3_CONFIG.fileUrl) ||
          url.includes("/drafts/") ||
          url.includes("/published/"));
      
      if (isR2Url) {
        console.log("Image already in R2, skipping download:", url);
        uploadedUrls.push(url);
        continue;
      }

      const uploadedUrl = await downloadAndUploadImage(url);
      uploadedUrls.push(uploadedUrl);
    } catch (error) {
      console.error(`Failed to process image ${url}:`, error);
      // Continue with other images even if one fails
      // Optionally, you could add the original URL if download fails
      // For now, we'll skip failed images to avoid broken image references
    }
  }

  return uploadedUrls;
}
