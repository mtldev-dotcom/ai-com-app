/**
 * AI SEO API Route
 * POST /api/ai/seo
 * Generates SEO-optimized meta titles and descriptions
 */
import { NextRequest, NextResponse } from "next/server";
import { seoInputSchema, seoOutputSchema } from "@/types/schemas";
import { generateSEO } from "@/lib/ai/seo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedInput = seoInputSchema.parse(body);

    // Generate SEO content
    const result = await generateSEO(validatedInput);

    // Validate output
    const validatedOutput = seoOutputSchema.parse(result);

    // Log success
    console.log("AI SEO generation successful", {
      provider: validatedInput.provider,
    });

    return NextResponse.json(validatedOutput, { status: 200 });
  } catch (error) {
    console.error("AI SEO API error:", error);

    if (error instanceof Error) {
      // Check for API key errors
      if (
        error.message.includes("API key") ||
        error.message.includes("not configured")
      ) {
        return NextResponse.json(
          { error: "AI service API key is not configured" },
          { status: 500 }
        );
      }

      // Zod validation errors
      if (error.name === "ZodError") {
        return NextResponse.json(
          { error: "Invalid input", details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to generate SEO content" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
