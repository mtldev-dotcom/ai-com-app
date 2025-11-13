"use client";

/**
 * Match Score Indicator Component
 * Visualizes match score with progress bar and badge
 */

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getMatchScoreColor, formatMatchScore } from "../utils/match-scoring";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface MatchScoreIndicatorProps {
  score: number;
  showLabel?: boolean;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MatchScoreIndicator({
  score,
  showLabel = true,
  showProgress = true,
  size = "md",
  className,
}: MatchScoreIndicatorProps) {
  const color = getMatchScoreColor(score);
  const formattedScore = formatMatchScore(score);

  const colorClasses = {
    high: {
      bg: "bg-green-500",
      text: "text-green-600 dark:text-green-400",
      badge: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      progress: "bg-green-500",
      icon: CheckCircle2,
    },
    medium: {
      bg: "bg-yellow-500",
      text: "text-yellow-600 dark:text-yellow-400",
      badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      progress: "bg-yellow-500",
      icon: AlertCircle,
    },
    low: {
      bg: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
      badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      progress: "bg-red-500",
      icon: XCircle,
    },
  };

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const colors = colorClasses[color];
  const Icon = colors.icon;

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1.5 font-medium",
              colors.badge,
              sizeClasses[size]
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{formattedScore} Match</span>
          </Badge>
        </div>
      )}
      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Match Quality</span>
            <span className={colors.text}>{formattedScore}</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>
      )}
    </div>
  );
}

