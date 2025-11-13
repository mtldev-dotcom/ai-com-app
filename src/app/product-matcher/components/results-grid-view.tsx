"use client";

/**
 * Results Grid View Component
 * Grid layout for product match cards with animations
 */

import { StaggerContainer, StaggerItem } from "./animations";
import { ProductMatchCard } from "./product-match-card";
import { LoadingSkeleton, ProductCardSkeleton } from "./loading-skeleton";
import { cn } from "@/lib/utils";
import type { MatchResult } from "../types";

interface ResultsGridViewProps {
  results: MatchResult[];
  onSendToDraft?: (matchResultId: string, useBestMatch: boolean) => void;
  onViewProduct?: (url: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ResultsGridView({
  results,
  onSendToDraft,
  onViewProduct,
  isLoading = false,
  className,
}: ResultsGridViewProps) {
  if (isLoading && results.length === 0) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <p className="text-muted-foreground">No results to display</p>
      </div>
    );
  }

  return (
    <StaggerContainer className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr", className)}>
      {results.map((result) => (
        <StaggerItem key={result.id} className="h-full">
          <ProductMatchCard
            result={result}
            onSendToDraft={onSendToDraft}
            onViewProduct={onViewProduct}
            isLoading={isLoading}
          />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

