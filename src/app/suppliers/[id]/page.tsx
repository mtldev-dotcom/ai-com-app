"use client";

/**
 * Supplier Detail/Edit Page
 * Allows editing supplier information and ratings
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Loader2,
  Star,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  getSupplierAction,
  updateSupplier,
  createSupplier,
} from "@/app/actions/suppliers";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [qualityRating, setQualityRating] = useState<number | undefined>(
    undefined
  );
  const [speedRating, setSpeedRating] = useState<number | undefined>(undefined);
  const [priceRating, setPriceRating] = useState<number | undefined>(undefined);
  const [supportRating, setSupportRating] = useState<number | undefined>(
    undefined
  );
  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      loadSupplier();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  useEffect(() => {
    // Calculate average rating when individual ratings change
    const ratings = [
      qualityRating,
      speedRating,
      priceRating,
      supportRating,
    ].filter((r) => r !== undefined && r !== null) as number[];

    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, val) => acc + val, 0);
      const avg = Math.round((sum / ratings.length) * 100) / 100;
      setAverageRating(avg);
    } else {
      setAverageRating(null);
    }
  }, [qualityRating, speedRating, priceRating, supportRating]);

  const loadSupplier = async () => {
    if (!id || isNew) return;

    setLoading(true);
    try {
      const supplier = await getSupplierAction(id);
      if (supplier) {
        setName(supplier.name);
        setContactEmail(supplier.contactEmail || "");
        setContactPhone(supplier.contactPhone || "");
        setWebsite(supplier.website || "");
        setNotes(supplier.notes || "");
        setQualityRating(
          supplier.qualityRating
            ? parseFloat(supplier.qualityRating)
            : undefined
        );
        setSpeedRating(
          supplier.speedRating ? parseFloat(supplier.speedRating) : undefined
        );
        setPriceRating(
          supplier.priceRating ? parseFloat(supplier.priceRating) : undefined
        );
        setSupportRating(
          supplier.supportRating
            ? parseFloat(supplier.supportRating)
            : undefined
        );
        setAverageRating(
          supplier.averageRating ? parseFloat(supplier.averageRating) : null
        );
      } else {
        setError("Supplier not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Supplier name is required");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isNew) {
        const result = await createSupplier({
          name,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
          website: website || undefined,
          notes: notes || undefined,
          qualityRating,
          speedRating,
          priceRating,
          supportRating,
        });

        if (result.success && result.supplier) {
          setSuccess("Supplier created successfully");
          setTimeout(() => {
            router.push(`/suppliers/${result.supplier.id}`);
          }, 1500);
        }
      } else {
        await updateSupplier(id, {
          name,
          contactEmail: contactEmail || undefined,
          contactPhone: contactPhone || undefined,
          website: website || undefined,
          notes: notes || undefined,
          qualityRating,
          speedRating,
          priceRating,
          supportRating,
        });

        setSuccess("Supplier updated successfully");
        setTimeout(() => setSuccess(null), 3000);
        // Reload to get updated average rating
        await loadSupplier();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const renderStarInput = (
    label: string,
    value: number | undefined,
    onChange: (value: number | undefined) => void
  ) => {
    const handleStarClick = (rating: number) => {
      onChange(value === rating ? undefined : rating);
    };

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleStarClick(rating)}
                className="focus:outline-none focus:ring-2 focus:ring-ring rounded"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    value && rating <= value
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground hover:text-yellow-400"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {value ? `${value}.0 / 5.0` : "Not rated"}
          </span>
        </div>
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/suppliers")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {isNew ? "New Supplier" : "Edit Supplier"}
              </h1>
              <p className="text-muted-foreground">
                {isNew
                  ? "Create a new supplier profile"
                  : "Edit supplier information and ratings"}
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Supplier name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="supplier@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes about this supplier..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderStarInput("Quality", qualityRating, setQualityRating)}
                {renderStarInput("Speed", speedRating, setSpeedRating)}
                {renderStarInput("Price", priceRating, setPriceRating)}
                {renderStarInput("Support", supportRating, setSupportRating)}

                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Average Rating</Label>
                    <div className="flex items-center gap-2">
                      {averageRating !== null ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                            <span className="text-2xl font-bold">
                              {averageRating.toFixed(1)}
                            </span>
                            <span className="text-muted-foreground">/ 5.0</span>
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Rate at least one category to see average
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
