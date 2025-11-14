"use client";

/**
 * Medusa Multi-Select Component (Generic)
 * Allows selecting multiple entities from synced Medusa entities
 * Supports syncing from Medusa
 */
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, RefreshCw, ChevronDown } from "lucide-react";
import {
  getStoredEntities,
  syncAndStoreEntities,
} from "@/app/actions/medusa-entities";
import { Badge } from "@/components/ui/badge";

type Entity = {
  id: string;
  name?: string;
  title?: string;
  value?: string;
  handle?: string;
};

type MedusaMultiSelectProps = {
  entityType: "sales_channel" | "stock_location";
  value: string[];
  onValueChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  allowRefresh?: boolean;
};

export function MedusaMultiSelect({
  entityType,
  value,
  onValueChange,
  label,
  placeholder,
  allowRefresh = true,
}: MedusaMultiSelectProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadEntities();
  }, [entityType]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStoredEntities(entityType);

      // Normalize entity data
      const normalized = (data as Entity[]).map((entity) => ({
        id: entity.id,
        name:
          entity.name ||
          entity.title ||
          entity.value ||
          entity.handle ||
          entity.id,
      }));

      setEntities(normalized);
    } catch (err) {
      console.error(`Error loading ${entityType}:`, err);
      setError(err instanceof Error ? err.message : "Failed to load entities");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await syncAndStoreEntities(entityType);
      await loadEntities();
    } catch (err) {
      console.error(`Error refreshing ${entityType}:`, err);
      setError(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleEntity = (entityId: string) => {
    if (value.includes(entityId)) {
      onValueChange(value.filter((id) => id !== entityId));
    } else {
      onValueChange([...value, entityId]);
    }
  };

  const removeEntity = (entityId: string) => {
    onValueChange(value.filter((id) => id !== entityId));
  };

  const selectedEntities = entities.filter((e) => value.includes(e.id));
  const displayName = entityType === "sales_channel" ? "Sales Channels" : "Stock Locations";

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedEntities.map((entity) => (
          <Badge
            key={entity.id}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {entity.name}
            <button
              type="button"
              onClick={() => removeEntity(entity.id)}
              className="ml-1 hover:text-destructive"
            >
              <span className="sr-only">Remove</span>
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {placeholder || `Select ${displayName.toLowerCase()}...`}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto">
            {entities.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No {displayName.toLowerCase()} available. Sync from Medusa to populate.
              </div>
            ) : (
              entities.map((entity) => (
                <DropdownMenuItem
                  key={entity.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggleEntity(entity.id);
                  }}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    checked={value.includes(entity.id)}
                    onCheckedChange={() => toggleEntity(entity.id)}
                  />
                  <span>{entity.name}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {allowRefresh && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title={`Sync ${displayName.toLowerCase()} from Medusa`}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Select {displayName.toLowerCase()} from synced Medusa {displayName.toLowerCase()}
      </p>
    </div>
  );
}

