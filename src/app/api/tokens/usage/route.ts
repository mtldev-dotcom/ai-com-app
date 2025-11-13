/**
 * Token Usage Logs API Route
 * GET /api/tokens/usage
 * Query usage logs with filters (provider, date range, process_name)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { tokenUsageLogs } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * GET /api/tokens/usage
 * Get usage logs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as
      | "openai"
      | "gemini"
      | "medusa"
      | null;
    const processName = searchParams.get("process_name");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Build query conditions
    const conditions = [];

    if (provider) {
      conditions.push(eq(tokenUsageLogs.provider, provider));
    }

    if (processName) {
      conditions.push(eq(tokenUsageLogs.processName, processName));
    }

    if (fromDate) {
      conditions.push(gte(tokenUsageLogs.usedAt, new Date(fromDate)));
    }

    if (toDate) {
      conditions.push(lte(tokenUsageLogs.usedAt, new Date(toDate)));
    }

    // Query usage logs
    const logs = await db
      .select()
      .from(tokenUsageLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tokenUsageLogs.usedAt))
      .limit(limit);

    return NextResponse.json({ logs }, { status: 200 });
  } catch (error) {
    console.error("Get token usage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage logs" },
      { status: 500 }
    );
  }
}
