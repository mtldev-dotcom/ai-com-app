"use client";

/**
 * Provider Badge Component
 * Displays provider branding with icons and colors
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ShoppingBag, Globe } from "lucide-react";

interface ProviderBadgeProps {
  provider: string;
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const providerConfig = {
  cj: {
    name: "CJ Dropshipping",
    icon: ShoppingBag,
    color: "bg-indigo-900",
    textColor: "text-white",
    borderColor: "border-indigo-300",
  },
  web: {
    name: "Web Search",
    icon: Globe,
    color: "bg-gray-900",
    textColor: "text-white",
    borderColor: "border-gray-300",
  },
};

export function ProviderBadge({
  provider,
  variant = "default",
  size = "md",
  className,
}: ProviderBadgeProps) {
  const config = providerConfig[provider.toLowerCase() as keyof typeof providerConfig] || {
    name: provider,
    icon: Globe,
    color: "bg-gray-900",
    textColor: "text-white",
    borderColor: "border-gray-300",
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      variant={variant === "outline" ? "outline" : variant === "secondary" ? "secondary" : "default"}
      className={cn(
        "flex items-center gap-1.5 font-medium",
        sizeClasses[size],
        variant === "outline" && config.borderColor,
        variant === "default" && [config.color, config.textColor, "border-transparent"],
        className
      )}
    >
      <Icon className={cn(iconSizeClasses[size], variant === "default" && config.textColor)} />
      <span>{config.name}</span>
    </Badge>
  );
}

