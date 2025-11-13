/**
 * Dashboard page
 * Protected route - requires authentication
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.email}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Produits</h2>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Total produits</p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Suppliers</h2>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Active suppliers</p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">Imports</h2>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Total imports</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
