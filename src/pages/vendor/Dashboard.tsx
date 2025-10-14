import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { PhotoUpload } from "@/components/ui/photo-upload";
import CatalogScanner from "@/components/CatalogScanner.tsx";
import { EditQuotationDialog } from "@/pages/vendor/_components/EditQuotationDialog";
import { GroupBuyOpportunities } from "@/pages/vendor/_components/GroupBuyOpportunities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { EmptyState, EmptyStateContent, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from "@/components/ui/empty-state.tsx";
import { Package, AlertCircle, Plus, Edit, Trash2, MessageCircle, XCircle, Clock, ScanLine, Users, BarChart3, TrendingUp, Star, Lightbulb, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-auth.ts";
import VendorRatingDisplay from "@/components/VendorRatingDisplay.tsx";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const categories = useQuery(api.categories.getCategories, {});
  const products = useQuery(api.products.getProducts, {});
  const myQuotations = useQuery(api.vendorQuotations.getMyQuotations, {});
  const pendingRFQs = useQuery(api.vendorQuotations.getPendingRFQs, {});
  const sentQuotations = useQuery(api.rfqs.getMyVendorQuotationsSent, {});
  const groupBuyOpportunities = useQuery(api.groupBuys.getGroupBuyOpportunitiesForVendor, {});
  const vendorPerformance = useQuery(api.vendorAnalytics.getVendorPerformance, {});
  const marketComparison = useQuery(api.vendorAnalytics.getMarketComparison, {});
  const vendorAdvisory = useQuery(api.vendorAdvisory.getVendorAdvisory, {});
  const recentPerformance = useQuery(api.vendorAnalytics.getRecentPerformance, {});
  
  // Add notifications query
  const notifications = useQuery(api.notifications.getMyNotifications, {});
  const markAsRead = useMutation(api.notifications.markAsRead);
  const updateQuotationPreference = useMutation(api.users.updateQuotationPreference);

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
  const [productSpecifications, setProductSpecifications] = useState("");
  const [selectedRFQ, setSelectedRFQ] = useState("");
  const [openRFQDialog, setOpenRFQDialog] = useState(false);
  const [editQuotationData, setEditQuotationData] = useState<{
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
  } | null>(null);
  const [editQuotationOpen, setEditQuotationOpen] = useState(false);
  const [catalogScannerOpen, setCatalogScannerOpen] = useState(false);

  const createQuotation = useMutation(api.vendorQuotations.createQuotation);
  const deleteQuotation = useMutation(api.vendorQuotations.deleteQuotation);

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

  // Check approval status
  if (currentUser.status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Account Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your account application has been rejected. Please contact support for more information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser.status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your account is pending admin approval. You will be notified once your account is approved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check vendor verification
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
        productSpecifications: productSpecifications || undefined,
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
      setProductSpecifications("");
    } catch (error) {
      toast.error("Failed to add quotation");
      console.error(error);
    }
  };

  const handleDeleteQuotation = async (quotationId: Id<"vendorQuotations">) => {
    if (!confirm("Are you sure you want to delete this quotation?")) {
      return;
    }

    try {
      await deleteQuotation({ quotationId });
      toast.success("Quotation deleted successfully");
    } catch (error) {
      toast.error("Failed to delete quotation");
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
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/browse">Browse & Request Products</Link>
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl">
            <TabsTrigger value="products">
              <Package className="size-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="size-4" /> Performance
            </TabsTrigger>
            <TabsTrigger value="advisory" className="flex items-center gap-2">
              <Lightbulb className="size-4" /> Sales Advisory
            </TabsTrigger>
            <TabsTrigger value="my-rfqs">
              <MessageCircle className="size-4" /> RFQs
            </TabsTrigger>
            <TabsTrigger value="quotations">
              Sent Quotations
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {notifications && notifications.filter(n => !n.read).length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ratings">
              My Ratings
            </TabsTrigger>
            <TabsTrigger value="groupbuys" className="flex items-center gap-2">
              <Users className="size-4" />
              Group Buys
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="size-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="settings">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Product Quotations</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCatalogScannerOpen(true)}>
                  <ScanLine className="size-4 mr-2" />
                  Scan Catalog
                </Button>
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

                      <PhotoUpload
                        value={productPhoto}
                        onChange={(url) => setProductPhoto(url)}
                        label="Product Photo"
                        uploadUrlMutation={api.vendorQuotations.generateUploadUrl}
                      />

                      <div className="space-y-2">
                        <Label>Product Specifications</Label>
                        <Textarea
                          value={productSpecifications}
                          onChange={(e) => setProductSpecifications(e.target.value)}
                          placeholder="Technical specifications"
                          rows={3}
                        />
                      </div>

                      <Button onClick={handleAddQuotation} className="w-full">
                        Submit Quotation
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                      <div className="flex gap-4">
                        {quotation.productPhoto && (
                          <img
                            src={quotation.productPhoto}
                            alt="Product"
                            className="size-24 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1">
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
                            <div className="flex flex-col gap-2">
                              <Badge variant={quotation.active ? "default" : "secondary"}>
                                {quotation.active ? "Active" : "Inactive"}
                              </Badge>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditQuotationData(quotation);
                                    setEditQuotationOpen(true);
                                  }}
                                >
                                  <Edit className="size-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteQuotation(quotation._id)}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Performance Dashboard</h2>
              <p className="text-muted-foreground">Track your success metrics and compare with market averages</p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vendorPerformance?.winRate?.toFixed(1) || "0"}%
                  </div>
                  {marketComparison && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Market avg: {marketComparison.marketAverageWinRate.toFixed(1)}%
                      {vendorPerformance && vendorPerformance.winRate > marketComparison.marketAverageWinRate && (
                        <span className="text-green-600 ml-1">↑ Above average</span>
                      )}
                      {vendorPerformance && vendorPerformance.winRate < marketComparison.marketAverageWinRate && (
                        <span className="text-red-600 ml-1">↓ Below average</span>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    KES {(vendorPerformance?.totalRevenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {vendorPerformance?.totalWonQuotations || 0} won deals
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {vendorPerformance?.averageRating?.toFixed(1) || "0"}
                    <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  </div>
                  {marketComparison && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Market avg: {marketComparison.marketAverageRating.toFixed(1)}
                      {vendorPerformance && vendorPerformance.averageRating > marketComparison.marketAverageRating && (
                        <span className="text-green-600 ml-1">↑ Above average</span>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vendorPerformance?.deliveryRate?.toFixed(1) || "0"}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {vendorPerformance?.deliveredOrders || 0} of {vendorPerformance?.totalOrders || 0} orders delivered
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Performance (Last 30 Days) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" />
                  Last 30 Days Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quotations</p>
                    <p className="text-2xl font-bold">{recentPerformance?.quotationsLast30Days || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Won Deals</p>
                    <p className="text-2xl font-bold">{recentPerformance?.wonQuotationsLast30Days || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Orders</p>
                    <p className="text-2xl font-bold">{recentPerformance?.ordersLast30Days || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">KES {(recentPerformance?.revenueLast30Days || 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Ratings Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Ratings Breakdown</CardTitle>
                <CardDescription>{vendorPerformance?.totalRatings || 0} total ratings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Delivery Speed</span>
                    <span className="text-sm font-medium">{vendorPerformance?.averageDeliveryRating?.toFixed(1) || "0"}/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${((vendorPerformance?.averageDeliveryRating || 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Communication</span>
                    <span className="text-sm font-medium">{vendorPerformance?.averageCommunicationRating?.toFixed(1) || "0"}/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${((vendorPerformance?.averageCommunicationRating || 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Product Quality</span>
                    <span className="text-sm font-medium">{vendorPerformance?.averageQualityRating?.toFixed(1) || "0"}/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${((vendorPerformance?.averageQualityRating || 0) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card>
              <CardHeader>
                <CardTitle>Average Response Time</CardTitle>
                <CardDescription>How quickly you respond to RFQs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {vendorPerformance && vendorPerformance.averageResponseTime > 0
                    ? `${Math.round(vendorPerformance.averageResponseTime / (1000 * 60 * 60))} hours`
                    : "No data yet"}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Faster responses increase your chances of winning deals
                </p>
              </CardContent>
            </Card>

            {/* Market Position */}
            {marketComparison && (
              <Card>
                <CardHeader>
                  <CardTitle>Market Position</CardTitle>
                  <CardDescription>How you compare to {marketComparison.totalActiveVendors} active vendors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Your Win Rate</p>
                      <p className="text-2xl font-bold">{marketComparison.myWinRate.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        vs Market: {marketComparison.marketAverageWinRate.toFixed(1)}%
                      </p>
                      {marketComparison.myWinRate > marketComparison.marketAverageWinRate && (
                        <div className="flex items-center gap-1 text-green-600 mt-2">
                          <TrendingUp className="size-4" />
                          <span className="text-sm">You're outperforming the market!</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Your Average Rating</p>
                      <p className="text-2xl font-bold flex items-center gap-2">
                        {marketComparison.myAverageRating.toFixed(1)}
                        <Star className="size-5 fill-yellow-400 text-yellow-400" />
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        vs Market: {marketComparison.marketAverageRating.toFixed(1)}
                      </p>
                      {marketComparison.myAverageRating > marketComparison.marketAverageRating && (
                        <div className="flex items-center gap-1 text-green-600 mt-2">
                          <TrendingUp className="size-4" />
                          <span className="text-sm">Higher than market average!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Ways to improve your performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {vendorPerformance && vendorPerformance.averageResponseTime > (24 * 60 * 60 * 1000) && (
                    <li className="flex items-start gap-2">
                      <Clock className="size-4 mt-0.5 text-orange-500" />
                      <span className="text-sm">Your response time is over 24 hours. Try to respond faster to increase win rate.</span>
                    </li>
                  )}
                  {vendorPerformance && vendorPerformance.averageRating < 4 && vendorPerformance.totalRatings > 0 && (
                    <li className="flex items-start gap-2">
                      <Star className="size-4 mt-0.5 text-orange-500" />
                      <span className="text-sm">Your rating is below 4.0. Focus on improving delivery speed and communication.</span>
                    </li>
                  )}
                  {marketComparison && marketComparison.myWinRate < marketComparison.marketAverageWinRate && (
                    <li className="flex items-start gap-2">
                      <TrendingUp className="size-4 mt-0.5 text-orange-500" />
                      <span className="text-sm">Your win rate is below market average. Consider reviewing your pricing strategy.</span>
                    </li>
                  )}
                  {vendorPerformance && vendorPerformance.totalQuotations < 10 && (
                    <li className="flex items-start gap-2">
                      <Package className="size-4 mt-0.5 text-blue-500" />
                      <span className="text-sm">Submit more quotations to increase your visibility and chances of winning deals.</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Advisory Tab */}
          <TabsContent value="advisory" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Sales Advisory</h2>
              <p className="text-muted-foreground">Personalized recommendations to help you win more deals</p>
            </div>

            {!vendorAdvisory && (
              <div className="grid gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {vendorAdvisory && vendorAdvisory.advice && vendorAdvisory.advice.length > 0 && (
              <div className="space-y-4">
                {/* Urgent Advice */}
                {vendorAdvisory.advice.filter((a) => a.priority === "urgent").map((advice) => (
                  <Card key={advice.id} className="border-red-200 dark:border-red-900">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive">URGENT</Badge>
                            <Badge variant="outline">{advice.category}</Badge>
                          </div>
                          <CardTitle className="text-lg">{advice.title}</CardTitle>
                        </div>
                      </div>
                      <CardDescription>{advice.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Impact:</p>
                        <p className="text-sm text-muted-foreground">{advice.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Action Steps:</p>
                        <ul className="space-y-2">
                          {advice.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="size-4 mt-0.5 text-green-600 shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-900">
                        <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">Expected Result:</p>
                        <p className="text-sm text-green-800 dark:text-green-200">{advice.expectedResult}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* High Priority Advice */}
                {vendorAdvisory.advice.filter((a) => a.priority === "high").map((advice) => (
                  <Card key={advice.id} className="border-orange-200 dark:border-orange-900">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-orange-500">HIGH PRIORITY</Badge>
                            <Badge variant="outline">{advice.category}</Badge>
                          </div>
                          <CardTitle className="text-lg">{advice.title}</CardTitle>
                        </div>
                      </div>
                      <CardDescription>{advice.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Impact:</p>
                        <p className="text-sm text-muted-foreground">{advice.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Action Steps:</p>
                        <ul className="space-y-2">
                          {advice.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="size-4 mt-0.5 text-blue-600 shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Expected Result:</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">{advice.expectedResult}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Medium Priority Advice */}
                {vendorAdvisory.advice.filter((a) => a.priority === "medium").map((advice) => (
                  <Card key={advice.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">RECOMMENDED</Badge>
                            <Badge variant="outline">{advice.category}</Badge>
                          </div>
                          <CardTitle className="text-lg">{advice.title}</CardTitle>
                        </div>
                      </div>
                      <CardDescription>{advice.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Impact:</p>
                        <p className="text-sm text-muted-foreground">{advice.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Action Steps:</p>
                        <ul className="space-y-2">
                          {advice.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="size-4 mt-0.5 text-primary shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium mb-1">Expected Result:</p>
                        <p className="text-sm text-muted-foreground">{advice.expectedResult}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Low Priority Advice */}
                {vendorAdvisory.advice.filter((a) => a.priority === "low").map((advice) => (
                  <Card key={advice.id} className="border-muted">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">OPTIMIZATION</Badge>
                            <Badge variant="outline">{advice.category}</Badge>
                          </div>
                          <CardTitle className="text-lg">{advice.title}</CardTitle>
                        </div>
                      </div>
                      <CardDescription>{advice.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Impact:</p>
                        <p className="text-sm text-muted-foreground">{advice.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Action Steps:</p>
                        <ul className="space-y-2">
                          {advice.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Expected Result:</p>
                        <p className="text-sm text-muted-foreground">{advice.expectedResult}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Best Practices Section */}
            {vendorAdvisory && vendorAdvisory.bestPractices && vendorAdvisory.bestPractices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Best Practices from Top Vendors</CardTitle>
                  <CardDescription>Learn from the strategies that drive success</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendorAdvisory.bestPractices.map((practice, idx) => (
                      <div key={idx} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{practice.title}</h4>
                          <Badge variant={
                            practice.difficulty === "Easy" ? "default" :
                            practice.difficulty === "Medium" ? "secondary" : "outline"
                          }>
                            {practice.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{practice.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {vendorAdvisory && vendorAdvisory.advice && vendorAdvisory.advice.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Lightbulb className="size-16 mx-auto text-green-600 mb-4" />
                  <CardTitle className="mb-2">You're Doing Great!</CardTitle>
                  <CardDescription>
                    No critical issues found. Keep up the excellent work! Check the Performance tab for detailed metrics.
                  </CardDescription>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-rfqs">
            <Card>
              <CardHeader>
                <CardTitle>My RFQs (as Broker)</CardTitle>
                <CardDescription>
                  Track RFQs you've submitted to other vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!pendingRFQs && (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                )}
                {pendingRFQs && pendingRFQs.length === 0 && (
                  <EmptyState>
                    <EmptyStateContent>
                      <EmptyStateIcon>
                        <Package className="size-8" />
                      </EmptyStateIcon>
                      <EmptyStateTitle>No RFQs submitted yet</EmptyStateTitle>
                      <EmptyStateDescription>
                        Browse products and submit RFQs to get quotations from other vendors
                      </EmptyStateDescription>
                    </EmptyStateContent>
                  </EmptyState>
                )}
                {pendingRFQs && pendingRFQs.length > 0 && (
                  <div className="grid gap-4">
                    {pendingRFQs.map((rfq) => (
                      <Card key={rfq._id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">RFQ #{rfq._id.slice(-6)}</h3>
                              <p className="text-sm text-muted-foreground">
                                Submitted {new Date(rfq.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={
                              rfq.status === "completed" ? "default" :
                              rfq.status === "quoted" ? "secondary" : "outline"
                            }>
                              {rfq.status === "completed" ? "Completed" :
                               rfq.status === "quoted" ? "Quoted" :
                               "Pending"}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {rfq.items?.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Package className="size-4" />
                                <span>{item.productName} - {item.quantity} units</span>
                              </div>
                            ))}
                          </div>
                          {rfq.expectedDeliveryTime && (
                            <p className="text-sm text-muted-foreground">
                              Expected by: {rfq.expectedDeliveryTime}
                            </p>
                          )}
                          <Button 
                            className="w-full mt-4" 
                            size="sm"
                            onClick={() => {
                              toast.info("Quote this RFQ from the Pending RFQs tab");
                            }}
                          >
                            Submit Quotation
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                          <TableHead>Client Type</TableHead>
                          <TableHead>Client Name</TableHead>
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
                          buyerType?: string;
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
                              <Badge variant={quot.buyerType === "Broker" ? "secondary" : "default"}>
                                {quot.buyerType || "Buyer"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {quot.chosen && quot.buyerName && !quot.buyerName.startsWith("Anonymous") ? (
                                <div>
                                  <div className="font-medium">{quot.buyerName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {quot.buyerEmail}
                                  </div>
                                  {quot.buyerPhone && (
                                    <a
                                      href={`https://wa.me/${quot.buyerPhone.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1"
                                    >
                                      <MessageCircle className="size-3" />
                                      WhatsApp: {quot.buyerPhone}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">{quot.buyerName || "Anonymous"}</span>
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

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  RFQ notifications and quotation updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!notifications && (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                )}
                {notifications && notifications.length === 0 && (
                  <EmptyState>
                    <EmptyStateContent>
                      <EmptyStateIcon>
                        <AlertCircle />
                      </EmptyStateIcon>
                      <EmptyStateTitle>No notifications</EmptyStateTitle>
                      <EmptyStateDescription>
                        You'll receive notifications when buyers submit RFQs in your categories
                      </EmptyStateDescription>
                    </EmptyStateContent>
                  </EmptyState>
                )}
                {notifications && notifications.length > 0 && (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <Card 
                        key={notif._id}
                        className={`${!notif.read ? 'bg-blue-50 dark:bg-blue-950 border-blue-200' : ''} ${notif.type === 'rfq_needs_quotation' ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
                        onClick={() => {
                          if (notif.type === 'rfq_needs_quotation' && notif.relatedId) {
                            setSelectedRFQ(notif.relatedId);
                            setOpenRFQDialog(true);
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{notif.title}</h4>
                                {!notif.read && (
                                  <Badge variant="default" className="text-xs">New</Badge>
                                )}
                                {notif.type === 'rfq_needs_quotation' && (
                                  <Badge variant="outline" className="text-xs">Click to respond</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{notif.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(notif.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {!notif.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await markAsRead({ notificationId: notif._id });
                                  toast.success("Marked as read");
                                }}
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Ratings Tab */}
          <TabsContent value="ratings">
            <Card>
              <CardHeader>
                <CardTitle>My Ratings & Reviews</CardTitle>
                <CardDescription>
                  See what hospitals are saying about your service
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentUser && (
                  <VendorRatingDisplay vendorId={currentUser._id} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Group Buys Tab */}
          <TabsContent value="groupbuys">
            <GroupBuyOpportunities />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  Track your orders and order status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState>
                  <EmptyStateContent>
                    <EmptyStateIcon>
                      <Package className="size-8" />
                    </EmptyStateIcon>
                    <EmptyStateTitle>No orders yet</EmptyStateTitle>
                    <EmptyStateDescription>
                      Your orders will appear here when buyers place orders for your products
                    </EmptyStateDescription>
                  </EmptyStateContent>
                </EmptyState>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Settings</CardTitle>
                <CardDescription>
                  Manage your quotation preferences and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">RFQ Acceptance Preference</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose which types of buyers you want to send quotations to
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                         onClick={() => {
                           updateQuotationPreference({ preference: "registered_hospitals_only" });
                           toast.success("Preference updated");
                         }}
                    >
                      <input
                        type="radio"
                        checked={currentUser?.quotationPreference === "registered_hospitals_only"}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">Registered Hospitals Only</p>
                        <p className="text-sm text-muted-foreground">
                          Only send quotations to verified hospitals with registered accounts
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                         onClick={() => {
                           updateQuotationPreference({ preference: "registered_all" });
                           toast.success("Preference updated");
                         }}
                    >
                      <input
                        type="radio"
                        checked={currentUser?.quotationPreference === "registered_all"}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">All Registered Buyers</p>
                        <p className="text-sm text-muted-foreground">
                          Send to both registered hospitals and other verified vendors/brokers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                         onClick={() => {
                           updateQuotationPreference({ preference: "all_including_guests" });
                           toast.success("Preference updated");
                         }}
                    >
                      <input
                        type="radio"
                        checked={(currentUser?.quotationPreference ?? "all_including_guests") === "all_including_guests"}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">All Including Guest Submissions</p>
                        <p className="text-sm text-muted-foreground">
                          Send to registered buyers AND guest submissions (unregistered users)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* RFQ Response Dialog */}
      <Dialog open={openRFQDialog} onOpenChange={setOpenRFQDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to RFQ</DialogTitle>
            <DialogDescription>
              Submit a quotation or decline if you don't supply this product
            </DialogDescription>
          </DialogHeader>
          {selectedRFQ && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    // Switch to pending RFQs tab
                    setOpenRFQDialog(false);
                    const tabTriggers = document.querySelectorAll('[role="tab"]');
                    const pendingRFQTab = Array.from(tabTriggers).find(tab => 
                      tab.textContent?.includes('Pending RFQs')
                    );
                    if (pendingRFQTab instanceof HTMLElement) {
                      pendingRFQTab.click();
                    }
                  }}
                >
                  Submit Quotation
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    // TODO: Add decline product mutation
                    setOpenRFQDialog(false);
                    toast.success("You won't receive notifications for this product again");
                  }}
                >
                  I Don't Supply This Product
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditQuotationDialog
        quotation={editQuotationData}
        open={editQuotationOpen}
        onOpenChange={setEditQuotationOpen}
      />

      <CatalogScanner
        open={catalogScannerOpen}
        onOpenChange={setCatalogScannerOpen}
        userRole="vendor"
        vendorId={currentUser?._id}
      />
    </div>
  );
}