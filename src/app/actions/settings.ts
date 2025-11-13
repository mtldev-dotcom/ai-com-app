/**
 * Settings Server Actions
 * Server-side actions for settings management
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/user/get-user-role";
import {
  getSetting,
  getAllSettings,
  SETTING_KEYS,
} from "@/lib/settings/get-settings";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/encryption";
import { invalidateSettingsCache } from "@/lib/settings/get-settings";
import { revalidatePath } from "next/cache";

/**
 * Get all settings (owner only)
 */
export async function getSettings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const role = await getUserRole();
  if (role !== "owner") {
    throw new Error("Only owners can access settings");
  }

  const allSettings = await getAllSettings();
  return allSettings;
}

/**
 * Get a specific setting value
 */
export async function getSettingValue(key: string) {
  return await getSetting(key);
}

/**
 * Update settings (owner only)
 */
export async function updateSettings(params: {
  medusaAdminUrl?: string;
  medusaAdminToken?: string;
  fxBaseCurrency?: "CAD" | "USD" | "AUTO";
  defaultMarginPct?: number;
  defaultLocale?: "en" | "fr";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const role = await getUserRole();
  if (role !== "owner") {
    throw new Error("Only owners can update settings");
  }

  const settingsToUpdate: Record<string, unknown> = {};

  if (params.medusaAdminUrl !== undefined) {
    settingsToUpdate[SETTING_KEYS.MEDUSA_ADMIN_URL] = params.medusaAdminUrl;
  }

  if (params.medusaAdminToken !== undefined) {
    // Encrypt token before storing
    settingsToUpdate[SETTING_KEYS.MEDUSA_ADMIN_TOKEN] = encrypt(
      params.medusaAdminToken
    );
  }

  if (params.fxBaseCurrency !== undefined) {
    settingsToUpdate[SETTING_KEYS.FX_BASE_CURRENCY] = params.fxBaseCurrency;
  }

  if (params.defaultMarginPct !== undefined) {
    settingsToUpdate[SETTING_KEYS.DEFAULT_MARGIN_PCT] = params.defaultMarginPct;
  }

  if (params.defaultLocale !== undefined) {
    settingsToUpdate[SETTING_KEYS.DEFAULT_LOCALE] = params.defaultLocale;
  }

  // Upsert each setting
  for (const [key, value] of Object.entries(settingsToUpdate)) {
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(settings)
        .set({
          valueJsonb: value,
          updatedAt: new Date(),
        })
        .where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({
        key,
        valueJsonb: value,
      });
    }

    invalidateSettingsCache(key);
  }

  revalidatePath("/settings");
}

/**
 * Check if current user is owner
 */
export async function checkIsOwner(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const role = await getUserRole();
  return role === "owner";
}
