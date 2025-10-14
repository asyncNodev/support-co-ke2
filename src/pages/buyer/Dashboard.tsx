import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Package, FileText, CheckCircle, XCircle, Clock, ShoppingBag, MessageCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import GroupBuyCard from "./_components/GroupBuyCard.tsx";
import CreateGroupBuyDialog from "./_components/CreateGroupBuyDialog.tsx";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const myRFQs = useQuery(api.rfqs.getMyRFQs, isAuthenticated ? {} : "skip");
  const myQuotations = useQuery(api.rfqs.getMyQuotationsSent, isAuthenticated ? {} : "skip");
  const activeGroupBuys = useQuery(api.groupBuys.getActiveGroupBuys, isAuthenticated ? {} : "skip");
  const myGroupBuys = useQuery(api.groupBuys.getMyGroupBuys, isAuthenticated ? {} : "skip");
  
  const approveQuotation = useMutation(api.rfqs.chooseQuotation);
  const declineQuotation = useMutation(api.rfqs.declineQuotation);

  const [declineDialog, setDeclineDialog] = useState<{
    open: boolean;
    quotationId: Id<"sentQuotations"> | null;
  }>({ open: false, quotationId: null });
  const [declineReason, setDeclineReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle redirects in useEffect
  useEffect(() => {
    if (isAuthenticated && currentUser && currentUser.role !== "buyer") {
      navigate("/");
    }
  }, [isAuthenticated, currentUser, navigate]);

  useEffect(() => {
    if (isAuthenticated && currentUser === null) {
      navigate("/register");
    }
  }, [isAuthenticated, currentUser, navigate]);

  const isPending = currentUser === undefined || myRFQs === undefined || myQuotations === undefined;

  // Check approval status
  if (currentUser?.status === "rejected") {
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

  if (currentUser?.status === "pending") {
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
            <Button variant="outline" onClick={() => navigate("/")}>
              Browse as Guest
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApprove = async (quotationId: Id<"sentQuotations">) => {
    try {
      await approveQuotation({ sentQuotationId: quotationId });
      toast.success("Quotation approved! Vendor contact information has been shared.");
    } catch (error) {
      toast.error("Failed to approve quotation");
      console.error(error);
    }
  };

  const handleDeclineClick = (quotationId: Id<"sentQuotations">) => {
    setDeclineDialog({ open: true, quotationId });
    setDeclineReason("");
  };

  const handleDeclineSubmit = async () => {
    if (!declineDialog.quotationId) return;
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }

    try {
      setIsSubmitting(true);
      await declineQuotation({
        sentQuotationId: declineDialog.quotationId,
        reason: declineReason,
      });
      toast.success("Quotation declined");
      setDeclineDialog({ open: false, quotationId: null });
      setDeclineReason("");
    } catch (error) {
      toast.error("Failed to decline quotation");
      console.error(error);
    } finally {
      setIsSubmitting(false);
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
              <p className="text-muted-foreground">Buyer</p>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Buyer Dashboard</h1>

        <Tabs defaultValue="quotations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="quotations" className="gap-2">
              <FileText className="size-4" />
              Quotations
              {myQuotations && myQuotations.length > 0 && (
                <Badge variant="secondary">{myQuotations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rfqs" className="gap-2">
              <Package className="size-4" />
              My RFQs
              {myRFQs && myRFQs.length > 0 && (
                <Badge variant="secondary">{myRFQs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="groupbuys" className="gap-2">
              <Users className="size-4" />
              Group Buys
              {activeGroupBuys && activeGroupBuys.length > 0 && (
                <Badge variant="secondary">{activeGroupBuys.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Quotations Tab */}
          <TabsContent value="quotations">
            <Card>
              <CardHeader>
                <CardTitle>Received Quotations</CardTitle>
                <CardDescription>
                  Review and approve quotations from suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!myQuotations || myQuotations.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No quotations yet</p>
                    <Button asChild>
                      <Link to="/browse">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Specifications</TableHead>
                          <TableHead>Price (KES)</TableHead>
                          <TableHead>Payment Terms</TableHead>
                          <TableHead>Delivery Time</TableHead>
                          <TableHead>Warranty</TableHead>
                          <TableHead>Country of Origin</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myQuotations.map((quot) => (
                          <TableRow key={quot._id}>
                            <TableCell className="font-medium">
                              {quot.product?.name || "Unknown Product"}
                            </TableCell>
                            <TableCell>
                              {quot.vendor && quot.chosen ? (
                                <div>
                                  <div className="font-medium">{quot.vendor.name}</div>
                                  {quot.vendor.companyName && (
                                    <div className="text-sm text-muted-foreground">{quot.vendor.companyName}</div>
                                  )}
                                  {quot.vendor.email && (
                                    <div className="text-sm text-muted-foreground">{quot.vendor.email}</div>
                                  )}
                                  {quot.vendor.phone && (
                                    <a
                                      href={`https://wa.me/${quot.vendor.phone.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1"
                                    >
                                      <MessageCircle className="size-3" />
                                      WhatsApp: {quot.vendor.phone}
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">{quot.vendor?.name || "Anonymous"}</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm line-clamp-2">
                                {quot.productSpecifications || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {quot.price.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={quot.paymentTerms === "cash" ? "default" : "secondary"}>
                                {quot.paymentTerms}
                              </Badge>
                            </TableCell>
                            <TableCell>{quot.deliveryTime}</TableCell>
                            <TableCell>{quot.warrantyPeriod}</TableCell>
                            <TableCell>{quot.countryOfOrigin}</TableCell>
                            <TableCell>
                              {quot.chosen ? (
                                <Badge className="gap-1">
                                  <CheckCircle className="size-3" />
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="size-3" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!quot.chosen && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(quot._id)}
                                    className="gap-1"
                                  >
                                    <CheckCircle className="size-3" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeclineClick(quot._id)}
                                    className="gap-1"
                                  >
                                    <XCircle className="size-3" />
                                    Decline
                                  </Button>
                                </div>
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

          {/* RFQs Tab */}
          <TabsContent value="rfqs">
            <Card>
              <CardHeader>
                <CardTitle>My RFQs</CardTitle>
                <CardDescription>
                  Track your submitted quotation requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!myRFQs || myRFQs.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No RFQs submitted yet</p>
                    <Button asChild>
                      <Link to="/browse">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {myRFQs.map((rfq) => (
                      <Card key={rfq._id} className="cursor-pointer hover:border-primary transition-colors">
                        <Link to={`/buyer/rfq/${rfq._id}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">
                                  RFQ #{rfq._id.slice(-6)}
                                </CardTitle>
                                <CardDescription>
                                  Submitted {format(rfq._creationTime, "PPP")}
                                </CardDescription>
                              </div>
                              <Badge
                                variant={
                                  rfq.status === "completed"
                                    ? "default"
                                    : rfq.status === "quoted"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {rfq.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {rfq.items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{item.product?.name || "Unknown Product"}</span>
                                  <span className="text-muted-foreground">
                                    Qty: {item.quantity}
                                  </span>
                                </div>
                              ))}
                              {rfq.expectedDeliveryTime && (
                                <p className="text-sm text-muted-foreground">
                                  Expected by: {rfq.expectedDeliveryTime}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Link>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Group Buys Tab */}
          <TabsContent value="groupbuys">
            <div className="space-y-6">
              {/* My Group Buys Section */}
              {myGroupBuys && myGroupBuys.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">My Group Buys</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myGroupBuys.map((participation) => (
                      <Card key={participation._id}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {participation.product?.name}
                          </CardTitle>
                          <CardDescription>
                            {participation.groupBuy.title}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Your Quantity:</span>
                              <span className="font-semibold">{participation.quantity} units</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Progress:</span>
                              <span className="font-semibold">
                                {participation.currentQuantity}/{participation.groupBuy.targetQuantity}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Participants:</span>
                              <span className="font-semibold">{participation.participantCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Deadline:</span>
                              <span className="font-semibold">
                                {participation.daysLeft === 0 ? "Today" : `${participation.daysLeft} days`}
                              </span>
                            </div>
                            <Badge variant={participation.status === "active" ? "default" : "secondary"}>
                              {participation.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Group Buys Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Available Group Buys</h3>
                  <Badge variant="outline">
                    {activeGroupBuys?.length || 0} Active
                  </Badge>
                </div>

                {!activeGroupBuys || activeGroupBuys.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="size-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No active group buys at the moment
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Start one when you find a product you need!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeGroupBuys.map((groupBuy) => (
                      <GroupBuyCard
                        key={groupBuy._id}
                        groupBuy={groupBuy}
                        onJoin={() => {
                          // Refresh data
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Decline Dialog */}
      <Dialog open={declineDialog.open} onOpenChange={(open) => setDeclineDialog({ open, quotationId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Quotation</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this quotation
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="e.g., Price too high, Need faster delivery, etc."
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeclineDialog({ open: false, quotationId: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeclineSubmit}
              disabled={isSubmitting || !declineReason.trim()}
            >
              {isSubmitting ? "Declining..." : "Decline Quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}