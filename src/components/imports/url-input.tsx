"use client";

/**
 * URL Input Component
 * Allows users to import data from a URL
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface UrlInputProps {
  onUrlSubmit: (url: string) => void;
  isLoading?: boolean;
}

export function UrlInput({ onUrlSubmit, isLoading = false }: UrlInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/products.csv"
            className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            required
          />
        </div>
        <Button type="submit" disabled={isLoading || !url.trim()}>
          {isLoading ? "Loading..." : "Fetch"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Enter a URL pointing to a CSV or XLSX file
      </p>
    </form>
  );
}
