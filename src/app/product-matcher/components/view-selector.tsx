"use client";

/**
 * View Selector Component
 * Toggle between grid, list, and comparison view modes
 */

import { Button } from "@/components/ui/button";
import { Grid3x3, List, Columns } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list" | "comparison";

interface ViewSelectorProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewSelector({ viewMode, onViewModeChange, className }: ViewSelectorProps) {
  return (
    <div className={cn("flex items-center gap-1 border rounded-md p-1 bg-background", className)}>
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("grid")}
        className="h-8 px-3"
        aria-label="Grid view"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("list")}
        className="h-8 px-3"
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "comparison" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("comparison")}
        className="h-8 px-3"
        aria-label="Comparison view"
        disabled
        title="Coming soon"
      >
        <Columns className="h-4 w-4" />
      </Button>
    </div>
  );
}

