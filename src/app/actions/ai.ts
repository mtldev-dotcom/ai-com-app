"use server";

/**
 * AI Enrichment Server Actions
 * Server actions for AI-powered product enrichment
 */
import { enrichProduct } from "@/lib/ai/enrich";
import { translateText } from "@/lib/ai/translate";
import { generateSpecs } from "@/lib/ai/specs";
import { generateSEO } from "@/lib/ai/seo";
import type {
  EnrichInput,
  EnrichOutput,
  TranslateInput,
  TranslateOutput,
  SpecsInput,
  SpecsOutput,
  SeoInput,
  SeoOutput,
} from "@/types/schemas";

/**
 * Enrich product with AI
 */
export async function enrichProductAction(
  input: EnrichInput
): Promise<EnrichOutput> {
  try {
    console.log("Enriching product:", input.productId);
    const result = await enrichProduct(input);
    console.log("Enrichment successful:", input.productId);
    return result;
  } catch (error) {
    console.error("Enrichment action error:", error);
    throw error;
  }
}

/**
 * Translate text using AI
 */
export async function translateTextAction(
  input: TranslateInput
): Promise<TranslateOutput> {
  try {
    console.log("Translating text:", {
      targetLanguage: input.targetLanguage,
      provider: input.provider,
    });
    const result = await translateText(input);
    console.log("Translation successful");
    return result;
  } catch (error) {
    console.error("Translation action error:", error);
    throw error;
  }
}

/**
 * Generate specifications using AI
 */
export async function generateSpecsAction(
  input: SpecsInput
): Promise<SpecsOutput> {
  try {
    console.log("Generating specs for:", input.title);
    const result = await generateSpecs(input);
    console.log("Specs generation successful");
    return result;
  } catch (error) {
    console.error("Specs generation action error:", error);
    throw error;
  }
}

/**
 * Generate SEO content using AI
 */
export async function generateSEOAction(input: SeoInput): Promise<SeoOutput> {
  try {
    console.log("Generating SEO for:", input.title);
    const result = await generateSEO(input);
    console.log("SEO generation successful");
    return result;
  } catch (error) {
    console.error("SEO generation action error:", error);
    throw error;
  }
}
