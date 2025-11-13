/**
 * Medusa Admin API Client
 * Handles communication with Medusa Admin API
 * Updated to use settings from database instead of env vars
 */
import { getSetting, SETTING_KEYS } from "@/lib/settings/get-settings";
import { decrypt } from "@/lib/encryption";

/**
 * Medusa API Response types
 */
export interface MedusaProduct {
  id: string;
  title: string;
  handle?: string;
  description?: string;
  images?: Array<{ id: string; url: string }>;
  metadata?: Record<string, unknown>;
  variants?: MedusaVariant[];
  created_at: string;
  updated_at: string;
}

export interface MedusaVariant {
  id: string;
  product_id: string;
  title: string;
  sku?: string;
  price: number;
  inventory_quantity?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateProductPayload {
  title: string;
  description?: string;
  handle?: string;
  images?: Array<{ url: string }>;
  metadata?: Record<string, unknown>;
  is_giftcard?: boolean;
  discountable?: boolean;
  status?: "draft" | "proposed" | "published" | "rejected";
  collection_id?: string;
  tags?: Array<{ id?: string; value?: string }>;
  categories?: Array<{ id: string }>;
  // type?: string; // Removed - not supported by Medusa API (causes "Unrecognized fields: 'type'" error)
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  origin_country?: string;
  hs_code?: string;
  mid_code?: string;
  material?: string;
  options?: Array<{
    title: string;
    values: string[];
  }>;
  variants?: Array<{
    title: string;
    options?: Record<string, string>;
    prices?: Array<{
      amount: number;
      currency_code: string;
    }>;
    sku?: string;
    weight?: number;
    length?: number;
    height?: number;
    width?: number;
    origin_country?: string;
    hs_code?: string;
    mid_code?: string;
    material?: string;
  }>;
  shipping_profile_id?: string;
}

export interface CreateVariantPayload {
  product_id: string;
  title: string;
  sku?: string;
  barcode?: string;
  ean?: string;
  upc?: string;
  inventory_quantity?: number;
  allow_backorder?: boolean;
  manage_inventory?: boolean;
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  origin_country?: string;
  mid_code?: string;
  hs_code?: string;
  material?: string;
  metadata?: Record<string, unknown>;
  prices: Array<{
    amount: number;
    currency_code: string;
  }>;
  options?: Record<string, string>;
}

/**
 * Medusa Admin API Client
 */
class MedusaClient {
  /**
   * Get base URL from settings or fallback to env var
   */
  private async getBaseUrl(): Promise<string> {
    const url = await getSetting<string>(SETTING_KEYS.MEDUSA_ADMIN_URL);
    if (url) {
      return url.replace(/\/$/, ""); // Remove trailing slash
    }

    // Fallback to env var for backward compatibility
    const envUrl = process.env.MEDUSA_BASE_URL;
    if (!envUrl) {
      throw new Error(
        "MEDUSA_ADMIN_URL not configured in settings or MEDUSA_BASE_URL environment variable"
      );
    }
    return envUrl.replace(/\/$/, "");
  }

  /**
   * Get admin token from settings or fallback to env var
   */
  private async getToken(): Promise<string> {
    const encryptedToken = await getSetting<string>(
      SETTING_KEYS.MEDUSA_ADMIN_TOKEN
    );
    if (encryptedToken) {
      try {
        return decrypt(encryptedToken);
      } catch (error) {
        console.error("Failed to decrypt Medusa token:", error);
        throw new Error("Failed to decrypt Medusa admin token");
      }
    }

    // Fallback to env var for backward compatibility
    const envToken = process.env.MEDUSA_ADMIN_API_TOKEN;
    if (!envToken) {
      throw new Error(
        "MEDUSA_ADMIN_TOKEN not configured in settings or MEDUSA_ADMIN_API_TOKEN environment variable"
      );
    }
    return envToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/admin${endpoint}`;
    const token = await this.getToken();

    // Determine authentication method:
    // - API tokens use Basic auth (per Medusa v2 docs)
    // - JWT tokens use Bearer auth
    const isJWT = token.includes(".") && token.split(".").length === 3;
    const authHeader = isJWT
      ? `Bearer ${token}`
      : `Basic ${Buffer.from(`${token}:`).toString("base64")}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Medusa API error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = `${errorMessage} - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Create a product in Medusa
   */
  async createProduct(payload: CreateProductPayload): Promise<MedusaProduct> {
    const response = await this.request<{ product: MedusaProduct }>(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return response.product;
  }

  /**
   * Create a product variant in Medusa
   */
  async createVariant(payload: CreateVariantPayload): Promise<MedusaVariant> {
    const response = await this.request<{ product_variant: MedusaVariant }>(
      `/products/${payload.product_id}/variants`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return response.product_variant;
  }

  /**
   * Get a product by ID
   */
  async getProduct(productId: string): Promise<MedusaProduct> {
    const response = await this.request<{ product: MedusaProduct }>(
      `/products/${productId}`
    );
    return response.product;
  }

  /**
   * Update a product
   */
  async updateProduct(
    productId: string,
    payload: Partial<CreateProductPayload>
  ): Promise<MedusaProduct> {
    const response = await this.request<{ product: MedusaProduct }>(
      `/products/${productId}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    return response.product;
  }
}

// Export singleton instance
export const medusaClient = new MedusaClient();
