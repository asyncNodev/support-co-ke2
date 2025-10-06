import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Bell } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useUser } from "@/hooks/use-auth.ts";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
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
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            Medical Supplies Kenya
          </Link>
          
          <div className="flex items-center gap-4">
            {isAuthenticated && currentUser && (
              <>
                {/* Notifications Bell */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="size-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        {unreadCount} unread
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {!notifications || notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-4 border-b hover:bg-muted/50 cursor-pointer ${
                              !notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                            }`}
                            onClick={() => navigate(getDashboardLink())}
                          >
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                            </p>
                          </div>
                        ))
                      )}
                      {notifications && notifications.length > 5 && (
                        <div className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(getDashboardLink())}
                          >
                            View all notifications
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Dashboard Link */}
                <Button variant="outline" asChild>
                  <Link to={getDashboardLink()}>Dashboard</Link>
                </Button>
              </>
            )}
            <SignInButton />
          </div>
        </div>
      </header>

      {/* Back button */}
      <div className="container mx-auto px-4 py-6">
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
                    <p className="text-sm text-muted-foreground text-center">
                      Please sign in to submit RFQ
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}