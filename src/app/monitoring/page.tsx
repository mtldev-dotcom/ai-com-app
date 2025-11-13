"use client";

/**
 * Monitoring page
 * Shows price monitoring alerts and Medusa sync jobs
 */
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
} from "lucide-react";
import { getSyncJobs } from "@/app/actions/sync-jobs";
import { getPriceChecksWithProducts } from "@/app/actions/price-checks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SyncJob = {
  id: string;
  entityType: string;
  operation: string;
  status: "queued" | "running" | "done" | "error";
  recordCount: number | null;
  logText: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
};

type PriceCheck = {
  id: string;
  productDraftId: string;
  supplierPriceAmount: string;
  supplierPriceCurrency: string;
  sellingPriceAmount: string;
  sellingPriceCurrency: string;
  marginPct: string;
  deltaPct: string | null;
  observedAt: Date;
  product: {
    id: string;
    titleEn: string | null;
    titleFr: string | null;
    cost: string | null;
    sellingPrice: string | null;
    status: string;
  } | null;
};

export default function MonitoringPage() {
  const [loading, setLoading] = useState(true);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [filterEntityType, setFilterEntityType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [priceChecks, setPriceChecks] = useState<PriceCheck[]>([]);
  const [priceChecksLoading, setPriceChecksLoading] = useState(false);
  const [runningPriceCheck, setRunningPriceCheck] = useState(false);

  useEffect(() => {
    loadSyncJobs();
    loadPriceChecks();
  }, [filterEntityType, filterStatus]);

  const loadSyncJobs = async () => {
    try {
      setLoading(true);
      const jobs = await getSyncJobs({
        entityType:
          filterEntityType !== "all" ? (filterEntityType as any) : undefined,
        status: filterStatus !== "all" ? (filterStatus as any) : undefined,
        limit: 50,
      });
      setSyncJobs(jobs);
    } catch (err) {
      console.error("Failed to load sync jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceChecks = async () => {
    try {
      setPriceChecksLoading(true);
      const checks = await getPriceChecksWithProducts({ limit: 100 });
      setPriceChecks(checks);
    } catch (err) {
      console.error("Failed to load price checks:", err);
    } finally {
      setPriceChecksLoading(false);
    }
  };

  const runPriceCheck = async () => {
    try {
      setRunningPriceCheck(true);
      const response = await fetch("/api/monitoring/check-prices", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to run price check");
      }

      const result = await response.json();
      console.log("Price check result:", result);

      // Reload price checks
      await loadPriceChecks();
      await loadSyncJobs();
    } catch (err) {
      console.error("Failed to run price check:", err);
      alert(err instanceof Error ? err.message : "Failed to run price check");
    } finally {
      setRunningPriceCheck(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "running":
        return "text-blue-600";
      case "queued":
        return "text-yellow-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "queued":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor Medusa sync jobs and price alerts
            </p>
          </div>
          <Button onClick={loadSyncJobs} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="sync" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sync">Sync Jobs</TabsTrigger>
            <TabsTrigger value="prices">Price Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="prices" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Price Alerts</h2>
                <p className="text-sm text-muted-foreground">
                  Monitor margin violations and price deltas
                </p>
              </div>
              <Button
                onClick={runPriceCheck}
                disabled={runningPriceCheck}
                variant="outline"
              >
                {runningPriceCheck ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Price Check
                  </>
                )}
              </Button>
            </div>

            {priceChecksLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : priceChecks.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  No price checks found. Run a price check to get started.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Cost
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Selling Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Margin
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Delta
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Observed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {priceChecks.map((check) => {
                      const margin = parseFloat(check.marginPct);
                      const delta = check.deltaPct
                        ? parseFloat(check.deltaPct)
                        : 0;
                      const isAlert =
                        delta < -10 || (check.product && margin < 30);

                      return (
                        <tr
                          key={check.id}
                          className={`hover:bg-muted/50 ${
                            isAlert ? "bg-red-50 dark:bg-red-950/20" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isAlert && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                              <div>
                                <div className="font-medium">
                                  {check.product?.titleEn ||
                                    check.product?.titleFr ||
                                    "Unknown Product"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {check.product?.status || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {parseFloat(check.supplierPriceAmount).toFixed(2)}{" "}
                            {check.supplierPriceCurrency}
                          </td>
                          <td className="px-4 py-3">
                            {parseFloat(check.sellingPriceAmount).toFixed(2)}{" "}
                            {check.sellingPriceCurrency}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                margin < 30
                                  ? "font-semibold text-red-600"
                                  : "font-medium"
                              }
                            >
                              {margin.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                delta < -10
                                  ? "font-semibold text-red-600"
                                  : delta > 10
                                    ? "font-semibold text-green-600"
                                    : ""
                              }
                            >
                              {delta >= 0 ? "+" : ""}
                              {delta.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(check.observedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            {/* Filters */}
            <div className="rounded-lg border bg-card p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="entityType">Entity Type</Label>
                  <Select
                    value={filterEntityType}
                    onValueChange={setFilterEntityType}
                  >
                    <SelectTrigger id="entityType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="product">Products</SelectItem>
                      <SelectItem value="category">Categories</SelectItem>
                      <SelectItem value="collection">Collections</SelectItem>
                      <SelectItem value="type">Product Types</SelectItem>
                      <SelectItem value="tag">Tags</SelectItem>
                      <SelectItem value="sales_channel">
                        Sales Channels
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Sync Jobs Table */}
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : syncJobs.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  No sync jobs found. Start a sync from the Imports page.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Entity Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Operation
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Records
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Started
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Completed
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {syncJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 capitalize">
                          {job.entityType.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {job.operation}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className={`flex items-center gap-2 ${getStatusColor(
                              job.status
                            )}`}
                          >
                            {getStatusIcon(job.status)}
                            <span className="capitalize">{job.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {job.recordCount !== null ? job.recordCount : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(job.startedAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(job.completedAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {job.logText ? (
                            <span className="truncate max-w-xs">
                              {job.logText}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="prices" className="space-y-4">
            <div className="rounded-lg border bg-card p-8 text-center">
              <p className="text-muted-foreground">
                Price monitoring alerts will be implemented in Step 13
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
