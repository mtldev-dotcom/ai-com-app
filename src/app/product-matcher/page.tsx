"use client";

/**
 * Product Matcher Page
 * Import product lists from spreadsheets and automatically search multiple suppliers
 * Redesigned with modern UI/UX and enhanced features
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Settings,
  TrendingUp,
  ChevronRight,
  AlertCircle,
  X,
  CheckCircle2,
  Sparkles,
  History,
} from "lucide-react";
import {
  createMatcherJobAction,
  getMatcherJobAction,
  sendToDraftAction,
} from "@/app/actions/product-matcher";
import type { ParsedRow } from "@/lib/imports/parse-file";
import { ImportStep } from "./components/steps/import-step";
import { ConfigureStep } from "./components/steps/configure-step";
import { ResultsStep } from "./components/steps/results-step";
import type { MatcherJob } from "./types";

export default function ProductMatcherPage() {
  const router = useRouter();
  const [step, setStep] = useState<"import" | "configure" | "results">("import");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Import state
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);

  // Configuration state
  const [jobName, setJobName] = useState("");
  const [providers, setProviders] = useState<string[]>(["cj"]);
  const [shippingOrigin, setShippingOrigin] = useState<string[]>([]);
  const [maxDeliveryDays, setMaxDeliveryDays] = useState<number | undefined>();
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [currency, setCurrency] = useState("USD");

  // Job state
  const [currentJob, setCurrentJob] = useState<MatcherJob | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Check for jobId in URL params (from history navigation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("jobId");
    if (jobId && !currentJob) {
      fetchJobDetails(jobId);
      setStep("results");
    }
  }, []);

  // Handle import step completion
  const handleImportComplete = (columns: string[], rows: ParsedRow[]) => {
    setColumns(columns);
    setRows(rows);
    setStep("configure");
  };

  // Start search job
  const handleStartSearch = async () => {
    if (providers.length === 0) {
      setError("Please select at least one provider");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const criteria: {
        shippingOrigin?: string[];
        maxDeliveryDays?: number;
        priceRange?: { min?: number; max?: number };
        currency?: string;
        countryCode?: string;
      } = {};

      if (shippingOrigin.length > 0) {
        criteria.shippingOrigin = shippingOrigin;
        // CJ API uses countryCode for single selection, shippingOrigin for multiple
        if (shippingOrigin.length === 1) {
          criteria.countryCode = shippingOrigin[0];
        }
      }
      if (maxDeliveryDays) {
        criteria.maxDeliveryDays = maxDeliveryDays;
      }
      if (priceMin || priceMax) {
        criteria.priceRange = {};
        if (priceMin) {
          criteria.priceRange.min = parseFloat(priceMin);
        }
        if (priceMax) {
          criteria.priceRange.max = parseFloat(priceMax);
        }
      }
      criteria.currency = currency;

      const result = await createMatcherJobAction({
        name: jobName.trim() || undefined, // Empty string becomes undefined
        sheetUrl: undefined,
        sheetData: rows,
        providers,
        criteria,
      });

      // Fetch the created job to get the generated name
      const createdJob = await getMatcherJobAction(result.jobId);

      setSuccess("Search job started successfully!");
      setCurrentJob({
        id: result.jobId,
        name: createdJob.name,
        status: "pending",
        progress: { processed: 0, total: rows.length },
        criteria,
      });
      setStep("results");
      setAutoRefresh(true);

      // Fetch job details
      fetchJobDetails(result.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch job details
  const fetchJobDetails = async (jobId: string) => {
    try {
      const job = await getMatcherJobAction(jobId);
      setCurrentJob({
        id: job.id,
        name: job.name,
        status: job.status as MatcherJob["status"],
        progress: job.progress as { processed: number; total: number } | null,
        criteria: job.criteria as MatcherJob["criteria"] | undefined,
        results: job.results as MatcherJob["results"],
      });

      // Stop auto-refresh if completed or failed
      if (job.status === "completed" || job.status === "failed") {
        setAutoRefresh(false);
      }
    } catch (err) {
      console.error("Failed to fetch job details:", err);
    }
  };

  // Auto-refresh while processing
  useEffect(() => {
    if (!autoRefresh || !currentJob) return;

    const interval = setInterval(() => {
      if (currentJob.status === "processing" || currentJob.status === "pending") {
        fetchJobDetails(currentJob.id);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh, currentJob?.id, currentJob?.status]);

  // Send match to draft
  const handleSendToDraft = async (matchResultId: string, useBestMatch = true, matchIndex?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendToDraftAction({
        matchResultId,
        useBestMatch,
        matchIndex,
      });
      setSuccess("Draft created successfully! Redirecting...");
      setTimeout(() => {
        router.push(`/products/${result.draftId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create draft");
    } finally {
      setIsLoading(false);
    }
  };

  // View product in new tab
  const handleViewProduct = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Product Matcher
            </h1>
            <p className="text-muted-foreground mt-1">
              Import product lists and automatically search for matching suppliers
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/product-matcher/history")}>
            <History className="h-4 w-4 mr-2" />
            View History
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive animate-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-6 w-6 p-0"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400 animate-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{success}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuccess(null)}
              className="h-6 w-6 p-0"
              aria-label="Dismiss success"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex items-center gap-2" role="navigation" aria-label="Progress steps">
          <div
            className={`flex items-center gap-2 ${step === "import" ? "text-primary" : "text-muted-foreground"
              }`}
            aria-current={step === "import" ? "step" : undefined}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${step === "import"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
                }`}
            >
              {step === "import" ? <FileText className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
            <span className="font-medium">Import</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div
            className={`flex items-center gap-2 ${step === "configure"
              ? "text-primary"
              : step === "results"
                ? "text-muted-foreground"
                : "text-muted-foreground"
              }`}
            aria-current={step === "configure" ? "step" : undefined}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${step === "configure"
                ? "bg-primary text-primary-foreground"
                : step === "results"
                  ? "bg-green-500 text-white"
                  : "bg-muted"
                }`}
            >
              {step === "results" ? <CheckCircle2 className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
            </div>
            <span className="font-medium">Configure</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div
            className={`flex items-center gap-2 ${step === "results" ? "text-primary" : "text-muted-foreground"
              }`}
            aria-current={step === "results" ? "step" : undefined}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${step === "results" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
            >
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="font-medium">Results</span>
          </div>
        </div>

        {/* Step 1: Import */}
        <AnimatePresence mode="wait">
          {step === "import" && (
            <motion.div
              key="import"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ImportStep
                onNext={handleImportComplete}
                isLoading={isLoading}
                error={error}
                success={success}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Configure */}
        <AnimatePresence mode="wait">
          {step === "configure" && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ConfigureStep
                columns={columns}
                rows={rows}
                providers={providers}
                onProvidersChange={setProviders}
                shippingOrigin={shippingOrigin}
                onShippingOriginChange={setShippingOrigin}
                maxDeliveryDays={maxDeliveryDays}
                onMaxDeliveryDaysChange={setMaxDeliveryDays}
                priceMin={priceMin}
                onPriceMinChange={setPriceMin}
                priceMax={priceMax}
                onPriceMaxChange={setPriceMax}
                currency={currency}
                onCurrencyChange={setCurrency}
                jobName={jobName}
                onJobNameChange={setJobName}
                onBack={() => setStep("import")}
                onStart={handleStartSearch}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Results */}
        <AnimatePresence mode="wait">
          {step === "results" && currentJob && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ResultsStep
                job={currentJob}
                onSendToDraft={handleSendToDraft}
                onViewProduct={handleViewProduct}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
