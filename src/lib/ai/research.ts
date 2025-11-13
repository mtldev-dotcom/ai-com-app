/**
 * AI Research Functions
 * Provides AI-powered research capabilities for trends, suppliers, and products
 */

import { getOpenAIClient } from "./openai-client";
import { getGeminiClient } from "./gemini-client";
import { getActiveTokenId } from "@/lib/tokens/get-token";
import { logTokenUsage } from "@/lib/tokens/log-usage";

/**
 * Analyze trends for given keywords/category
 * Returns trending keywords, tags, and market insights
 */
export async function analyzeTrends(
  keywords: string,
  options?: { useGemini?: boolean }
): Promise<{
  trends: string[];
  suggestedTags: string[];
  insights: string;
}> {
  const provider = options?.useGemini ? "gemini" : "openai";
  const tokenId = await getActiveTokenId(provider);

  const prompt = `Analyze market trends for the following product category/keywords: "${keywords}"

Provide:
1. Top 5 trending keywords related to this category
2. Suggested tags (5-10 tags) for SEO and categorization
3. Market insights: current trends, consumer preferences, and opportunities

Format your response as JSON:
{
  "trends": ["trending keyword 1", "trending keyword 2", ...],
  "suggestedTags": ["tag1", "tag2", ...],
  "insights": "Detailed market insights paragraph"
}`;

  let result: {
    trends: string[];
    suggestedTags: string[];
    insights: string;
  } | null = null;

  try {
    if (provider === "gemini") {
      const client = await getGeminiClient(tokenId || undefined);
      if (!client) {
        throw new Error("Gemini client not available");
      }

      const model = client.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      result = JSON.parse(text);
    } else {
      const client = await getOpenAIClient(tokenId || undefined);
      if (!client) {
        throw new Error("OpenAI client not available");
      }

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a market research analyst specializing in e-commerce trends.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        result = JSON.parse(content);
      }
    }

    // Log usage
    if (tokenId) {
      await logTokenUsage({
        tokenId,
        provider,
        processName: "research_trends",
      });
    }

    return (
      result || {
        trends: [],
        suggestedTags: [],
        insights: "Unable to analyze trends at this time.",
      }
    );
  } catch (error) {
    console.error("Trend analysis error:", error);
    throw new Error(
      `Failed to analyze trends: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Find suppliers matching search criteria
 * Uses AI to analyze supplier profiles and suggest matches
 */
export async function findSuppliers(
  criteria: string,
  supplierProfiles: Array<{
    id: string;
    name: string;
    contactEmail?: string | null;
    notes?: string | null;
  }>,
  options?: { useGemini?: boolean }
): Promise<{
  matches: Array<{
    supplierId: string;
    supplierName: string;
    matchScore: number;
    reasoning: string;
  }>;
}> {
  const provider = options?.useGemini ? "gemini" : "openai";
  const tokenId = await getActiveTokenId(provider);

  const supplierList = supplierProfiles
    .map(
      (s) =>
        `- ${s.name} (ID: ${s.id})${s.notes ? ` - ${s.notes}` : ""}${
          s.contactEmail ? ` - ${s.contactEmail}` : ""
        }`
    )
    .join("\n");

  const prompt = `Find suppliers that match the following criteria: "${criteria}"

Available suppliers:
${supplierList}

For each matching supplier, provide:
1. Supplier ID
2. Supplier name
3. Match score (0-100)
4. Brief reasoning for the match

Format your response as JSON:
{
  "matches": [
    {
      "supplierId": "uuid",
      "supplierName": "name",
      "matchScore": 85,
      "reasoning": "explanation"
    }
  ]
}`;

  try {
    let result: {
      matches: Array<{
        supplierId: string;
        supplierName: string;
        matchScore: number;
        reasoning: string;
      }>;
    } | null = null;

    if (provider === "gemini") {
      const client = await getGeminiClient(tokenId || undefined);
      if (!client) {
        throw new Error("Gemini client not available");
      }

      const model = client.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      result = JSON.parse(text);
    } else {
      const client = await getOpenAIClient(tokenId || undefined);
      if (!client) {
        throw new Error("OpenAI client not available");
      }

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a procurement assistant that matches suppliers to requirements.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        result = JSON.parse(content);
      }
    }

    // Log usage
    if (tokenId) {
      await logTokenUsage({
        tokenId,
        provider,
        processName: "research_suppliers",
      });
    }

    return (
      result || {
        matches: [],
      }
    );
  } catch (error) {
    console.error("Supplier finder error:", error);
    throw new Error(
      `Failed to find suppliers: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Research competitor product
 * Extracts specs, pricing, and features from product information
 */
export async function researchProduct(
  productInfo: string,
  options?: { useGemini?: boolean }
): Promise<{
  title: string;
  description: string;
  specs: Record<string, string>;
  estimatedPrice?: string;
  features: string[];
  tags: string[];
}> {
  const provider = options?.useGemini ? "gemini" : "openai";
  const tokenId = await getActiveTokenId(provider);

  const prompt = `Analyze the following competitor product information and extract structured data:

"${productInfo}"

Extract:
1. Product title
2. Description (2-3 sentences)
3. Specifications (key-value pairs)
4. Estimated price range (if mentioned)
5. Key features (bullet list)
6. Suggested tags for categorization

Format your response as JSON:
{
  "title": "Product Title",
  "description": "Product description",
  "specs": {
    "dimensions": "value",
    "weight": "value",
    "material": "value",
    ...
  },
  "estimatedPrice": "price range or null",
  "features": ["feature1", "feature2", ...],
  "tags": ["tag1", "tag2", ...]
}`;

  try {
    let result: {
      title: string;
      description: string;
      specs: Record<string, string>;
      estimatedPrice?: string;
      features: string[];
      tags: string[];
    } | null = null;

    if (provider === "gemini") {
      const client = await getGeminiClient(tokenId || undefined);
      if (!client) {
        throw new Error("Gemini client not available");
      }

      const model = client.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      result = JSON.parse(text);
    } else {
      const client = await getOpenAIClient(tokenId || undefined);
      if (!client) {
        throw new Error("OpenAI client not available");
      }

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a product research assistant that extracts structured data from product information.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        result = JSON.parse(content);
      }
    }

    // Log usage
    if (tokenId) {
      await logTokenUsage({
        tokenId,
        provider,
        processName: "research_product",
      });
    }

    return (
      result || {
        title: "",
        description: "",
        specs: {},
        features: [],
        tags: [],
      }
    );
  } catch (error) {
    console.error("Product research error:", error);
    throw new Error(
      `Failed to research product: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
