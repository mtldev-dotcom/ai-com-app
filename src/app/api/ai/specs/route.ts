/**
 * AI Specifications API Route
 * POST /api/ai/specs
 * Generates technical specifications for products
 */
import { NextRequest, NextResponse } from "next/server";
import { specsInputSchema, specsOutputSchema } from "@/types/schemas";
import { generateSpecs } from "@/lib/ai/specs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedInput = specsInputSchema.parse(body);

    // Generate specifications
    const result = await generateSpecs(validatedInput);

    // Validate output
    const validatedOutput = specsOutputSchema.parse(result);

    // Log success
    console.log("AI specs generation successful", {
      provider: validatedInput.provider,
    });

    return NextResponse.json(validatedOutput, { status: 200 });
  } catch (error) {
    console.error("AI specs API error:", error);

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
        { error: error.message || "Failed to generate specifications" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
