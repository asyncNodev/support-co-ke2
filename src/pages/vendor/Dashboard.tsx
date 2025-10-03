import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useUser } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { Package, Clock, AlertCircle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";

export default function VendorDashboard() {
  const { isAuthenticated } = useUser({ shouldRedirect: true });
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const pendingRFQs = useQuery(api.vendorQuotations.getPendingRFQs, isAuthenticated ? {} : "skip");
  const myQuotations = useQuery(api.vendorQuotations.getMyQuotations, isAuthenticated ? {} : "skip");
  const availableProducts = useQuery(api.vendorQuotations.getProductsWithoutQuotation, isAuthenticated ? {} : "skip");
  const sentQuotations = useQuery(api.vendorQuotations.getMySentQuotations, isAuthenticated ? {} : "skip");
  
  const submitOnDemand = useMutation(api.vendorQuotations.submitOnDemandQuotation);
  const createQuotation = useMutation(api.vendorQuotations.createQuotation);

  type PendingRFQItem = NonNullable<typeof pendingRFQs>[0]["items"][0] & { 
    rfqId: Id<"rfqs">;
    expectedDeliveryTime?: string;
    createdAt: number;
  };
  const [selectedRFQ, setSelectedRFQ] = useState<PendingRFQItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Id<"products"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flatten pending RFQs into individual items
  const flattenedPendingItems: PendingRFQItem[] = pendingRFQs?.flatMap(rfq => 
    rfq.items.map(item => ({
      ...item,
      rfqId: rfq._id,
      expectedDeliveryTime: rfq.expectedDeliveryTime,
      createdAt: rfq.createdAt
    }))
  ) || [];

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  if (currentUser.role !== "vendor") {
    navigate("/");
    return null;
  }

  if (!currentUser.verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-lg">
          <CardHeader>
            <AlertCircle className="size-12 text-yellow-500 mb-4" />
            <CardTitle>Account Pending Verification</CardTitle>
            <CardDescription>
              Your vendor account is pending admin approval. You'll be notified once verified and can start submitting quotations.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleSubmitOnDemand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRFQ) return;

    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);

    try {
      await submitOnDemand({
        rfqId: selectedRFQ.rfqId,
        productId: selectedRFQ.productId,
        price: Number(formData.get("price")),
        quantity: Number(formData.get("quantity")),
        paymentTerms: formData.get("paymentTerms") as "cash" | "credit",
        deliveryTime: formData.get("deliveryTime") as string,
        warrantyPeriod: formData.get("warrantyPeriod") as string,
        countryOfOrigin: formData.get("countryOfOrigin") as string,
        productSpecifications: formData.get("productSpecifications") as string,
        productDescription: formData.get("productDescription") as string,
      });
      toast.success("Quotation submitted successfully!");
      setSelectedRFQ(null);
    } catch (error) {
      toast.error("Failed to submit quotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(e.currentTarget);
    setIsSubmitting(true);

    try {
      await createQuotation({
        productId: selectedProduct,
        price: Number(formData.get("price")),
        quantity: Number(formData.get("quantity")),
        paymentTerms: formData.get("paymentTerms") as "cash" | "credit",
        deliveryTime: formData.get("deliveryTime") as string,
        warrantyPeriod: formData.get("warrantyPeriod") as string,
        countryOfOrigin: formData.get("countryOfOrigin") as string,
        productSpecifications: formData.get("productSpecifications") as string,
        productDescription: formData.get("productDescription") as string,
      });
      toast.success("Pre-filled quotation created!");
      setSelectedProduct(null);
    } catch (error) {
      toast.error("Failed to create quotation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your quotations and RFQ responses</p>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Pending RFQs
              {flattenedPendingItems && flattenedPendingItems.length > 0 && (
                <Badge variant="destructive" className="ml-2">{flattenedPendingItems.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quotations">My Quotations ({myQuotations?.length || 0})</TabsTrigger>
            <TabsTrigger value="sent">Sent ({sentQuotations?.filter(q => q.opened).length || 0})</TabsTrigger>
          </TabsList>

          {/* Pending RFQs */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" />
                  RFQs Awaiting Your Quotation
                </CardTitle>
                <CardDescription>
                  Buyers have requested quotations for products you supply. Submit your pricing to win the order.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!pendingRFQs ? (
                  <Skeleton className="h-32" />
                ) : flattenedPendingItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No pending RFQs</p>
                ) : (
                  <div className="space-y-4">
                    {flattenedPendingItems.map((rfq) => (
                      <div key={`${rfq.rfqId}-${rfq.productId}`} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <h3 className="font-semibold">{rfq.productName}</h3>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>Buyer: <strong>Anonymous</strong></span>
                              <span>Qty: <strong>{rfq.quantity}</strong></span>
                              {rfq.expectedDeliveryTime && (
                                <span>Expected: <strong>{rfq.expectedDeliveryTime}</strong></span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Requested {new Date(rfq.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Dialog open={selectedRFQ?.productId === rfq.productId && selectedRFQ?.rfqId === rfq.rfqId} onOpenChange={(open) => !open && setSelectedRFQ(null)}>
                            <DialogTrigger asChild>
                              <Button onClick={() => setSelectedRFQ(rfq)}>
                                Submit Quotation
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Submit Quotation for {rfq.productName}</DialogTitle>
                                <DialogDescription>
                                  Buyer information will remain anonymous until they choose your quotation
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleSubmitOnDemand} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="price">Price (KES) *</Label>
                                    <Input id="price" name="price" type="number" required placeholder="1000" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity Available *</Label>
                                    <Input id="quantity" name="quantity" type="number" required placeholder={rfq.quantity.toString()} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="paymentTerms">Payment Terms *</Label>
                                    <Select name="paymentTerms" required>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select terms" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="credit">Credit</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="deliveryTime">Delivery Time *</Label>
                                    <Input id="deliveryTime" name="deliveryTime" required placeholder="7-10 days" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="warrantyPeriod">Warranty Period *</Label>
                                    <Input id="warrantyPeriod" name="warrantyPeriod" required placeholder="1 year" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="countryOfOrigin">Country of Origin *</Label>
                                    <Input id="countryOfOrigin" name="countryOfOrigin" required placeholder="Kenya" />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="productSpecifications">Product Specifications *</Label>
                                  <Textarea id="productSpecifications" name="productSpecifications" required placeholder="Detailed technical specifications..." rows={3} />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="productDescription">Additional Description</Label>
                                  <Textarea id="productDescription" name="productDescription" placeholder="Additional information..." rows={2} />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setSelectedRFQ(null)}>
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Submitting..." : "Submit Quotation"}
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Pre-filled Quotations */}
          <TabsContent value="quotations" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="size-5" />
                      Pre-filled Quotations
                    </CardTitle>
                    <CardDescription>Quotations ready for instant matching</CardDescription>
                  </div>
                  {availableProducts && availableProducts.length > 0 && (
                    <Dialog open={selectedProduct !== null} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="size-4 mr-2" />
                          Add Quotation
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create Pre-filled Quotation</DialogTitle>
                          <DialogDescription>
                            Add quotation for products you supply for instant matching
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateQuotation} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="product">Select Product *</Label>
                            <Select onValueChange={(value) => setSelectedProduct(value as Id<"products">)} required>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a product" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableProducts?.map((product) => (
                                  <SelectItem key={product._id} value={product._id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="price">Price (KES) *</Label>
                              <Input id="price" name="price" type="number" required placeholder="1000" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="quantity">Quantity Available *</Label>
                              <Input id="quantity" name="quantity" type="number" required placeholder="100" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="paymentTerms">Payment Terms *</Label>
                              <Select name="paymentTerms" required>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select terms" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="credit">Credit</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="deliveryTime">Delivery Time *</Label>
                              <Input id="deliveryTime" name="deliveryTime" required placeholder="7-10 days" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="warrantyPeriod">Warranty Period *</Label>
                              <Input id="warrantyPeriod" name="warrantyPeriod" required placeholder="1 year" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="countryOfOrigin">Country of Origin *</Label>
                              <Input id="countryOfOrigin" name="countryOfOrigin" required placeholder="Kenya" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="productSpecifications">Product Specifications *</Label>
                            <Textarea id="productSpecifications" name="productSpecifications" required placeholder="Detailed technical specifications..." rows={3} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="productDescription">Additional Description</Label>
                            <Textarea id="productDescription" name="productDescription" placeholder="Additional information..." rows={2} />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setSelectedProduct(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !selectedProduct}>
                              {isSubmitting ? "Creating..." : "Create Quotation"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!myQuotations ? (
                  <Skeleton className="h-32" />
                ) : myQuotations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No quotations yet. Create your first one!</p>
                ) : (
                  <div className="space-y-2">
                    {myQuotations.map((quot) => (
                      <div key={quot._id} className="border rounded p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{quot.product?.name}</h3>
                          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                            <span>Price: <strong>KES {quot.price.toLocaleString()}</strong></span>
                            <span>Qty: <strong>{quot.quantity}</strong></span>
                            <span>{quot.paymentTerms}</span>
                          </div>
                        </div>
                        <Badge variant={quot.active ? "default" : "secondary"}>
                          {quot.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sent Quotations */}
          <TabsContent value="sent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quotations Sent to Buyers</CardTitle>
                <CardDescription>Track which buyers have opened your quotations</CardDescription>
              </CardHeader>
              <CardContent>
                {!sentQuotations ? (
                  <Skeleton className="h-32" />
                ) : sentQuotations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No quotations sent yet</p>
                ) : (
                  <div className="space-y-2">
                    {sentQuotations.filter(q => q.opened).map((quot) => (
                      <div key={quot._id} className="border rounded p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{quot.productName}</h3>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                              <span>Price: <strong>KES {quot.price.toLocaleString()}</strong></span>
                              <span>Qty: <strong>{quot.quantity}</strong></span>
                              {quot.chosen && <Badge variant="default">Chosen by Buyer!</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Sent {new Date(quot.sentAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={quot.quotationType === "pre-filled" ? "default" : "secondary"}>
                            {quot.quotationType === "pre-filled" ? "Pre-filled" : "On-demand"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}