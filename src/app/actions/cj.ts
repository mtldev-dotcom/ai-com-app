/**
 * CJ Dropshipping Server Actions
 * Server-side actions for CJ API operations
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  saveCJCredentials,
  saveCJTokens,
  testCJConnection,
  getCJCredentials,
  clearCJCredentials,
} from "@/lib/cj/auth";
import {
  searchCJProducts,
  getCJProduct,
  getCJCategories,
  getCJInventory,
  getCJProductByUrl,
  getAllCJMyProducts,
  getCJInventoryBySku,
  getCJFreightCalculate,
  calculateAverageDeliveryDays,
  type CJFreightCalculateParams,
} from "@/lib/cj/client";
import { revalidatePath } from "next/cache";
import type { CJProductQueryRequest } from "@/types/cj-schemas";

/**
 * Save CJ API credentials
 * @param apiKey - CJ API Key
 * @param accountEmail - CJ Account Email
 * @returns Success status and message
 */
export async function saveCJSettings(
  apiKey: string,
  accountEmail: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    // Validate inputs
    if (!apiKey || !accountEmail) {
      return { success: false, message: "API Key and Account Email are required" };
    }

    // Test connection with provided credentials
    const testResult = await testCJConnection(apiKey, accountEmail);
    if (!testResult.success) {
      return {
        success: false,
        message: `Connection test failed: ${testResult.message}`,
      };
    }

    // Save credentials (this also fetches and saves tokens)
    await saveCJCredentials(apiKey, accountEmail);

    revalidatePath("/settings");

    return {
      success: true,
      message: "CJ credentials saved successfully and connection verified",
    };
  } catch (error) {
    console.error("Error saving CJ settings:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save credentials",
    };
  }
}

/**
 * Test CJ connection with current credentials
 * @returns Test result
 */
export async function testCJConnectionAction(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const credentials = await getCJCredentials();
    if (!credentials) {
      return {
        success: false,
        message: "No CJ credentials found. Please configure credentials first.",
      };
    }

    const result = await testCJConnection(
      credentials.apiKey,
      credentials.accountEmail
    );
    return result;
  } catch (error) {
    console.error("Error testing CJ connection:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Connection test failed",
    };
  }
}

/**
 * Get CJ credentials status (without exposing actual credentials)
 * @returns Whether credentials are configured
 */
export async function getCJCredentialsStatus(): Promise<{
  configured: boolean;
  accountEmail?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { configured: false };
    }

    const credentials = await getCJCredentials();
    if (!credentials) {
      return { configured: false };
    }

    return {
      configured: true,
      accountEmail: credentials.accountEmail,
    };
  } catch (error) {
    console.error("Error getting CJ credentials status:", error);
    return { configured: false };
  }
}

/**
 * Clear CJ credentials
 * @returns Success status
 */
export async function clearCJSettingsAction(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    await clearCJCredentials();
    revalidatePath("/settings");

    return { success: true, message: "CJ credentials cleared successfully" };
  } catch (error) {
    console.error("Error clearing CJ credentials:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to clear credentials",
    };
  }
}

/**
 * Search CJ products
 * @param params - Search parameters
 * @returns Product list and total count
 */
export async function searchCJProductsAction(params: CJProductQueryRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const result = await searchCJProducts(params);
    return { success: true, ...result };
  } catch (error) {
    console.error("Error searching CJ products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
      products: [],
      total: 0,
    };
  }
}

/**
 * Get CJ product details
 * @param pid - Product ID
 * @returns Product details
 */
export async function getCJProductAction(pid: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const product = await getCJProduct(pid);
    return { success: true, product };
  } catch (error) {
    console.error("Error getting CJ product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get product",
      product: null,
    };
  }
}

/**
 * Get CJ categories
 * @returns Category list
 */
export async function getCJCategoriesAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const categories = await getCJCategories();
    return { success: true, categories };
  } catch (error) {
    console.error("Error getting CJ categories:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get categories",
      categories: [],
    };
  }
}

