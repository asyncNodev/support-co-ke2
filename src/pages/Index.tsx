import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Camera } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth.ts";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import RFQChatbot from "@/components/RFQChatbot";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, signinRedirect } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const products = useQuery(api.products.getProducts, {});

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEnterAsHospital = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in first");
      signinRedirect();
      return;
    }
    if (!currentUser) {
      navigate("/register");
      return;
    }
    navigate("/buyer");
  };

  const handleEnterAsVendor = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in first");
      signinRedirect();
      return;
    }
    if (!currentUser) {
      navigate("/register");
      return;
    }
    navigate("/vendor");
  };

  const suggestions = products?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/product-search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (productName: string) => {
    setSearchQuery(productName);
    setShowSuggestions(false);
    navigate(`/product-search?q=${encodeURIComponent(productName)}`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      // Navigate to search with image parameter
      navigate(`/product-search?image=true`);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSearchClick = () => {
    fileInputRef.current?.click();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Find Medical Equipment & Supplies
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Search and get quotations from verified Kenyan suppliers
          </p>

          <form onSubmit={handleSearch} className="w-full mb-8">
            <div ref={searchRef} className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                placeholder="Search for medical supplies (e.g. Hospital Bed, Wheelchair)..."
                className="w-full pl-16 pr-24 py-6 text-lg rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={handleImageSearchClick}
              >
                <Camera className="h-5 w-5" />
              </Button>

              {showSuggestions && suggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-background border-2 border-border rounded-xl shadow-lg max-h-96 overflow-y-auto">
                  {suggestions.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleSuggestionClick(product.name)}
                      className="w-full px-6 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <Search className="size-4 text-muted-foreground" />
                      <span>{product.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          <p className="text-sm text-muted-foreground">
            💡 Tip: Click the camera icon to search by image
          </p>

          {/* Only show entry buttons if NOT signed in */}
          {!isAuthenticated && (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <Button
                size="lg"
                variant="default"
                onClick={handleEnterAsHospital}
                className="px-8 py-6 text-lg"
              >
                Enter as Hospital
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleEnterAsVendor}
                className="px-8 py-6 text-lg"
              >
                Enter as Vendor
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Medical Supplies Kenya. All rights reserved.</p>
        </div>
      </footer>

      {/* RFQ Chatbot */}
      <RFQChatbot />
    </div>
  );
}