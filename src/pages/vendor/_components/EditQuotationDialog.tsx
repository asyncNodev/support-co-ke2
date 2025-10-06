import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
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

type Quotation = {
  _id: Id<"vendorQuotations">;
  price: number;
  quantity: number;
  brand?: string;
  paymentTerms: "cash" | "credit";
  deliveryTime: string;
  warrantyPeriod: string;
  countryOfOrigin?: string;
  productDescription?: string;
  productPhoto?: string;
  productSpecifications?: string;
};

type EditQuotationDialogProps = {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditQuotationDialog({ quotation, open, onOpenChange }: EditQuotationDialogProps) {
  const updateQuotation = useMutation(api.vendorQuotations.updateQuotation);

  const [formData, setFormData] = useState({
    price: "",
    quantity: "",
    brand: "",
    paymentTerms: "cash" as "cash" | "credit",
    deliveryTime: "",
    warrantyPeriod: "",
    countryOfOrigin: "",
    productDescription: "",
    productPhoto: "",
    productSpecifications: "",
  });

  useEffect(() => {
    if (quotation) {
      setFormData({
        price: quotation.price.toString(),
        quantity: quotation.quantity.toString(),
        brand: quotation.brand || "",
        paymentTerms: quotation.paymentTerms,
        deliveryTime: quotation.deliveryTime,
        warrantyPeriod: quotation.warrantyPeriod,
        countryOfOrigin: quotation.countryOfOrigin || "",
        productDescription: quotation.productDescription || "",
        productPhoto: quotation.productPhoto || "",
        productSpecifications: quotation.productSpecifications || "",
      });
    }
  }, [quotation]);

  const handleSubmit = async () => {
    if (!quotation || !formData.price || !formData.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await updateQuotation({
        quotationId: quotation._id,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        brand: formData.brand || undefined,
        paymentTerms: formData.paymentTerms,
        deliveryTime: formData.deliveryTime,
        warrantyPeriod: formData.warrantyPeriod,
        countryOfOrigin: formData.countryOfOrigin || undefined,
        productDescription: formData.productDescription || undefined,
        productPhoto: formData.productPhoto || undefined,
        productSpecifications: formData.productSpecifications || undefined,
      });
      toast.success("Quotation updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update quotation");
      console.error(error);
    }
  };

  if (!quotation) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quotation</DialogTitle>
          <DialogDescription>
            Update your product quotation details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (KES) *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="4500"
              />
            </div>

            <div>
              <Label>Quantity Available *</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="100"
              />
            </div>
          </div>

          <div>
            <Label>Brand</Label>
            <Input
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Philips, Siemens, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment Terms *</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(v: "cash" | "credit") => setFormData({ ...formData, paymentTerms: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Delivery Time *</Label>
              <Input
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                placeholder="3-5 days"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Warranty Period *</Label>
              <Input
                value={formData.warrantyPeriod}
                onChange={(e) => setFormData({ ...formData, warrantyPeriod: e.target.value })}
                placeholder="12 months"
              />
            </div>

            <div>
              <Label>Country of Origin</Label>
              <Input
                value={formData.countryOfOrigin}
                onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                placeholder="Kenya, China, USA, etc."
              />
            </div>
          </div>

          <div>
            <Label>Product Description</Label>
            <Textarea
              value={formData.productDescription}
              onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
              placeholder="Detailed product description"
              rows={3}
            />
          </div>

          <PhotoUpload
            value={formData.productPhoto}
            onChange={(url) => setFormData({ ...formData, productPhoto: url })}
            label="Product Photo"
            uploadUrlMutation={api.vendorQuotations.generateUploadUrl}
          />

          <div>
            <Label>Product Specifications</Label>
            <Textarea
              value={formData.productSpecifications}
              onChange={(e) => setFormData({ ...formData, productSpecifications: e.target.value })}
              placeholder="Technical specifications"
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            Update Quotation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
