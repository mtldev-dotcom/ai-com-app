/**
 * API Token Management Routes (by ID)
 * PUT /api/tokens/:id - Update token
 * DELETE /api/tokens/:id - Soft delete token (set active=false)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { apiTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateTokenSchema = z.object({
  active: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * PUT /api/tokens/:id
 * Update token (active status, expires_at)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateTokenSchema.parse(body);

    // Update token
    const updateData: {
      active?: boolean;
      expiresAt?: Date | null;
    } = {};

    if (validated.active !== undefined) {
      updateData.active = validated.active;
    }

    if (validated.expiresAt !== undefined) {
      updateData.expiresAt = validated.expiresAt
        ? new Date(validated.expiresAt)
        : null;
    }

    const [updatedToken] = await db
      .update(apiTokens)
      .set(updateData)
      .where(eq(apiTokens.id, id))
      .returning();

    if (!updatedToken) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: updatedToken.id,
        provider: updatedToken.provider,
        active: updatedToken.active,
        expiresAt: updatedToken.expiresAt,
        createdAt: updatedToken.createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update token error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update token" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tokens/:id
 * Soft delete token (set active=false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    // Soft delete by setting active=false
    const [updatedToken] = await db
      .update(apiTokens)
      .set({ active: false })
      .where(eq(apiTokens.id, id))
      .returning();

    if (!updatedToken) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Token deactivated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete token error:", error);
    return NextResponse.json(
      { error: "Failed to delete token" },
      { status: 500 }
    );
  }
}
