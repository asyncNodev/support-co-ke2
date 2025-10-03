import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, Check, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";

export default function RFQDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const rfqDetails = useQuery(api.rfqs.getRFQDetails, id ? { rfqId: id as Id<"rfqs"> } : "skip");
  const chooseQuotation = useMutation(api.rfqs.chooseQuotation);

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

  // Group quotations by product
  const quotationsByProduct: Record<string, Array<typeof rfqDetails.quotations[0]>> = {};
  rfqDetails.quotations.forEach((quot) => {
    if (!quotationsByProduct[quot.productId]) {
      quotationsByProduct[quot.productId] = [];
    }
    quotationsByProduct[quot.productId].push(quot);
  });

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

        {/* Quotations by Product */}
        {rfqDetails.items.map((item) => {
          const quotations = quotationsByProduct[item.productId] || [];
          if (quotations.length === 0) {
            return (
              <Card key={item.productId} className="mb-8">
                <CardHeader>
                  <CardTitle>{item.product?.name}</CardTitle>
                  <CardDescription>No quotations available yet</CardDescription>
                </CardHeader>
              </Card>
            );
          }

          return (
            <Card key={item.productId} className="mb-8">
              <CardHeader>
                <CardTitle>{item.product?.name}</CardTitle>
                <CardDescription>{quotations.length} quotation(s) available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Payment Terms</TableHead>
                        <TableHead>Delivery Time</TableHead>
                        <TableHead>Warranty</TableHead>
                        <TableHead>Country of Origin</TableHead>
                        <TableHead>Specifications</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotations.map((quot) => (
                        <TableRow key={quot._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{quot.vendor?.name}</span>
                              {quot.vendorRating && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="size-3 fill-yellow-400 text-yellow-400" />
                                  {quot.vendorRating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={quot.quotationType === "pre-filled" ? "default" : "secondary"}>
                              {quot.quotationType === "pre-filled" ? "Instant" : "Custom"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">KES {quot.price.toLocaleString()}</TableCell>
                          <TableCell>{quot.quantity}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{quot.paymentTerms}</Badge>
                          </TableCell>
                          <TableCell>{quot.deliveryTime}</TableCell>
                          <TableCell>{quot.warrantyPeriod}</TableCell>
                          <TableCell>{quot.countryOfOrigin}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {quot.productSpecifications}
                          </TableCell>
                          <TableCell>
                            {quot.chosen ? (
                              <Badge variant="default" className="gap-1">
                                <Check className="size-3" /> Chosen
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleChooseQuotation(quot._id)}
                              >
                                Choose
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {rfqDetails.quotations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No quotations received yet. Vendors have been notified and will submit quotations soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}