/**
 * Get user's CJ inventory
 * @param pageNum - Page number
 * @param pageSize - Page size
 * @returns Inventory products
 */
export async function getCJInventoryAction(pageNum = 1, pageSize = 20) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const result = await getCJInventory(pageNum, pageSize);
    return { success: true, ...result };
  } catch (error) {
    console.error("Error getting CJ inventory:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get inventory",
      products: [],
      total: 0,
    };
  }
}

/**
 * Get CJ product by URL
 * @param url - Product URL
 * @returns Product details
 */
export async function getCJProductByUrlAction(url: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const product = await getCJProductByUrl(url);
    return { success: true, product };
  } catch (error) {
    console.error("Error getting CJ product by URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get product from URL",
      product: null,
    };
  }
}

/**
 * Get user's "My Product Lists" from CJ Dropshipping
 * Since the API doesn't support pagination (always returns page 1),
 * this fetches all products and returns them for client-side pagination
 * 
 * @returns All products from user's saved lists
 */
export async function getCJMyProductsAction() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { getAllCJMyProducts } = await import("@/lib/cj/client");
    const result = await getAllCJMyProducts();
    return { success: true, ...result };
  } catch (error) {
    console.error("Error getting CJ my products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get my products",
      products: [],
      total: 0,
    };
  }
}

/**
 * Get refreshed product data including inventory, shipping options, and updated price
 */
export async function getCJProductRefreshDataAction(
  pid: string,
  sku: string,
  vid?: string
) {
  try {
    // Check authentication
    const { getValidAccessToken } = await import("@/lib/cj/auth");
    await getValidAccessToken();

    const results = await Promise.allSettled([
      // Fetch updated product details for price
      getCJProduct(pid),
      // Fetch inventory by SKU
      getCJInventoryBySku(sku),
      // Fetch freight calculation if vid is available
      // Try multiple destination countries to find available shipping options
      // Prioritize Canada (CA) as requested
      vid
        ? Promise.allSettled([
          getCJFreightCalculate({
            vid,
            startCountryCode: "CN", // Default origin: China
            endCountryCode: "CA", // Try Canada first (prioritized)
            quantity: 1,
          }),
          getCJFreightCalculate({
            vid,
            startCountryCode: "CN",
            endCountryCode: "US", // Try US
            quantity: 1,
          }),
          getCJFreightCalculate({
            vid,
            startCountryCode: "CN",
            endCountryCode: "GB", // Try UK
            quantity: 1,
          }),
        ]).then((results) => {
          // Combine all successful results, prioritizing Canada options
          // Track which country each option is for
          const allOptions: any[] = [];
          const canadaOptions: any[] = [];
          const countryCodes = ["CA", "US", "GB"]; // Match the order of API calls

          results.forEach((result, index) => {
            if (result.status === "fulfilled" && result.value) {
              const countryCode = countryCodes[index];
              const optionsWithCountry = result.value.map((opt: any) => ({
                ...opt,
                destinationCountry: countryCode, // Add country code to each option
              }));

              if (index === 0) {
                // First result is Canada - add to front
                canadaOptions.push(...optionsWithCountry);
              } else {
                allOptions.push(...optionsWithCountry);
              }
            }
          });

          // Return Canada options first, then others
          return [...canadaOptions, ...allOptions];
        })
        : Promise.resolve([]),
    ]);

    const productResult = results[0];
    const inventoryResult = results[1];
    const freightResult = results[2];

    console.log("Refresh action results:", {
      productSuccess: productResult.status === "fulfilled",
      inventorySuccess: inventoryResult.status === "fulfilled",
      freightSuccess: freightResult.status === "fulfilled",
      freightLength: freightResult.status === "fulfilled" ? freightResult.value?.length : 0,
    });

    // Extract product price
    let updatedPrice: number | undefined = undefined;
    if (productResult.status === "fulfilled" && productResult.value) {
      updatedPrice = productResult.value.sellPrice;
    }

    // Extract inventory data
    let inventory: Array<{
      areaEn: string;
      areaId: string;
      countryCode: string;
      totalInventoryNum: number;
      cjInventoryNum: number;
      factoryInventoryNum: number;
    }> = [];
    if (inventoryResult.status === "fulfilled") {
      inventory = inventoryResult.value.map((item) => ({
        areaEn: item.areaEn,
        areaId: item.areaId,
        countryCode: item.countryCode,
        totalInventoryNum: item.totalInventoryNum,
        cjInventoryNum: item.cjInventoryNum,
        factoryInventoryNum: item.factoryInventoryNum,
      }));
    }

    // Extract shipping options and calculate average delivery days
    let shippingOptions: Array<{
      logisticName: string;
      logisticPrice: number;
      logisticAging: string;
    }> = [];
    let avgDeliveryDays: number | null = null;

    if (freightResult.status === "fulfilled") {
      console.log("Freight calculation result:", {
        hasData: !!freightResult.value,
        length: freightResult.value?.length || 0,
        data: freightResult.value,
      });

      if (freightResult.value && freightResult.value.length > 0) {
        shippingOptions = freightResult.value.map((option: any) => ({
          logisticName: option.logisticName,
          logisticPrice: option.logisticPrice,
          logisticAging: option.logisticAging,
          destinationCountry: option.destinationCountry, // Preserve country code
        }));

        // Calculate average delivery days from all shipping options
        const deliveryDays = freightResult.value
          .map((opt) => calculateAverageDeliveryDays(opt.logisticAging))
          .filter((days): days is number => days !== null);

        if (deliveryDays.length > 0) {
          const sum = deliveryDays.reduce((a, b) => a + b, 0);
          avgDeliveryDays = Math.round(sum / deliveryDays.length);
        }
      } else {
        console.warn("Freight calculation returned empty array - no shipping options available");
      }
    } else {
      console.error("Freight calculation failed:", freightResult.reason);
    }

    return {
      success: true,
      price: updatedPrice,
      inventory,
      shippingOptions,
      avgDeliveryDays,
      errors: {
        product: productResult.status === "rejected" ? (productResult.reason as Error)?.message : undefined,
        inventory: inventoryResult.status === "rejected" ? (inventoryResult.reason as Error)?.message : undefined,
        freight: freightResult.status === "rejected" ? (freightResult.reason as Error)?.message : undefined,
      },
    };
  } catch (error) {
    console.error("Error refreshing CJ product data:", error);
    return {
      success: false,
      price: undefined,
      inventory: [],
      shippingOptions: [],
      avgDeliveryDays: null,
      error: error instanceof Error ? error.message : "Failed to refresh product data",
    };
  }
}

