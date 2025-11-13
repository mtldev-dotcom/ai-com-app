"use client";

/**
 * Medusa Entity Selector Component
 * Allows selecting from synced Medusa entities (categories, collections, types, tags)
 */
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import {
  getStoredEntities,
  syncAndStoreEntities,
} from "@/app/actions/medusa-entities";

type Entity = {
  id: string;
  name?: string;
  title?: string;
  value?: string;
  handle?: string;
};

type MedusaEntitySelectorProps = {
  entityType: "category" | "collection" | "type" | "tag";
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  allowRefresh?: boolean;
};

export function MedusaEntitySelector({
  entityType,
  value,
  onValueChange,
  label,
  placeholder,
  allowRefresh = true,
}: MedusaEntitySelectorProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntities();
  }, [entityType]);

  const loadEntities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStoredEntities(entityType);

      // Normalize entity data (different entity types have different field names)
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
      console.error(`Failed to load ${entityType}s:`, err);
      setError(err instanceof Error ? err.message : "Failed to load entities");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const result = await syncAndStoreEntities(entityType);

      // Reload entities
      const data = await getStoredEntities(entityType);
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
      setError(
        err instanceof Error ? err.message : "Failed to refresh entities"
      );
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2">
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Loading..." />
            </SelectTrigger>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <Label>{label}</Label>}
        {allowRefresh && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-7"
          >
            {refreshing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      <Select
        value={value || "__none"}
        onValueChange={(val) => onValueChange(val === "__none" ? "" : val)}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder || `Select ${entityType}...`} />
        </SelectTrigger>
        <SelectContent>
          {entities.length === 0 ? (
            <SelectItem value="__no_items" disabled>
              No {entityType}s found. Click refresh to sync from Medusa.
            </SelectItem>
          ) : (
            <>
              <SelectItem value="__none">None</SelectItem>
              {entities.map((entity) => (
                <SelectItem key={entity.id} value={entity.id}>
                  {entity.name}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {entities.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground">
          No {entityType}s available. Sync from Medusa to populate.
        </p>
      )}
    </div>
  );
}
