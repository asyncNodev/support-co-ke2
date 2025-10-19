import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Star, TrendingUp, Package, MessageCircle, Award, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

type VendorRatingDisplayProps = {
  vendorId: Id<"users">;
  compact?: boolean;
};

export default function VendorRatingDisplay({ vendorId, compact = false }: VendorRatingDisplayProps) {
  const stats = useQuery(api.ratings.getVendorStats, { vendorId });
  const ratings = useQuery(api.ratings.getVendorRatings, { vendorId });

  if (!stats) {
    return <div className="text-sm text-muted-foreground">Loading ratings...</div>;
  }

  if (stats.totalRatings === 0 && compact) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Star className="size-4" />
        <span>No ratings yet</span>
      </div>
    );
  }

  // Compact view - just show stars and count
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`size-4 ${
                star <= Math.round(stats.averageRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{stats.averageRating}</span>
        <span className="text-sm text-muted-foreground">
          ({stats.totalRatings} {stats.totalRatings === 1 ? "review" : "reviews"})
        </span>
      </div>
    );
  }

  // Full detailed view
  return (
    <div className="space-y-6">
      {/* Overall Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Ratings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Rating Display */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
              <div className="text-5xl font-bold">{stats.averageRating}</div>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-5 ${
                      star <= Math.round(stats.averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.totalRatings} {stats.totalRatings === 1 ? "review" : "reviews"}
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm">{star}</span>
                    <Star className="size-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress
                    value={(stats.ratingDistribution[star] / stats.totalRatings) * 100}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-8">
                    {stats.ratingDistribution[star]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Detailed Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.averageDelivery > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <Package className="size-5 text-primary mt-0.5" />
                <div>
                  <div className="text-2xl font-bold">{stats.averageDelivery}</div>
                  <div className="text-xs text-muted-foreground">Delivery Speed</div>
                </div>
              </div>
            )}

            {stats.averageCommunication > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <MessageCircle className="size-5 text-primary mt-0.5" />
                <div>
                  <div className="text-2xl font-bold">{stats.averageCommunication}</div>
                  <div className="text-xs text-muted-foreground">Communication</div>
                </div>
              </div>
            )}

            {stats.averageQuality > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <Award className="size-5 text-primary mt-0.5" />
                <div>
                  <div className="text-2xl font-bold">{stats.averageQuality}</div>
                  <div className="text-xs text-muted-foreground">Product Quality</div>
                </div>
              </div>
            )}

            {stats.recommendationRate > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                <ThumbsUp className="size-5 text-primary mt-0.5" />
                <div>
                  <div className="text-2xl font-bold">{stats.recommendationRate}%</div>
                  <div className="text-xs text-muted-foreground">Would Recommend</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      {ratings && ratings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating._id} className="space-y-3 pb-4 border-b last:border-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rating.buyerName}</span>
                      {rating.buyerCompanyName && (
                        <span className="text-sm text-muted-foreground">
                          • {rating.buyerCompanyName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`size-4 ${
                              star <= rating.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(rating.createdAt, "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  {rating.wouldRecommend !== undefined && (
                    <Badge variant={rating.wouldRecommend ? "default" : "secondary"}>
                      {rating.wouldRecommend ? (
                        <>
                          <ThumbsUp className="size-3 mr-1" />
                          Recommends
                        </>
                      ) : (
                        "Not Recommended"
                      )}
                    </Badge>
                  )}
                </div>

                {/* Sub-ratings */}
                {(rating.deliveryRating || rating.communicationRating || rating.qualityRating) && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    {rating.deliveryRating && (
                      <div className="flex items-center gap-1">
                        <Package className="size-3 text-muted-foreground" />
                        <span>Delivery: {rating.deliveryRating}/5</span>
                      </div>
                    )}
                    {rating.communicationRating && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="size-3 text-muted-foreground" />
                        <span>Communication: {rating.communicationRating}/5</span>
                      </div>
                    )}
                    {rating.qualityRating && (
                      <div className="flex items-center gap-1">
                        <Award className="size-3 text-muted-foreground" />
                        <span>Quality: {rating.qualityRating}/5</span>
                      </div>
                    )}
                  </div>
                )}

                {rating.review && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rating.review}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
