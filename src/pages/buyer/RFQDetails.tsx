import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, Check, Star, MessageCircle, TrendingDown, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { PriceComparisonCard } from "./_components/PriceComparisonCard.tsx";
import RatingDialog from "./_components/RatingDialog.tsx";
import VendorRatingDisplay from "@/components/VendorRatingDisplay.tsx";
import { useState } from "react";

export default function RFQDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rfqDetails = useQuery(api.rfqs.getRFQDetails, id ? { rfqId: id as Id<"rfqs"> } : "skip");
  const priceAnalytics = useQuery(api.priceAnalytics.getRFQPriceAnalytics, id ? { rfqId: id as Id<"rfqs"> } : "skip");
  const chooseQuotation = useMutation(api.rfqs.chooseQuotation);

  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedVendorForRating, setSelectedVendorForRating] = useState<{
    vendorId: Id<"users">;
    vendorName: string;
    orderValue: number;
  } | null>(null);

  const handleChooseQuotation = async (quotationId: Id<"sentQuotations">) => {
    try {
      await chooseQuotation({ sentQuotationId: quotationId });
      toast.success("Quotation selected! Vendor has been notified and your contact info has been shared.");
    } catch (error) {
      toast.error("Failed to select quotation");
    }
  };

  if (!id) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p>Invalid RFQ ID</p>
      </div>
    );
  }

  if (!rfqDetails) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/buyer")}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">RFQ Details</h1>
              <p className="text-sm text-muted-foreground">
                Submitted on {new Date(rfqDetails.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge variant={rfqDetails.status === "quoted" ? "default" : "secondary"}>
            {rfqDetails.status}
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Savings Summary */}
        {priceAnalytics && priceAnalytics.totals.potentialSavings > 0 && (
          <Card className="mb-8 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 text-white p-3 rounded-lg">
                    <TrendingDown className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                      Total Potential Savings
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      By choosing the best prices
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    KES {priceAnalytics.totals.potentialSavings.toLocaleString()}
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {priceAnalytics.totals.savingsPercentage.toFixed(1)}% savings possible
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-green-200 dark:border-green-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-700 dark:text-green-300 block mb-1">Best Total Cost</span>
                    <span className="text-xl font-semibold text-green-900 dark:text-green-100">
                      KES {priceAnalytics.totals.lowestCost.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300 block mb-1">Average Cost</span>
                    <span className="text-xl font-semibold text-green-900 dark:text-green-100">
                      KES {Math.round(priceAnalytics.totals.averageCost).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-green-700 dark:text-green-300 block mb-1">Highest Cost</span>
                    <span className="text-xl font-semibold text-green-900 dark:text-green-100">
                      KES {priceAnalytics.totals.highestCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* RFQ Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Requested Products</CardTitle>
            <CardDescription>Items in your RFQ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rfqDetails.items.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{item.product?.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.product?.description}</p>
                  </div>
                  <Badge variant="outline">Qty: {item.quantity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Price Comparison Cards */}
        {priceAnalytics && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Price Comparison & Analytics</h2>
              <p className="text-muted-foreground">
                Compare quotations and choose the best deal for each product
              </p>
            </div>

            {Object.values(priceAnalytics.byProduct).map((productAnalytics) => (
              <PriceComparisonCard
                key={productAnalytics.productId}
                analytics={productAnalytics}
                onChooseQuote={handleChooseQuotation}
              />
            ))}
          </div>
        )}

        {rfqDetails.quotations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No quotations received yet. Vendors have been notified and will submit quotations soon.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Vendor Ratings Section - Show ratings for vendors who got chosen */}
        {rfqDetails.quotations.some((q) => q.chosen) && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Vendor Ratings</h2>
            <div className="space-y-6">
              {Array.from(new Set(rfqDetails.quotations.filter((q) => q.chosen).map((q) => q.vendorId))).map((vendorId) => {
                const vendor = rfqDetails.quotations.find((q) => q.vendorId === vendorId);
                if (!vendor) return null;
                
                return (
                  <div key={vendorId}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">{vendor.vendor?.name}</h3>
                      <Button
                        onClick={() => {
                          const totalValue = rfqDetails.quotations
                            .filter((q) => q.vendorId === vendorId && q.chosen)
                            .reduce((sum, q) => sum + (q.price * q.quantity), 0);
                          setSelectedVendorForRating({
                            vendorId,
                            vendorName: vendor.vendor?.name || "Vendor",
                            orderValue: totalValue,
                          });
                          setRatingDialogOpen(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Star className="size-4 mr-2" />
                        Rate This Vendor
                      </Button>
                    </div>
                    <VendorRatingDisplay vendorId={vendorId} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Rating Dialog */}
      {selectedVendorForRating && (
        <RatingDialog
          vendorId={selectedVendorForRating.vendorId}
          vendorName={selectedVendorForRating.vendorName}
          rfqId={id as Id<"rfqs">}
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          orderValue={selectedVendorForRating.orderValue}
        />
      )}
    </div>
  );
}