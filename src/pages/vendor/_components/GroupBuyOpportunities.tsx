import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, EmptyStateIcon, EmptyStateTitle, EmptyStateDescription } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Users, Clock, Package } from "lucide-react";

export function GroupBuyOpportunities() {
  const groupBuyOpportunities = useQuery(api.groupBuys.getGroupBuyOpportunitiesForVendor, {});

  if (!groupBuyOpportunities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Group Buy Opportunities</CardTitle>
          <CardDescription>
            Large orders from multiple hospitals working together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupBuyOpportunities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Group Buy Opportunities</CardTitle>
          <CardDescription>
            Large orders from multiple hospitals working together
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState>
            <EmptyStateIcon>
              <Users />
            </EmptyStateIcon>
            <EmptyStateTitle>No Group Buys Yet</EmptyStateTitle>
            <EmptyStateDescription>
              When hospitals team up for bulk orders, you'll see them here
            </EmptyStateDescription>
          </EmptyState>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Buy Opportunities</CardTitle>
        <CardDescription>
          Large orders from multiple hospitals working together
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groupBuyOpportunities.map((gb) => (
            <Card key={gb._id} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{gb.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {gb.product?.name}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {gb.participantCount} {gb.participantCount === 1 ? "Hospital" : "Hospitals"}
                  </Badge>
                </div>
                
                {gb.description && (
                  <p className="text-sm text-muted-foreground mb-4">{gb.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {gb.currentQuantity} / {gb.targetQuantity} units ({Math.round(gb.progress)}%)
                    </span>
                  </div>
                  <Progress value={gb.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="size-4" />
                      <span>{gb.daysLeft} days left</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="size-4" />
                      <span>{gb.currentQuantity} units</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Bulk Order
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
