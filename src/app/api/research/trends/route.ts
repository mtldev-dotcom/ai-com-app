/**
 * Research API Routes - Trends
 * POST /api/research/trends - Analyze trends for keywords
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeTrendsAction } from "@/app/actions/research";
import { z } from "zod";

const trendsRequestSchema = z.object({
  keywords: z.string().min(1),
});

/**
 * POST /api/research/trends
 * Analyze trends for given keywords
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
    const validated = trendsRequestSchema.parse(body);

    const result = await analyzeTrendsAction(validated.keywords);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error("Trends API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to analyze trends",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
