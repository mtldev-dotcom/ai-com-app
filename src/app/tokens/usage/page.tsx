"use client";

/**
 * Token Usage Logs Page
 * Displays token usage logs with filtering by provider, date range, and process name
 */
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, Filter, RefreshCw } from "lucide-react";
import { getTokenUsageLogs } from "@/app/actions/tokens";

type UsageLog = {
  id: string;
  tokenId: string;
  provider: "openai" | "gemini" | "medusa";
  processName: string;
  usedAt: Date;
  recordCount: number | null;
  details: Record<string, unknown> | null;
};

export default function TokenUsagePage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [provider, setProvider] = useState<string>("all");
  const [processName, setProcessName] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getTokenUsageLogs({
        provider:
          provider !== "all"
            ? (provider as "openai" | "gemini" | "medusa")
            : undefined,
        processName: processName || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: 100,
      });
      setLogs(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load usage logs:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load usage logs"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadLogs();
  };

  const handleReset = () => {
    setProvider("all");
    setProcessName("");
    setFromDate("");
    setToDate("");
    setTimeout(() => loadLogs(), 100);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
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
            <h1 className="text-3xl font-bold">Token Usage Logs</h1>
            <p className="text-muted-foreground">
              Track API token usage across all providers ({logs.length} entries)
            </p>
          </div>
          <Button onClick={loadLogs} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="medusa">Medusa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="processName">Process Name</Label>
              <Input
                id="processName"
                value={processName}
                onChange={(e) => setProcessName(e.target.value)}
                placeholder="e.g., ai_enrich"
              />
            </div>
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleFilter}>
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        {logs.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              No usage logs found. Token usage will appear here after API calls
              are made.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Process
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Used At
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Records
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <span className="font-medium capitalize">
                        {log.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {log.processName}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(log.usedAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.recordCount !== null ? log.recordCount : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
