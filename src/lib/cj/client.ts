/**
 * CJ Dropshipping API Client
 * Handles all API interactions with CJ Dropshipping
 */

import { getValidAccessToken, CJ_API_BASE_URL } from "./auth";
import {
  CJProductListResponseSchema,
  CJProductDetailResponseSchema,
  CJCategoryListResponseSchema,
  CJInventoryResponseSchema,
  CJProductListV2ResponseSchema,
  CJInventoryBySkuResponseSchema,
  CJFreightCalculateResponseSchema,
  isCJSuccess,
  isAuthError,
  type CJProduct,
  type CJCategory,
  type CJInventoryProduct,
  type CJProductQueryRequest,
  type CJProductV2,
  type CJInventoryBySkuItem,
  type CJFreightOption,
} from "@/types/cj-schemas";

/**
 * API Request Timeout (10 seconds)
 */
const API_TIMEOUT_MS = 10000;

/**
 * Rate limiting configuration
 * CJ API allows ~5-10 requests per second
 */
const CJ_API_MIN_DELAY_MS = 200; // 200ms = 5 req/s (conservative)
let lastCJApiCallTime = 0;

/**
 * Rate limiting lock (simple in-memory for serverless)
 * In production, consider using Redis for distributed rate limiting
 */
let rateLimitPromise: Promise<void> | null = null;

/**
 * Wait for rate limit delay
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCJApiCallTime;

  if (elapsed < CJ_API_MIN_DELAY_MS) {
    const waitTime = CJ_API_MIN_DELAY_MS - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastCJApiCallTime = Date.now();
}

/**
 * Retry configuration
 */
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * CJ API Client Error
 */
export class CJAPIError extends Error {
  constructor(
    message: string,
    public code?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "CJAPIError";
  }
}

/**
 * Make authenticated request to CJ API
 * @param endpoint - API endpoint (e.g., "/product/query")
 * @param options - Fetch options
 * @param retries - Number of retries attempted
 * @returns Response data
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 0
): Promise<T> {
  try {
    // Wait for rate limit
    if (rateLimitPromise) {
      await rateLimitPromise;
    }
    rateLimitPromise = waitForRateLimit();
    await rateLimitPromise;
    rateLimitPromise = null;

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken();

    // Build full URL
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${CJ_API_BASE_URL}${endpoint}`;

    // Make request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": accessToken,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle rate limiting (429) with exponential backoff retry
      if (response.status === 429 && retries < MAX_RETRIES) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : RETRY_DELAY_MS * Math.pow(2, retries + 1); // Exponential backoff

        console.warn(
          `Rate limit hit (429), retrying after ${delay}ms... (${retries + 1}/${MAX_RETRIES})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return makeRequest<T>(endpoint, options, retries + 1);
      }

      // Handle other errors
      const errorText = await response.text().catch(() => "Unknown error");
      throw new CJAPIError(
        `CJ API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        response.status
      );
    }

    const data = await response.json();

    // Check if response indicates auth error
    if (isAuthError(data.code)) {
      // If we haven't retried yet, try again with fresh token
      if (retries < MAX_RETRIES) {
        console.warn("Auth error, retrying with fresh token...");
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return makeRequest<T>(endpoint, options, retries + 1);
      }
      throw new CJAPIError("Authentication failed", data.code, data);
    }

    return data as T;
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new CJAPIError("Request timeout - CJ API took too long to respond");
    }

    // Handle network errors with retry
    if (
      error instanceof TypeError &&
      error.message.includes("fetch") &&
      retries < MAX_RETRIES
    ) {
      console.warn(`Network error, retrying... (${retries + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return makeRequest<T>(endpoint, options, retries + 1);
    }

    // Re-throw CJAPIError
    if (error instanceof CJAPIError) {
      throw error;
    }

    // Wrap other errors
    throw new CJAPIError(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}

/**
 * Search CJ product catalog
 * @param params - Search parameters
 * @returns List of products
 */
