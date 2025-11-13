"use client";

/**
 * Price Rules Management Page
 * Manage price monitoring rules
 */
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  getAllPriceRules,
  createPriceRule,
  updatePriceRule,
  deletePriceRule,
} from "@/app/actions/price-rules";

type PriceRule = {
  id: string;
  ruleName: string;
  targetMarginPct: string;
  minMarginPct: string | null;
  roundingRule: ".99" | ".95" | "none";
  currencyPreference: "CAD" | "USD" | "AUTO";
  active: boolean;
};

export default function PriceRulesPage() {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PriceRule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [ruleName, setRuleName] = useState("");
  const [targetMarginPct, setTargetMarginPct] = useState(50);
  const [minMarginPct, setMinMarginPct] = useState<number | null>(null);
  const [roundingRule, setRoundingRule] = useState<".99" | ".95" | "none">(
    "none"
  );
  const [currencyPreference, setCurrencyPreference] = useState<
    "CAD" | "USD" | "AUTO"
  >("CAD");
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await getAllPriceRules();
      setRules(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load price rules:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load price rules"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRule(null);
    setRuleName("");
    setTargetMarginPct(50);
    setMinMarginPct(null);
    setRoundingRule("none");
    setCurrencyPreference("CAD");
    setActive(true);
    setIsDialogOpen(true);
  };

  const handleEdit = (rule: PriceRule) => {
    setEditingRule(rule);
    setRuleName(rule.ruleName);
    setTargetMarginPct(parseFloat(rule.targetMarginPct));
    setMinMarginPct(rule.minMarginPct ? parseFloat(rule.minMarginPct) : null);
    setRoundingRule(rule.roundingRule);
    setCurrencyPreference(rule.currencyPreference);
    setActive(rule.active);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!ruleName.trim()) {
      setError("Rule name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingRule) {
        await updatePriceRule(editingRule.id, {
          ruleName,
          targetMarginPct,
          minMarginPct: minMarginPct || undefined,
          roundingRule,
          currencyPreference,
          active,
        });
      } else {
        await createPriceRule({
          ruleName,
          targetMarginPct,
          minMarginPct: minMarginPct || undefined,
          roundingRule,
          currencyPreference,
          active,
        });
      }

      setIsDialogOpen(false);
      await loadRules();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save price rule"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deletePriceRule(id);
      await loadRules();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete price rule"
      );
    }
  };

  const handleToggleActive = async (rule: PriceRule) => {
    try {
      await updatePriceRule(rule.id, { active: !rule.active });
      await loadRules();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update price rule"
      );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Price Rules</h1>
            <p className="text-muted-foreground">
              Configure pricing rules for automatic monitoring ({rules.length}{" "}
              rules)
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <span>{error}</span>
          </div>
        )}

        {rules.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No price rules found. Create your first rule to get started.
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Rule Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Target Margin
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Min Margin
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Rounding
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Currency
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{rule.ruleName}</td>
                    <td className="px-4 py-3">
                      {parseFloat(rule.targetMarginPct).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      {rule.minMarginPct
                        ? `${parseFloat(rule.minMarginPct).toFixed(2)}%`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {rule.roundingRule}
                    </td>
                    <td className="px-4 py-3">{rule.currencyPreference}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {rule.active ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Inactive
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(rule)}
                        >
                          {rule.active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(rule.id, rule.ruleName)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Edit Price Rule" : "Create Price Rule"}
              </DialogTitle>
              <DialogDescription>
                Define pricing rules for automatic margin monitoring and price
                calculations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ruleName">Rule Name *</Label>
                <Input
                  id="ruleName"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., Standard Pricing Rule"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetMarginPct">Target Margin (%) *</Label>
                  <Input
                    id="targetMarginPct"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    value={targetMarginPct}
                    onChange={(e) =>
                      setTargetMarginPct(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="minMarginPct">Min Margin (%)</Label>
                  <Input
                    id="minMarginPct"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    value={minMarginPct || ""}
                    onChange={(e) =>
                      setMinMarginPct(
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roundingRule">Rounding Rule</Label>
                  <Select
                    value={roundingRule}
                    onValueChange={(value: ".99" | ".95" | "none") =>
                      setRoundingRule(value)
                    }
                  >
                    <SelectTrigger id="roundingRule">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value=".99">Round to .99</SelectItem>
                      <SelectItem value=".95">Round to .95</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currencyPreference">
                    Currency Preference
                  </Label>
                  <Select
                    value={currencyPreference}
                    onValueChange={(value: "CAD" | "USD" | "AUTO") =>
                      setCurrencyPreference(value)
                    }
                  >
                    <SelectTrigger id="currencyPreference">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="AUTO">AUTO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
