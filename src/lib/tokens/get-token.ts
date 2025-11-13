/**
 * Token Retrieval Helper
 * Gets active tokens from database for API calls
 */

import { db } from "@/db";
import { apiTokens } from "@/db/schema";
import { eq, and, isNull, gt, or } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";

/**
 * Get active token for a provider
 * Returns the first active, non-expired token
 * @param provider - Provider name (openai, gemini, medusa)
 * @returns Decrypted token value or null
 */
export async function getActiveToken(
  provider: "openai" | "gemini" | "medusa"
): Promise<string | null> {
  try {
    const now = new Date();

    // Find active token that is not expired
    const [token] = await db
      .select()
      .from(apiTokens)
      .where(
        and(
          eq(apiTokens.provider, provider),
          eq(apiTokens.active, true),
          or(isNull(apiTokens.expiresAt), gt(apiTokens.expiresAt, now))
        )
      )
      .limit(1);

    if (!token) {
      return null;
    }

    // Decrypt and return token
    try {
      const decrypted = decrypt(token.tokenValueEncrypted);
      return decrypted;
    } catch (error) {
      console.error(`Failed to decrypt token ${token.id}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`Error getting token for provider ${provider}:`, error);
    return null;
  }
}

/**
 * Get token by ID (for usage logging)
 * @param tokenId - Token ID
 * @returns Token record or null
 */
export async function getTokenById(tokenId: string) {
  const [token] = await db
    .select()
    .from(apiTokens)
    .where(eq(apiTokens.id, tokenId))
    .limit(1);

  return token || null;
}

/**
 * Get active token ID for a provider (for usage logging)
 * @param provider - Provider name
 * @returns Token ID or null
 */
export async function getActiveTokenId(
  provider: "openai" | "gemini" | "medusa"
): Promise<string | null> {
  try {
    const now = new Date();

    const [token] = await db
      .select()
      .from(apiTokens)
      .where(
        and(
          eq(apiTokens.provider, provider),
          eq(apiTokens.active, true),
          or(isNull(apiTokens.expiresAt), gt(apiTokens.expiresAt, now))
        )
      )
      .limit(1);

    return token?.id || null;
  } catch (error) {
    console.error(`Error getting token ID for provider ${provider}:`, error);
    return null;
  }
}
