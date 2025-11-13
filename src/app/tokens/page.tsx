"use client";

/**
 * Tokens Management Page
 * Lists all API tokens with their status and allows management
 */
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Key,
} from "lucide-react";
import {
  getAllTokens,
  createToken,
  updateToken,
  deleteToken,
} from "@/app/actions/tokens";
import { useRouter } from "next/navigation";

type Token = {
  id: string;
  provider: "openai" | "gemini" | "medusa";
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
};

export default function TokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<Token | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [provider, setProvider] = useState<"openai" | "gemini" | "medusa">(
    "openai"
  );
  const [tokenValue, setTokenValue] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const data = await getAllTokens();
      setTokens(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load tokens:", err);
      setError(err instanceof Error ? err.message : "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!tokenValue.trim()) {
      setError("Token value is required");
      return;
    }

    setSubmitting(true);
    try {
      await createToken({
        provider,
        tokenValue: tokenValue.trim(),
        expiresAt: expiresAt || null,
      });
      setIsCreateDialogOpen(false);
      setTokenValue("");
      setExpiresAt("");
      await loadTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (token: Token) => {
    setEditingToken(token);
    setProvider(token.provider);
    setExpiresAt(
      token.expiresAt
        ? new Date(token.expiresAt).toISOString().slice(0, 16)
        : ""
    );
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingToken) return;

    setSubmitting(true);
    try {
      await updateToken(editingToken.id, {
        expiresAt: expiresAt || null,
      });
      setIsEditDialogOpen(false);
      setEditingToken(null);
      await loadTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update token");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (token: Token) => {
    try {
      await updateToken(token.id, { active: !token.active });
      await loadTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update token");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this token?")) {
      return;
    }

    try {
      await deleteToken(id);
      await loadTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete token");
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  const isExpired = (date: Date | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Tokens</h1>
            <p className="text-muted-foreground">
              Manage API tokens for OpenAI, Gemini, and Medusa ({tokens.length}{" "}
              total)
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/tokens/usage")}>
              View Usage Logs
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Token
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <span>{error}</span>
          </div>
        )}

        {tokens.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No tokens found. Add your first API token to get started.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Token
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Expires
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <span className="font-medium capitalize">
                        {token.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {token.active && !isExpired(token.expiresAt) ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm">Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {!token.active ? "Inactive" : "Expired"}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        {token.expiresAt ? (
                          <>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span
                              className={
                                isExpired(token.expiresAt)
                                  ? "text-destructive"
                                  : ""
                              }
                            >
                              {formatDate(token.expiresAt)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(token.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(token)}
                        >
                          {token.active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(token)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(token.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add API Token</DialogTitle>
              <DialogDescription>
                Add a new API token for OpenAI, Gemini, or Medusa. The token
                will be encrypted before storage.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={provider}
                  onValueChange={(value: "openai" | "gemini" | "medusa") =>
                    setProvider(value)
                  }
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="medusa">Medusa Admin API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tokenValue">Token Value</Label>
                <Input
                  id="tokenValue"
                  type="password"
                  value={tokenValue}
                  onChange={(e) => setTokenValue(e.target.value)}
                  placeholder="sk-... or your API key"
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Token
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Token</DialogTitle>
              <DialogDescription>
                Update token expiration date. Token value cannot be changed
                after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Provider</Label>
                <Input value={editingToken?.provider} disabled />
              </div>
              <div>
                <Label htmlFor="editExpiresAt">Expires At</Label>
                <Input
                  id="editExpiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
