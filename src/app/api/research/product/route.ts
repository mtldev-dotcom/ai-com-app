/**
 * Research API Routes - Product
 * POST /api/research/product - Research competitor product
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { researchProductAction } from "@/app/actions/research";
import { z } from "zod";

const productRequestSchema = z.object({
  productInfo: z.string().min(1),
});

/**
 * POST /api/research/product
 * Research competitor product and extract specs
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
    const validated = productRequestSchema.parse(body);

    const result = await researchProductAction(validated.productInfo);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error("Product research API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to research product",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
