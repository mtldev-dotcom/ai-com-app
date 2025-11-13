/**
 * Token Management Server Actions
 * Server-side actions for token CRUD operations
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { apiTokens, tokenUsageLogs } from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { encrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

/**
 * Get all tokens
 */
export async function getAllTokens() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const tokens = await db
    .select()
    .from(apiTokens)
    .orderBy(desc(apiTokens.createdAt));

  return tokens.map((token) => ({
    id: token.id,
    provider: token.provider,
    active: token.active,
    expiresAt: token.expiresAt,
    createdAt: token.createdAt,
  }));
}

/**
 * Create a new token
 */
export async function createToken(params: {
  provider: "openai" | "gemini" | "medusa";
  tokenValue: string;
  expiresAt?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Encrypt token
  const encryptedToken = encrypt(params.tokenValue);

  // Insert token
  const [newToken] = await db
    .insert(apiTokens)
    .values({
      provider: params.provider,
      tokenValueEncrypted: encryptedToken,
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
      active: true,
    })
    .returning();

  revalidatePath("/tokens");
  return {
    id: newToken.id,
    provider: newToken.provider,
    active: newToken.active,
    expiresAt: newToken.expiresAt,
    createdAt: newToken.createdAt,
  };
}

/**
 * Update token
 */
export async function updateToken(
  id: string,
  params: {
    active?: boolean;
    expiresAt?: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const updateData: {
    active?: boolean;
    expiresAt?: Date | null;
  } = {};

  if (params.active !== undefined) {
    updateData.active = params.active;
  }

  if (params.expiresAt !== undefined) {
    updateData.expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;
  }

  const [updated] = await db
    .update(apiTokens)
    .set(updateData)
    .where(eq(apiTokens.id, id))
    .returning();

  if (!updated) {
    throw new Error("Token not found");
  }

  revalidatePath("/tokens");
  return {
    id: updated.id,
    provider: updated.provider,
    active: updated.active,
    expiresAt: updated.expiresAt,
  };
}

/**
 * Delete token (soft delete)
 */
export async function deleteToken(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.update(apiTokens).set({ active: false }).where(eq(apiTokens.id, id));

  revalidatePath("/tokens");
}

/**
 * Get token usage logs
 */
export async function getTokenUsageLogs(params?: {
  provider?: "openai" | "gemini" | "medusa";
  processName?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const conditions = [];

  if (params?.provider) {
    conditions.push(eq(tokenUsageLogs.provider, params.provider));
  }

  if (params?.processName) {
    conditions.push(eq(tokenUsageLogs.processName, params.processName));
  }

  if (params?.fromDate) {
    conditions.push(gte(tokenUsageLogs.usedAt, new Date(params.fromDate)));
  }

  if (params?.toDate) {
    conditions.push(lte(tokenUsageLogs.usedAt, new Date(params.toDate)));
  }

  const logs = await db
    .select()
    .from(tokenUsageLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tokenUsageLogs.usedAt))
    .limit(params?.limit || 100);

  return logs;
}
