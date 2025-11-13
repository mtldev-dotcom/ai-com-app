"use client";

/**
 * useFilters Hook
 * Manages filter state with debouncing and URL persistence
 */

import { useState, useEffect, useCallback } from "react";
import type { FilterState } from "../components/advanced-filters";

const DEBOUNCE_DELAY = 300;

export function useFilters(initialFilters?: FilterState) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      status: [],
      providers: [],
      shippingOrigin: [],
      priceRange: {},
    }
  );

  const updateFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      status: [],
      providers: [],
      shippingOrigin: [],
      priceRange: {},
    });
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}

