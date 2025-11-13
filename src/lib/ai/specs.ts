/**
 * AI Specifications Generation
 * Generate technical specifications for products
 */
import { generateWithOpenAI } from "./openai-client";
import { generateWithGemini } from "./gemini-client";
import type { SpecsInput, SpecsOutput } from "@/types/schemas";

/**
 * Generate product specifications using AI
 */
export async function generateSpecs(input: SpecsInput): Promise<SpecsOutput> {
  const provider = input.provider || "openai";

  const specsPrompt = `You are a product specification expert. Based on the following product information, generate comprehensive technical specifications in JSON format.

Product Title: ${input.title}
Product Description: ${input.description || "N/A"}
Existing Specifications: ${JSON.stringify(input.existingSpecs || {})}

Generate a JSON object with relevant technical specifications. Include fields such as:
- Dimensions (if applicable)
- Weight (if applicable)
- Materials
- Features
- Compatibility
- Power requirements (if applicable)
- Any other relevant technical details

Respond with only a JSON object, no additional text:
{
  "dimensions": "...",
  "weight": "...",
  "materials": "...",
  ...
}`;

  try {
    let response: string;
    if (provider === "gemini") {
      response = await generateWithGemini(specsPrompt);
    } else {
      response = await generateWithOpenAI(specsPrompt);
    }

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response is not valid JSON");
    }

    const specifications = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    // Merge with existing specs
    const mergedSpecs = {
      ...(input.existingSpecs || {}),
      ...specifications,
    };

    return {
      specifications: mergedSpecs,
    };
  } catch (error) {
    console.error("Specs generation error:", error);
    throw error;
  }
}
