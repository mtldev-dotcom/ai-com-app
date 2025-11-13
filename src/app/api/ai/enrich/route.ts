/**
 * AI Enrichment API Route
 * POST /api/ai/enrich
 * Enriches product with AI-generated bilingual content
 */
import { NextRequest, NextResponse } from "next/server";
import { enrichInputSchema, enrichOutputSchema } from "@/types/schemas";
import { enrichProduct } from "@/lib/ai/enrich";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedInput = enrichInputSchema.parse(body);

    // Enrich product
    const result = await enrichProduct(validatedInput);

    // Validate output
    const validatedOutput = enrichOutputSchema.parse(result);

    // Log success
    console.log("AI enrichment successful", {
      productId: validatedInput.productId,
      provider: validatedInput.provider,
    });

    return NextResponse.json(validatedOutput, { status: 200 });
  } catch (error) {
    console.error("AI enrich API error:", error);

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
        { error: error.message || "Failed to enrich product" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
