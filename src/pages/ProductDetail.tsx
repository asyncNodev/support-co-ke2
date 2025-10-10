import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth.ts";
import { ShoppingCart, Bell, CalendarIcon, ArrowLeft } from "lucide-react";
import { addToRFQCart, getRFQCart } from "@/lib/rfq-cart.ts";
import { toast } from "sonner";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, formatDistanceToNow } from "date-fns";
import AppHeader from "@/components/AppHeader";
import GuestRFQDialog from "@/pages/_components/GuestRFQDialog";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});

  const notifications = useQuery(
    api.notifications.getMyNotifications,
    isAuthenticated ? {} : "skip"
  );

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const product = useQuery(
    api.products.getProduct,
    id ? { productId: id as Id<"products"> } : "skip"
  );
  
  const submitRFQ = useMutation(api.rfqs.submitRFQ);

  const [quantity, setQuantity] = useState("");
  const [expectedDate, setExpectedDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuestDialog, setShowGuestDialog] = useState(false);

  const getDashboardLink = () => {
    if (!currentUser) return "/";
    if (currentUser.role === "admin") return "/admin";
    if (currentUser.role === "vendor") return "/vendor";
    if (currentUser.role === "buyer") return "/buyer";
    return "/";
  };

  const handleSubmitRFQ = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to submit RFQ");
      return;
    }

    if (!quantity || !expectedDate || !product) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRFQ({
        items: [
          {
            productId: product._id,
            quantity: parseInt(quantity),
          },
        ],
        expectedDeliveryTime: format(expectedDate, "yyyy-MM-dd"),
      });

      toast.success("RFQ submitted successfully!");
      navigate("/buyer");
    } catch (error) {
      toast.error("Failed to submit RFQ. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 size-4" />
          Back to Results
        </Button>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Request for Quotation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Display */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="md:w-1/2">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No Image Available
                      </div>
                    )}
                  </div>
                </div>

                {/* RFQ Form */}
                <div className="md:w-1/2 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                  </div>

                  {/* Quantity Input */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity Required *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  {/* Expected Delivery Date */}
                  <div className="space-y-2">
                    <Label>Expected Delivery Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {expectedDate ? (
                            format(expectedDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmitRFQ}
                    disabled={isSubmitting || !isAuthenticated}
                    className="w-full text-lg py-6"
                    size="lg"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : "Submit Your Request for Quotation"}
                  </Button>

                  {!isAuthenticated && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground text-center">
                        Please sign in to submit RFQ
                      </p>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          if (!quantity || !expectedDate) {
                            toast.error("Please fill in quantity and expected delivery date");
                            return;
                          }
                          setShowGuestDialog(true);
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Submit as Guest (Limited Vendors)
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        💡 <strong>Note:</strong> Guest submissions may receive fewer vendor responses. 
                        <a href="/register" className="underline ml-1">Register</a> to reach more vendors and track quotations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Guest RFQ Dialog */}
      {product && expectedDate && (
        <GuestRFQDialog
          open={showGuestDialog}
          onOpenChange={setShowGuestDialog}
          items={[
            {
              productId: product._id,
              quantity: parseInt(quantity) || 1,
            },
          ]}
          expectedDeliveryTime={format(expectedDate, "yyyy-MM-dd")}
          onSuccess={() => {
            setQuantity("");
            setExpectedDate(undefined);
          }}
        />
      )}
    </div>
  );
}