import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth.ts";
import { Loader2, Building2, ShoppingCart, MapPin, Upload } from "lucide-react";
import AppHeader from "@/components/AppHeader";

export default function Register() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const createUser = useMutation(api.users.createUser);

  const [selectedRole, setSelectedRole] = useState<"buyer" | "vendor" | null>(null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [cr12Url, setCr12Url] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          setAddress(data.display_name || `${lat}, ${lng}`);
          toast.success("Location fetched successfully");
        } catch (error) {
          setAddress(`${lat}, ${lng}`);
          toast.error("Could not fetch address, using coordinates");
        }
        setIsLoadingLocation(false);
      },
      (error) => {
        toast.error("Failed to get location: " + error.message);
        setIsLoadingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    if (selectedRole === "vendor" && !cr12Url) {
      toast.error("Please upload CR-12 certificate");
      return;
    }

    if (selectedRole === "vendor" && !latitude) {
      toast.error("Please fetch your GPS location");
      return;
    }

    setIsSubmitting(true);

    try {
      await createUser({
        name: name || user?.profile.name || "Unknown",
        email: user?.profile.email || "unknown@example.com",
        role: selectedRole,
        companyName: companyName || undefined,
        phone: phone || undefined,
        address: address || undefined,
        cr12Certificate: cr12Url || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      });

      toast.success("Registration successful!");

      // Redirect based on role
      if (selectedRole === "vendor") {
        navigate("/vendor");
      } else {
        navigate("/buyer");
      }
    } catch (error) {
      toast.error("Registration failed");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Signed in as: {user.profile?.email}
            </p>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="space-y-4">
                <Label>Select Your Role</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedRole("buyer")}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                      <ShoppingCart className="size-12 text-primary" />
                      <h3 className="font-semibold">Buyer</h3>
                      <p className="text-xs text-center text-muted-foreground">
                        Request quotations from suppliers
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedRole("vendor")}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
                      <Building2 className="size-12 text-primary" />
                      <h3 className="font-semibold">Vendor</h3>
                      <p className="text-xs text-center text-muted-foreground">
                        Provide quotations to buyers
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={name || user.profile?.name || ""}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="ACME Medical Supplies"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                  />
                </div>

                {selectedRole === "vendor" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="cr12">CR-12 Certificate URL *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cr12"
                          value={cr12Url}
                          onChange={(e) => setCr12Url(e.target.value)}
                          placeholder="https://cdn.hercules.app/file_..."
                          required
                        />
                        <Button type="button" variant="outline" size="icon">
                          <Upload className="size-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload your CR-12 certificate to Files & Media tab, then paste the URL here
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Company Address (GPS) *</Label>
                      <div className="flex gap-2">
                        <Input
                          value={address}
                          readOnly
                          placeholder="Click button to fetch GPS location"
                        />
                        <Button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isLoadingLocation}
                          variant="outline"
                        >
                          <MapPin className="size-4 mr-2" />
                          {isLoadingLocation ? "Fetching..." : "Get Location"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Your GPS location will be fetched automatically
                      </p>
                    </div>
                  </>
                )}

                {selectedRole === "vendor" && (
                  <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-900 dark:text-amber-100">
                      <strong>Note:</strong> Your vendor account requires admin verification before you can submit quotations.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedRole(null)}
                    className="w-full"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Creating Account..." : "Complete Registration"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}