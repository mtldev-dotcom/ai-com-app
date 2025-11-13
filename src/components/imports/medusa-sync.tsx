"use client";

/**
 * Medusa Sync Component
 * Allows fetching entities from Medusa store
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";
import type { MedusaEntityType } from "@/lib/medusa/sync";

type SyncJob = {
  id: string;
  entityType: string;
  operation: string;
  status: string;
  recordCount: number | null;
  logText: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
};

export function MedusaSync() {
  const [entityType, setEntityType] = useState<MedusaEntityType>("product");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastJob, setLastJob] = useState<SyncJob | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType,
          operation: "fetch",
          limit: 100,
          offset: 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to start sync");
      }

      const data = await response.json();
      setLastJob({
        id: data.jobId,
        entityType,
        operation: "fetch",
        status: data.status,
        recordCount: null,
        logText: null,
        startedAt: new Date(),
        completedAt: null,
      });
      setSuccess(`Sync job created: ${data.jobId}`);

      // Poll for job completion
      pollJobStatus(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setSyncing(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`/api/sync/${jobId}`);
        if (!response.ok) {
          clearInterval(interval);
          return;
        }

        const data = await response.json();
        setLastJob(data.job);

        if (data.job.status === "done" || data.job.status === "error") {
          clearInterval(interval);
          if (data.job.status === "done") {
            setSuccess(
              `Sync completed: ${data.job.recordCount || 0} records fetched`
            );
          } else {
            setError(data.job.logText || "Sync failed");
          }
        }
      } catch (err) {
        console.error("Error polling job status:", err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 1000); // Poll every second
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Sync from Medusa</h2>
        <p className="text-muted-foreground">
          Fetch entities from your Medusa store and sync them to the system
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="entityType">Entity Type</Label>
          <Select
            value={entityType}
            onValueChange={(value: MedusaEntityType) => setEntityType(value)}
          >
            <SelectTrigger id="entityType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">Products</SelectItem>
              <SelectItem value="category">Categories</SelectItem>
              <SelectItem value="collection">Collections</SelectItem>
              <SelectItem value="type">Product Types</SelectItem>
              <SelectItem value="tag">Tags</SelectItem>
              <SelectItem value="sales_channel">Sales Channels</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSync} disabled={syncing} className="w-full">
          {syncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Sync from Medusa
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {lastJob && (
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-2">Last Sync Job</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="capitalize">{lastJob.status}</span>
              </div>
              {lastJob.recordCount !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Records:</span>
                  <span>{lastJob.recordCount}</span>
                </div>
              )}
              {lastJob.logText && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Message:</span>
                  <span className="text-xs">{lastJob.logText}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
