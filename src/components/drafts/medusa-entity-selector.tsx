"use client";

/**
 * Medusa Entity Selector Component
 * Allows selecting from synced Medusa entities (categories, collections, types, tags)
 * Supports syncing from Medusa and creating new entities
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, RefreshCw, Plus, Trash2 } from "lucide-react";
import {
  getStoredEntities,
  syncAndStoreEntities,
  createCollection,
  createCategory,
  deleteCollection,
  deleteCategory,
} from "@/app/actions/medusa-entities";
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);
  
  // Form state for creating new entities
  const [newTitle, setNewTitle] = useState("");
  const [newHandle, setNewHandle] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

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

  const handleCreate = async () => {
    if (entityType !== "collection" && entityType !== "category") {
      setCreateError("Create is only supported for collections and categories");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      let result;
      if (entityType === "collection") {
        if (!newTitle.trim()) {
          setCreateError("Title is required");
          setCreating(false);
          return;
        }
        result = await createCollection({
          title: newTitle.trim(),
          handle: newHandle.trim() || undefined,
        });
        if (result.success && result.collection) {
          // Response structure: { collection: { id: string, ... } }
          const response = result.collection as { collection?: { id: string } };
          const collectionId = response.collection?.id;
          if (collectionId) {
            onValueChange(collectionId);
          }
        }
      } else if (entityType === "category") {
        if (!newName.trim()) {
          setCreateError("Name is required");
          setCreating(false);
          return;
        }
        result = await createCategory({
          name: newName.trim(),
          handle: newHandle.trim() || undefined,
          description: newDescription.trim() || undefined,
        });
        if (result.success && result.category) {
          // Response structure: { product_category: { id: string, ... } }
          const response = result.category as { product_category?: { id: string } };
          const categoryId = response.product_category?.id;
          if (categoryId) {
            onValueChange(categoryId);
          }
        }
      }

      // Reload entities
      await loadEntities();
      
      // Close dialog and reset form
      setShowCreateDialog(false);
      setNewTitle("");
      setNewHandle("");
      setNewName("");
      setNewDescription("");
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create entity"
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
      if (entityType === "collection") {
        await deleteCollection(entityToDelete.id);
      } else if (entityType === "category") {
        await deleteCategory(entityToDelete.id);
      }

      // If the deleted entity was selected, clear selection
      if (value === entityToDelete.id) {
        onValueChange("");
      }

      // Reload entities
      await loadEntities();
      
      // Close dialog
      setShowDeleteDialog(false);
      setEntityToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete entity"
      );
    } finally {
      setDeleting(false);
    }
  };

  const canCreate = entityType === "collection" || entityType === "category";
  const canDelete = entityType === "collection" || entityType === "category";

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
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {label && <Label>{label}</Label>}
          <div className="flex items-center gap-1">
            {canCreate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="h-7"
                title={`Create new ${entityType}`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            {allowRefresh && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-7"
                title={`Sync ${entityType}s from Medusa`}
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
        <div className="flex items-center gap-2">
          <Select
            value={value || "__none"}
            onValueChange={(val) => onValueChange(val === "__none" ? "" : val)}
            className="flex-1"
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder || `Select ${entityType}...`} />
            </SelectTrigger>
            <SelectContent>
              {entities.length === 0 ? (
                <SelectItem value="__no_items" disabled>
                  No {entityType}s found. {canCreate ? "Create new or" : ""} sync from Medusa.
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
          {canDelete && value && value !== "__none" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const selectedEntity = entities.find((e) => e.id === value);
                if (selectedEntity) {
                  setEntityToDelete(selectedEntity);
                  setShowDeleteDialog(true);
                }
              }}
              className="h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
              title={`Delete selected ${entityType}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {entities.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">
            No {entityType}s available. {canCreate ? "Create new or" : ""} sync from Medusa to populate.
          </p>
        )}
      </div>

      {/* Create Dialog */}
      {canCreate && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Create New {entityType === "collection" ? "Collection" : "Category"}
              </DialogTitle>
              <DialogDescription>
                Create a new {entityType} directly in Medusa. It will be synced automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {entityType === "collection" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="collection-title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="collection-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Summer Collection"
                      disabled={creating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collection-handle">Handle (Slug)</Label>
                    <Input
                      id="collection-handle"
                      value={newHandle}
                      onChange={(e) => setNewHandle(e.target.value)}
                      placeholder="summer-collection"
                      disabled={creating}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL-friendly identifier. Leave empty to auto-generate from title.
                    </p>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
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
                  setNewTitle("");
                  setNewHandle("");
                  setNewName("");
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
      )}

      {/* Delete Confirmation Dialog */}
      {canDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {entityType === "collection" ? "Collection" : "Category"}?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{entityToDelete?.name}"? This action cannot be undone and will remove the {entityType} from Medusa.
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
      )}
    </>
  );
}
