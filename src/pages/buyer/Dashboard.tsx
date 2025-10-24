import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  CheckCircle,
  CheckCircle2,
  Clock,
  FileText,
  MessageCircle,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth.ts";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";

import CreateGroupBuyDialog from "./_components/CreateGroupBuyDialog.tsx";
import GroupBuyCard from "./_components/GroupBuyCard.tsx";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const myRFQs = useQuery(api.rfqs.getMyRFQs, isAuthenticated ? {} : "skip");
  const myQuotations = useQuery(
    api.rfqs.getMyQuotationsSent,
    isAuthenticated ? {} : "skip",
  );
  const activeGroupBuys = useQuery(api.groupBuys.getActiveGroupBuys, {});
  const myGroupBuys = useQuery(api.groupBuys.getMyGroupBuys, {});

  const myApprovalRequests = useQuery(api.approvals.getMyApprovalRequests, {});

  const approvalRequests = useQuery(api.approvals.getMyApprovalRequests, {});
  const myOrders = useQuery(api.orders.getMyOrders, {});
  const orderStats = useQuery(api.orders.getOrderStats, {});

  const approveQuotation = useMutation(api.rfqs.chooseQuotation);
  const respondToApproval = useMutation(api.approvals.respondToApprovalRequest);
  const declineQuotation = useMutation(api.rfqs.declineQuotation);

  const [showApprovalDialog, setShowApprovalDialog] = useState<{
    open: boolean;
    requestId: Id<"approvalRequests"> | null;
    action: "approve" | "reject" | null;
  }>({
    open: false,
    requestId: null,
    action: null,
  });
  const [approvalComments, setApprovalComments] = useState("");

  const [declineDialog, setDeclineDialog] = useState<{
    open: boolean;
    quotationId: Id<"sentQuotations"> | null;
  }>({
    open: false,
    quotationId: null,
  });
  const [declineReason, setDeclineReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("quotations");

  // Handle redirects in useEffect
  useEffect(() => {
    if (isAuthenticated && user && user.role !== "buyer") {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (isAuthenticated && user === null) {
      navigate("/register");
    }
  }, [isAuthenticated, user, navigate]);

  const isPending =
    user === undefined || myRFQs === undefined || myQuotations === undefined;

  // Check approval status
  if (user?.status === "rejected") {
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
              Your account application has been rejected. Please contact support
              for more information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.status === "pending") {
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
              Your account is pending admin approval. You will be notified once
              your account is approved.
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
      toast.success(
        "Quotation approved! Vendor contact information has been shared.",
      );
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
          <Link to="/" className="text-2xl font-bold">
            QuickQuote B2B
          </Link>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link to="/browse">Browse Products</Link>
            </Button>
            <div className="text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-muted-foreground">Buyer</p>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Buyer Dashboard</h1>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex overflow-x-auto gap-1 pb-px">
            {["quotations", "rfqs", "group-buys", "approvals", "orders"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {tab
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Quotations Tab */}
          {activeTab === "quotations" && (
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
                    <p className="text-muted-foreground mb-4">
                      No quotations yet
                    </p>
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
                                  <div className="font-medium">
                                    {quot.vendor.name}
                                  </div>
                                  {quot.vendor.companyName && (
                                    <div className="text-sm text-muted-foreground">
                                      {quot.vendor.companyName}
                                    </div>
                                  )}
                                  {quot.vendor.email && (
                                    <div className="text-sm text-muted-foreground">
                                      {quot.vendor.email}
                                    </div>
                                  )}
                                  {quot.vendor.phone && (
                                    <a
                                      href={`https://wa.me/${quot.vendor.phone.replace(/\D/g, "")}`}
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
                                <span className="text-muted-foreground">
                                  {quot.vendor?.name || "Anonymous"}
                                </span>
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
                              <Badge
                                variant={
                                  quot.paymentTerms === "cash"
                                    ? "default"
                                    : "secondary"
                                }
                              >
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
          )}

          {/* RFQs Tab */}
          {activeTab === "rfqs" && (
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
                    <p className="text-muted-foreground mb-4">
                      No RFQs submitted yet
                    </p>
                    <Button asChild>
                      <Link to="/browse">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {myRFQs.map((rfq) => (
                      <Card
                        key={rfq._id}
                        className="cursor-pointer hover:border-primary transition-colors"
                      >
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
                                <div
                                  key={idx}
                                  className="flex justify-between text-sm"
                                >
                                  <span>
                                    {item.product?.name || "Unknown Product"}
                                  </span>
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
          )}

          {/* Group Buys Tab */}
          {activeTab === "group-buys" && (
            <div className="space-y-6">
              {/* Available Group Buys Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Available Group Buys
                  </h3>
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

              {/* Group Buy Opportunities Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Group Buy Opportunities
                  </h3>
                  <Badge variant="outline">
                    {activeGroupBuys?.length || 0} Active
                  </Badge>
                </div>

                {!activeGroupBuys || activeGroupBuys.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Users className="size-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No group buy opportunities at the moment
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Check back later for new opportunities
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {activeGroupBuys.map((opportunity) => {
                      // Derive missing fields from available data
                      const groupSize = opportunity.participants?.length ?? 0;
                      const pricePerUnit = opportunity.product?.price ?? 0;
                      const totalPrice = groupSize * pricePerUnit;

                      return (
                        <Card key={opportunity._id}>
                          <CardHeader>
                            <CardTitle>{opportunity.title}</CardTitle>
                            <CardDescription>
                              {opportunity.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Group Size:
                                </span>
                                <span className="font-medium">
                                  {groupSize} units
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Price per unit:
                                </span>
                                <span className="font-medium">
                                  KES {pricePerUnit.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Total price:
                                </span>
                                <span className="font-medium">
                                  KES {totalPrice.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                  Deadline:
                                </span>
                                <span className="font-medium">
                                  {opportunity.deadline}
                                </span>
                              </div>
                            </div>
                            <Button
                              className="w-full mt-4"
                              onClick={() => {
                                toast.info("Join this group buy opportunity");
                              }}
                            >
                              Join Group Buy
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approvals Tab */}
          {activeTab === "approvals" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Pending Approvals</h2>
                  <Badge variant="outline">
                    {myApprovalRequests?.filter((r) => r.status === "pending")
                      .length || 0}{" "}
                    Pending
                  </Badge>
                </div>

                {!myApprovalRequests || myApprovalRequests.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <CheckCircle2 className="size-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">
                        No approval requests at the moment
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You'll see RFQs that need your approval here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myApprovalRequests
                      .filter((request) => request.status === "pending")
                      .map((request) => (
                        <Card key={request._id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  RFQ from {request.requestedBy?.name}
                                </CardTitle>
                                <CardDescription>
                                  Submitted{" "}
                                  {new Date(
                                    request.createdAt,
                                  ).toLocaleDateString()}{" "}
                                  • Level {request.approverLevel} approval
                                  required
                                </CardDescription>
                              </div>
                              {request.rfq?.estimatedValue && (
                                <Badge variant="secondary" className="ml-2">
                                  KES{" "}
                                  {request.rfq.estimatedValue.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <div className="font-medium text-sm mb-2">
                                Requested Items:
                              </div>
                              <div className="space-y-1">
                                {request.items?.map((item) => (
                                  <div
                                    key={item._id}
                                    className="text-sm flex justify-between"
                                  >
                                    <span>{item.product?.name}</span>
                                    <span className="text-muted-foreground">
                                      Qty: {item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setShowApprovalDialog({
                                    open: true,
                                    requestId: request._id,
                                    action: "approve",
                                  });
                                }}
                              >
                                <CheckCircle2 className="size-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setShowApprovalDialog({
                                    open: true,
                                    requestId: request._id,
                                    action: "reject",
                                  });
                                }}
                              >
                                <XCircle className="size-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}

                {/* Completed Approvals */}
                {myApprovalRequests &&
                  myApprovalRequests.filter((r) => r.status !== "pending")
                    .length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">
                        Approval History
                      </h3>
                      <div className="space-y-3">
                        {myApprovalRequests
                          .filter((request) => request.status !== "pending")
                          .map((request) => (
                            <Card key={request._id}>
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      RFQ from {request.requestedBy?.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {request.respondedAt
                                        ? new Date(
                                            request.respondedAt,
                                          ).toLocaleString()
                                        : new Date(
                                            request.createdAt,
                                          ).toLocaleString()}
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      request.status === "approved"
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {request.status}
                                  </Badge>
                                </div>
                                {request.comments && (
                                  <div className="text-sm mt-3 p-2 bg-muted rounded">
                                    {request.comments}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Order Statistics */}
              {orderStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                          <Package className="size-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Orders
                          </p>
                          <p className="text-2xl font-bold">
                            {orderStats.totalOrders}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                          <TrendingUp className="size-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Value
                          </p>
                          <p className="text-2xl font-bold">
                            KES {orderStats.totalValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                          <CheckCircle className="size-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Delivered
                          </p>
                          <p className="text-2xl font-bold">
                            {orderStats.delivered}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                          <Clock className="size-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            In Progress
                          </p>
                          <p className="text-2xl font-bold">
                            {orderStats.inProgress}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Orders List */}
              <div>
                <h2 className="text-2xl font-bold mb-4">My Orders</h2>

                {!myOrders || myOrders.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Package className="size-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">
                        No orders yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Orders will appear here when you choose quotations
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {myOrders.map((order) => (
                      <Card key={order._id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {order.productName}
                              </CardTitle>
                              <CardDescription>
                                Order #{order._id.slice(-8)} •{" "}
                                {format(order.orderDate, "MMM d, yyyy")}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "default"
                                  : order.status === "cancelled"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Vendor
                              </p>
                              <p className="font-medium">{order.vendorName}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Quantity
                              </p>
                              <p className="font-medium">
                                {order.quantity} units
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Total Amount
                              </p>
                              <p className="font-medium">
                                KES {order.totalAmount.toLocaleString()}
                              </p>
                            </div>
                            {order.trackingNumber && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Tracking Number
                                </p>
                                <p className="font-medium font-mono">
                                  {order.trackingNumber}
                                </p>
                              </div>
                            )}
                            {order.estimatedDeliveryDate && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Est. Delivery
                                </p>
                                <p className="font-medium">
                                  {format(
                                    order.estimatedDeliveryDate,
                                    "MMM d, yyyy",
                                  )}
                                </p>
                              </div>
                            )}
                            {order.actualDeliveryDate && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">
                                  Delivered On
                                </p>
                                <p className="font-medium">
                                  {format(
                                    order.actualDeliveryDate,
                                    "MMM d, yyyy",
                                  )}
                                </p>
                              </div>
                            )}
                            {order.cancelReason && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground mb-1">
                                  Cancellation Reason
                                </p>
                                <p className="text-sm">{order.cancelReason}</p>
                              </div>
                            )}
                            {order.deliveryNotes && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-muted-foreground mb-1">
                                  Delivery Notes
                                </p>
                                <p className="text-sm">{order.deliveryNotes}</p>
                              </div>
                            )}
                          </div>

                          {/* Order Timeline */}
                          <div className="mt-6 pt-6 border-t">
                            <p className="text-sm font-medium mb-3">
                              Order Progress
                            </p>
                            <div className="flex items-center gap-2">
                              {[
                                "ordered",
                                "confirmed",
                                "processing",
                                "shipped",
                                "delivered",
                              ].map((status, idx) => (
                                <div
                                  key={status}
                                  className="flex items-center gap-2 flex-1"
                                >
                                  <div
                                    className={`size-8 rounded-full flex items-center justify-center ${
                                      [
                                        "ordered",
                                        "confirmed",
                                        "processing",
                                        "shipped",
                                        "delivered",
                                      ].indexOf(order.status) >= idx
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {[
                                      "ordered",
                                      "confirmed",
                                      "processing",
                                      "shipped",
                                      "delivered",
                                    ].indexOf(order.status) >= idx ? (
                                      <CheckCircle className="size-4" />
                                    ) : (
                                      <Clock className="size-4" />
                                    )}
                                  </div>
                                  {idx < 4 && (
                                    <div
                                      className={`h-0.5 flex-1 ${
                                        [
                                          "ordered",
                                          "confirmed",
                                          "processing",
                                          "shipped",
                                          "delivered",
                                        ].indexOf(order.status) > idx
                                          ? "bg-primary"
                                          : "bg-muted"
                                      }`}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between mt-2">
                              {[
                                "Ordered",
                                "Confirmed",
                                "Processing",
                                "Shipped",
                                "Delivered",
                              ].map((label) => (
                                <p
                                  key={label}
                                  className="text-xs text-muted-foreground"
                                >
                                  {label}
                                </p>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decline Dialog */}
      <Dialog
        open={declineDialog.open}
        onOpenChange={(open) => setDeclineDialog({ open, quotationId: null })}
      >
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
              onClick={() =>
                setDeclineDialog({ open: false, quotationId: null })
              }
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

      {/* Approval Dialog */}
      <Dialog
        open={showApprovalDialog.open}
        onOpenChange={(open) =>
          setShowApprovalDialog({ open, requestId: null, action: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showApprovalDialog.action === "approve"
                ? "Approve RFQ"
                : "Reject RFQ"}
            </DialogTitle>
            <DialogDescription>
              {showApprovalDialog.action === "approve"
                ? "Approve this RFQ and provide comments if needed"
                : "Reject this RFQ and provide a reason for rejection"}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            placeholder={
              showApprovalDialog.action === "approve"
                ? "Provide comments on why you're approving this RFQ..."
                : "Provide a reason for rejecting this RFQ..."
            }
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setShowApprovalDialog({
                  open: false,
                  requestId: null,
                  action: null,
                })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!showApprovalDialog.requestId) return;
                if (!approvalComments.trim()) {
                  toast.error("Please provide a comment for your decision");
                  return;
                }

                try {
                  setIsSubmitting(true);
                  await respondToApproval({
                    requestId:
                      showApprovalDialog.requestId as Id<"approvalRequests">,
                    decision:
                      showApprovalDialog.action === "approve"
                        ? "approved"
                        : "rejected",
                    comments: approvalComments,
                  });
                  toast.success(
                    showApprovalDialog.action === "approve"
                      ? "RFQ approved successfully"
                      : "RFQ rejected successfully",
                  );
                  setShowApprovalDialog({
                    open: false,
                    requestId: null,
                    action: null,
                  });
                  setApprovalComments("");
                } catch (error) {
                  toast.error("Failed to process approval");
                  console.error(error);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={
                isSubmitting ||
                !showApprovalDialog.requestId ||
                !approvalComments.trim()
              }
            >
              {isSubmitting
                ? "Processing..."
                : showApprovalDialog.action === "approve"
                  ? "Approve RFQ"
                  : "Reject RFQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
