"use client";

/**
 * Draft Filters Component
 * Filters for status, date, and supplier
 */
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface DraftFiltersProps {
  suppliers: Array<{ id: string; name: string }>;
  onFilterChange: (filters: {
    status?: string;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

export function DraftFilters({ suppliers, onFilterChange }: DraftFiltersProps) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [supplierId, setSupplierId] = useState(
    searchParams.get("supplierId") || "all"
  );
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");

  const handleFilterChange = () => {
    onFilterChange({
      status: status && status !== "all" ? status : undefined,
      supplierId: supplierId && supplierId !== "all" ? supplierId : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const clearFilters = () => {
    setStatus("all");
    setSupplierId("all");
    setDateFrom("");
    setDateTo("");
    onFilterChange({});
  };

  const hasActiveFilters =
    (status && status !== "all") ||
    (supplierId && supplierId !== "all") ||
    dateFrom ||
    dateTo;

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Status:</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="enriched">Enriched</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Supplier:</label>
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All suppliers</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">From:</label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[150px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">To:</label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[150px]"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleFilterChange} size="sm">
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button onClick={clearFilters} variant="outline" size="sm">
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
