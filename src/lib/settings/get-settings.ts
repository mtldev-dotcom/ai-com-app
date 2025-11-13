/**
 * Settings Helper
 * Retrieves settings from database with caching
 */

import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Simple in-memory cache (can be replaced with Redis later)
const settingsCache = new Map<string, { value: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a setting value by key
 * @param key - Setting key (e.g., "medusa_admin_url")
 * @param defaultValue - Default value if setting doesn't exist
 * @returns Setting value or default
 */
export async function getSetting<T = unknown>(
  key: string,
  defaultValue?: T
): Promise<T | null> {
  // Check cache first
  const cached = settingsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value as T;
  }

  try {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (!setting) {
      return defaultValue ?? null;
    }

    // Update cache
    settingsCache.set(key, {
      value: setting.valueJsonb,
      timestamp: Date.now(),
    });

    return setting.valueJsonb as T;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue ?? null;
  }
}

/**
 * Get multiple settings at once
 * @param keys - Array of setting keys
 * @returns Object with key-value pairs
 */
export async function getSettings(
  keys: string[]
): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};

  for (const key of keys) {
    results[key] = await getSetting(key);
  }

  return results;
}

/**
 * Get all settings (for admin/settings page)
 * @returns Array of all settings
 */
export async function getAllSettings() {
  return await db.select().from(settings);
}

/**
 * Invalidate cache for a specific key or all keys
 * @param key - Optional key to invalidate, or undefined to clear all
 */
export function invalidateSettingsCache(key?: string) {
  if (key) {
    settingsCache.delete(key);
  } else {
    settingsCache.clear();
  }
}

// Common setting keys
export const SETTING_KEYS = {
  MEDUSA_ADMIN_URL: "medusa_admin_url",
  MEDUSA_ADMIN_TOKEN: "medusa_admin_token",
  FX_BASE_CURRENCY: "fx_base_currency",
  DEFAULT_MARGIN_PCT: "default_margin_pct",
  DEFAULT_LOCALE: "default_locale",
} as const;
