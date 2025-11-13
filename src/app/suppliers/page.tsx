"use client";

/**
 * Suppliers List Page
 * Displays all suppliers with ratings and allows navigation to detail page
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
// Using HTML table (consistent with drafts page)
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Star,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { getAllSuppliersAction, deleteSupplier } from "@/app/actions/suppliers";
import type { Supplier } from "@/db/schema/suppliers";

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getAllSuppliersAction();
      setSuppliers(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
      setError(err instanceof Error ? err.message : "Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteSupplier(id);
      await loadSuppliers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete supplier"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatRating = (rating: string | null): string => {
    if (!rating) return "-";
    return parseFloat(rating).toFixed(1);
  };

  const renderStars = (rating: string | null) => {
    if (!rating) {
      return <span className="text-muted-foreground">Not rated</span>;
    }
    const num = parseFloat(rating);
    const fullStars = Math.floor(num);
    const hasHalf = num % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalf && (
          <Star className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={i} className="h-4 w-4 text-muted-foreground" />
        ))}
        <span className="ml-1 text-sm font-medium">{formatRating(rating)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Suppliers</h1>
            <p className="text-muted-foreground">
              Manage supplier profiles and ratings ({suppliers.length} total)
            </p>
          </div>
          <Button onClick={() => router.push("/suppliers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <span>{error}</span>
          </div>
        )}

        {suppliers.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No suppliers found. Create your first supplier to get started.
            </p>
            <Button onClick={() => router.push("/suppliers/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Contact</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Quality
                    </th>
                    <th className="px-4 py-3 text-center font-medium">Speed</th>
                    <th className="px-4 py-3 text-center font-medium">Price</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Support
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Average
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{supplier.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-sm">
                          {supplier.contactEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {supplier.contactEmail}
                              </span>
                            </div>
                          )}
                          {supplier.contactPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {supplier.contactPhone}
                              </span>
                            </div>
                          )}
                          {supplier.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <a
                                href={supplier.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Website
                              </a>
                            </div>
                          )}
                          {!supplier.contactEmail &&
                            !supplier.contactPhone &&
                            !supplier.website && (
                              <span className="text-muted-foreground">
                                No contact info
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {renderStars(supplier.qualityRating)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {renderStars(supplier.speedRating)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {renderStars(supplier.priceRating)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {renderStars(supplier.supportRating)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          {supplier.averageRating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {formatRating(supplier.averageRating)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/suppliers/${supplier.id}`)
                            }
                            title="Edit supplier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleDelete(supplier.id, supplier.name)
                            }
                            disabled={deletingId === supplier.id}
                            title="Delete supplier"
                          >
                            {deletingId === supplier.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
