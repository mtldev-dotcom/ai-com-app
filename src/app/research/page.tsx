"use client";

/**
 * Research Page (AI Console)
 * AI-powered research for trends, suppliers, and products
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Search,
  TrendingUp,
  Users,
  Package,
  Copy,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  analyzeTrendsAction,
  findSuppliersAction,
  researchProductAction,
  createDraftFromResearch,
} from "@/app/actions/research";

export default function ResearchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Trends state
  const [trendsKeywords, setTrendsKeywords] = useState("");
  const [trendsResult, setTrendsResult] = useState<{
    trends: string[];
    suggestedTags: string[];
    insights: string;
  } | null>(null);

  // Suppliers state
  const [suppliersCriteria, setSuppliersCriteria] = useState("");
  const [suppliersResult, setSuppliersResult] = useState<{
    matches: Array<{
      supplierId: string;
      supplierName: string;
      matchScore: number;
      reasoning: string;
    }>;
  } | null>(null);

  // Product research state
  const [productInfo, setProductInfo] = useState("");
  const [productResult, setProductResult] = useState<{
    title: string;
    description: string;
    specs: Record<string, string>;
    estimatedPrice?: string;
    features: string[];
    tags: string[];
  } | null>(null);

  const handleAnalyzeTrends = async () => {
    if (!trendsKeywords.trim()) {
      setError("Please enter keywords to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setTrendsResult(null);

    try {
      const result = await analyzeTrendsAction(trendsKeywords);
      setTrendsResult(result);
      setSuccess("Trends analyzed successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze trends");
    } finally {
      setLoading(false);
    }
  };

  const handleFindSuppliers = async () => {
    if (!suppliersCriteria.trim()) {
      setError("Please enter search criteria");
      return;
    }

    setLoading(true);
    setError(null);
    setSuppliersResult(null);

    try {
      const result = await findSuppliersAction(suppliersCriteria);
      setSuppliersResult(result);
      setSuccess(
        result.matches.length > 0
          ? `Found ${result.matches.length} matching suppliers`
          : "No suppliers found matching your criteria"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleResearchProduct = async () => {
    if (!productInfo.trim()) {
      setError("Please enter product information");
      return;
    }

    setLoading(true);
    setError(null);
    setProductResult(null);

    try {
      const result = await researchProductAction(productInfo);
      setProductResult(result);
      setSuccess("Product researched successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to research product"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!productResult) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createDraftFromResearch({
        title: productResult.title,
        description: productResult.description,
        specs: productResult.specs,
        features: productResult.features,
        tags: productResult.tags,
      });

      if (result.success && result.id) {
        setSuccess("Draft created successfully");
        setTimeout(() => {
          router.push(`/drafts/${result.id}`);
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create draft");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard");
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Research Console</h1>
          <p className="text-muted-foreground">
            Analyze trends, find suppliers, and research competitor products
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trends Analysis
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              <Users className="mr-2 h-4 w-4" />
              Supplier Finder
            </TabsTrigger>
            <TabsTrigger value="product">
              <Package className="mr-2 h-4 w-4" />
              Product Research
            </TabsTrigger>
          </TabsList>

          {/* Trends Analysis Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trends Analysis</CardTitle>
                <CardDescription>
                  Analyze market trends and get keyword and tag suggestions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="trendsKeywords">
                    Product Category / Keywords
                  </Label>
                  <Input
                    id="trendsKeywords"
                    value={trendsKeywords}
                    onChange={(e) => setTrendsKeywords(e.target.value)}
                    placeholder="e.g., wireless headphones, eco-friendly products"
                  />
                </div>
                <Button onClick={handleAnalyzeTrends} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Analyze Trends
                    </>
                  )}
                </Button>

                {trendsResult && (
                  <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                    <div>
                      <h3 className="font-semibold mb-2">Trending Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {trendsResult.trends.map((trend, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary/10 rounded-full text-sm"
                          >
                            {trend}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Suggested Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {trendsResult.suggestedTags.map((tag, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="px-3 py-1 bg-secondary rounded-full text-sm">
                              {tag}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(tag)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Market Insights</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {trendsResult.insights}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supplier Finder Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Finder</CardTitle>
                <CardDescription>
                  Find suppliers matching your requirements using AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="suppliersCriteria">Search Criteria</Label>
                  <Textarea
                    id="suppliersCriteria"
                    value={suppliersCriteria}
                    onChange={(e) => setSuppliersCriteria(e.target.value)}
                    placeholder="e.g., suppliers in Canada, fast shipping, electronics, high quality rating"
                    rows={3}
                  />
                </div>
                <Button onClick={handleFindSuppliers} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Find Suppliers
                    </>
                  )}
                </Button>

                {suppliersResult && (
                  <div className="space-y-3">
                    {suppliersResult.matches.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No suppliers found matching your criteria
                      </p>
                    ) : (
                      suppliersResult.matches.map((match) => (
                        <Card key={match.supplierId}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">
                                    {match.supplierName}
                                  </h3>
                                  <span className="px-2 py-1 bg-primary/10 rounded text-xs">
                                    {match.matchScore}% match
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {match.reasoning}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/suppliers/${match.supplierId}`)
                                }
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Product Research Tab */}
          <TabsContent value="product" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Research</CardTitle>
                <CardDescription>
                  Extract specs, pricing, and features from competitor product
                  information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="productInfo">Product Information</Label>
                  <Textarea
                    id="productInfo"
                    value={productInfo}
                    onChange={(e) => setProductInfo(e.target.value)}
                    placeholder="Paste product description, specs, pricing, features, etc."
                    rows={6}
                  />
                </div>
                <Button onClick={handleResearchProduct} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Research Product
                    </>
                  )}
                </Button>

                {productResult && (
                  <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {productResult.title}
                        </h3>
                        {productResult.estimatedPrice && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Estimated Price: {productResult.estimatedPrice}
                          </p>
                        )}
                      </div>
                      <Button onClick={handleCreateDraft} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Create Draft
                          </>
                        )}
                      </Button>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {productResult.description}
                      </p>
                    </div>
                    {Object.keys(productResult.specs).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Specifications</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(productResult.specs).map(
                            ([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium">{key}:</span>{" "}
                                <span className="text-muted-foreground">
                                  {value}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {productResult.features.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Features</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {productResult.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {productResult.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {productResult.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-secondary rounded-full text-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