export async function searchCJProducts(
  params: CJProductQueryRequest
): Promise<{ products: CJProduct[]; total: number }> {
  try {
    // Build query string parameters
    const queryParams = new URLSearchParams();
    if (params.productNameEn) queryParams.append("productNameEn", params.productNameEn);
    if (params.categoryId) queryParams.append("categoryId", params.categoryId);
    if (params.minPrice !== undefined) queryParams.append("minPrice", params.minPrice.toString());
    if (params.maxPrice !== undefined) queryParams.append("maxPrice", params.maxPrice.toString());
    queryParams.append("pageNum", (params.pageNum || 1).toString());
    queryParams.append("pageSize", (params.pageSize || 20).toString());
    if (params.orderBy) queryParams.append("orderBy", params.orderBy);

    const response = await makeRequest<unknown>(
      `/product/list?${queryParams.toString()}`,
      {
        method: "GET",
      }
    );

    const validatedResponse = CJProductListResponseSchema.parse(response);

    if (!isCJSuccess(validatedResponse)) {
      throw new CJAPIError(
        `Search failed: ${validatedResponse.message}`,
        validatedResponse.code,
        validatedResponse
      );
    }

    return {
      products: validatedResponse.data?.list || [],
      total: validatedResponse.data?.total || 0,
    };
  } catch (error) {
    console.error("Error searching CJ products:", error);
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to search products"
      );
  }
}

/**
 * Convert listV2 product to standard CJProduct format
 */
function convertV2ProductToCJProduct(v2Product: CJProductV2): CJProduct | null {
  // Skip products without a valid name
  if (!v2Product.nameEn || v2Product.nameEn.trim() === "") {
    return null;
  }

  // Parse sellPrice - handle string prices like "9.15"
  let sellPrice: number | undefined = undefined;
  if (v2Product.sellPrice !== undefined && v2Product.sellPrice !== null) {
    sellPrice = typeof v2Product.sellPrice === "number"
      ? v2Product.sellPrice
      : parseFloat(String(v2Product.sellPrice)) || undefined;
  }

  // Fallback to nowPrice if sellPrice not available
  if (sellPrice === undefined && v2Product.nowPrice !== undefined && v2Product.nowPrice !== null) {
    sellPrice = typeof v2Product.nowPrice === "number"
      ? v2Product.nowPrice
      : parseFloat(String(v2Product.nowPrice)) || undefined;
  }

  // Convert to CJProduct format and preserve V2-specific fields
  const cjProduct: CJProduct = {
    pid: v2Product.id,
    productNameEn: v2Product.nameEn,
    productSku: v2Product.sku || v2Product.spu || "",
    productImage: v2Product.bigImage || "",
    sellPrice: sellPrice,
    categoryId: v2Product.categoryId,
    productType: v2Product.productType || undefined,
  };

  // Preserve V2-specific fields by merging them into the product object
  // These fields aren't in CJProductSchema but we need them for normalization
  const productWithV2Data = {
    ...cjProduct,
    oneCategoryName: v2Product.oneCategoryName || undefined,
    twoCategoryName: v2Product.twoCategoryName || undefined,
    threeCategoryName: v2Product.threeCategoryName || undefined,
    directMinOrderNum: v2Product.directMinOrderNum ?? undefined,
    supplierName: v2Product.supplierName || undefined,
    warehouseInventoryNum: v2Product.warehouseInventoryNum ?? undefined,
    totalVerifiedInventory: v2Product.totalVerifiedInventory ?? undefined,
  } as CJProduct & {
    oneCategoryName?: string;
    twoCategoryName?: string;
    threeCategoryName?: string;
    directMinOrderNum?: number;
    supplierName?: string;
    warehouseInventoryNum?: number;
    totalVerifiedInventory?: number;
  };

  return productWithV2Data;
}

/**
 * Search CJ product catalog using listV2 endpoint
 * Uses Elasticsearch for better search quality
 * @param params - Search parameters
 * @returns List of products
 */
