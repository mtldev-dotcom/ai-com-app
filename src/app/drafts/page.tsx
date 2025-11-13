"use client";

/**
 * Redirect from old /drafts route to /products
 * This page has been merged into /products
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Loader2 } from "lucide-react";

export default function DraftsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to products page
    router.replace("/products");
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">
            Redirecting to Produits page...
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
