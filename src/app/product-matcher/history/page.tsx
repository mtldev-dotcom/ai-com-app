"use client";

/**
 * Product Matcher History Page
 * Lists all past batch searches and allows viewing them
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { getMatcherJobsAction, deleteMatcherJobAction, retryMatcherJobAction } from "@/app/actions/product-matcher";
import { cn } from "@/lib/utils";

// Simple date formatting function (no external dependency needed)
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

interface JobListItem {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: { processed: number; total: number } | null;
  createdAt: Date;
  error: string | null;
}

export default function ProductMatcherHistoryPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedJobs = await getMatcherJobsAction();
      setJobs(fetchedJobs as JobListItem[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleViewJob = (jobId: string) => {
    router.push(`/product-matcher?jobId=${jobId}`);
  };

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      await deleteMatcherJobAction(jobId);
      setJobs(jobs.filter((j) => j.id !== jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    }
  };

  const handleRetryJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await retryMatcherJobAction(jobId);
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry job");
    }
  };

  const getStatusBadge = (status: JobListItem["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8 text-primary" />
              Batch Search History
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your past product matching jobs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/product-matcher")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Matcher
            </Button>
            <Button variant="outline" onClick={fetchJobs} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && jobs.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-2 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No search history</h3>
              <p className="text-muted-foreground mb-4">You haven't run any batch searches yet.</p>
              <Button onClick={() => router.push("/product-matcher")}>
                Start Your First Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => {
              const progressPercent =
                job.progress && job.progress.total > 0
                  ? (job.progress.processed / job.progress.total) * 100
                  : 0;

              return (
                <Card
                  key={job.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewJob(job.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{job.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {formatTimeAgo(new Date(job.createdAt))}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewJob(job.id)}
                          className="h-8 w-8 p-0"
                          title="View job"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {job.status === "failed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleRetryJob(job.id, e)}
                            className="h-8 w-8 p-0"
                            title="Retry job"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteJob(job.id, e)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete job"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(job.status)}
                    </div>

                    {job.progress && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {job.progress.processed} / {job.progress.total} products
                          </span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    )}

                    {job.error && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        {job.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

