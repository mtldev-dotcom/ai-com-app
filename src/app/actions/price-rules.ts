/**
 * Price Rules Server Actions
 * Server-side actions for managing price rules
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { priceRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Get all price rules
 */
export async function getAllPriceRules() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const rules = await db.select().from(priceRules).orderBy(priceRules.ruleName);
  return rules;
}

/**
 * Get active price rules
 */
export async function getActivePriceRules() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const rules = await db
    .select()
    .from(priceRules)
    .where(eq(priceRules.active, true))
    .orderBy(priceRules.ruleName);

  return rules;
}

/**
 * Get price rule by ID
 */
export async function getPriceRule(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [rule] = await db
    .select()
    .from(priceRules)
    .where(eq(priceRules.id, id))
    .limit(1);

  return rule || null;
}

/**
 * Create price rule
 */
export async function createPriceRule(params: {
  ruleName: string;
  targetMarginPct: number;
  minMarginPct?: number;
  roundingRule: ".99" | ".95" | "none";
  currencyPreference: "CAD" | "USD" | "AUTO";
  active?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const [newRule] = await db
    .insert(priceRules)
    .values({
      ruleName: params.ruleName,
      targetMarginPct: params.targetMarginPct.toString(),
      minMarginPct: params.minMarginPct?.toString(),
      roundingRule: params.roundingRule,
      currencyPreference: params.currencyPreference,
      active: params.active ?? true,
    })
    .returning();

  revalidatePath("/settings/price-rules");
  return newRule;
}

/**
 * Update price rule
 */
export async function updatePriceRule(
  id: string,
  params: {
    ruleName?: string;
    targetMarginPct?: number;
    minMarginPct?: number;
    roundingRule?: ".99" | ".95" | "none";
    currencyPreference?: "CAD" | "USD" | "AUTO";
    active?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const updateData: Partial<typeof priceRules.$inferInsert> = {};

  if (params.ruleName !== undefined) {
    updateData.ruleName = params.ruleName;
  }
  if (params.targetMarginPct !== undefined) {
    updateData.targetMarginPct = params.targetMarginPct.toString();
  }
  if (params.minMarginPct !== undefined) {
    updateData.minMarginPct = params.minMarginPct.toString();
  }
  if (params.roundingRule !== undefined) {
    updateData.roundingRule = params.roundingRule;
  }
  if (params.currencyPreference !== undefined) {
    updateData.currencyPreference = params.currencyPreference;
  }
  if (params.active !== undefined) {
    updateData.active = params.active;
  }

  const [updated] = await db
    .update(priceRules)
    .set(updateData)
    .where(eq(priceRules.id, id))
    .returning();

  if (!updated) {
    throw new Error("Price rule not found");
  }

  revalidatePath("/settings/price-rules");
  return updated;
}

/**
 * Delete price rule
 */
export async function deletePriceRule(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.delete(priceRules).where(eq(priceRules.id, id));
  revalidatePath("/settings/price-rules");
}
