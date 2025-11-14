import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for auto-saving with debouncing
 * @param saveFn - Function to call when saving
 * @param data - Data to save
 * @param delay - Delay in milliseconds before saving (default: 2000ms)
 * @param enabled - Whether auto-save is enabled (default: true)
 */
export function useAutoSave<T>(
  saveFn: (data: T) => Promise<void> | void,
  data: T,
  delay: number = 2000,
  enabled: boolean = true
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);
  const saveFnRef = useRef(saveFn);

  // Keep saveFn ref updated
  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;
    
    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(lastSavedRef.current)) {
      return;
    }

    isSavingRef.current = true;
    try {
      await saveFnRef.current(data);
      lastSavedRef.current = JSON.parse(JSON.stringify(data)); // Deep clone
    } catch (error) {
      console.error("Auto-save error:", error);
      // Don't throw, just log
    } finally {
      isSavingRef.current = false;
    }
  }, [data, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Save immediately on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (
        enabled &&
        JSON.stringify(data) !== JSON.stringify(lastSavedRef.current) &&
        !isSavingRef.current
      ) {
        save();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    save: useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return save();
    }, [save]),
  };
}