export async function searchCJProductsV2(
  params: CJProductQueryRequest & {
    countryCode?: string; // Shipping origin country code
    startSellPrice?: number; // Min price (alias for minPrice)
    endSellPrice?: number; // Max price (alias for maxPrice)
  }
): Promise<{ products: CJProduct[]; total: number }> {
  try {
    // Build query string parameters for listV2
    const queryParams = new URLSearchParams();
    if (params.productNameEn) queryParams.append("keyWord", params.productNameEn);
    if (params.categoryId) queryParams.append("categoryId", params.categoryId);

    // Use startSellPrice/endSellPrice for listV2
    const minPrice = params.startSellPrice ?? params.minPrice;
    const maxPrice = params.endSellPrice ?? params.maxPrice;
    if (minPrice !== undefined) queryParams.append("startSellPrice", minPrice.toString());
    if (maxPrice !== undefined) queryParams.append("endSellPrice", maxPrice.toString());

    if (params.countryCode) queryParams.append("countryCode", params.countryCode);
    queryParams.append("page", (params.pageNum || 1).toString());
    queryParams.append("size", Math.min(params.pageSize || 20, 100).toString()); // Max 100 per page

    const queryString = queryParams.toString();
    console.log("CJ listV2 query params:", queryString);

    const response = await makeRequest<unknown>(
      `/product/listV2?${queryString}`,
      {
        method: "GET",
      }
    );

    // Log raw response for debugging (first 1000 chars)
    console.log("CJ listV2 raw response:", JSON.stringify(response, null, 2).substring(0, 1000));

    // Parse listV2 response (different structure)
    let validatedResponse;
    try {
      validatedResponse = CJProductListV2ResponseSchema.parse(response);
    } catch (parseError) {
      // Log the actual response for debugging
      console.error("CJ listV2 parsing error. Response structure:", JSON.stringify(response, null, 2));
      console.error("Parse error details:", parseError);

      // Try to extract products even if schema validation fails
      // This helps us see if there's data but schema is wrong
      if (response && typeof response === "object" && "data" in response) {
        const data = (response as any).data;
        if (data && Array.isArray(data.content)) {
          console.log(`Found ${data.content.length} content items (schema validation failed)`);
          const productCount = data.content.reduce((sum: number, item: any) => {
            return sum + (Array.isArray(item.productList) ? item.productList.length : 0);
          }, 0);
          console.log(`Found ${productCount} products in raw response`);
        }
      }

      // Fallback to regular list endpoint
      console.warn("Falling back to /product/list endpoint due to schema validation error");
      return searchCJProducts(params);
    }

    // Check if response indicates success
    // Handle optional result field - use success field if result is not available
    const isSuccess = validatedResponse.result === true ||
      (validatedResponse.result === undefined && validatedResponse.success === true) ||
      validatedResponse.code === 200;

    if (!isSuccess) {
      throw new CJAPIError(
        `Search failed: ${validatedResponse.message}`,
        validatedResponse.code,
        validatedResponse
      );
    }

    // Extract products from nested structure: data.content[].productList[]
    const allProducts: CJProduct[] = [];
    const content = validatedResponse.data?.content || [];

    if (content.length === 0) {
      console.log("CJ listV2: No content items found in response");
      return {
        products: [],
        total: 0,
      };
    }

    for (const contentItem of content) {
      if (contentItem.productList && Array.isArray(contentItem.productList)) {
        const convertedProducts = contentItem.productList
          .map(convertV2ProductToCJProduct)
          .filter((p): p is CJProduct => p !== null); // Filter out null products
        allProducts.push(...convertedProducts);
      }
    }

    const total = validatedResponse.data?.totalRecords ?? allProducts.length;

    console.log(`CJ listV2: Found ${allProducts.length} products (total records: ${total})`);

    return {
      products: allProducts,
      total,
    };
  } catch (error) {
    console.error("Error searching CJ products (listV2):", error);
    // Log the actual response for debugging
    if (error instanceof Error && error.message.includes("ZodError")) {
      console.error("Response structure mismatch. Falling back to /product/list endpoint.");
    }
    // Fallback to regular list endpoint if listV2 fails
    if (error instanceof CJAPIError && error.code !== 401 && error.code !== 403) {
      console.warn("Falling back to /product/list endpoint");
      return searchCJProducts(params);
    }
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to search products"
      );
  }
}

