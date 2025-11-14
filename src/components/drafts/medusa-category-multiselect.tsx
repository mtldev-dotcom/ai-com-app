"use client";

/**
 * Medusa Category Multi-Select Component
 * Allows selecting multiple categories from synced Medusa categories
 * Supports syncing from Medusa, creating new categories, and deleting categories
 */
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, RefreshCw, Plus, Trash2, X } from "lucide-react";
import {
  getStoredEntities,
  syncAndStoreEntities,
  createCategory,
  deleteCategory,
} from "@/app/actions/medusa-entities";
import { Badge } from "@/components/ui/badge";

type Entity = {
  id: string;
  name?: string;
  title?: string;
  value?: string;
  handle?: string;
};

type MedusaCategoryMultiSelectProps = {
  value: string[];
  onValueChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  allowRefresh?: boolean;
};

export function MedusaCategoryMultiSelect({
  value,
  onValueChange,
  label,
  placeholder,
  allowRefresh = true,
}: MedusaCategoryMultiSelectProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Form state for creating new entities
  const [newName, setNewName] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStoredEntities("category");

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
      console.error("Failed to load categories:", err);
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await syncAndStoreEntities("category");

      // Reload entities
      const data = await getStoredEntities("category");
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
        err instanceof Error ? err.message : "Failed to refresh categories"
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleCategory = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onValueChange(value.filter((id) => id !== categoryId));
    } else {
      onValueChange([...value, categoryId]);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError("Name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const result = await createCategory({
        name: newName.trim(),
        handle: newHandle.trim() || undefined,
        description: newDescription.trim() || undefined,
      });
      
      if (result.success && result.category) {
        // Response structure: { product_category: { id: string, ... } }
        const response = result.category as { product_category?: { id: string } };
        const categoryId = response.product_category?.id;
        if (categoryId) {
          // Add to selection
          onValueChange([...value, categoryId]);
        }
      }

      // Reload entities
      await loadEntities();
      
      // Close dialog and reset form
      setShowCreateDialog(false);
      setNewName("");
      setNewHandle("");
      setNewDescription("");
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create category"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!entityToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteCategory(entityToDelete.id);

      // Remove from selection if selected
      if (value.includes(entityToDelete.id)) {
        onValueChange(value.filter((id) => id !== entityToDelete.id));
      }

      // Reload entities
      await loadEntities();
      
      // Close dialog
      setShowDeleteDialog(false);
      setEntityToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
    } finally {
      setDeleting(false);
    }
  };

  const selectedEntities = entities.filter((e) => value.includes(e.id));

  if (loading) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex items-center gap-2">
          <div className="h-10 w-full rounded-md border bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {label && <Label>{label}</Label>}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="h-7"
              title="Create new category"
            >
              <Plus className="h-3 w-3" />
            </Button>
            {allowRefresh && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-7"
                title="Sync categories from Medusa"
              >
                {refreshing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Selected Categories Display */}
        {selectedEntities.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[2.5rem]">
            {selectedEntities.map((entity) => (
              <Badge
                key={entity.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {entity.name}
                <button
                  type="button"
                  onClick={() => handleToggleCategory(entity.id)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  title="Remove category"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Category Selection Dropdown */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedEntities.length === 0
              ? placeholder || "Select categories..."
              : `${selectedEntities.length} categor${selectedEntities.length === 1 ? "y" : "ies"} selected`}
          </Button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
              {entities.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No categories found. Create new or sync from Medusa.
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {entities.map((entity) => (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between p-2 hover:bg-accent rounded-md cursor-pointer"
                    >
                      <div
                        className="flex items-center space-x-2 flex-1"
                        onClick={() => handleToggleCategory(entity.id)}
                      >
                        <Checkbox
                          checked={value.includes(entity.id)}
                          onCheckedChange={() => handleToggleCategory(entity.id)}
                        />
                        <span className="text-sm">{entity.name}</span>
                      </div>
                      <button
                        type="button"
                        className="p-1 hover:bg-destructive/10 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntityToDelete(entity);
                          setShowDeleteDialog(true);
                        }}
                        title={`Delete ${entity.name}`}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}
        {entities.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">
            No categories available. Create new or sync from Medusa to populate.
          </p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Create a new category directly in Medusa. It will be synced automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Electronics"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-handle">Handle (Slug)</Label>
              <Input
                id="category-handle"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                placeholder="electronics"
                disabled={creating}
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Leave empty to auto-generate from name.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Input
                id="category-description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Category description"
                disabled={creating}
              />
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setCreateError(null);
                setNewName("");
                setNewHandle("");
                setNewDescription("");
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{entityToDelete?.name}"? This action cannot be undone and will remove the category from Medusa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setEntityToDelete(null);
                setDeleteError(null);
              }}
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Click outside to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

