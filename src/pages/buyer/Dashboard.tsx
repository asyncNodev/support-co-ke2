import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Zap, Package, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useUser } from "@/hooks/use-auth.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import { getRFQCart, clearRFQCart } from "@/lib/rfq-cart.ts";
import { SignInButton } from "@/components/ui/signin.tsx";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const rfqs = useQuery(api.rfqs.getMyRFQs);
  const submitRFQ = useMutation(api.rfqs.submitRFQ);

  const [rfqCart, setRfqCart] = useState(getRFQCart());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRfqCart(getRFQCart());
  }, []);

  const handleSubmitRFQ = async () => {
    if (rfqCart.length === 0) {
      toast.error("Please add items to your RFQ cart");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitRFQ({
        items: rfqCart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      toast.success(`RFQ submitted! ${result.matchedCount} quotations matched.`);
      clearRFQCart();
      setRfqCart([]);
    } catch (error) {
      toast.error("Failed to submit RFQ");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = rfqCart.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item
    );
    setRfqCart(updatedCart);
    localStorage.setItem("rfq_cart", JSON.stringify(updatedCart));
  };

  const removeItem = (productId: string) => {
    const updatedCart = rfqCart.filter((item) => item.productId !== productId);
    setRfqCart(updatedCart);
    localStorage.setItem("rfq_cart", JSON.stringify(updatedCart));
  };

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
          <p className="text-muted-foreground">You need to sign in to access the buyer dashboard</p>
          <SignInButton />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Complete Registration</h1>
          <p className="text-muted-foreground">Please complete your profile to continue</p>
        </div>
      </div>
    );
  }

  if (currentUser.role !== "buyer") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">This page is only accessible to buyers</p>
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
          <h1 className="text-4xl font-bold mb-2">Buyer Dashboard</h1>
          <p className="text-muted-foreground">
            {currentUser.verified ? "Submit RFQs and view quotations" : "Your account is pending verification"}
          </p>
          {!currentUser.verified && (
            <Badge variant="secondary" className="mt-2">
              Pending Verification
            </Badge>
          )}
        </div>

        {/* RFQ Cart */}
        {rfqCart.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                Submit New RFQ
              </CardTitle>
              <CardDescription>Review your items and submit your request for quotation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {rfqCart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Quantity:</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.productId)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleSubmitRFQ}
                disabled={isSubmitting || !currentUser.verified}
                className="w-full gap-2"
              >
                <Send className="size-4" />
                {isSubmitting ? "Submitting..." : "Submit RFQ"}
              </Button>
              {!currentUser.verified && (
                <p className="text-sm text-muted-foreground text-center">
                  Your account must be verified to submit RFQs
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* My RFQs */}
        <div>
          <h2 className="text-2xl font-bold mb-4">My RFQs</h2>
          {rfqs === undefined ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : rfqs.length > 0 ? (
            <div className="grid gap-4">
              {rfqs.map((rfq) => (
                <Card key={rfq._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>RFQ #{rfq._id.slice(-6)}</CardTitle>
                        <CardDescription>
                          {new Date(rfq.createdAt).toLocaleDateString()} • {rfq.items.length} items
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rfq.status === "quoted" ? "default" : "secondary"}>
                          {rfq.status === "quoted"
                            ? `${rfq.quotationCount} Quotations`
                            : rfq.status === "pending"
                              ? "Pending"
                              : "Completed"}
                        </Badge>
                        <Link to={`/buyer/rfq/${rfq._id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="size-4" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Products: {rfq.items.map((item) => item.product?.name).join(", ")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No RFQs submitted yet</p>
                <Link to="/browse">
                  <Button>Browse Products</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