/**
 * Get CJ product details by product ID
 * Note: CJ API returns a list response even when querying by PID
 * @param pid - CJ Product ID
 * @returns Product details
 */
export async function getCJProduct(pid: string): Promise<CJProduct | null> {
  try {
    const response = await makeRequest<unknown>(`/product/list?pid=${pid}`, {
      method: "GET",
    });

    // CJ returns a list response even for single product queries
    const validatedResponse = CJProductListResponseSchema.parse(response);

    if (!isCJSuccess(validatedResponse)) {
      throw new CJAPIError(
        `Get product failed: ${validatedResponse.message}`,
        validatedResponse.code,
        validatedResponse
      );
    }

    // Extract first product from list
    const products = validatedResponse.data?.list || [];
    return products.length > 0 ? products[0] : null;
  } catch (error) {
    console.error(`Error getting CJ product ${pid}:`, error);
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to get product details"
      );
  }
}

/**
 * Get list of CJ categories
 * Flattens the nested category structure into a flat array
 * @returns List of flattened categories
 */
export async function getCJCategories(): Promise<CJCategory[]> {
  try {
    const response = await makeRequest<unknown>("/product/getCategory", {
      method: "GET",
    });

    const validatedResponse = CJCategoryListResponseSchema.parse(response);

    if (!isCJSuccess(validatedResponse)) {
      throw new CJAPIError(
        `Get categories failed: ${validatedResponse.message}`,
        validatedResponse.code,
        validatedResponse
      );
    }

    // Flatten nested category structure
    const flatCategories: CJCategory[] = [];
    const categoryData = validatedResponse.data || [];

    for (const firstLevel of categoryData) {
      for (const secondLevel of firstLevel.categoryFirstList) {
        for (const thirdLevel of secondLevel.categorySecondList) {
          flatCategories.push({
            categoryId: thirdLevel.categoryId,
            categoryName: thirdLevel.categoryName,
            categorySecondName: secondLevel.categorySecondName,
            categoryFirstName: firstLevel.categoryFirstName,
          });
        }
      }
    }

    return flatCategories;
  } catch (error) {
    console.error("Error getting CJ categories:", error);
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to get categories"
      );
  }
}

/**
 * Get user's CJ inventory (products added to their store)
 * Note: CJ's "My Product List" endpoint may not be available for all account tiers.
 * This uses the standard product list endpoint as a fallback.
 * 
 * For better results, users should:
 * 1. Search for specific products using the search tab
 * 2. Import by product URL/PID
 * 
 * @param pageNum - Page number
 * @param pageSize - Page size
 * @returns User's inventory products (general catalog)
 */
export async function getCJInventory(
  pageNum = 1,
  pageSize = 20
): Promise<{ products: CJInventoryProduct[]; total: number }> {
  try {
    // Use standard product list endpoint since dedicated inventory endpoint
    // may not be available for all account types
    const response = await makeRequest<unknown>(
      `/product/list?pageNum=${pageNum}&pageSize=${pageSize}`,
      {
        method: "GET",
      }
    );

    // Parse as product list response
    const validatedResponse = CJProductListResponseSchema.parse(response);

    if (!isCJSuccess(validatedResponse)) {
      throw new CJAPIError(
        `Get products failed: ${validatedResponse.message}`,
        validatedResponse.code,
        validatedResponse
      );
    }

    // Convert CJ products to inventory products
    const products = (validatedResponse.data?.list || []).map((product) => ({
      id: product.pid,
      pid: product.pid,
      productNameEn: product.productNameEn,
      productImage: product.productImage,
      variants: product.variantList,
      addedAt: product.entryTime,
      status: "active",
    }));

    return {
      products,
      total: validatedResponse.data?.total || 0,
    };
  } catch (error) {
    console.error("Error getting CJ inventory:", error);
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to get products"
      );
  }
}

