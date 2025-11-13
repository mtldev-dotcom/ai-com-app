"use client";

/**
 * Settings Page
 * Enhanced settings page with Medusa store connection, token management, and global preferences
 * Owner role only
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  Save,
  Key,
  Globe,
  DollarSign,
  Languages,
  Shield,
  TrendingUp,
  Package,
  Check,
  X,
  TestTube,
  FileJson,
} from "lucide-react";
import {
  getSettings,
  updateSettings,
  checkIsOwner,
} from "@/app/actions/settings";
import { getAllTokens } from "@/app/actions/tokens";
import {
  saveCJSettings,
  testCJConnectionAction,
  getCJCredentialsStatus,
  clearCJSettingsAction,
  saveCJTokensFromJSON,
} from "@/app/actions/cj";

type Setting = {
  id: string;
  key: string;
  valueJsonb: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type Token = {
  id: string;
  provider: "openai" | "gemini" | "medusa";
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Settings form state
  const [medusaAdminUrl, setMedusaAdminUrl] = useState("");
  const [medusaAdminToken, setMedusaAdminToken] = useState("");
  const [fxBaseCurrency, setFxBaseCurrency] = useState<"CAD" | "USD" | "AUTO">(
    "CAD"
  );
  const [defaultMarginPct, setDefaultMarginPct] = useState(50);
  const [defaultLocale, setDefaultLocale] = useState<"en" | "fr">("en");

  // CJ Dropshipping state
  const [cjApiKey, setCjApiKey] = useState("");
  const [cjAccountEmail, setCjAccountEmail] = useState("");
  const [cjConfigured, setCjConfigured] = useState(false);
  const [cjTesting, setCjTesting] = useState(false);
  const [cjTestResult, setCjTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [cjJsonResponse, setCjJsonResponse] = useState("");

  // Tokens state
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      // Check if user is owner
      const ownerCheck = await checkIsOwner();
      setIsOwner(ownerCheck);

      if (!ownerCheck) {
        setError("Only owners can access settings");
        return;
      }

      // Load settings
      const settingsData = await getSettings();
      const settingsMap = new Map(
        settingsData.map((s) => [s.key, s.valueJsonb])
      );

      setMedusaAdminUrl((settingsMap.get("medusa_admin_url") as string) || "");
      setMedusaAdminToken(""); // Don't populate token field for security
      setFxBaseCurrency(
        (settingsMap.get("fx_base_currency") as "CAD" | "USD" | "AUTO") || "CAD"
      );
      setDefaultMarginPct(
        (settingsMap.get("default_margin_pct") as number) || 50
      );
      setDefaultLocale(
        (settingsMap.get("default_locale") as "en" | "fr") || "en"
      );

      // Load tokens
      const tokensData = await getAllTokens();
      setTokens(tokensData);

      // Load CJ credentials status
      const cjStatus = await getCJCredentialsStatus();
      setCjConfigured(cjStatus.configured);
      setCjAccountEmail(cjStatus.accountEmail || "");

      setError(null);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await updateSettings({
        medusaAdminUrl: medusaAdminUrl || undefined,
        medusaAdminToken: medusaAdminToken || undefined,
        fxBaseCurrency,
        defaultMarginPct,
        defaultLocale,
      });

      // Reload to show updated values
      await loadSettings();

      // Clear token field after save
      setMedusaAdminToken("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update settings"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCJSettings = async () => {
    setSubmitting(true);
    setError(null);
    setCjTestResult(null);

    try {
      const result = await saveCJSettings(cjApiKey, cjAccountEmail);
      if (result.success) {
        setCjTestResult({ success: true, message: result.message });
        // Reload settings to update status
        await loadSettings();
        // Clear password field after save
        setCjApiKey("");
      } else {
        setCjTestResult({ success: false, message: result.message });
      }
    } catch (err) {
      setCjTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to save credentials",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestCJConnection = async () => {
    setCjTesting(true);
    setCjTestResult(null);

    try {
      const result = await testCJConnectionAction();
      setCjTestResult(result);
    } catch (err) {
      setCjTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Connection test failed",
      });
    } finally {
      setCjTesting(false);
    }
  };

  const handleClearCJSettings = async () => {
    if (!confirm("Are you sure you want to clear CJ credentials?")) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await clearCJSettingsAction();
      if (result.success) {
        setCjTestResult({ success: true, message: result.message });
        await loadSettings();
        setCjApiKey("");
        setCjAccountEmail("");
      } else {
        setCjTestResult({ success: false, message: result.message });
      }
    } catch (err) {
      setCjTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to clear credentials",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFromJSON = async () => {
    if (!cjJsonResponse.trim()) {
      setCjTestResult({
        success: false,
        message: "Please paste the JSON response",
      });
      return;
    }

    setSubmitting(true);
    setCjTestResult(null);

    try {
      const result = await saveCJTokensFromJSON(cjJsonResponse);
      setCjTestResult(result);
      if (result.success) {
        await loadSettings();
        setCjJsonResponse("");
      }
    } catch (err) {
      setCjTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to save tokens",
      });
    } finally {
      setSubmitting(false);
    }
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

  if (!isOwner) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configure application settings
            </p>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Only owners can access settings. Please contact an owner to
                manage settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure Medusa store connection, tokens, and global preferences
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <span>{error}</span>
          </div>
        )}

        {/* Medusa Store Connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Medusa Store Connection</CardTitle>
            </div>
            <CardDescription>
              Connect your Medusa store to enable product publishing and
              synchronization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="medusaAdminUrl">Medusa Admin URL</Label>
              <Input
                id="medusaAdminUrl"
                type="url"
                value={medusaAdminUrl}
                onChange={(e) => setMedusaAdminUrl(e.target.value)}
                placeholder="https://your-medusa-store.com"
              />
            </div>
            <div>
              <Label htmlFor="medusaAdminToken">Medusa Admin Token</Label>
              <Input
                id="medusaAdminToken"
                type="password"
                value={medusaAdminToken}
                onChange={(e) => setMedusaAdminToken(e.target.value)}
                placeholder={
                  medusaAdminUrl
                    ? "Enter new token to update"
                    : "Enter admin token"
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to keep existing token. Token is encrypted before
                storage.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CJ Dropshipping Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>CJ Dropshipping Integration</CardTitle>
            </div>
            <CardDescription>
              Connect your CJ Dropshipping account to import products directly
              from their catalog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cjConfigured && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <Check className="h-4 w-4" />
                <span>
                  Connected as: <strong>{cjAccountEmail}</strong>
                </span>
              </div>
            )}

            {cjTestResult && (
              <div
                className={`flex items-center gap-2 rounded-md p-3 text-sm ${
                  cjTestResult.success
                    ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {cjTestResult.success ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span>{cjTestResult.message}</span>
              </div>
            )}

            <Tabs defaultValue="apikey" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="apikey">API Key Method</TabsTrigger>
                <TabsTrigger value="json">Manual JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="apikey" className="space-y-4">
                <div>
                  <Label htmlFor="cjAccountEmail">CJ Account Email</Label>
                  <Input
                    id="cjAccountEmail"
                    type="email"
                    value={cjAccountEmail}
                    onChange={(e) => setCjAccountEmail(e.target.value)}
                    placeholder="your-email@example.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email address associated with your CJ Dropshipping account
                  </p>
                </div>

                <div>
                  <Label htmlFor="cjApiKey">CJ API Key</Label>
                  <Input
                    id="cjApiKey"
                    type="password"
                    value={cjApiKey}
                    onChange={(e) => setCjApiKey(e.target.value)}
                    placeholder={
                      cjConfigured
                        ? "Enter new API key to update"
                        : "Enter your CJ API key"
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    API key is encrypted before storage. Get your API key from CJ
                    Dashboard → Store Authorization → CJ API
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveCJSettings}
                    disabled={submitting || !cjAccountEmail || !cjApiKey}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save & Test Connection
                      </>
                    )}
                  </Button>

                  {cjConfigured && (
                    <>
                      <Button
                        onClick={handleTestCJConnection}
                        disabled={cjTesting}
                        variant="outline"
                      >
                        {cjTesting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube className="mr-2 h-4 w-4" />
                            Test
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleClearCJSettings}
                        disabled={submitting}
                        variant="destructive"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="json" className="space-y-4">
                <div>
                  <Label htmlFor="cjJsonResponse">
                    Paste Authentication JSON Response
                  </Label>
                  <Textarea
                    id="cjJsonResponse"
                    value={cjJsonResponse}
                    onChange={(e) => setCjJsonResponse(e.target.value)}
                    placeholder='{"code":200,"result":true,"message":"Success","data":{...}}'
                    rows={10}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the complete JSON response from Postman or the CJ API authentication endpoint.
                    This bypasses the 5-minute rate limit.
                  </p>
                </div>

                <Button
                  onClick={handleSaveFromJSON}
                  disabled={submitting || !cjJsonResponse.trim()}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileJson className="mr-2 h-4 w-4" />
                      Save Tokens from JSON
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Token Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <CardTitle>API Token Management</CardTitle>
              </div>
              <Button variant="outline" onClick={() => router.push("/tokens")}>
                Manage Tokens
              </Button>
            </div>
            <CardDescription>
              Manage API tokens for OpenAI, Gemini, and Medusa. View usage logs
              and manage token lifecycle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Tokens:</span>
                <span className="font-medium">
                  {tokens.filter((t) => t.active).length} / {tokens.length}
                </span>
              </div>
              <div className="flex gap-2 text-sm">
                {tokens
                  .filter((t) => t.active)
                  .map((token) => (
                    <span
                      key={token.id}
                      className="px-2 py-1 bg-muted rounded capitalize"
                    >
                      {token.provider}
                    </span>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <CardTitle>Price Rules</CardTitle>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/settings/price-rules")}
              >
                Manage Price Rules
              </Button>
            </div>
            <CardDescription>
              Configure pricing rules for automatic margin monitoring and price
              calculations
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Global Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <CardTitle>Global Preferences</CardTitle>
            </div>
            <CardDescription>
              Configure default settings for currency, margins, and locale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fxBaseCurrency">FX Base Currency</Label>
              <Select
                value={fxBaseCurrency}
                onValueChange={(value: "CAD" | "USD" | "AUTO") =>
                  setFxBaseCurrency(value)
                }
              >
                <SelectTrigger id="fxBaseCurrency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAD">CAD (Canadian Dollar)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                  <SelectItem value="AUTO">AUTO (Auto-detect)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="defaultMarginPct">
                Default Margin Percentage
              </Label>
              <Input
                id="defaultMarginPct"
                type="number"
                min="0"
                max="100"
                value={defaultMarginPct}
                onChange={(e) =>
                  setDefaultMarginPct(parseFloat(e.target.value) || 0)
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default margin percentage for price calculations
              </p>
            </div>
            <div>
              <Label htmlFor="defaultLocale">Default Locale</Label>
              <Select
                value={defaultLocale}
                onValueChange={(value: "en" | "fr") => setDefaultLocale(value)}
              >
                <SelectTrigger id="defaultLocale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
