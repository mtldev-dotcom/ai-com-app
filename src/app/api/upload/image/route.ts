import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadDraftImage } from "@/lib/s3/upload";

/**
 * API Route for uploading images to S3
 * Handles large file uploads better than Server Actions
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "Image size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Convert File to Blob
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    // Upload to S3 with filename and content type
    const url = await uploadDraftImage(blob, file.type, file.name);

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload image to S3",
      },
      { status: 500 }
    );
  }
}

// Next.js App Router doesn't use export config
// Body size limits are handled by Next.js automatically for API routes
// Default limit is higher than Server Actions (up to 4.5MB or configurable)
