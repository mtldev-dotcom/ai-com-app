/**
 * Settings API Route
 * GET /api/settings - Get all settings
 * POST /api/settings - Create or update settings (owner only)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserRole } from "@/lib/user/get-user-role";
import { invalidateSettingsCache } from "@/lib/settings/get-settings";
import { z } from "zod";
import { encrypt } from "@/lib/encryption";

const updateSettingsSchema = z.object({
  medusaAdminUrl: z.string().url().optional(),
  medusaAdminToken: z.string().optional(),
  fxBaseCurrency: z.enum(["CAD", "USD", "AUTO"]).optional(),
  defaultMarginPct: z.number().min(0).max(100).optional(),
  defaultLocale: z.enum(["en", "fr"]).optional(),
});

/**
 * GET /api/settings
 * Get all settings (owner only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner
    const role = await getUserRole();
    if (role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can access settings" },
        { status: 403 }
      );
    }

    const allSettings = await db.select().from(settings);

    // Return settings without sensitive data
    const safeSettings = allSettings.map((s) => ({
      key: s.key,
      value: s.key === "medusa_admin_token" ? "***" : s.valueJsonb,
    }));

    return NextResponse.json({ settings: safeSettings }, { status: 200 });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * Create or update settings (owner only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner
    const role = await getUserRole();
    if (role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can update settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = updateSettingsSchema.parse(body);

    // Map to setting keys
    const settingsToUpdate: Record<string, unknown> = {};

    if (validated.medusaAdminUrl !== undefined) {
      settingsToUpdate["medusa_admin_url"] = validated.medusaAdminUrl;
    }

    if (validated.medusaAdminToken !== undefined) {
      // Encrypt Medusa token before storing
      settingsToUpdate["medusa_admin_token"] = encrypt(
        validated.medusaAdminToken
      );
    }

    if (validated.fxBaseCurrency !== undefined) {
      settingsToUpdate["fx_base_currency"] = validated.fxBaseCurrency;
    }

    if (validated.defaultMarginPct !== undefined) {
      settingsToUpdate["default_margin_pct"] = validated.defaultMarginPct;
    }

    if (validated.defaultLocale !== undefined) {
      settingsToUpdate["default_locale"] = validated.defaultLocale;
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(settingsToUpdate)) {
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(settings)
          .set({
            valueJsonb: value,
            updatedAt: new Date(),
          })
          .where(eq(settings.key, key));
      } else {
        // Create new
        await db.insert(settings).values({
          key,
          valueJsonb: value,
        });
      }

      // Invalidate cache
      invalidateSettingsCache(key);
    }

    return NextResponse.json(
      { message: "Settings updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update settings error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
