# S3 (Cloudflare R2) Integration Guide

## 📋 Overview

The application now supports uploading product images to S3-compatible storage (Cloudflare R2). Images are organized in folders:
- **`drafts/`** - For non-published product images
- **`published/`** - For published product images (future use)

## 🔧 Configuration

Add the following environment variables to your `.env.local`:

```env
# S3 / Cloudflare R2 Configuration
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key
S3_BUCKET=nick-a-deal
S3_REGION=auto
S3_ENDPOINT=https://your-r2-endpoint.r2.cloudflarestorage.com
S3_FILE_URL=https://your-public-url.r2.dev
```

### Cloudflare R2 Setup Notes

- `S3_ENDPOINT` - Your R2 endpoint URL (from Cloudflare dashboard)
- `S3_FILE_URL` - Your R2 public domain URL (for accessing files)
- `S3_REGION` - Set to `"auto"` for Cloudflare R2
- `S3_BUCKET` - Your bucket name

## 📁 Folder Structure

Images are stored in the following structure:

```
nick-a-deal/
├── drafts/              # Non-published product images
│   ├── uuid-1.jpg
│   ├── uuid-2.png
│   └── ...
└── published/           # Published product images (future)
    └── ...
```

## 🖼️ Image Upload Flow

1. **User uploads image** in the draft detail page
2. **Image is compressed/resized** client-side (max 1920x1920px, 85% quality)
3. **Image is uploaded to S3** in the `drafts/` folder
4. **S3 URL is stored** in the product draft's `images` array
5. **Image is displayed** from S3 URL

## 📝 Features

### Image Processing
- ✅ Automatic resizing (max 1920x1920px)
- ✅ JPEG compression (85% quality)
- ✅ File size validation (max 10MB)
- ✅ Image type validation

### Storage
- ✅ Unique file names (UUID-based)
- ✅ Organized folder structure
- ✅ Public read access
- ✅ Preserves original file type (JPEG, PNG, etc.)

### User Experience
- ✅ Progress indicators during upload
- ✅ Error handling and messages
- ✅ Support for both file upload and URL input
- ✅ Image preview and management

## 🔍 Usage

### In ImageManager Component

The `ImageManager` component automatically:
1. Compresses and resizes images before upload
2. Uploads to S3 via `uploadImageAction` server action
3. Stores the S3 URL in the images array

### Uploading to S3 Programmatically

```typescript
import { uploadDraftImage } from "@/lib/s3/upload";

// Upload an image file
const file = // ... your file
const url = await uploadDraftImage(file, "image/jpeg");
// Returns: https://your-public-url.r2.dev/drafts/uuid.jpg
```

### Custom Folder

```typescript
import { uploadToS3 } from "@/lib/s3/upload";

const url = await uploadToS3(file, {
  folder: "custom-folder",
  contentType: "image/png",
  fileName: "my-image.png",
});
```

## 🧪 Testing

### Test Image Upload

1. Navigate to `/drafts/[id]` (a draft product page)
2. Scroll to the Images section
3. Click "Upload Image from Computer"
4. Select an image file
5. Wait for upload to complete
6. Verify:
   - ✅ Image appears in the preview
   - ✅ Image URL starts with your `S3_FILE_URL`
   - ✅ Image URL includes `/drafts/` folder

### Verify in Cloudflare R2

1. Go to Cloudflare Dashboard → R2
2. Open your bucket (`nick-a-deal`)
3. Navigate to `drafts/` folder
4. Verify uploaded images are present

## ⚠️ Troubleshooting

### Upload Fails

**Error: "S3 configuration incomplete"**
- ✅ Check all S3 environment variables are set
- ✅ Restart dev server after adding env vars

**Error: "Unauthorized" or "Access Denied"**
- ✅ Verify `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are correct
- ✅ Check R2 API token permissions in Cloudflare

**Error: "Failed to upload image to S3"**
- ✅ Verify `S3_ENDPOINT` is correct (full URL with https://)
- ✅ Check `S3_BUCKET` name matches your R2 bucket
- ✅ Ensure `forcePathStyle: true` is set (already configured)

### Images Not Displaying

**Images show broken/not loading:**
- ✅ Verify `S3_FILE_URL` is correct
- ✅ Check R2 bucket public access settings
- ✅ Ensure files were uploaded with `public-read` ACL
- ✅ Test URL directly in browser

### File Size Issues

**"Image size must be less than 10MB"**
- ✅ Current limit: 10MB (configurable in `uploadImageAction`)
- ✅ Images are compressed before upload anyway

## 🔐 Security Notes

- ✅ Server-side authentication required for uploads
- ✅ Files are validated (type, size) before upload
- ✅ Unique file names prevent conflicts
- ✅ Public read access for easy image serving
- ⚠️ Consider adding file deletion when drafts are deleted (future)

## 📚 API Reference

### `uploadDraftImage(file, contentType)`
Uploads an image to the `drafts/` folder.

**Parameters:**
- `file`: Buffer, Uint8Array, or Blob
- `contentType`: MIME type (default: "image/jpeg")

**Returns:** Promise<string> - Public URL of uploaded image

### `uploadToS3(file, options)`
Generic S3 upload function with custom options.

**Options:**
- `folder`: Folder path (default: "uploads")
- `fileName`: Custom file name (optional)
- `contentType`: MIME type (default: "application/octet-stream")
- `publicRead`: Public read access (default: true)

## ✅ Next Steps

- [ ] Add image deletion when draft is deleted
- [ ] Move images from `drafts/` to `published/` when product is published
- [ ] Add image optimization/caching layer
- [ ] Support for bulk image uploads
- [ ] Image CDN integration

