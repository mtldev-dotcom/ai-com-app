/**
 * Price Rule API Route (by ID)
 * PUT /api/price-rules/:id - Update price rule
 * DELETE /api/price-rules/:id - Delete price rule
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  updatePriceRule,
  deletePriceRule,
  getPriceRule,
} from "@/app/actions/price-rules";
import { z } from "zod";

const updatePriceRuleSchema = z.object({
  ruleName: z.string().min(1).optional(),
  targetMarginPct: z.number().min(0).max(1000).optional(),
  minMarginPct: z.number().min(0).max(1000).optional().nullable(),
  roundingRule: z.enum([".99", ".95", "none"]).optional(),
  currencyPreference: z.enum(["CAD", "USD", "AUTO"]).optional(),
  active: z.boolean().optional(),
});

/**
 * PUT /api/price-rules/:id
 * Update price rule
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updatePriceRuleSchema.parse(body);

    // Convert null to undefined for minMarginPct
    const updateParams = {
      ...validated,
      minMarginPct: validated.minMarginPct ?? undefined,
    };

    const updated = await updatePriceRule(id, updateParams);

    return NextResponse.json({ rule: updated }, { status: 200 });
  } catch (error) {
    console.error("Update price rule error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update price rule" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/price-rules/:id
 * Delete price rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deletePriceRule(id);

    return NextResponse.json(
      { message: "Price rule deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete price rule error:", error);
    return NextResponse.json(
      { error: "Failed to delete price rule" },
      { status: 500 }
    );
  }
}
