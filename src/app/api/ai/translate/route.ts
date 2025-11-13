/**
 * AI Translation API Route
 * POST /api/ai/translate
 * Translates text between languages
 */
import { NextRequest, NextResponse } from "next/server";
import { translateInputSchema, translateOutputSchema } from "@/types/schemas";
import { translateText } from "@/lib/ai/translate";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedInput = translateInputSchema.parse(body);

    // Translate text
    const result = await translateText(validatedInput);

    // Validate output
    const validatedOutput = translateOutputSchema.parse(result);

    // Log success
    console.log("AI translation successful", {
      source: validatedOutput.sourceLanguage,
      target: validatedOutput.targetLanguage,
      provider: validatedInput.provider,
    });

    return NextResponse.json(validatedOutput, { status: 200 });
  } catch (error) {
    console.error("AI translate API error:", error);

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
        { error: error.message || "Failed to translate text" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
