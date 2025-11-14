/**
 * Zod validation schemas for database entities
 * Used for API request/response validation
 */
import { z } from "zod";

/**
 * Supplier validation schema
 */
export const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  speedRating: z.number().min(1).max(5).optional(),
  priceRating: z.number().min(1).max(5).optional(),
  supportRating: z.number().min(1).max(5).optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

/**
 * Product draft validation schema
 */
export const productDraftSchema = z.object({
  supplierId: z.string().uuid("Invalid supplier ID"),
  titleFr: z.string().optional(),
  titleEn: z.string().min(1, "English title is required"),
  descriptionFr: z.string().optional(),
  descriptionEn: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  cost: z.number().positive("Cost must be positive"),
  sellingPrice: z.number().positive().optional(),
  margin: z.number().optional(),
  specifications: z.record(z.unknown()).optional(),
  status: z
    .enum(["draft", "enriched", "ready", "published", "archived"])
    .default("draft"),
});

export type ProductDraftInput = z.infer<typeof productDraftSchema>;

/**
 * Variant draft validation schema
 */
export const variantDraftSchema = z.object({
  productDraftId: z.string().uuid("Invalid product draft ID"),
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().optional(),
  priceAdjustment: z.number().default(0),
  stock: z.number().int().min(0).default(0),
  metadata: z.string().optional(),
});

export type VariantDraftInput = z.infer<typeof variantDraftSchema>;

/**
 * Import validation schema
 */
export const importSchema = z.object({
  sourceType: z.enum(["csv", "xlsx", "url"]),
  sourceUrl: z.string().url().optional(),
  filename: z.string().optional(),
  mappedColumns: z.record(z.string()).optional(),
});

export type ImportInput = z.infer<typeof importSchema>;

/**
 * Auth validation schemas
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * AI Enrichment validation schemas
 */

/**
 * Enrich input schema
 */
export const enrichInputSchema = z
  .object({
    productId: z.string().uuid("Invalid product ID").optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    specifications: z.record(z.unknown()).optional(),
    provider: z.enum(["openai", "gemini"]).default("openai"),
  })
  .refine((data) => data.productId || data.title || data.description, {
    message: "Either productId or title/description must be provided",
  });

export type EnrichInput = z.infer<typeof enrichInputSchema>;

/**
 * Enrich output schema
 */
export const enrichOutputSchema = z.object({
  titleEn: z.string().optional(),
  titleFr: z.string().optional(),
  subtitle: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionFr: z.string().optional(),
  specifications: z.record(z.unknown()).optional(),
});

export type EnrichOutput = z.infer<typeof enrichOutputSchema>;

/**
 * Translate input schema
 */
export const translateInputSchema = z.object({
  text: z.string().min(1, "Text is required"),
  targetLanguage: z.enum(["fr", "en"]),
  sourceLanguage: z.enum(["fr", "en", "auto"]).default("auto"),
  provider: z.enum(["openai", "gemini"]).default("openai"),
});

export type TranslateInput = z.infer<typeof translateInputSchema>;

/**
 * Translate output schema
 */
export const translateOutputSchema = z.object({
  translatedText: z.string(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
});

export type TranslateOutput = z.infer<typeof translateOutputSchema>;

/**
 * Specs input schema
 */
export const specsInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  existingSpecs: z.record(z.unknown()).optional(),
  provider: z.enum(["openai", "gemini"]).default("openai"),
});

export type SpecsInput = z.infer<typeof specsInputSchema>;

/**
 * Specs output schema
 */
export const specsOutputSchema = z.object({
  specifications: z.record(z.unknown()),
});

export type SpecsOutput = z.infer<typeof specsOutputSchema>;

/**
 * SEO input schema
 */
export const seoInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  provider: z.enum(["openai", "gemini"]).default("openai"),
});

export type SeoInput = z.infer<typeof seoInputSchema>;

/**
 * SEO output schema
 */
export const seoOutputSchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  keywords: z.array(z.string()).optional(),
});

export type SeoOutput = z.infer<typeof seoOutputSchema>;
