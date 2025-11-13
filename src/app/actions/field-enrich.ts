"use server";

/**
 * Field-Specific AI Enrichment Actions
 * Individual field enrichment for product detail page
 */
import { generateWithOpenAI } from "@/lib/ai/openai-client";
import { generateWithGemini } from "@/lib/ai/gemini-client";
import { getProductDraftById } from "@/db/queries/products-draft";
import { createClient } from "@/lib/supabase/server";

type AIProvider = "openai" | "gemini";

/**
 * Generate handle (slug) from title
 */
export async function generateHandleAction(
  title: string,
  _provider: AIProvider = "openai"
): Promise<{ success: boolean; handle?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    if (!title || title.trim().length === 0) {
      return { success: false, error: "Title is required" };
    }

    // Simple slug generation (no AI needed, but we can enhance it)
    const handle = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);

    return { success: true, handle };
  } catch (error) {
    console.error("Generate handle error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate handle",
    };
  }
}

/**
 * Generate tags from product title and description
 */
export async function generateTagsAction(
  title: string,
  description?: string,
  provider: AIProvider = "openai"
): Promise<{ success: boolean; tags?: string[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const prompt = `You are an e-commerce tagging expert. Based on the following product information, generate 5-8 relevant tags (comma-separated).

Product Title: ${title}
Description: ${description || "N/A"}

Generate relevant tags that customers would use to find this product. Return only a comma-separated list of tags, no explanations.
Example format: tag1, tag2, tag3, tag4, tag5`;

    let response: string;
    if (provider === "gemini") {
      response = await generateWithGemini(prompt);
    } else {
      response = await generateWithOpenAI(prompt);
    }

    // Extract tags from response
    const tags = response
      .trim()
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8); // Limit to 8 tags

    return { success: true, tags };
  } catch (error) {
    console.error("Generate tags error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate tags",
    };
  }
}

/**
 * Generate material and type from product information
 */
export async function generateMaterialTypeAction(
  title: string,
  description?: string,
  provider: AIProvider = "openai"
): Promise<{
  success: boolean;
  material?: string;
  type?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const prompt = `You are a product classification expert. Based on the following product information, identify:
1. The primary material (e.g., "Plastic", "Metal", "Wood", "Fabric")
2. The product type/category (e.g., "Electronics", "Home & Kitchen", "Sports & Outdoors")

Product Title: ${title}
Description: ${description || "N/A"}

Respond in JSON format:
{
  "material": "...",
  "type": "..."
}`;

    let response: string;
    if (provider === "gemini") {
      response = await generateWithGemini(prompt);
    } else {
      response = await generateWithOpenAI(prompt);
    }

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response is not valid JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      material?: string;
      type?: string;
    };

    return {
      success: true,
      material: parsed.material,
      type: parsed.type,
    };
  } catch (error) {
    console.error("Generate material/type error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate material/type",
    };
  }
}

/**
 * Generate/improve title using AI
 */
export async function generateTitleAction(
  productId: string,
  language: "en" | "fr",
  provider: AIProvider = "openai"
): Promise<{ success: boolean; title?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const product = await getProductDraftById(productId);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const existingTitleEn = product.product.titleEn || "";
    const existingTitleFr = product.product.titleFr || "";
    const existingDescription =
      product.product.descriptionEn || product.product.descriptionFr || "";

    const targetLang = language === "fr" ? "French" : "English";
    const existingTitle = language === "en" ? existingTitleEn : existingTitleFr;

    const prompt = `You are an e-commerce product title expert. ${existingTitle ? "Improve the existing title" : "Generate a new title"} for this product in ${targetLang}.

Existing Title: ${existingTitle || "None"}
Product Description: ${existingDescription || "N/A"}

Generate a concise, SEO-friendly product title (50-70 characters) that:
- Is compelling and clear
- Includes key product features
- Is optimized for search

Return only the title, no explanations.`;

    let response: string;
    if (provider === "gemini") {
      response = await generateWithGemini(prompt);
    } else {
      response = await generateWithOpenAI(prompt);
    }

    const title = response.trim().replace(/^["']|["']$/g, "");

    return { success: true, title };
  } catch (error) {
    console.error("Generate title error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate title",
    };
  }
}

/**
 * Generate/improve description using AI
 */
export async function generateDescriptionAction(
  productId: string,
  language: "en" | "fr",
  provider: AIProvider = "openai"
): Promise<{ success: boolean; description?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const product = await getProductDraftById(productId);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const existingTitleEn = product.product.titleEn || "";
    const existingTitleFr = product.product.titleFr || "";
    const existingDescriptionEn = product.product.descriptionEn || "";
    const existingDescriptionFr = product.product.descriptionFr || "";
    const specs = product.product.specifications || {};

    const targetLang = language === "fr" ? "French" : "English";
    const existingTitle = language === "en" ? existingTitleEn : existingTitleFr;
    const existingDescription =
      language === "en" ? existingDescriptionEn : existingDescriptionFr;

    const prompt = `You are an e-commerce product description expert. ${existingDescription ? "Improve the existing description" : "Generate a new description"} for this product in ${targetLang}.

Product Title: ${existingTitle || "N/A"}
Existing Description: ${existingDescription || "None"}
Specifications: ${JSON.stringify(specs)}

Generate a compelling product description (3-5 sentences) that:
- Highlights key features and benefits
- Is persuasive and engaging
- Includes relevant technical details from specifications
- Is optimized for conversions

Return only the description, no explanations.`;

    let response: string;
    if (provider === "gemini") {
      response = await generateWithGemini(prompt);
    } else {
      response = await generateWithOpenAI(prompt);
    }

    const description = response.trim().replace(/^["']|["']$/g, "");

    return { success: true, description };
  } catch (error) {
    console.error("Generate description error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate description",
    };
  }
}
