"use client";

/**
 * Sort Selector Component
 * Advanced sorting dropdown with multiple sort options
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortField = "matchScore" | "price" | "delivery" | "inventory" | "listingCount";
export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface SortSelectorProps {
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  className?: string;
}

const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: "matchScore", label: "Match Score" },
  { value: "price", label: "Price" },
  { value: "delivery", label: "Delivery Time" },
  { value: "inventory", label: "Inventory" },
  { value: "listingCount", label: "Listing Count" },
];

export function SortSelector({ sort, onSortChange, className }: SortSelectorProps) {
  const toggleDirection = () => {
    onSortChange({
      ...sort,
      direction: sort.direction === "asc" ? "desc" : "asc",
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={sort.field}
        onValueChange={(value) =>
          onSortChange({ ...sort, field: value as SortField })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleDirection}
        className="h-10 w-10"
        aria-label={`Sort ${sort.direction === "asc" ? "descending" : "ascending"}`}
      >
        {sort.direction === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

