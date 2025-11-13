/**
 * Price Checks Server Actions
 * Server-side actions for managing price checks and alerts
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { priceChecks, productsDraft } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type PriceCheckWithProduct = {
  id: string;
  productDraftId: string;
  supplierPriceAmount: string;
  supplierPriceCurrency: string;
  sellingPriceAmount: string;
  sellingPriceCurrency: string;
  marginPct: string;
  deltaPct: string | null;
  observedAt: Date;
  product: {
    id: string;
    titleEn: string | null;
    titleFr: string | null;
    cost: string | null;
    sellingPrice: string | null;
    status: string;
  } | null;
};

/**
 * Get price checks with product info
 */
export async function getPriceChecksWithProducts(params?: {
  productDraftId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}): Promise<PriceCheckWithProduct[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const conditions = [];

  if (params?.productDraftId) {
    conditions.push(eq(priceChecks.productDraftId, params.productDraftId));
  }

  if (params?.dateFrom) {
    conditions.push(gte(priceChecks.observedAt, params.dateFrom));
  }

  if (params?.dateTo) {
    conditions.push(lte(priceChecks.observedAt, params.dateTo));
  }

  const checks = await db
    .select({
      id: priceChecks.id,
      productDraftId: priceChecks.productDraftId,
      supplierPriceAmount: priceChecks.supplierPriceAmount,
      supplierPriceCurrency: priceChecks.supplierPriceCurrency,
      sellingPriceAmount: priceChecks.sellingPriceAmount,
      sellingPriceCurrency: priceChecks.sellingPriceCurrency,
      marginPct: priceChecks.marginPct,
      deltaPct: priceChecks.deltaPct,
      observedAt: priceChecks.observedAt,
      product: {
        id: productsDraft.id,
        titleEn: productsDraft.titleEn,
        titleFr: productsDraft.titleFr,
        cost: productsDraft.cost,
        sellingPrice: productsDraft.sellingPrice,
        status: productsDraft.status,
      },
    })
    .from(priceChecks)
    .leftJoin(productsDraft, eq(priceChecks.productDraftId, productsDraft.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(priceChecks.observedAt))
    .limit(params?.limit || 100);

  return checks;
}

/**
 * Get price checks (simple version)
 */
export async function getPriceChecks(params?: {
  productDraftId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const conditions = [];

  if (params?.productDraftId) {
    conditions.push(eq(priceChecks.productDraftId, params.productDraftId));
  }

  if (params?.dateFrom) {
    conditions.push(gte(priceChecks.observedAt, params.dateFrom));
  }

  if (params?.dateTo) {
    conditions.push(lte(priceChecks.observedAt, params.dateTo));
  }

  const checks = await db
    .select()
    .from(priceChecks)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(priceChecks.observedAt))
    .limit(params?.limit || 100);

  return checks;
}

/**
 * Create a price check record
 */
export async function createPriceCheck(params: {
  productDraftId: string;
  supplierPriceAmount: number;
  supplierPriceCurrency: string;
  sellingPriceAmount: number;
  sellingPriceCurrency: string;
  marginPct: number;
  deltaPct?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [check] = await db
    .insert(priceChecks)
    .values({
      productDraftId: params.productDraftId,
      supplierPriceAmount: params.supplierPriceAmount.toString(),
      supplierPriceCurrency: params.supplierPriceCurrency,
      sellingPriceAmount: params.sellingPriceAmount.toString(),
      sellingPriceCurrency: params.sellingPriceCurrency,
      marginPct: params.marginPct.toString(),
      deltaPct: params.deltaPct?.toString(),
    })
    .returning();

  revalidatePath("/monitoring");
  return check;
}
