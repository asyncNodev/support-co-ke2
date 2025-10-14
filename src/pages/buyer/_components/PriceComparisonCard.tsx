import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, DollarSign, Award, AlertCircle } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Progress } from "@/components/ui/progress";

type QuoteData = {
  _id: Id<"sentQuotations">;
  vendorId: Id<"users">;
  vendorName: string;
  price: number;
  quantity: number;
  deliveryTime: string;
  warrantyPeriod: string;
  paymentTerms: string;
  chosen: boolean;
  savingsVsBest?: number;
  savingsPercentage?: number;
  isLowest?: boolean;
  isHighest?: boolean;
  vsAverage?: number;
};

type ProductAnalytics = {
  productId: string;
  productName: string;
  quotes: QuoteData[];
  lowestPrice: number;
  highestPrice: number;
  averagePrice: number;
  medianPrice: number;
  bestQuoteId: Id<"sentQuotations">;
  potentialSavings: number;
  priceRange: number;
  savingsPercentage: number;
};

export function PriceComparisonCard({
  analytics,
  onChooseQuote,
}: {
  analytics: ProductAnalytics;
  onChooseQuote: (quoteId: Id<"sentQuotations">) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{analytics.productName}</CardTitle>
            <CardDescription className="mt-1">
              {analytics.quotes.length} quotation{analytics.quotes.length > 1 ? "s" : ""} received
            </CardDescription>
          </div>
          {analytics.potentialSavings > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 font-semibold">
                <TrendingDown className="size-4" />
                Save up to KES {analytics.potentialSavings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.savingsPercentage.toFixed(1)}% potential savings
              </p>
            </div>
          )}
        </div>

        {/* Price Range Visualization */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price Range:</span>
            <span className="font-medium">
              KES {analytics.lowestPrice.toLocaleString()} - {analytics.highestPrice.toLocaleString()}
            </span>
          </div>
          <div className="relative">
            <Progress value={50} className="h-2" />
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span>Best Price</span>
              <span>Avg: KES {Math.round(analytics.averagePrice).toLocaleString()}</span>
              <span>Highest</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y">
          {analytics.quotes
            .sort((a, b) => a.price - b.price)
            .map((quote) => (
              <div
                key={quote._id}
                className={`p-4 transition-colors ${
                  quote.isLowest ? "bg-green-50 dark:bg-green-950/20" : ""
                } ${quote.chosen ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Vendor Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold truncate">{quote.vendorName}</h4>
                      {quote.isLowest && (
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <Award className="size-3" />
                          Best Price
                        </Badge>
                      )}
                      {quote.chosen && <Badge variant="secondary">Selected</Badge>}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs">Payment</span>
                        <span className="font-medium">{quote.paymentTerms}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Delivery</span>
                        <span className="font-medium">{quote.deliveryTime}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Warranty</span>
                        <span className="font-medium">{quote.warrantyPeriod}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs">Quantity</span>
                        <span className="font-medium">{quote.quantity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="text-right flex-shrink-0">
                    <div className="mb-3">
                      <div
                        className={`text-2xl font-bold ${
                          quote.isLowest ? "text-green-600" : ""
                        }`}
                      >
                        KES {quote.price.toLocaleString()}
                      </div>

                      {/* Price Comparison */}
                      {!quote.isLowest && quote.savingsVsBest && (
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-1 text-sm text-red-600">
                            <TrendingUp className="size-3" />
                            +KES {quote.savingsVsBest.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {quote.savingsPercentage?.toFixed(1)}% above best price
                          </p>
                        </div>
                      )}

                      {quote.isLowest && (
                        <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                          <DollarSign className="size-3" />
                          Lowest offer
                        </div>
                      )}

                      {/* vs Average */}
                      {quote.vsAverage !== undefined && Math.abs(quote.vsAverage) > 100 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {quote.vsAverage > 0 ? "+" : ""}
                          KES {Math.round(quote.vsAverage).toLocaleString()} vs avg
                        </div>
                      )}
                    </div>

                    {!quote.chosen && (
                      <Button
                        size="sm"
                        onClick={() => onChooseQuote(quote._id)}
                        variant={quote.isLowest ? "default" : "outline"}
                        className="w-full"
                      >
                        {quote.isLowest ? "Choose Best" : "Choose"}
                      </Button>
                    )}
                    {quote.chosen && (
                      <Badge variant="default" className="w-full justify-center py-1">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CardContent>

      {/* Recommendation */}
      {analytics.quotes.length > 1 && (
        <div className="border-t bg-blue-50 dark:bg-blue-950/20 p-4">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Smart Recommendation
              </p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                Choosing the best price saves you{" "}
                <span className="font-semibold">
                  KES {analytics.potentialSavings.toLocaleString()}
                </span>{" "}
                ({analytics.savingsPercentage.toFixed(1)}%) on this item. Consider delivery time
                and warranty when making your decision.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}