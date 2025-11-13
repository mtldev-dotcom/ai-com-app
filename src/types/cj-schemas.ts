/**
 * CJ Dropshipping API Schemas
 * Type-safe schemas for CJ API requests and responses
 * Based on CJ API Documentation: https://developers.cjdropshipping.com/
 */

import { z } from "zod";

/**
 * Authentication Response Schema
 * POST /authentication/getAccessToken
 * Based on CJ API documentation: https://developers.cjdropshipping.cn/en/api/api2/api/auth.html
 */
export const CJAuthResponseSchema = z.object({
  code: z.number(),
  result: z.boolean(),
  success: z.boolean().optional(), // Some responses include this
  message: z.string(),
  requestId: z.string().optional(),
  data: z
    .object({
      openId: z.number(),
      accessToken: z.string(),
      accessTokenExpiryDate: z.string(), // ISO date string, e.g., "2025-11-19T07:19:23+08:00"
      refreshToken: z.string(),
      refreshTokenExpiryDate: z.string(), // ISO date string
      createDate: z.string(), // ISO date string
    })
    .nullable()
    .optional(),
});

export type CJAuthResponse = z.infer<typeof CJAuthResponseSchema>;

/**
 * Token Refresh Response Schema
 * POST /authentication/refreshAccessToken
 * Based on CJ API documentation: https://developers.cjdropshipping.cn/en/api/api2/api/auth.html
 */
export const CJRefreshTokenResponseSchema = z.object({
  code: z.number(),
  result: z.boolean(),
  success: z.boolean().optional(),
  message: z.string(),
  requestId: z.string().optional(),
  data: z
    .object({
      accessToken: z.string(),
      accessTokenExpiryDate: z.string(), // ISO date string
      refreshToken: z.string(),
      refreshTokenExpiryDate: z.string(), // ISO date string
      createDate: z.string(), // ISO date string
    })
    .nullable()
    .optional(),
});

export type CJRefreshTokenResponse = z.infer<
  typeof CJRefreshTokenResponseSchema
>;

/**
 * Product Variant Schema
 */
export const CJProductVariantSchema = z.object({
  vid: z.string(), // Variant ID
  productNameEn: z.string().optional(),
  productSku: z.string(),
  variantNameEn: z.string().optional(),
  variantSku: z.string().optional(),
  variantImage: z.string().url().optional(),
  variantKey: z.string().optional(), // e.g., "Color:Red|Size:M"
  sellPrice: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(), // USD (CJ returns as string, may be empty)
  listPrice: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(), // USD (MSRP, CJ returns as string, may be empty)
  weight: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  length: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  width: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  height: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  stock: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional()
});

export type CJProductVariant = z.infer<typeof CJProductVariantSchema>;

/**
 * Product Image Schema
 */
export const CJProductImageSchema = z.object({
  url: z.string().url(),
  type: z.string().optional(), // "main", "detail", etc.
});

export type CJProductImage = z.infer<typeof CJProductImageSchema>;

/**
 * Product Schema
 */
export const CJProductSchema = z.object({
  pid: z.string(), // Product ID
  productNameEn: z.string(),
  productNameCn: z.string().optional(),
  productSku: z.string(),
  productImage: z.string().url().optional(),
  productImageList: z.array(CJProductImageSchema).optional(),
  productType: z.string().optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  sellPrice: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(), // USD - base price (CJ returns as string, may be empty)
  listPrice: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(), // USD - MSRP (CJ returns as string, may be empty)
  packingWeight: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  packingLength: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  packingWidth: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  packingHeight: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  variantList: z.array(CJProductVariantSchema).optional(),
  entryTime: z.string().optional(), // ISO date
  isSupportCustomization: z.boolean().optional(),
  sourceFrom: z.string().optional(), // "1688", "taobao", etc.
});

export type CJProduct = z.infer<typeof CJProductSchema>;

/**
 * Product List Response Schema
 * GET /product/list or POST /product/query
 */
export const CJProductListResponseSchema = z.object({
  code: z.number(),
  result: z.boolean(),
  message: z.string(),
  data: z
    .object({
      total: z.coerce.number(),
      list: z.array(CJProductSchema),
      pageNum: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    })
    .nullable()
    .optional(),
});

/**
 * Product List V2 Response Schema
 * GET /product/listV2 - Different structure than /product/list
 */
