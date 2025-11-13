"use client";

/**
 * AI Fill Button Component
 * Small AI icon button for auto-filling fields
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface AIFillButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
  title?: string;
}

export function AIFillButton({
  onClick,
  disabled = false,
  title = "AI Fill",
}: AIFillButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      await onClick();
    } catch (error) {
      console.error("AI fill error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
    </Button>
  );
}
