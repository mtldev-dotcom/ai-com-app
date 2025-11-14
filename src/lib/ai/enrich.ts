/**
 * AI Enrichment Functions
 * Core functions for enriching product data with AI
 */
import { generateWithOpenAI } from "./openai-client";
import { generateWithGemini } from "./gemini-client";
import { getActiveTokenId } from "@/lib/tokens/get-token";
import type { EnrichInput, EnrichOutput } from "@/types/schemas";
import { getProductDraftById } from "@/db/queries/products-draft";

/**
 * Enrich product with AI-generated content
 */
export async function enrichProduct(input: EnrichInput): Promise<EnrichOutput> {
  const provider = input.provider || "openai";

  // Fetch product data if productId is provided
  let productTitle = input.title;
  let productDescription = input.description;
  let productSubtitle = input.subtitle;
  let productSpecs = input.specifications;

  if (input.productId) {
    const product = await getProductDraftById(input.productId);
    if (product) {
      productTitle =
        product.product.titleEn || product.product.titleFr || productTitle;
      productDescription =
        product.product.descriptionEn ||
        product.product.descriptionFr ||
        productDescription;
      productSubtitle = product.product.subtitle || productSubtitle;
      productSpecs = product.product.specifications || productSpecs;
    }
  }

  const enrichPrompt = `You are a product enrichment assistant for an e-commerce platform. 
Given the following product information, generate comprehensive bilingual (English and French) content.

Product Title: ${productTitle || "N/A"}
Product Subtitle: ${productSubtitle || "N/A"}
Product Description: ${productDescription || "N/A"}
Existing Specifications: ${JSON.stringify(productSpecs || {})}

Please provide:
1. Enhanced English title (concise, SEO-friendly)
2. Enhanced French title (concise, SEO-friendly)
3. Product subtitle (short, catchy tagline or key selling point - 5-10 words max)
4. Detailed English description (3-5 sentences, highlighting key features and benefits)
5. Detailed French description (3-5 sentences, highlighting key features and benefits)
6. Technical specifications as a JSON object (extract or infer from available information)

Respond in JSON format:
{
  "titleEn": "...",
  "titleFr": "...",
  "subtitle": "...",
  "descriptionEn": "...",
  "descriptionFr": "...",
  "specifications": {...}
}`;

  try {
    // Get token ID for usage logging
    const tokenId = await getActiveTokenId(provider);

    let response: string;
    if (provider === "gemini") {
      response = await generateWithGemini(enrichPrompt, {
        tokenId: tokenId || undefined,
      });
    } else {
      response = await generateWithOpenAI(enrichPrompt, {
        tokenId: tokenId || undefined,
      });
    }

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response is not valid JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]) as EnrichOutput;

    return {
      titleEn: parsed.titleEn || productTitle,
      titleFr: parsed.titleFr,
      subtitle: parsed.subtitle || productSubtitle,
      descriptionEn: parsed.descriptionEn || productDescription,
      descriptionFr: parsed.descriptionFr,
      specifications: parsed.specifications || productSpecs,
    };
  } catch (error) {
    console.error("Enrichment error:", error);
    throw error;
  }
}
