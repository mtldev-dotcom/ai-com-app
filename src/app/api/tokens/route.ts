/**
 * API Tokens Management Routes
 * GET /api/tokens - List all tokens
 * POST /api/tokens - Create new token
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { apiTokens } from "@/db/schema";
import { encrypt, maskToken } from "@/lib/encryption";
import { z } from "zod";

// Validation schemas
const createTokenSchema = z.object({
  provider: z.enum(["openai", "gemini", "medusa"]),
  tokenValue: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

/**
 * GET /api/tokens
 * List all tokens (masked values)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all tokens
    const tokens = await db
      .select()
      .from(apiTokens)
      .orderBy(apiTokens.createdAt);

    // Return tokens with masked values
    const maskedTokens = tokens.map((token) => {
      // Don't decrypt here - just return masked placeholder
      // Actual decryption happens only when needed for API calls
      return {
        id: token.id,
        provider: token.provider,
        tokenValue: "••••••••", // Masked placeholder
        active: token.active,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      };
    });

    return NextResponse.json({ tokens: maskedTokens }, { status: 200 });
  } catch (error) {
    console.error("Get tokens error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tokens
 * Create new token
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTokenSchema.parse(body);

    // Encrypt token value
    const encryptedToken = encrypt(validated.tokenValue);

    // Create token record
    const [newToken] = await db
      .insert(apiTokens)
      .values({
        provider: validated.provider,
        tokenValueEncrypted: encryptedToken,
        expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
        active: true,
      })
      .returning();

    return NextResponse.json(
      {
        id: newToken.id,
        provider: newToken.provider,
        active: newToken.active,
        expiresAt: newToken.expiresAt,
        createdAt: newToken.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create token error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
