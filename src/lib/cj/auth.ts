/**
 * CJ Dropshipping Authentication Module
 * Handles token fetching, refresh, and validation
 */

import { getSetting, invalidateSettingsCache } from "@/lib/settings/get-settings";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "@/lib/encryption";
import {
  CJAuthResponseSchema,
  CJRefreshTokenResponseSchema,
  isCJSuccess,
  isAuthError,
  type CJAuthResponse,
  type CJRefreshTokenResponse,
} from "@/types/cj-schemas";

/**
 * CJ Settings Keys
 */
export const CJ_SETTINGS_KEYS = {
  API_KEY: "cj_api_key",
  ACCOUNT_EMAIL: "cj_account_email",
  ACCESS_TOKEN: "cj_access_token",
  REFRESH_TOKEN: "cj_refresh_token",
  TOKEN_EXPIRES_AT: "cj_token_expires_at",
} as const;

/**
 * CJ API Base URL (from environment or default)
 */
export const CJ_API_BASE_URL =
  process.env.CJ_API_BASE_URL || "https://developers.cjdropshipping.com/api2.0/v1";

/**
 * Get CJ credentials from settings
 * @returns Object with API key and account email, or null if not configured
 */
export async function getCJCredentials(): Promise<{
  apiKey: string;
  accountEmail: string;
} | null> {
  try {
    const apiKeyEncrypted = await getSetting<string>(CJ_SETTINGS_KEYS.API_KEY);
    const accountEmail = await getSetting<string>(CJ_SETTINGS_KEYS.ACCOUNT_EMAIL);

    if (!apiKeyEncrypted || !accountEmail) {
      return null;
    }

    const apiKey = decrypt(apiKeyEncrypted);
    return { apiKey, accountEmail };
  } catch (error) {
    console.error("Error getting CJ credentials:", error);
    return null;
  }
}

/**
 * Get CJ access token from settings
 * @returns Access token or null if not available
 */
export async function getCJAccessToken(): Promise<string | null> {
  try {
    const tokenEncrypted = await getSetting<string>(CJ_SETTINGS_KEYS.ACCESS_TOKEN);
    if (!tokenEncrypted) {
      return null;
    }
    return decrypt(tokenEncrypted);
  } catch (error) {
    console.error("Error getting CJ access token:", error);
    return null;
  }
}

/**
 * Get CJ refresh token from settings
 * @returns Refresh token or null if not available
 */
export async function getCJRefreshToken(): Promise<string | null> {
  try {
    const tokenEncrypted = await getSetting<string>(CJ_SETTINGS_KEYS.REFRESH_TOKEN);
    if (!tokenEncrypted) {
      return null;
    }
    return decrypt(tokenEncrypted);
  } catch (error) {
    console.error("Error getting CJ refresh token:", error);
    return null;
  }
}

/**
 * Check if access token is expired or about to expire (within 1 hour)
 * @returns true if token needs refresh
 */
export async function isTokenExpired(): Promise<boolean> {
  try {
    const expiresAt = await getSetting<string>(CJ_SETTINGS_KEYS.TOKEN_EXPIRES_AT);
    if (!expiresAt) {
      return true;
    }

    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    return expiryDate <= oneHourFromNow;
  } catch (error) {
    console.error("Error checking token expiry:", error);
    return true;
  }
}

/**
 * Fetch new access token from CJ API
 * @param apiKey - CJ API Key
 * @param accountEmail - CJ Account Email
 * @returns Auth response with tokens
 */
