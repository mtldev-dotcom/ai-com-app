/**
 * Price Rules API Route
 * GET /api/price-rules - List all price rules
 * POST /api/price-rules - Create new price rule
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllPriceRules, createPriceRule } from "@/app/actions/price-rules";
import { z } from "zod";

const createPriceRuleSchema = z.object({
  ruleName: z.string().min(1),
  targetMarginPct: z.number().min(0).max(1000),
  minMarginPct: z.number().min(0).max(1000).optional(),
  roundingRule: z.enum([".99", ".95", "none"]),
  currencyPreference: z.enum(["CAD", "USD", "AUTO"]),
  active: z.boolean().optional(),
});

/**
 * GET /api/price-rules
 * List all price rules
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await getAllPriceRules();
    return NextResponse.json({ rules }, { status: 200 });
  } catch (error) {
    console.error("Get price rules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch price rules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/price-rules
 * Create new price rule
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createPriceRuleSchema.parse(body);

    const newRule = await createPriceRule(validated);

    return NextResponse.json({ rule: newRule }, { status: 201 });
  } catch (error) {
    console.error("Create price rule error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create price rule" },
      { status: 500 }
    );
  }
}