export const CJProductV2Schema = z.object({
  id: z.union([z.string(), z.number()]).transform((val) => String(val)), // Can be string or number
  nameEn: z.string(),
  sku: z.string().nullable().optional(),
  spu: z.string().nullable().optional(),
  bigImage: z.union([z.string(), z.null()]).transform((val) => {
    if (!val || val === null || val.trim() === "") return undefined;
    return val;
  }).optional(), // May not always be a valid URL or may be empty
  sellPrice: z
    .union([z.string(), z.number(), z.null()])
    .transform((val) => {
      if (val === null) return undefined;
      if (typeof val === "string") {
        // Handle price ranges like "39.40 -- 41.39"
        const rangeMatch = val.match(/(\d+\.?\d*)/);
        return rangeMatch ? parseFloat(rangeMatch[1]) : undefined;
      }
      return typeof val === "number" ? val : undefined;
    })
    .optional(),
  nowPrice: z
    .union([z.string(), z.number(), z.null()])
    .transform((val) => {
      if (val === null) return undefined;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  categoryId: z.union([z.string(), z.number(), z.null()]).transform((val) => val === null ? undefined : String(val)).optional(),
  threeCategoryName: z.string().nullable().optional(),
  twoCategoryName: z.string().nullable().optional(),
  oneCategoryName: z.string().nullable().optional(),
  warehouseInventoryNum: z.number().nullable().optional(),
  totalVerifiedInventory: z.number().nullable().optional(),
  productType: z.string().nullable().optional(),
  supplierName: z.string().nullable().optional(),
  directMinOrderNum: z.number().nullable().optional(),
  isVideo: z.union([z.boolean(), z.number(), z.null()]).transform((val) => val === null ? undefined : (val === 1 || val === true)).optional(),
  customization: z.union([z.boolean(), z.number(), z.null()]).transform((val) => val === null ? undefined : (val === 1 || val === true)).optional(),
});

export type CJProductV2 = z.infer<typeof CJProductV2Schema>;

export const CJProductListV2ResponseSchema = z.object({
  code: z.number(),
  result: z.boolean().optional(),
  success: z.boolean().optional(),
  message: z.string(),
  data: z
    .object({
      content: z
        .array(
          z.object({
            productList: z.array(CJProductV2Schema),
            relatedCategoryList: z.array(z.unknown()).optional(),
            keyWord: z.string().optional(),
            keyWordOld: z.string().optional(),
          })
        )
        .optional(),
      pageNumber: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
      totalRecords: z.coerce.number().optional(),
      totalPages: z.coerce.number().optional(),
    })
    .nullable()
    .optional(),
});

export type CJProductListV2Response = z.infer<typeof CJProductListV2ResponseSchema>;

/**
 * Product Detail Response Schema
 * GET /product/query?pid={pid}
 */
export const CJProductDetailResponseSchema = z.object({
  code: z.number(),
  result: z.boolean(),
  message: z.string(),
  data: CJProductSchema.nullable().optional(),
});

export type CJProductDetailResponse = z.infer<
  typeof CJProductDetailResponseSchema
>;

/**
 * Category Schema (Third Level - Leaf Categories)
 */
export const CJCategoryThirdSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
});

/**
 * Category Schema (Second Level)
 */
export const CJCategorySecondSchema = z.object({
  categorySecondName: z.string(),
  categorySecondList: z.array(CJCategoryThirdSchema),
});

/**
 * Category Schema (First Level)
 */
export const CJCategoryFirstSchema = z.object({
  categoryFirstName: z.string(),
  categoryFirstList: z.array(CJCategorySecondSchema),
});

/**
 * Flat category for easier use in UI
 */
export const CJCategorySchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  categorySecondName: z.string().optional(),
  categoryFirstName: z.string().optional(),
});

export type CJCategory = z.infer<typeof CJCategorySchema>;
export type CJCategoryFirst = z.infer<typeof CJCategoryFirstSchema>;
export type CJCategorySecond = z.infer<typeof CJCategorySecondSchema>;
export type CJCategoryThird = z.infer<typeof CJCategoryThirdSchema>;

/**
 * Category List Response Schema
 * Returns nested category structure
 */
export const CJCategoryListResponseSchema = z.object({
  code: z.number(),
  result: z.boolean(),
  message: z.string(),
  data: z.array(CJCategoryFirstSchema).nullable().optional(),
});

export type CJCategoryListResponse = z.infer<
  typeof CJCategoryListResponseSchema
>;

/**
 * Search/Query Request Schema
 */
export const CJProductQueryRequestSchema = z.object({
  productNameEn: z.string().optional(), // Keyword search
  categoryId: z.string().optional(),
  minPrice: z.number().optional(), // USD
  maxPrice: z.number().optional(), // USD
  pageNum: z.number().default(1),
  pageSize: z.number().max(100).default(20),
  orderBy: z.enum(["price_asc", "price_desc", "sales", "newest"]).optional(),
});

