import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Package, FileText, Bell, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const pendingRFQs = useQuery(api.vendorQuotations.getPendingRFQs, isAuthenticated ? {} : "skip");
  const myProducts = useQuery(api.products.getProducts, {});
  const myQuotations = useQuery(api.vendorQuotations.getMyQuotations, isAuthenticated ? {} : "skip");
  const notifications = useQuery(api.notifications.getMyNotifications, isAuthenticated ? {} : "skip");
  
  const submitQuotation = useMutation(api.vendorQuotations.submitOnDemandQuotation);
  const markNotificationRead = useMutation(api.notifications.markAsRead);

  const [quotationDialog, setQuotationDialog] = useState<{
    open: boolean;
    rfqId: Id<"rfqs"> | null;
    productId: Id<"products"> | null;
    productName: string;
    quantity: number;
  }>({ open: false, rfqId: null, productId: null, productName: "", quantity: 0 });

  const [formData, setFormData] = useState({
    price: "",
    specifications: "",
    paymentTerms: "cash" as "cash" | "credit",
    deliveryTime: "",
    warranty: "",
    countryOfOrigin: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated or not a vendor
  if (isAuthenticated && currentUser && currentUser.role !== "vendor") {
    navigate("/");
    return null;
  }

  if (isAuthenticated && currentUser === null) {
    navigate("/register");
    return null;
  }

  const isPending = currentUser === undefined;

  const handleOpenQuotationDialog = (
    rfqId: Id<"rfqs">,
    productId: Id<"products">,
    productName: string,
    quantity: number
  ) => {
    setQuotationDialog({
      open: true,
      rfqId,
      productId,
      productName,
      quantity,
    });
    setFormData({
      price: "",
      specifications: "",
      paymentTerms: "cash",
      deliveryTime: "",
      warranty: "",
      countryOfOrigin: "",
    });
  };

  const handleSubmitQuotation = async () => {
    if (!quotationDialog.rfqId || !quotationDialog.productId) return;

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (!formData.specifications.trim()) {
      toast.error("Please enter product specifications");
      return;
    }

    if (!formData.deliveryTime.trim()) {
      toast.error("Please enter delivery time");
      return;
    }

    if (!formData.warranty.trim()) {
      toast.error("Please enter warranty period");
      return;
    }

    if (!formData.countryOfOrigin.trim()) {
      toast.error("Please enter country of origin");
      return;
    }

    try {
      setIsSubmitting(true);
      await submitQuotation({
        rfqId: quotationDialog.rfqId,
        productId: quotationDialog.productId,
        price: parseFloat(formData.price),
        quantity: quotationDialog.quantity,
        productSpecifications: formData.specifications,
        paymentTerms: formData.paymentTerms,
        deliveryTime: formData.deliveryTime,
        warrantyPeriod: formData.warranty,
        countryOfOrigin: formData.countryOfOrigin,
      });

      toast.success("Quotation submitted successfully!");
      setQuotationDialog({
        open: false,
        rfqId: null,
        productId: null,
        productName: "",
        quantity: 0,
      });
    } catch (error) {
      toast.error("Failed to submit quotation");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId: Id<"notifications">) => {
    try {
      await markNotificationRead({ notificationId });
    } catch (error) {
      console.error(error);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Flatten pending RFQs to individual items
  const flattenedPendingItems = pendingRFQs?.flatMap(rfq =>
    rfq.items?.map(item => ({
      rfqId: rfq._id,
      rfqCreatedAt: rfq._creationTime,
      expectedDeliveryTime: rfq.expectedDeliveryTime,
      productId: item.productId,
      productName: "productName" in item ? item.productName : "Unknown Product",
      quantity: item.quantity,
    })) || []
  ) || [];

  const unreadNotifications = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">QuickQuote B2B</Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link to="/browse">Browse Products</Link>
            </Button>
            <div className="text-sm">
              <p className="font-medium">{currentUser?.name}</p>
              <p className="text-muted-foreground">
                Vendor {!currentUser?.verified && <Badge variant="destructive" className="ml-2">Unverified</Badge>}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Vendor Dashboard</h1>

        {!currentUser?.verified && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <CardHeader>
              <CardTitle className="text-yellow-900 dark:text-yellow-100">Account Pending Verification</CardTitle>
              <CardDescription className="text-yellow-800 dark:text-yellow-200">
                Your account is awaiting admin approval. You can add products and prepare quotations, but they won't be visible to buyers until you're verified.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Tabs defaultValue="rfqs" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rfqs" className="gap-2">
              <FileText className="size-4" />
              Pending RFQs
              {flattenedPendingItems.length > 0 && (
                <Badge variant="destructive">{flattenedPendingItems.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="size-4" />
              My Products
              {myProducts && myProducts.length > 0 && (
                <Badge variant="secondary">{myProducts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quotations" className="gap-2">
              <Send className="size-4" />
              My Quotations
              {myQuotations && myQuotations.length > 0 && (
                <Badge variant="secondary">{myQuotations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="size-4" />
              Notifications
              {unreadNotifications > 0 && (
                <Badge variant="destructive">{unreadNotifications}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending RFQs Tab */}
          <TabsContent value="rfqs">
            <Card>
              <CardHeader>
                <CardTitle>RFQs Needing Your Quotation</CardTitle>
                <CardDescription>
                  Submit quotations for products buyers are requesting (buyer information is anonymous until approved)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {flattenedPendingItems.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending RFQs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {flattenedPendingItems.map((item, idx) => (
                      <Card key={idx}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{item.productName}</CardTitle>
                              <CardDescription>
                                From: Anonymous Buyer • Submitted {format(item.rfqCreatedAt, "PPP")}
                              </CardDescription>
                            </div>
                            <Button
                              onClick={() =>
                                handleOpenQuotationDialog(
                                  item.rfqId,
                                  item.productId,
                                  item.productName,
                                  item.quantity
                                )
                              }
                            >
                              Submit Quotation
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Quantity Needed:</span>
                              <p className="font-semibold">{item.quantity} units</p>
                            </div>
                            {item.expectedDeliveryTime && (
                              <div>
                                <span className="text-muted-foreground">Expected Delivery:</span>
                                <p className="font-semibold">{item.expectedDeliveryTime}</p>
                              </div>
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

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Available Products</CardTitle>
                <CardDescription>
                  All products in the system (managed by admin)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!myProducts || myProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No products available</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myProducts.map((product: { _id: Id<"products">; name: string; categoryName?: string; description: string }) => (
                      <Card key={product._id}>
                        <CardHeader>
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          {product.categoryName && (
                            <Badge variant="outline">{product.categoryName}</Badge>
                          )}
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quotations Tab */}
          <TabsContent value="quotations">
            <Card>
              <CardHeader>
                <CardTitle>My Submitted Quotations</CardTitle>
                <CardDescription>
                  Track your quotations and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!myQuotations || myQuotations.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No quotations submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myQuotations.map((quot) => (
                      <Card key={quot._id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {quot.product?.name || "Unknown Product"}
                              </CardTitle>
                              <CardDescription>
                                Price: KES {quot.price.toLocaleString()} • Qty: {quot.quantity}
                              </CardDescription>
                            </div>
                            <Badge variant={quot.active ? "default" : "secondary"}>
                              {quot.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Payment:</span>
                              <p className="font-semibold capitalize">{quot.paymentTerms}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Delivery:</span>
                              <p className="font-semibold">{quot.deliveryTime}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Warranty:</span>
                              <p className="font-semibold">{quot.warrantyPeriod}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Origin:</span>
                              <p className="font-semibold">{quot.countryOfOrigin}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                  Updates about your quotations and RFQs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!notifications || notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <Card
                        key={notification._id}
                        className={notification.read ? "opacity-60" : "border-primary"}
                        onClick={() => !notification.read && handleMarkNotificationRead(notification._id)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{notification.title}</CardTitle>
                              <CardDescription className="mt-1">
                                {notification.message}
                              </CardDescription>
                            </div>
                            {!notification.read && (
                              <Badge variant="default">New</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(notification.createdAt, "PPP 'at' p")}
                          </p>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Submit Quotation Dialog */}
      <Dialog
        open={quotationDialog.open}
        onOpenChange={(open) =>
          !open &&
          setQuotationDialog({
            open: false,
            rfqId: null,
            productId: null,
            productName: "",
            quantity: 0,
          })
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Quotation</DialogTitle>
            <DialogDescription>
              For: {quotationDialog.productName} (Qty: {quotationDialog.quantity})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price per Unit (KES) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., 4500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specifications">Product Specifications *</Label>
              <Textarea
                id="specifications"
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                placeholder="Detailed technical specifications..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms *</Label>
              <Select
                value={formData.paymentTerms}
                onValueChange={(value: "cash" | "credit") =>
                  setFormData({ ...formData, paymentTerms: value })
                }
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

            <div className="space-y-2">
              <Label htmlFor="deliveryTime">Delivery Time *</Label>
              <Input
                id="deliveryTime"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                placeholder="e.g., 3-5 business days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty">Warranty Period *</Label>
              <Input
                id="warranty"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                placeholder="e.g., 12 months"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryOfOrigin">Country of Origin *</Label>
              <Input
                id="countryOfOrigin"
                value={formData.countryOfOrigin}
                onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                placeholder="e.g., Kenya"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setQuotationDialog({
                  open: false,
                  rfqId: null,
                  productId: null,
                  productName: "",
                  quantity: 0,
                })
              }
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitQuotation} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}