/**
 * Get ALL user's "My Product Lists" from CJ Dropshipping
 * Since the API doesn't support pagination (always returns page 1),
 * we try to fetch as many products as possible in a single request
 * by using a large pageSize.
 * 
 * @returns All products from user's saved lists (limited by API's max page size)
 */
export async function getAllCJMyProducts(): Promise<{ products: CJProduct[]; total: number }> {
  try {
    // Try to fetch with a large page size to get as many products as possible
    // The API may have a maximum, but we'll try 100 (common limit)
    const largePageSize = 100;
    const result = await getCJMyProductsPage(1, largePageSize);

    console.log(`Fetched ${result.products.length} products (total available: ${result.total})`);

    // Note: Since the API doesn't support pagination, we can only get
    // the products from the first page. If there are more products than
    // the page size allows, they won't be accessible via this endpoint.
    if (result.total > result.products.length) {
      console.warn(`⚠️  API returned ${result.products.length} products but total is ${result.total}. ` +
        `Remaining products are not accessible due to API pagination limitation.`);
    }

    return result;
  } catch (error) {
    console.error("Error fetching all CJ my products:", error);
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to fetch all my products"
      );
  }
}

/**
 * Get a single page of user's "My Product Lists" from CJ Dropshipping
 * Fetches products from the user's saved product lists
 * GET /product/myProduct/query?page=1&size=20
 * 
 * Note: This endpoint has a different response structure than /product/list:
 * - Uses pageNumber/pageSize instead of pageNum/pageSize
 * - Uses totalRecords instead of total
 * - Uses content array instead of list
 * - Product structure is different (productId, nameEn, sku, etc.)
 * 
 * WARNING: The API appears to ignore pagination parameters and always returns page 1.
 * 
 * @param pageNum - Page number (default: 1, but API ignores this)
 * @param pageSize - Page size (default: 20, but API may use its own default)
 * @returns List of products from user's saved lists (always page 1)
 */
