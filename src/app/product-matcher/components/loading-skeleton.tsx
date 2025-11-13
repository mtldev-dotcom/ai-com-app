"use client";

/**
 * Loading Skeleton Component
 * Provides skeleton loading states for better UX
 */

import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave";
}

export function LoadingSkeleton({
  className,
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
}: LoadingSkeletonProps) {
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-[wave_1.6s_ease-in-out_infinite]",
  };

  return (
    <div
      className={cn(
        "bg-muted",
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width ? (typeof width === "number" ? `${width}px` : width) : "100%",
        height: height ? (typeof height === "number" ? `${height}px` : height) : "100%",
      }}
      aria-label="Loading..."
    />
  );
}

/**
 * Product Card Skeleton
 */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <LoadingSkeleton variant="rectangular" height={200} className="w-full" />
      <div className="space-y-2">
        <LoadingSkeleton variant="text" height={20} width="80%" />
        <LoadingSkeleton variant="text" height={16} width="60%" />
      </div>
      <div className="flex gap-2">
        <LoadingSkeleton variant="rectangular" height={24} width={80} />
        <LoadingSkeleton variant="rectangular" height={24} width={80} />
      </div>
      <div className="flex justify-between">
        <LoadingSkeleton variant="text" height={20} width={100} />
        <LoadingSkeleton variant="rectangular" height={32} width={120} />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <LoadingSkeleton variant="text" height={16} width={i === 0 ? "80%" : "60%"} />
        </td>
      ))}
    </tr>
  );
}

