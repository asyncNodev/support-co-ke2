import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Zap, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useUser } from "@/hooks/use-auth.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const myQuotations = useQuery(api.vendorQuotations.getMyQuotations, currentUser ? {} : "skip");
  const sentQuotations = useQuery(api.vendorQuotations.getMySentQuotations, currentUser ? {} : "skip");

  if (authLoading || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please Sign In</h1>
          <p className="text-muted-foreground">You need to sign in to access the vendor dashboard</p>
          <SignInButton />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    navigate("/register");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Complete Registration</h1>
          <p className="text-muted-foreground">Redirecting to registration...</p>
        </div>
      </div>
    );
  }

  if (currentUser.role !== "vendor") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">This page is only accessible to vendors</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="size-8 text-primary" />
            <span className="text-2xl font-bold">QuickQuote B2B</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/browse">
              <Button variant="ghost">Browse Products</Button>
            </Link>
            <SignInButton />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Manage your quotations and track sent quotes</p>
          <div className="flex items-center gap-2 mt-2">
            {currentUser.verified ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="size-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <Clock className="size-3" />
                Pending Verification
              </Badge>
            )}
          </div>
        </div>

        {/* Verification Notice */}
        {!currentUser.verified && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/10 dark:border-orange-900">
            <CardContent className="py-4">
              <div className="flex gap-3">
                <AlertCircle className="size-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900 dark:text-orange-100">Account Pending Verification</p>
                  <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                    Your vendor account is awaiting admin approval. Once verified, you'll be able to add quotations and receive buyer RFQs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {myQuotations?.length ?? 0}
              </CardTitle>
              <CardDescription>Active Quotations</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {sentQuotations?.length ?? 0}
              </CardTitle>
              <CardDescription>Quotations Sent to Buyers</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {sentQuotations?.filter((q: { opened: boolean }) => q.opened).length ?? 0}
              </CardTitle>
              <CardDescription>Quotations Opened</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* My Quotations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Quotations</h2>
            {currentUser.verified && (
              <Button disabled>
                Add Quotation
              </Button>
            )}
          </div>

          {myQuotations === undefined ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : myQuotations.length > 0 ? (
            <div className="grid gap-4">
              {myQuotations.map((quotation: {
                _id: string;
                product: { name: string } | null;
                price: number;
                quantity: number;
                active: boolean;
                paymentTerms: string;
                deliveryTime: string;
                warrantyPeriod: string;
              }) => (
                <Card key={quotation._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{quotation.product?.name ?? "Unknown Product"}</CardTitle>
                        <CardDescription>
                          ${quotation.price} per unit • Min. quantity: {quotation.quantity}
                        </CardDescription>
                      </div>
                      <Badge variant={quotation.active ? "default" : "secondary"}>
                        {quotation.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Payment:</span>{" "}
                        <span className="font-medium">{quotation.paymentTerms}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivery:</span>{" "}
                        <span className="font-medium">{quotation.deliveryTime}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Warranty:</span>{" "}
                        <span className="font-medium">{quotation.warrantyPeriod}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {currentUser.verified
                    ? "No quotations added yet"
                    : "Add quotations once your account is verified"}
                </p>
                {currentUser.verified && (
                  <Button disabled>Add Your First Quotation</Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sent Quotations */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quotations Sent to Buyers</h2>
          {sentQuotations === undefined ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : sentQuotations.length > 0 ? (
            <div className="grid gap-4">
              {sentQuotations.map((sent: {
                _id: string;
                productName: string;
                sentAt: number;
                price: number;
                quantity: number;
                opened: boolean;
                buyerName: string;
              }) => (
                <Card key={sent._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{sent.productName}</CardTitle>
                        <CardDescription>
                          Sent {new Date(sent.sentAt).toLocaleDateString()} • ${sent.price} × {sent.quantity} units
                        </CardDescription>
                      </div>
                      <Badge variant={sent.opened ? "default" : "secondary"}>
                        {sent.opened ? "Opened" : "Sent"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Buyer: {sent.buyerName}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No quotations sent yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}