async function getCJMyProductsPage(
  pageNum = 1,
  pageSize = 20
): Promise<{ products: CJProduct[]; total: number }> {
  try {
    // Build query parameters
    // WARNING: The API appears to ignore pagination parameters entirely.
    // The response always shows pageNumber=1 and pageSize=10 regardless of what we send.
    // This might be a bug in the CJ API, or the endpoint might not support pagination.
    // 
    // We'll try using the response field names (pageNumber/pageSize) in the request,
    // but if this doesn't work, we may need to:
    // 1. Fetch all products and paginate client-side
    // 2. Contact CJ support about pagination support
    // 3. Use a different endpoint if available
    const queryParams = new URLSearchParams();

    // Use pageNumber/pageSize to match response structure
    queryParams.append("pageNumber", pageNum.toString());
    queryParams.append("pageSize", pageSize.toString());

    const url = `/product/myProduct/query?${queryParams.toString()}`;
    console.log(`CJ My Products request: pageNumber=${pageNum}, pageSize=${pageSize}, URL: ${url}`);
    console.warn(`⚠️  API may not support pagination - response always shows pageNumber=1, pageSize=10`);

    const response = await makeRequest<unknown>(url, {
      method: "GET",
    });

    // Log raw response for debugging
    console.log("CJ My Products raw response:", JSON.stringify(response, null, 2).substring(0, 2000));

    // Check if response indicates success
    if (
      typeof response === "object" &&
      response !== null &&
      "code" in response &&
      "result" in response
    ) {
      const responseObj = response as { code: number; result: boolean; message: string; data?: unknown };

      if (!isCJSuccess(responseObj)) {
        throw new CJAPIError(
          `Get my products failed: ${responseObj.message}`,
          responseObj.code,
          responseObj
        );
      }

      // Handle the different response structure
      // My Product endpoint uses: data.content[], data.totalRecords, data.pageNumber, data.pageSize
      if (responseObj.data && typeof responseObj.data === "object" && "content" in responseObj.data) {
        const data = responseObj.data as {
          content?: Array<{
            productId?: string;
            nameEn?: string;
            sku?: string;
            bigImage?: string;
            sellPrice?: string | number;
            productType?: string;
            weight?: string;
            packWeight?: string;
            vid?: string;
            lengthList?: number[];
            heightList?: number[];
            widthList?: number[];
            volumeList?: number[];
            defaultArea?: string;
            createAt?: number;
            totalPrice?: string | number;
            propertyKeyList?: string[];
            [key: string]: unknown;
          }>;
          totalRecords?: number;
          pageNumber?: number;
          pageSize?: number;
        };

        // Log pagination info from response
        console.log(`CJ My Products response pagination: pageNumber=${data.pageNumber}, pageSize=${data.pageSize}, totalRecords=${data.totalRecords}, content.length=${data.content?.length || 0}`);

        // NOTE: The API appears to ignore pagination parameters and always returns page 1
        // The response shows pageNumber=1 and pageSize=10 regardless of what we request.
        // This is likely a limitation or bug in the CJ API.
        // 
        // For now, we'll return whatever the API gives us (always page 1).
        // The UI should handle this by showing a message that pagination isn't supported,
        // or we could implement client-side pagination by fetching all pages.
        const responsePageNumber = data.pageNumber || 1;
        const totalRecords = data.totalRecords || 0;

        if (responsePageNumber === 1 && pageNum > 1) {
          console.warn(`⚠️  API returned pageNumber=1 but we requested page=${pageNum}. Pagination may not be supported by this endpoint.`);
        }

        // Convert My Product format to standard CJProduct format
        const products: CJProduct[] = (data.content || []).map((item) => {
          // Parse sellPrice - handle string prices and ranges like "2.22-2.40"
          let sellPrice: number | undefined = undefined;
          if (item.sellPrice !== undefined && item.sellPrice !== null) {
            const priceStr = String(item.sellPrice);
            // Handle price ranges (e.g., "2.22-2.40") - take the first value
            const priceMatch = priceStr.match(/^([\d.]+)/);
            if (priceMatch) {
              sellPrice = parseFloat(priceMatch[1]) || undefined;
            } else {
              sellPrice = typeof item.sellPrice === "number"
                ? item.sellPrice
                : parseFloat(priceStr) || undefined;
            }
          }

          // Parse packing dimensions - use first value from arrays if available
          let packingLength: number | undefined = undefined;
          let packingWidth: number | undefined = undefined;
          let packingHeight: number | undefined = undefined;
          let packingWeight: number | undefined = undefined;

          if (item.lengthList && item.lengthList.length > 0) {
            packingLength = item.lengthList[0];
          }
          if (item.widthList && item.widthList.length > 0) {
            packingWidth = item.widthList[0];
          }
          if (item.heightList && item.heightList.length > 0) {
            packingHeight = item.heightList[0];
          }

          // Parse weight - handle ranges like "26.00-34.00" - take first value
          if (item.packWeight) {
            const weightStr = String(item.packWeight);
            const weightMatch = weightStr.match(/^([\d.]+)/);
            if (weightMatch) {
              packingWeight = parseFloat(weightMatch[1]) || undefined;
            }
          } else if (item.weight) {
            const weightStr = String(item.weight);
            const weightMatch = weightStr.match(/^([\d.]+)/);
            if (weightMatch) {
              packingWeight = parseFloat(weightMatch[1]) || undefined;
            }
          }

          return {
            pid: item.productId || "",
            productNameEn: item.nameEn || "",
            productSku: item.sku || "",
            productImage: item.bigImage || "",
            sellPrice: sellPrice,
            productType: item.productType,
            packingLength: packingLength,
            packingWidth: packingWidth,
            packingHeight: packingHeight,
            packingWeight: packingWeight,
            // Store additional fields that might be useful
            entryTime: item.createAt ? new Date(item.createAt).toISOString() : undefined,
            // Preserve vid for freight calculation (My Product Lists have vid directly on product)
            vid: item.vid,
          } as CJProduct & {
            entryTime?: string;
            vid?: string;
          };
        });

        return {
          products,
          total: data.totalRecords || 0,
        };
      }

      // Fallback: try to parse as standard product list response
      try {
        const validatedResponse = CJProductListResponseSchema.parse(response);
        if (isCJSuccess(validatedResponse)) {
          return {
            products: validatedResponse.data?.list || [],
            total: validatedResponse.data?.total || 0,
          };
        }
      } catch (parseError) {
        // If standard parsing fails, continue with error
      }

      // If we get here, the response structure is unexpected
      throw new CJAPIError(
        "Unexpected response structure from My Product endpoint",
        500,
        response
      );
    }

    throw new CJAPIError("Invalid response format from CJ API", 500, response);
  } catch (error) {
    console.error("Error getting CJ my products:", error);
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to get my products"
      );
  }
}

