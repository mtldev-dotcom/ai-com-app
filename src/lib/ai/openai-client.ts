/**
 * OpenAI Client
 * Handles OpenAI API interactions
 * Updated to use tokens from database
 */
import OpenAI from "openai";
import { getActiveToken, getTokenById } from "@/lib/tokens/get-token";
import { logTokenUsage } from "@/lib/tokens/log-usage";

const openaiClientCache: Map<string, OpenAI> = new Map();

/**
 * Get OpenAI client instance using token from database
 * @param tokenId - Optional token ID for usage logging
 */
export async function getOpenAIClient(
  tokenId?: string
): Promise<OpenAI | null> {
  // Get active token from database
  const apiKey = await getActiveToken("openai");

  if (!apiKey) {
    console.warn("No active OpenAI token found in database");
    return null;
  }

  // Cache client by API key
  if (!openaiClientCache.has(apiKey)) {
    openaiClientCache.set(
      apiKey,
      new OpenAI({
        apiKey,
      })
    );
  }

  return openaiClientCache.get(apiKey) || null;
}

/**
 * Generate text using OpenAI
 * Automatically logs token usage
 */
export async function generateWithOpenAI(
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    tokenId?: string; // Optional token ID for usage logging
  }
): Promise<string> {
  const client = await getOpenAIClient(options?.tokenId);

  if (!client) {
    throw new Error("OpenAI API key is not configured");
  }

  try {
    const response = await client.chat.completions.create({
      model: options?.model || "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: options?.maxTokens || 1000,
      temperature: options?.temperature || 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned empty response");
    }

    // Log token usage if tokenId provided
    if (options?.tokenId) {
      await logTokenUsage({
        tokenId: options.tokenId,
        provider: "openai",
        processName: "generate_text",
        details: {
          model: options?.model || "gpt-4o-mini",
          promptLength: prompt.length,
          responseLength: content.length,
        },
      });
    }

    return content;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}