export type CJProductQueryRequest = z.infer<typeof CJProductQueryRequestSchema>;

/**
 * User Inventory Product Schema
 * Products user has added to their store/inventory
 */
export const CJInventoryProductSchema = z.object({
  id: z.string(),
  pid: z.string(),
  productNameEn: z.string(),
  productImage: z.string().url().optional(),
  variants: z.array(CJProductVariantSchema).optional(),
  addedAt: z.string().optional(),
  status: z.string().optional(), // "active", "inactive", etc.
});

export type CJInventoryProduct = z.infer<typeof CJInventoryProductSchema>;

/**
 * User Inventory Response Schema
 * GET /product/user-inventory or similar
 */
export const CJInventoryResponseSchema = z.object({
  code: z.number(),
  result: z.boolean(),
  message: z.string(),
  data: z
    .object({
      total: z.coerce.number(),
      list: z.array(CJInventoryProductSchema),
      pageNum: z.coerce.number().optional(),
      pageSize: z.coerce.number().optional(),
    })
    .nullable()
    .optional(),
});

export type CJInventoryResponse = z.infer<typeof CJInventoryResponseSchema>;

/**
 * API Error Response Schema
 * Standard error format
 */
export const CJErrorResponseSchema = z.object({
  code: z.number(),
  result: z.literal(false),
  message: z.string(),
  data: z.null().optional(),
});

export type CJErrorResponse = z.infer<typeof CJErrorResponseSchema>;

/**
 * Common Response Codes
 */
export const CJ_RESPONSE_CODES = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
  INVALID_TOKEN: 10001,
  TOKEN_EXPIRED: 10002,
} as const;

/**
 * Helper to validate CJ API response
 */
export function validateCJResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  return schema.parse(data);
}

/**
 * Check if response indicates success
 */
export function isCJSuccess(response: { code: number; result: boolean }): boolean {
  return response.result === true && response.code === CJ_RESPONSE_CODES.SUCCESS;
}

/**
 * Inventory by SKU Response Schema
 * GET /product/stock/queryBySku
 */
export const CJInventoryBySkuItemSchema = z.object({
  areaEn: z.string(), // Warehouse name
  areaId: z.union([z.string(), z.number()]).transform((val) => String(val)),
  countryCode: z.string(), // Country code (e.g., "CN", "US")
  totalInventoryNum: z.number(),
  cjInventoryNum: z.number(), // Inventory in CJ warehouse
  factoryInventoryNum: z.number(), // Inventory in factory
  countryNameEn: z.string().optional(),
});

export const CJInventoryBySkuResponseSchema = z.object({
  code: z.number(),
  result: z.boolean(),
  success: z.boolean().optional(),
  message: z.string(),
  data: z.array(CJInventoryBySkuItemSchema).optional(),
  requestId: z.string().optional(),
});

export type CJInventoryBySkuItem = z.infer<typeof CJInventoryBySkuItemSchema>;
export type CJInventoryBySkuResponse = z.infer<typeof CJInventoryBySkuResponseSchema>;

/**
 * Freight Calculation Response Schema
 * POST /logistic/freightCalculate
 */
export const CJFreightOptionSchema = z.object({
  logisticName: z.string(), // Carrier name (e.g., "USPS+")
  logisticPrice: z.number(), // Shipping cost in USD
  logisticPriceCn: z.number().optional(), // Shipping cost in CNY
  logisticAging: z.string(), // Delivery time range (e.g., "2-5")
  taxesFee: z.number().optional(),
  clearanceOperationFee: z.number().optional(),
  totalPostageFee: z.number().optional(),
});

export const CJFreightCalculateResponseSchema = z.object({
  code: z.number(),
  result: z.boolean(),
  message: z.string(),
  data: z.array(CJFreightOptionSchema).optional(),
  requestId: z.string().optional(),
});

export type CJFreightOption = z.infer<typeof CJFreightOptionSchema>;
export type CJFreightCalculateResponse = z.infer<typeof CJFreightCalculateResponseSchema>;

/**
 * Check if error is auth-related
 */
export function isAuthError(code: number): boolean {
  return (
    code === CJ_RESPONSE_CODES.UNAUTHORIZED ||
    code === CJ_RESPONSE_CODES.INVALID_TOKEN ||
    code === CJ_RESPONSE_CODES.TOKEN_EXPIRED
  );
}