/**
 * Get CJ product by URL, PID, or SKU
 * Extracts product identifier from various formats and fetches details
 * @param input - CJ product URL, PID (numeric), or SKU (e.g., CJJBHP0082)
 * @returns Product details
 */
export async function getCJProductByUrl(input: string): Promise<CJProduct | null> {
  try {
    const trimmedInput = input.trim();
    let searchParam: { pid?: string; productSku?: string } = {};

    // If it looks like a URL, try to extract PID
    if (trimmedInput.includes('http') || trimmedInput.includes('cjdropshipping')) {
      // Try various URL patterns
      // 1. pid parameter: ?pid=12345
      // 2. /product/12345
      // 3. /product/12345.html
      const pidMatch =
        trimmedInput.match(/[?&]pid=([^&]+)/) ||
        trimmedInput.match(/\/product\/(\d+)/) ||
        trimmedInput.match(/pid[=:](\d+)/i);

      if (!pidMatch || !pidMatch[1]) {
        throw new CJAPIError(
          "Could not extract product ID from URL. Please use the product search or enter SKU/PID directly."
        );
      }
      searchParam.pid = pidMatch[1];
    } else if (/^\d+$/.test(trimmedInput)) {
      // Pure numeric input - treat as PID
      searchParam.pid = trimmedInput;
    } else {
      // Alphanumeric - likely a SKU (e.g., CJJBHP0082, CJZN218906)
      searchParam.productSku = trimmedInput;
    }

    // Validate input
    if (!searchParam.pid && !searchParam.productSku) {
      throw new CJAPIError("Invalid product identifier");
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (searchParam.pid) {
      queryParams.append("pid", searchParam.pid);
    } else if (searchParam.productSku) {
      queryParams.append("productSku", searchParam.productSku);
    }

    // Fetch product
    console.log(`Searching CJ product with: ${queryParams.toString()}`);
    const response = await makeRequest<unknown>(
      `/product/list?${queryParams.toString()}`,
      {
        method: "GET",
      }
    );

    const validatedResponse = CJProductListResponseSchema.parse(response);

    if (!isCJSuccess(validatedResponse)) {
      throw new CJAPIError(
        `Get product failed: ${validatedResponse.message}`,
        validatedResponse.code,
        validatedResponse
      );
    }

    // Extract first product from list
    const products = validatedResponse.data?.list || [];
    if (products.length === 0) {
      const searchType = searchParam.pid ? 'PID' : 'SKU';
      const searchValue = searchParam.pid || searchParam.productSku;
      throw new CJAPIError(
        `Product not found with ${searchType}: "${searchValue}". ` +
        `This might be because: 1) The product is not in CJ's public catalog, ` +
        `2) The SKU format is different, or 3) The product ID is incorrect. ` +
        `Try searching by product name in the Catalog Search tab instead.`
      );
    }

    console.log(`Found CJ product: ${products[0].productNameEn} (${products[0].pid})`);
    return products[0];
  } catch (error) {
    console.error("Error getting CJ product:", error);
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to get product"
      );
  }
}

/**
 * Batch get multiple CJ products by IDs
 * @param pids - Array of product IDs
 * @returns Array of products (nulls for failed fetches)
 */
export async function batchGetCJProducts(
  pids: string[]
): Promise<(CJProduct | null)[]> {
  const results = await Promise.allSettled(pids.map((pid) => getCJProduct(pid)));

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    console.error("Failed to fetch product:", result.reason);
    return null;
  });
}

