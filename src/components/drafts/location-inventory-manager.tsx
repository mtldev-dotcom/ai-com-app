"use client";

/**
 * Location Inventory Manager Component
 * Allows managing inventory quantities per stock location
 */
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Plus } from "lucide-react";
import {
  getStoredEntities,
  syncAndStoreEntities,
} from "@/app/actions/medusa-entities";

type StockLocation = {
  id: string;
  name?: string;
  title?: string;
  value?: string;
  address?: {
    address_1?: string;
    city?: string;
    country_code?: string;
  };
};

type LocationInventoryManagerProps = {
  stockLocationIds: string[]; // Selected stock location IDs
  locationInventory: Record<string, number>; // { locationId: quantity }
  onLocationInventoryChange: (inventory: Record<string, number>) => void;
};

export function LocationInventoryManager({
  stockLocationIds,
  locationInventory,
  onLocationInventoryChange,
}: LocationInventoryManagerProps) {
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStoredEntities("stock_location");

      // Normalize location data
      const normalized = (data as StockLocation[]).map((location) => ({
        id: location.id,
        name:
          location.name ||
          location.title ||
          location.value ||
          location.id,
        address: location.address,
      }));

      setLocations(normalized);
    } catch (err) {
      console.error("Error loading stock locations:", err);
      setError(err instanceof Error ? err.message : "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await syncAndStoreEntities("stock_location");
      await loadLocations();
    } catch (err) {
      console.error("Error refreshing stock locations:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const updateInventory = (locationId: string, quantity: number) => {
    const newInventory = {
      ...locationInventory,
      [locationId]: quantity >= 0 ? quantity : 0,
    };
    // Remove zero quantities to keep data clean
    if (quantity === 0) {
      delete newInventory[locationId];
    }
    onLocationInventoryChange(newInventory);
  };

  const selectedLocations = locations.filter((loc) =>
    stockLocationIds.includes(loc.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading locations...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Inventory by Location</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Sync stock locations from Medusa"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {selectedLocations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Select stock locations above to manage inventory quantities.
        </p>
      ) : (
        <div className="space-y-3">
          {selectedLocations.map((location) => (
            <Card key={location.id} className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {location.name}
                </CardTitle>
                {location.address && (
                  <p className="text-xs text-muted-foreground">
                    {[
                      location.address.address_1,
                      location.address.city,
                      location.address.country_code,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`inventory-${location.id}`} className="w-20">
                    Quantity:
                  </Label>
                  <Input
                    id={`inventory-${location.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={locationInventory[location.id] || 0}
                    onChange={(e) =>
                      updateInventory(
                        location.id,
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                    placeholder="0"
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Set inventory quantities for each selected stock location. These will
        be set when publishing to Medusa.
      </p>
    </div>
  );
}

