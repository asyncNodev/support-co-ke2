import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft, CalendarIcon, Package, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  
  const product = useQuery(
    api.products.getProduct,
    id ? { productId: id as Id<"products"> } : "skip"
  );

  const submitRFQ = useMutation(api.rfqs.submitRFQ);

  const [quantity, setQuantity] = useState<string>("1");
  const [expectedDate, setExpectedDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRFQ = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to request quotations");
      return;
    }

    if (!currentUser) {
      navigate("/register");
      return;
    }

    if (currentUser.role !== "buyer") {
      toast.error("Only buyers can request quotations");
      return;
    }

    if (!quantity || parseInt(quantity) < 1) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!expectedDate) {
      toast.error("Please select expected delivery date");
      return;
    }

    if (!id) return;

    try {
      setIsSubmitting(true);
      await submitRFQ({
        items: [{ productId: id as Id<"products">, quantity: parseInt(quantity) }],
        expectedDeliveryTime: format(expectedDate, "yyyy-MM-dd"),
      });
      
      toast.success("RFQ submitted successfully! Check your dashboard for quotations.");
      navigate("/buyer");
    } catch (error) {
      toast.error("Failed to submit RFQ");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Product Not Found</CardTitle>
            <CardDescription>This product does not exist</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/browse")}>Browse Products</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">QuickQuote B2B</Link>
          <Button onClick={() => navigate("/browse")} variant="ghost">
            <ArrowLeft className="mr-2 size-4" />
            Back to Browse
          </Button>
        </div>
      </header>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="size-32 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Product Info & RFQ Form */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground">SKU: {product.sku || "N/A"}</p>
              {product.category?.name && (
                <p className="text-sm text-muted-foreground mt-1">
                  Category: {product.category.name}
                </p>
              )}
            </div>

            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            {product.specifications && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Specifications</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.specifications}
                </p>
              </div>
            )}

            {/* RFQ Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="size-5" />
                  Request Quotation from All Suppliers
                </CardTitle>
                <CardDescription>
                  Submit your inquiry and receive competitive quotations from verified medical suppliers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Needed</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expected Delivery Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {expectedDate ? format(expectedDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={expectedDate}
                        onSelect={setExpectedDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmitRFQ}
                  disabled={isSubmitting || !quantity || !expectedDate}
                >
                  {isSubmitting ? "Submitting..." : "Request Quotation"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}