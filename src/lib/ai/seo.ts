/**
 * AI SEO Generation
 * Generate SEO-optimized meta titles and descriptions
 */
import { generateWithOpenAI } from "./openai-client";
import { generateWithGemini } from "./gemini-client";
import type { SeoInput, SeoOutput } from "@/types/schemas";

/**
 * Generate SEO content using AI
 */
export async function generateSEO(input: SeoInput): Promise<SeoOutput> {
  const provider = input.provider || "openai";

  const seoPrompt = `You are an SEO expert. Based on the following product information, generate optimized SEO metadata.

Product Title: ${input.title}
Product Description: ${input.description || "N/A"}
Category: ${input.category || "General"}

Generate:
1. Meta title (50-60 characters, includes primary keywords, compelling)
2. Meta description (150-160 characters, includes call-to-action, highlights key benefits)
3. Relevant keywords (array of 5-10 keywords/phrases)

Respond in JSON format:
{
  "metaTitle": "...",
  "metaDescription": "...",
  "keywords": ["keyword1", "keyword2", ...]
}`;

  try {
    let response: string;
    if (provider === "gemini") {
      response = await generateWithGemini(seoPrompt);
    } else {
      response = await generateWithOpenAI(seoPrompt);
    }

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response is not valid JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]) as SeoOutput;

    // Ensure meta title and description are within limits
    const metaTitle = parsed.metaTitle.slice(0, 60);
    const metaDescription = parsed.metaDescription.slice(0, 160);

    return {
      metaTitle,
      metaDescription,
      keywords: parsed.keywords || [],
    };
  } catch (error) {
    console.error("SEO generation error:", error);
    throw error;
  }
}
