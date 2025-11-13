/**
 * Google Gemini Client
 * Handles Google Gemini API interactions
 * Updated to use tokens from database
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getActiveToken, getActiveTokenId } from "@/lib/tokens/get-token";
import { logTokenUsage } from "@/lib/tokens/log-usage";

const geminiClientCache: Map<string, GoogleGenerativeAI> = new Map();

/**
 * Get Gemini client instance using token from database
 * @param tokenId - Optional token ID for usage logging
 */
export async function getGeminiClient(
  tokenId?: string
): Promise<GoogleGenerativeAI | null> {
  // Get active token from database
  const apiKey = await getActiveToken("gemini");

  if (!apiKey) {
    console.warn("No active Gemini token found in database");
    return null;
  }

  // Cache client by API key
  if (!geminiClientCache.has(apiKey)) {
    geminiClientCache.set(apiKey, new GoogleGenerativeAI(apiKey));
  }

  return geminiClientCache.get(apiKey) || null;
}

/**
 * Generate text using Gemini
 * Automatically logs token usage
 */
export async function generateWithGemini(
  prompt: string,
  options?: {
    model?: string;
    maxOutputTokens?: number;
    temperature?: number;
    tokenId?: string; // Optional token ID for usage logging
  }
): Promise<string> {
  const client = await getGeminiClient(options?.tokenId);

  if (!client) {
    throw new Error("Google Gemini API key is not configured");
  }

  try {
    const model = client.getGenerativeModel({
      model: options?.model || "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: options?.maxOutputTokens || 1000,
        temperature: options?.temperature || 0.7,
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    // Log token usage if tokenId provided
    if (options?.tokenId) {
      await logTokenUsage({
        tokenId: options.tokenId,
        provider: "gemini",
        processName: "generate_text",
        details: {
          model: options?.model || "gemini-1.5-flash",
          promptLength: prompt.length,
          responseLength: text.length,
        },
      });
    }

    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}