export async function fetchAccessToken(
  apiKey: string,
  accountEmail: string
): Promise<CJAuthResponse> {
  const response = await fetch(`${CJ_API_BASE_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: accountEmail,
      apiKey: apiKey,
    }),
  });

  if (!response.ok) {
    // Handle rate limiting (429)
    if (response.status === 429) {
      throw new Error(
        "CJ API rate limit exceeded. The authentication endpoint can only be called once every 5 minutes. Please wait and try again."
      );
    }
    throw new Error(`CJ API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const validatedData = CJAuthResponseSchema.parse(data);

  if (!isCJSuccess(validatedData)) {
    throw new Error(`CJ authentication failed: ${validatedData.message}`);
  }

  return validatedData;
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - CJ Refresh Token
 * @returns Refresh response with new access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<CJRefreshTokenResponse> {
  const response = await fetch(
    `${CJ_API_BASE_URL}/authentication/refreshAccessToken`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
      }),
    }
  );

  if (!response.ok) {
    // Handle rate limiting (429)
    if (response.status === 429) {
      throw new Error(
        "CJ API rate limit exceeded. Please wait a few minutes and try again."
      );
    }
    throw new Error(
      `CJ token refresh failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const validatedData = CJRefreshTokenResponseSchema.parse(data);

  if (!isCJSuccess(validatedData)) {
    throw new Error(`CJ token refresh failed: ${validatedData.message}`);
  }

  return validatedData;
}

/**
 * Save CJ credentials to settings (encrypted)
 * @param apiKey - CJ API Key
 * @param accountEmail - CJ Account Email
 */
export async function saveCJCredentials(
  apiKey: string,
  accountEmail: string
): Promise<void> {
  try {
    const apiKeyEncrypted = encrypt(apiKey);

    // Upsert API key
    await db
      .insert(settings)
      .values({
        key: CJ_SETTINGS_KEYS.API_KEY,
        valueJsonb: apiKeyEncrypted,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          valueJsonb: apiKeyEncrypted,
          updatedAt: new Date(),
        },
      });

    // Upsert account email
    await db
      .insert(settings)
      .values({
        key: CJ_SETTINGS_KEYS.ACCOUNT_EMAIL,
        valueJsonb: accountEmail,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          valueJsonb: accountEmail,
          updatedAt: new Date(),
        },
      });

    // Invalidate cache
    invalidateSettingsCache(CJ_SETTINGS_KEYS.API_KEY);
    invalidateSettingsCache(CJ_SETTINGS_KEYS.ACCOUNT_EMAIL);
  } catch (error) {
    console.error("Error saving CJ credentials:", error);
    throw new Error("Failed to save CJ credentials");
  }
}

/**
 * Save CJ tokens to settings (encrypted)
 * @param accessToken - CJ Access Token
 * @param refreshToken - CJ Refresh Token (optional)
 * @param expiresAtString - Token expiry as ISO date string (from CJ API)
 */
export async function saveCJTokens(
  accessToken: string,
  refreshToken?: string,
  expiresAtString?: string
): Promise<void> {
  try {
    const accessTokenEncrypted = encrypt(accessToken);

    // Parse expiry date from CJ's date string or default to 15 days
    let expiresAt: Date;
    if (expiresAtString) {
      expiresAt = new Date(expiresAtString);
    } else {
      // Default to 15 days if not provided
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);
    }

    // Upsert access token
    await db
      .insert(settings)
      .values({
        key: CJ_SETTINGS_KEYS.ACCESS_TOKEN,
        valueJsonb: accessTokenEncrypted,
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          valueJsonb: accessTokenEncrypted,
          updatedAt: new Date(),
        },
      });

    // Upsert expiry date
    await db
      .insert(settings)
      .values({
        key: CJ_SETTINGS_KEYS.TOKEN_EXPIRES_AT,
        valueJsonb: expiresAt.toISOString(),
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          valueJsonb: expiresAt.toISOString(),
          updatedAt: new Date(),
        },
      });

    // Upsert refresh token if provided
    if (refreshToken) {
      const refreshTokenEncrypted = encrypt(refreshToken);
      await db
        .insert(settings)
        .values({
          key: CJ_SETTINGS_KEYS.REFRESH_TOKEN,
          valueJsonb: refreshTokenEncrypted,
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            valueJsonb: refreshTokenEncrypted,
            updatedAt: new Date(),
          },
        });
      invalidateSettingsCache(CJ_SETTINGS_KEYS.REFRESH_TOKEN);
    }

    // Invalidate cache
    invalidateSettingsCache(CJ_SETTINGS_KEYS.ACCESS_TOKEN);
    invalidateSettingsCache(CJ_SETTINGS_KEYS.TOKEN_EXPIRES_AT);
  } catch (error) {
    console.error("Error saving CJ tokens:", error);
    throw new Error("Failed to save CJ tokens");
  }
}

/**
 * Get or refresh valid access token
 * Automatically refreshes if token is expired
 * @returns Valid access token
 */
export async function getValidAccessToken(): Promise<string> {
  // Check if token exists and is valid
  const accessToken = await getCJAccessToken();
  const expired = await isTokenExpired();

  if (accessToken && !expired) {
    return accessToken;
  }

  // Try to refresh token
  const refreshToken = await getCJRefreshToken();
  if (refreshToken) {
    try {
      const refreshResponse = await refreshAccessToken(refreshToken);
      if (refreshResponse.data) {
        await saveCJTokens(
          refreshResponse.data.accessToken,
          refreshResponse.data.refreshToken,
          refreshResponse.data.accessTokenExpiryDate
        );
        return refreshResponse.data.accessToken;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Fall through to credential-based auth
    }
  }

  // If refresh failed, try to get new token with credentials
  const credentials = await getCJCredentials();
  if (!credentials) {
    throw new Error("CJ credentials not configured. Please add them in Settings.");
  }

  const authResponse = await fetchAccessToken(
    credentials.apiKey,
    credentials.accountEmail
  );

  if (!authResponse.data) {
    throw new Error("Failed to obtain CJ access token");
  }

  // Save tokens
  await saveCJTokens(
    authResponse.data.accessToken,
    authResponse.data.refreshToken,
    authResponse.data.accessTokenExpiryDate
  );

  return authResponse.data.accessToken;
}

/**
 * Test CJ connection with credentials
 * @param apiKey - CJ API Key
 * @param accountEmail - CJ Account Email
 * @returns true if connection successful
 */
export async function testCJConnection(
  apiKey: string,
  accountEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const authResponse = await fetchAccessToken(apiKey, accountEmail);
    if (authResponse.data) {
      return {
        success: true,
        message: "Connection successful! Credentials are valid.",
      };
    }
    return {
      success: false,
      message: authResponse.message || "Authentication failed",
    };
  } catch (error) {
    console.error("CJ connection test failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Clear all CJ credentials and tokens from settings
 */
export async function clearCJCredentials(): Promise<void> {
  try {
    await db.delete(settings).where(eq(settings.key, CJ_SETTINGS_KEYS.API_KEY));
    await db.delete(settings).where(eq(settings.key, CJ_SETTINGS_KEYS.ACCOUNT_EMAIL));
    await db.delete(settings).where(eq(settings.key, CJ_SETTINGS_KEYS.ACCESS_TOKEN));
    await db.delete(settings).where(eq(settings.key, CJ_SETTINGS_KEYS.REFRESH_TOKEN));
    await db
      .delete(settings)
      .where(eq(settings.key, CJ_SETTINGS_KEYS.TOKEN_EXPIRES_AT));

    // Clear cache
    invalidateSettingsCache();
  } catch (error) {
    console.error("Error clearing CJ credentials:", error);
    throw new Error("Failed to clear CJ credentials");
  }
}

