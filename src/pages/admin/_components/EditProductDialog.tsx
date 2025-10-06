import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { toast } from "sonner";

type EditProductDialogProps = {
  productId: Id<"products"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProductDialog({ productId, open, onOpenChange }: EditProductDialogProps) {
  const product = useQuery(
    api.products.getProduct,
    productId ? { productId } : "skip"
  );
  const categories = useQuery(api.categories.getCategories, {});
  const updateProduct = useMutation(api.products.updateProduct);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    description: "",
    image: "",
    sku: "",
    specifications: "",
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        image: product.image || "",
        sku: product.sku || "",
        specifications: product.specifications || "",
      });
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!productId || !formData.name || !formData.categoryId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateProduct({
        productId,
        name: formData.name,
        categoryId: formData.categoryId as Id<"categories">,
        description: formData.description,
        image: formData.image || undefined,
        sku: formData.sku || undefined,
        specifications: formData.specifications || undefined,
      });
      toast.success("Product updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update product");
      console.error(error);
    }
  };

  if (!product || !categories) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Hospital Bed"
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description"
              rows={3}
            />
          </div>

          <PhotoUpload
            value={formData.image}
            onChange={(url) => setFormData({ ...formData, image: url })}
            label="Product Photo"
            uploadUrlMutation={api.products.generateUploadUrl}
          />

          <div>
            <Label>SKU</Label>
            <Input
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="PROD-001"
            />
          </div>

          <div>
            <Label>Specifications</Label>
            <Textarea
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              placeholder="Technical specifications"
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Update Product
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
