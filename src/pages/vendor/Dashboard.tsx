import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState, EmptyStateContent, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from "@/components/ui/empty-state.tsx";
import { Package, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-auth.ts";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const categories = useQuery(api.categories.getCategories, {});
  const products = useQuery(api.products.getProducts, {});
  const myQuotations = useQuery(api.vendorQuotations.getMyQuotations, {});
  const pendingRFQs = useQuery(api.vendorQuotations.getPendingRFQs, {});
  const availableProducts = useQuery(api.products.getProducts, {});
  const sentQuotations = useQuery(api.rfqs.getMyQuotationsSent, {});
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [brand, setBrand] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<"cash" | "credit">("cash");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [warrantyPeriod, setWarrantyPeriod] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPhoto, setProductPhoto] = useState("");

  const createQuotation = useMutation(api.vendorQuotations.createQuotation);

  // Handle redirects in useEffect
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (currentUser && currentUser.role !== "vendor") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return <div className="p-8">Loading...</div>;
  }

  if (!currentUser.verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" />
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your vendor account is pending admin verification. You'll be able to submit quotations once verified.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredProducts = selectedCategory
    ? products?.filter((p) => p.categoryId === selectedCategory)
    : [];

  const handleAddQuotation = async () => {
    if (!selectedProductId || !price || !quantity) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await createQuotation({
        productId: selectedProductId as Id<"products">,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        brand: brand || undefined,
        paymentTerms,
        deliveryTime,
        warrantyPeriod,
        countryOfOrigin: countryOfOrigin || undefined,
        productDescription: productDescription || undefined,
        productPhoto: productPhoto || undefined,
      });

      toast.success("Product quotation added successfully");
      setIsAddDialogOpen(false);
      // Reset form
      setSelectedCategory("");
      setSelectedProductId("");
      setPrice("");
      setQuantity("");
      setBrand("");
      setDeliveryTime("");
      setWarrantyPeriod("");
      setCountryOfOrigin("");
      setProductDescription("");
      setProductPhoto("");
    } catch (error) {
      toast.error("Failed to add quotation");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {currentUser.companyName || currentUser.name}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")}>
              Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="products">
              My Products ({myQuotations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="quotations">
              Sent Quotations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Product Quotations</h2>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4 mr-2" />
                    Add Product Quotation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Product Quotation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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

                    {selectedCategory && (
                      <div className="space-y-2">
                        <Label>Product *</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredProducts?.map((product) => (
                              <SelectItem key={product._id} value={product._id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price (KES) *</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="4500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity Available *</Label>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Philips, Siemens, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Payment Terms *</Label>
                        <Select value={paymentTerms} onValueChange={(v: "cash" | "credit") => setPaymentTerms(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Delivery Time *</Label>
                        <Input
                          value={deliveryTime}
                          onChange={(e) => setDeliveryTime(e.target.value)}
                          placeholder="3-5 days"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Warranty Period *</Label>
                        <Input
                          value={warrantyPeriod}
                          onChange={(e) => setWarrantyPeriod(e.target.value)}
                          placeholder="12 months"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Country of Origin</Label>
                        <Input
                          value={countryOfOrigin}
                          onChange={(e) => setCountryOfOrigin(e.target.value)}
                          placeholder="Kenya, China, USA, etc."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Product Description</Label>
                      <Textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Detailed product description and specifications"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Product Photo URL</Label>
                      <Input
                        value={productPhoto}
                        onChange={(e) => setProductPhoto(e.target.value)}
                        placeholder="https://cdn.hercules.app/file_..."
                      />
                    </div>

                    <Button onClick={handleAddQuotation} className="w-full">
                      Submit Quotation
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {!myQuotations || myQuotations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="size-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No product quotations yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first product quotation to start receiving RFQs
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {myQuotations.map((quotation) => (
                  <Card key={quotation._id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{quotation.product?.name}</h3>
                          {quotation.brand && (
                            <p className="text-sm text-muted-foreground">Brand: {quotation.brand}</p>
                          )}
                          <p className="text-lg font-bold text-primary mt-2">
                            KES {quotation.price.toLocaleString()}
                          </p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant={quotation.paymentTerms === "cash" ? "default" : "secondary"}>
                              {quotation.paymentTerms}
                            </Badge>
                            <Badge variant="outline">{quotation.deliveryTime}</Badge>
                            <Badge variant="outline">{quotation.warrantyPeriod}</Badge>
                            {quotation.countryOfOrigin && (
                              <Badge variant="outline">{quotation.countryOfOrigin}</Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={quotation.active ? "default" : "secondary"}>
                          {quotation.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotations">
            <Card>
              <CardHeader>
                <CardTitle>Sent Quotations</CardTitle>
                <CardDescription>
                  Track quotations sent to buyers and see approval status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!sentQuotations && (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )}
                {sentQuotations && sentQuotations.length === 0 && (
                  <EmptyState>
                    <EmptyStateContent>
                      <EmptyStateIcon>
                        <Package className="size-8" />
                      </EmptyStateIcon>
                      <EmptyStateTitle>No quotations sent yet</EmptyStateTitle>
                      <EmptyStateDescription>
                        Your quotations will appear here when buyers request products you've added
                      </EmptyStateDescription>
                    </EmptyStateContent>
                  </EmptyState>
                )}
                {sentQuotations && sentQuotations.length > 0 && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Delivery</TableHead>
                          <TableHead>Sent Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sentQuotations.map((quot: {
                          _id: string;
                          productName?: string;
                          buyerName?: string;
                          buyerEmail?: string;
                          buyerPhone?: string;
                          price: number;
                          deliveryTime: string;
                          sentAt: number;
                          chosen: boolean;
                          opened: boolean;
                        }) => (
                          <TableRow key={quot._id}>
                            <TableCell className="font-medium">
                              {quot.productName || "Unknown Product"}
                            </TableCell>
                            <TableCell>
                              {quot.chosen && quot.buyerName !== "Anonymous Buyer" ? (
                                <div>
                                  <div className="font-medium">{quot.buyerName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {quot.buyerEmail}
                                  </div>
                                  {quot.buyerPhone && (
                                    <div className="text-sm text-muted-foreground">
                                      {quot.buyerPhone}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Anonymous Buyer</span>
                              )}
                            </TableCell>
                            <TableCell>KES {quot.price.toLocaleString()}</TableCell>
                            <TableCell>{quot.deliveryTime}</TableCell>
                            <TableCell>
                              {new Date(quot.sentAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {quot.chosen ? (
                                <Badge variant="default" className="bg-green-500">
                                  ✓ Approved
                                </Badge>
                              ) : quot.opened ? (
                                <Badge variant="secondary">Opened</Badge>
                              ) : (
                                <Badge variant="outline">Sent</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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