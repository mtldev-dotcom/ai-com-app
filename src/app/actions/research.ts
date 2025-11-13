/**
 * Research Server Actions
 * Server-side actions for AI research features
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  analyzeTrends,
  findSuppliers,
  researchProduct,
} from "@/lib/ai/research";
import { getAllSuppliers } from "@/db/queries/suppliers";
/**
 * Analyze trends for keywords
 */
export async function analyzeTrendsAction(keywords: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!keywords.trim()) {
    throw new Error("Keywords are required");
  }

  try {
    const result = await analyzeTrends(keywords);
    return result;
  } catch (error) {
    console.error("Trend analysis error:", error);
    throw error;
  }
}

/**
 * Find suppliers matching criteria
 */
export async function findSuppliersAction(criteria: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!criteria.trim()) {
    throw new Error("Search criteria are required");
  }

  try {
    // Get all suppliers
    const suppliers = await getAllSuppliers();

    if (suppliers.length === 0) {
      return { matches: [] };
    }

    // Convert to format expected by findSuppliers
    const supplierProfiles = suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      contactEmail: s.contactEmail,
      notes: s.notes,
    }));

    const result = await findSuppliers(criteria, supplierProfiles);
    return result;
  } catch (error) {
    console.error("Supplier finder error:", error);
    throw error;
  }
}

/**
 * Research competitor product
 */
export async function researchProductAction(productInfo: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!productInfo.trim()) {
    throw new Error("Product information is required");
  }

  try {
    const result = await researchProduct(productInfo);
    return result;
  } catch (error) {
    console.error("Product research error:", error);
    throw error;
  }
}

/**
 * Create draft from research result
 */
export async function createDraftFromResearch(data: {
  title: string;
  description: string;
  specs: Record<string, string>;
  features: string[];
  tags: string[];
  supplierId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const { saveDraft } = await import("@/app/actions/drafts");

    // Get supplier ID - if not provided, get first supplier or throw error
    let supplierId = data.supplierId;
    if (!supplierId || supplierId.trim() === "") {
      const suppliers = await getAllSuppliers();
      if (suppliers.length === 0) {
        throw new Error(
          "No suppliers found. Please create a supplier first before creating drafts."
        );
      }
      supplierId = suppliers[0].id;
    }

    // Convert specs to specifications JSONB
    const specifications: Record<string, unknown> = {
      ...data.specs,
      tags: data.tags.join(", "),
      features: data.features,
    };

    // Create draft (pass null as id to create new)
    // Use minimum cost (0.01) to pass validation - user can update it later
    const draft = await saveDraft(null, {
      supplierId,
      titleEn: data.title,
      descriptionEn: data.description,
      specifications,
      cost: "0.01", // Minimum positive value for validation
      status: "draft",
    });

    return draft;
  } catch (error) {
    console.error("Create draft from research error:", error);
    throw error;
  }
}
