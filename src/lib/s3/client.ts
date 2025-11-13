/**
 * S3 (Cloudflare R2) Client Configuration
 * Handles file uploads to S3-compatible storage (Cloudflare R2)
 */
import { S3Client } from "@aws-sdk/client-s3";

const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || "auto";
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_FILE_URL = process.env.S3_FILE_URL;

if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET || !S3_ENDPOINT) {
  throw new Error(
    "S3 configuration incomplete. Please set S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET, and S3_ENDPOINT environment variables."
  );
}

/**
 * Create S3 client configured for Cloudflare R2
 */
export const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2
});

export const S3_CONFIG = {
  bucket: S3_BUCKET,
  fileUrl: S3_FILE_URL || S3_ENDPOINT,
  region: S3_REGION,
};