/**
 * Get inventory by SKU
 * GET /product/stock/queryBySku
 * Returns inventory information for all warehouses
 */
export async function getCJInventoryBySku(
  sku: string
): Promise<CJInventoryBySkuItem[]> {
  try {
    const response = await makeRequest<unknown>(
      `/product/stock/queryBySku?sku=${encodeURIComponent(sku)}`,
      {
        method: "GET",
      }
    );

    const validatedResponse = CJInventoryBySkuResponseSchema.parse(response);

    if (!isCJSuccess(validatedResponse)) {
      throw new CJAPIError(
        `Get inventory failed: ${validatedResponse.message}`,
        validatedResponse.code,
        validatedResponse
      );
    }

    return validatedResponse.data || [];
  } catch (error) {
    console.error(`Error getting CJ inventory for SKU ${sku}:`, error);
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to get inventory"
      );
  }
}

/**
 * Calculate freight/shipping options
 * POST /logistic/freightCalculate
 * Returns available shipping options with prices and delivery times
 */
export interface CJFreightCalculateParams {
  vid: string; // Variant ID (required)
  startCountryCode: string; // Origin country (e.g., "CN")
  endCountryCode: string; // Destination country (e.g., "US")
  quantity?: number; // Quantity (default: 1)
  zip?: string;
  taxId?: string;
  houseNumber?: string;
  iossNumber?: string;
}

export async function getCJFreightCalculate(
  params: CJFreightCalculateParams
): Promise<CJFreightOption[]> {
  try {
    const requestBody = {
      startCountryCode: params.startCountryCode,
      endCountryCode: params.endCountryCode,
      products: [
        {
          quantity: params.quantity || 1,
          vid: params.vid,
        },
      ],
      ...(params.zip && { zip: params.zip }),
      ...(params.taxId && { taxId: params.taxId }),
      ...(params.houseNumber && { houseNumber: params.houseNumber }),
      ...(params.iossNumber && { iossNumber: params.iossNumber }),
    };

    console.log("CJ Freight Calculate Request:", JSON.stringify(requestBody, null, 2));

    const response = await makeRequest<unknown>(
      "/logistic/freightCalculate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log("CJ Freight Calculate Response (full):", JSON.stringify(response, null, 2));
    console.log("CJ Freight Calculate Response (data):", response && typeof response === 'object' && 'data' in response ? (response as any).data : 'no data field');

    const validatedResponse = CJFreightCalculateResponseSchema.parse(response);

    if (!isCJSuccess(validatedResponse)) {
      throw new CJAPIError(
        `Freight calculation failed: ${validatedResponse.message}`,
        validatedResponse.code,
        validatedResponse
      );
    }

    const options = validatedResponse.data || [];
    console.log(`CJ Freight Calculate returned ${options.length} shipping options`);

    return options;
  } catch (error) {
    console.error(`Error calculating freight for vid ${params.vid}:`, error);
    throw error instanceof CJAPIError
      ? error
      : new CJAPIError(
        error instanceof Error ? error.message : "Failed to calculate freight"
      );
  }
}

/**
 * Calculate average delivery days from logisticAging strings
 * Handles formats like "2-5", "12-50", etc.
 * Returns the average of min and max days
 */
export function calculateAverageDeliveryDays(
  logisticAging: string
): number | null {
  const match = logisticAging.match(/(\d+)-(\d+)/);
  if (!match) {
    return null;
  }
  const min = parseInt(match[1], 10);
  const max = parseInt(match[2], 10);
  if (isNaN(min) || isNaN(max)) {
    return null;
  }
  return Math.round((min + max) / 2);
}

/**
 * Test CJ API connection
 * Makes a simple API call to verify credentials
 * @returns true if connection successful
 */
export async function testCJAPIConnection(): Promise<boolean> {
  try {
    // Try to get categories as a simple test
    await getCJCategories();
    return true;
  } catch (error) {
    console.error("CJ API connection test failed:", error);
    return false;
  }
}