/**
 * Save CJ tokens from manual JSON response (from Postman/external auth)
 * @param jsonResponse - Raw JSON response from CJ authentication endpoint
 * @returns Success status and message
 */
export async function saveCJTokensFromJSON(
  jsonResponse: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    // Parse and validate JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonResponse);
    } catch (error) {
      return {
        success: false,
        message: "Invalid JSON format. Please check your input.",
      };
    }

    // Validate using Zod schema
    const { CJAuthResponseSchema } = await import("@/types/cj-schemas");
    let validatedData;
    try {
      validatedData = CJAuthResponseSchema.parse(parsedResponse);
    } catch (error) {
      return {
        success: false,
        message: "Invalid CJ response format. Please ensure you're pasting the complete authentication response.",
      };
    }

    // Check if response indicates success
    if (!validatedData.result || validatedData.code !== 200 || !validatedData.data) {
      return {
        success: false,
        message: `Authentication response failed: ${validatedData.message}`,
      };
    }

    // Save tokens
    const { saveCJTokens } = await import("@/lib/cj/auth");
    await saveCJTokens(
      validatedData.data.accessToken,
      validatedData.data.refreshToken,
      validatedData.data.accessTokenExpiryDate
    );

    revalidatePath("/settings");

    return {
      success: true,
      message: `Tokens saved successfully! Access token valid until ${validatedData.data.accessTokenExpiryDate}`,
    };
  } catch (error) {
    console.error("Error saving CJ tokens from JSON:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save tokens",
    };
  }
}

