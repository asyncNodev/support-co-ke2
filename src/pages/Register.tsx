import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { Loader2, Store, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, id: authId } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser, authId ? {} : "skip");
  const createUser = useMutation(api.users.createUser);

  const [role, setRole] = useState<"vendor" | "buyer">("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Redirect if user already exists
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === "admin") {
        navigate("/admin");
      } else if (currentUser.role === "vendor") {
        navigate("/vendor");
      } else if (currentUser.role === "buyer") {
        navigate("/buyer");
      }
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const args: {
        role: "vendor" | "buyer";
        companyName?: string;
        phone?: string;
        address?: string;
      } = {
        role,
        companyName: companyName || undefined,
        phone: phone || undefined,
        address: address || undefined,
      };
      await createUser(args);

      toast.success("Registration successful!");
      
      // Redirect based on role
      if (role === "vendor") {
        navigate("/vendor");
      } else {
        navigate("/buyer");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Complete Your Registration</CardTitle>
          <CardDescription>
            Choose your account type and provide your details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>I want to register as a:</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as "vendor" | "buyer")}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`relative flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${role === "buyer" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <RadioGroupItem value="buyer" id="buyer" className="mt-1" />
                    <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingBag className="size-5 text-primary" />
                        <span className="font-semibold text-lg">Buyer</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Browse products, submit RFQs, and receive instant quotations from verified vendors
                      </p>
                    </Label>
                  </div>

                  <div className={`relative flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${role === "vendor" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <RadioGroupItem value="vendor" id="vendor" className="mt-1" />
                    <Label htmlFor="vendor" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Store className="size-5 text-primary" />
                        <span className="font-semibold text-lg">Vendor</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Pre-fill quotations for products and get matched with buyer RFQs instantly
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, City, Country"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Verification Notice */}
            {role === "vendor" && (
              <div className="bg-muted/50 border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Vendor accounts require admin verification before you can submit quotations. You'll be notified once your account is approved.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                <>Complete Registration</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}