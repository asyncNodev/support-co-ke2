import { useQuery } from "convex/react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ArrowLeft, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export default function RFQDetails() {
  const { id } = useParams();
  const rfqDetails = useQuery(api.rfqs.getRFQDetails, {
    rfqId: id as Id<"rfqs">,
  });

  if (!rfqDetails) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Group quotations by product
  const itemsWithQuotations = rfqDetails.items.map((item) => ({
    ...item,
    productName: item.product?.name || "Unknown Product",
    quotations: rfqDetails.quotations.filter(
      (q) => q.productId === item.productId
    ),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link to="/buyer">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 size-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">RFQ #{rfqDetails._id.slice(-8)}</h1>
          <p className="text-muted-foreground">
            Submitted on {new Date(rfqDetails.createdAt).toLocaleDateString()}
          </p>
        </div>

        {itemsWithQuotations.map((item) => (
          <div key={item.productId} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Package className="size-6 text-primary" />
              <div>
                <h2 className="text-2xl font-semibold">{item.productName}</h2>
                <p className="text-sm text-muted-foreground">
                  Requested Quantity: {item.quantity}
                </p>
              </div>
            </div>

            {item.quotations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="size-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No quotations received yet for this product
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {item.quotations.map((quotation) => (
                  <Card key={quotation._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {quotation.vendor?.name}
                          </CardTitle>
                          {quotation.vendor?.companyName && (
                            <p className="text-sm text-muted-foreground">
                              {quotation.vendor.companyName}
                            </p>
                          )}
                        </div>
                        <Badge variant={quotation.quotationType === "pre-filled" ? "default" : "secondary"}>
                          {quotation.quotationType === "pre-filled" ? "Pre-filled" : "On-demand"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-primary">
                          ${quotation.price.toFixed(2)}
                        </span>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">Qty: {quotation.quantity}</p>
                          <p className="text-muted-foreground">
                            Unit: ${(quotation.price / quotation.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment:</span>
                          <span className="font-medium capitalize">{quotation.paymentTerms}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery:</span>
                          <span className="font-medium">{quotation.deliveryTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Warranty:</span>
                          <span className="font-medium">{quotation.warrantyPeriod}</span>
                        </div>
                      </div>
                      {quotation.productDescription && (
                        <p className="text-sm text-muted-foreground pt-2 border-t">
                          {quotation.productDescription}
                        </p>
                      )}
                      <Button className="w-full" variant="outline">
                        <TrendingUp className="mr-2 size-4" />
                        Accept Quote
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}