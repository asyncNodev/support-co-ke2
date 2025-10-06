import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type BulkProductUploadProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BulkProductUpload({ open, onOpenChange }: BulkProductUploadProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const categories = useQuery(api.categories.getCategories, {});
  const bulkCreateProducts = useMutation(api.products.bulkCreateProducts);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setUploadResults(null);
    } else {
      toast.error("Please select a CSV file");
    }
  };

  const parseCsv = (text: string): Array<{ name: string; category: string; description: string; image?: string; sku?: string; specifications?: string }> => {
    const lines = text.split("\n").filter(line => line.trim());
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    const products: Array<{ name: string; category: string; description: string; image?: string; sku?: string; specifications?: string }> = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length < 3) continue;
      
      const product: { name: string; category: string; description: string; image?: string; sku?: string; specifications?: string } = {
        name: "",
        category: "",
        description: "",
      };
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || "";
        if (header === "name" || header === "product name") product.name = value;
        else if (header === "category") product.category = value;
        else if (header === "description") product.description = value;
        else if (header === "image" || header === "photo" || header === "image url") product.image = value;
        else if (header === "sku") product.sku = value;
        else if (header === "specifications" || header === "specs") product.specifications = value;
      });
      
      if (product.name && product.category && product.description) {
        products.push(product);
      }
    }
    
    return products;
  };

  const handleUpload = async () => {
    if (!csvFile || !categories) {
      toast.error("Please select a CSV file");
      return;
    }

    setIsUploading(true);

    try {
      const text = await csvFile.text();
      const parsedProducts = parseCsv(text);

      if (parsedProducts.length === 0) {
        toast.error("No valid products found in CSV");
        setIsUploading(false);
        return;
      }

      // Create a map of category names to IDs
      const categoryMap: Record<string, Id<"categories">> = {};
      categories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat._id;
      });

      // Convert to product format with category IDs
      const productsToCreate: Array<{
        name: string;
        categoryId: Id<"categories">;
        description: string;
        image?: string;
        sku?: string;
        specifications?: string;
      }> = [];

      const errors: string[] = [];

      for (const product of parsedProducts) {
        const categoryId = categoryMap[product.category.toLowerCase()];
        if (!categoryId) {
          errors.push(`Category "${product.category}" not found for product "${product.name}"`);
          continue;
        }

        productsToCreate.push({
          name: product.name,
          categoryId,
          description: product.description,
          image: product.image,
          sku: product.sku,
          specifications: product.specifications,
        });
      }

      if (errors.length > 0) {
        console.warn("Errors during CSV parsing:", errors);
      }

      // Bulk create products
      const result = await bulkCreateProducts({ products: productsToCreate });

      setUploadResults({
        success: result.count,
        failed: parsedProducts.length - result.count,
      });

      toast.success(`Successfully uploaded ${result.count} products`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload products");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "name,category,description,image,sku,specifications\nHospital Bed,Patient Care Equipment,Standard hospital bed with adjustable height,https://example.com/bed.jpg,BED-001,Electric adjustable\nWheelchair,Patient Care Equipment,Manual wheelchair for patient mobility,,,Standard manual wheelchair";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleClose = () => {
    setCsvFile(null);
    setUploadResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Products</DialogTitle>
          <DialogDescription>
            Upload multiple products at once using a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instructions */}
          <Alert>
            <FileSpreadsheet className="size-4" />
            <AlertDescription>
              <p className="font-medium mb-2">CSV Format Requirements:</p>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Required columns: name, category, description</li>
                <li>Optional columns: image, sku, specifications</li>
                <li>Category must match exactly with existing categories</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Download Template */}
          <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
            <FileSpreadsheet className="size-4 mr-2" />
            Download CSV Template
          </Button>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload CSV File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="size-4 mr-2" />
              {csvFile ? csvFile.name : "Choose CSV File"}
            </Button>
          </div>

          {/* Upload Results */}
          {uploadResults && (
            <Alert variant={uploadResults.failed > 0 ? "destructive" : "default"}>
              {uploadResults.failed > 0 ? (
                <AlertCircle className="size-4" />
              ) : (
                <CheckCircle className="size-4" />
              )}
              <AlertDescription>
                <p className="font-medium">Upload Complete</p>
                <p className="text-sm">
                  Successfully created: {uploadResults.success} products
                  {uploadResults.failed > 0 && ` • Failed: ${uploadResults.failed} products`}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!csvFile || isUploading}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload Products"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
