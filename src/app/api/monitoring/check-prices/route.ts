/**
 * Price Monitoring API Route
 * POST /api/monitoring/check-prices - Trigger manual price check
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/user/get-user-role";
import { runPriceMonitoring } from "@/lib/monitoring/check-prices";

/**
 * POST /api/monitoring/check-prices
 * Trigger price monitoring check
 * Requires manager or owner role
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

    // Check role (manager or owner)
    const role = await getUserRole();
    if (role !== "owner" && role !== "manager") {
      return NextResponse.json(
        { error: "Only managers and owners can run price checks" },
        { status: 403 }
      );
    }

    // Run price monitoring
    const results = await runPriceMonitoring();

    return NextResponse.json(
      {
        success: true,
        checked: results.checked,
        alerts: results.alerts,
        errors: results.errors,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Price check error:", error);
    return NextResponse.json(
      { error: "Failed to run price check" },
      { status: 500 }
    );
  }
}
