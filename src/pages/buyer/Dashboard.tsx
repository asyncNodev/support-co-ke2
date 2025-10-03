import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { ArrowRight, Package, Clock, CheckCircle } from "lucide-react";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const myRFQs = useQuery(api.rfqs.getMyRFQs, currentUser ? {} : "skip");

  if (authLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }
  if (!currentUser) {
    navigate("/register");
    return null;
  }
  if (currentUser.role !== "buyer") {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="size-8 text-primary" />
            <span className="text-2xl font-bold">Buyer Dashboard</span>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome, {currentUser.name}</h1>
          <p className="text-muted-foreground">Manage your RFQs and review quotations</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/browse")}>
            <CardHeader>
              <CardTitle>Browse Products</CardTitle>
              <CardDescription>Search and add products to your RFQ cart</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>My RFQs</CardTitle>
              <CardDescription>View and manage your submitted RFQs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{myRFQs?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* My RFQs List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent RFQs</CardTitle>
            <CardDescription>Click on an RFQ to view quotations</CardDescription>
          </CardHeader>
          <CardContent>
            {!myRFQs || myRFQs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No RFQs yet. Start by browsing products and adding them to your cart.
              </div>
            ) : (
              <div className="space-y-3">
                {myRFQs.map((rfq) => {
                  const statusColor = 
                    rfq.status === "completed" ? "text-green-600" :
                    rfq.status === "quoted" ? "text-blue-600" :
                    "text-orange-600";
                  
                  const StatusIcon = 
                    rfq.status === "completed" ? CheckCircle :
                    rfq.status === "quoted" ? Package :
                    Clock;

                  return (
                    <Link key={rfq._id} to={`/buyer/rfq/${rfq._id}`}>
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-center gap-4">
                          <StatusIcon className={`size-8 ${statusColor}`} />
                          <div>
                            <div className="font-semibold">RFQ #{rfq._id.slice(-6)}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(rfq.createdAt).toLocaleDateString()}
                            </div>
                            <Badge className="mt-1" variant={
                              rfq.status === "completed" ? "default" :
                              rfq.status === "quoted" ? "secondary" :
                              "outline"
                            }>
                              {rfq.status}
                            </Badge>
                          </div>
                        </div>
                        <ArrowRight className="size-5 text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}