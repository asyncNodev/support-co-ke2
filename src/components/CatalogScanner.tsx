import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ScanLine,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";

type ExtractedProduct = {
  name: string;
  description: string;
  category: string;
  specifications: string;
  price?: number;
  sku?: string;
  brand?: string;
  image?: string;
  selected?: boolean;
  categoryId?: Id<"categories">;
};

type CatalogScannerProps = {
  userRole?: "admin" | "vendor";
  vendorId?: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CatalogScanner({
  userRole = "admin",
  vendorId,
  open,
  onOpenChange,
}: CatalogScannerProps) {
  const { user } = useAuth() as { user: any };
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [extractedProducts, setExtractedProducts] = useState<
    ExtractedProduct[]
  >([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const categories = useQuery(api.categories.getCategories, {});
  const scanCatalog = useAction(api.ai.catalogScanner.scanCatalogImage);
  const createProduct = useMutation(api.products.createProduct);
  const createQuotation = useMutation(api.vendorQuotations.createQuotation);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
    setExtractedProducts([]);
  };

  const handleScanCatalog = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setIsScanning(true);
    setExtractedProducts([]);
    setCurrentFileIndex(0);

    try {
      const allProducts: ExtractedProduct[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentFileIndex(i + 1);
        const file = selectedFiles[i];

        // Convert file to base64 data URL
        const reader = new FileReader();
        const imageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Scan the image
        const result = await scanCatalog({ imageUrl });

        // Add products with selected flag
        const productsWithSelection = result.products.map((p) => ({
          ...p,
          selected: true,
        }));

        allProducts.push(...productsWithSelection);
      }

      setExtractedProducts(allProducts);
      toast.success(
        `Extracted ${allProducts.length} products from ${selectedFiles.length} file(s)`,
      );
    } catch (error) {
      console.error("Scan error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to scan catalog",
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    setExtractedProducts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, categoryId: categoryId as Id<"categories"> } : p,
      ),
    );
  };

  const handleToggleProduct = (index: number) => {
    setExtractedProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p)),
    );
  };

  const handleImportProducts = async () => {
    const selectedProducts = extractedProducts.filter((p) => p.selected);

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product to import");
      return;
    }

    setIsImporting(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const product of selectedProducts) {
        try {
          // Match category by name if not already matched
          let categoryId = product.categoryId;
          if (!categoryId) {
            const matchedCategory = categories?.find(
              (c) => c.name.toLowerCase() === product.category.toLowerCase(),
            );
            categoryId = matchedCategory?._id;
          }

          if (!categoryId) {
            console.warn(`No category found for: ${product.category}`);
            errorCount++;
            continue;
          }

          if (userRole === "admin") {
            // Admin creates product
            await createProduct({
              name: product.name,
              categoryId,
              description: product.description,
              specifications: product.specifications || "",
              sku: product.sku,
              price: product.price ?? 0,
              userId: user?._id,
            });
            successCount++;
          } else if (userRole === "vendor" && vendorId) {
            // First create product if admin, or vendor creates quotation
            const productId = await createProduct({
              name: product.name,
              categoryId,
              description: product.description,
              specifications: product.specifications || "",
              sku: product.sku,
              price: product.price ?? 0,
              userId: user?._id,
            });

            // Create pre-filled quotation
            await createQuotation({
              productId,
              price: product.price || 0,
              quantity: 1,
              paymentTerms: "cash",
              deliveryTime: "2-4 weeks",
              warrantyPeriod: "1 year",
              brand: product.brand,
              userId: user?._id,
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Error importing ${product.name}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully imported ${successCount} product${successCount > 1 ? "s" : ""}` +
            (errorCount > 0 ? `. ${errorCount} failed.` : ""),
        );
        setExtractedProducts([]);
        setSelectedFiles(null);
      } else {
        toast.error("Failed to import products");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import products");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Scan Product Catalog
          </DialogTitle>
          <DialogDescription>
            Upload catalog images or PDFs. AI will automatically extract product
            information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="h-5 w-5" />
                Scan Catalog
              </CardTitle>
              <CardDescription>
                Upload product catalog images or PDFs. AI will extract product
                information automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="catalog-upload">Upload Catalog Files</Label>
                <Input
                  id="catalog-upload"
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileChange}
                  disabled={isScanning}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports: JPG, PNG, PDF. You can upload multiple files.
                </p>
              </div>

              <Button
                onClick={handleScanCatalog}
                disabled={!selectedFiles || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning {currentFileIndex} of {selectedFiles?.length}...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Scan Catalog
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Extracted Products */}
          {extractedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Extracted Products ({extractedProducts.length})
                </CardTitle>
                <CardDescription>
                  Review and select products to import. Match categories if
                  needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {extractedProducts.map((product, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={product.selected}
                        onCheckedChange={() => handleToggleProduct(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold">{product.name}</h4>
                            {product.sku && (
                              <Badge variant="outline">{product.sku}</Badge>
                            )}
                            {product.brand && (
                              <Badge variant="secondary">{product.brand}</Badge>
                            )}
                          </div>
                          {product.price && (
                            <Badge variant="default">
                              KSh {product.price.toLocaleString()}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {product.description}
                        </p>

                        {product.specifications && (
                          <p className="text-xs text-muted-foreground">
                            {product.specifications}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Category:</Label>
                          <Select
                            value={product.categoryId || ""}
                            onValueChange={(value) =>
                              handleCategoryChange(index, value)
                            }
                          >
                            <SelectTrigger className="h-8 w-[200px]">
                              <SelectValue placeholder={product.category} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories?.map((cat) => (
                                <SelectItem key={cat._id} value={cat._id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={handleImportProducts}
                    disabled={
                      isImporting || !extractedProducts.some((p) => p.selected)
                    }
                    className="flex-1"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Import Selected (
                        {extractedProducts.filter((p) => p.selected).length})
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setExtractedProducts([])}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Box */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="text-sm space-y-2">
                  <p className="font-medium text-blue-900">
                    Tips for best results:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Use clear, high-quality images or PDFs</li>
                    <li>Ensure product names and details are readable</li>
                    <li>One page per file works best</li>
                    <li>Review extracted data before importing</li>
                    <li>
                      Match categories manually if AI doesn't find exact match
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
