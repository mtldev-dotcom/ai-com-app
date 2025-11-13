"use client";

/**
 * Bulk Actions Bar Component
 * Toolbar for bulk selection and actions
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Download, X, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkSendToDraft: () => void;
  onExport: () => void;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkSendToDraft,
  onExport,
  className,
}: BulkActionsBarProps) {
  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between gap-4 rounded-lg border bg-background p-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={isAllSelected ? onDeselectAll : onSelectAll}
        >
          {isAllSelected ? (
            <CheckSquare className="mr-2 h-4 w-4" />
          ) : (
            <Square className="mr-2 h-4 w-4" />
          )}
          {isAllSelected ? "Deselect All" : "Select All"}
        </Button>
        <Badge variant="secondary" className="text-sm">
          {selectedCount} selected
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button size="sm" onClick={onBulkSendToDraft}>
          <Send className="mr-2 h-4 w-4" />
          Send to Drafts ({selectedCount})
        </Button>
      </div>
    </div>
  );
}

