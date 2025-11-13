"use client";

/**
 * useProductMatcher Hook
 * Main hook for managing product matcher state and operations
 */

import { useState, useCallback } from "react";
import type { MatcherJob } from "../types";
import type { ParsedRow } from "@/lib/imports/parse-file";

export function useProductMatcher() {
  const [currentJob, setCurrentJob] = useState<MatcherJob | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);

  const setImportedData = useCallback((cols: string[], data: ParsedRow[]) => {
    setColumns(cols);
    setRows(data);
  }, []);

  const setJob = useCallback((job: MatcherJob | null) => {
    setCurrentJob(job);
  }, []);

  return {
    currentJob,
    columns,
    rows,
    setImportedData,
    setJob,
  };
}

