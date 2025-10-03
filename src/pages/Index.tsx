import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import { toast } from "sonner";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, signinRedirect } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const products = useQuery(api.products.getProducts, {});
  const currentUser = useQuery(api.users.getCurrentUser, {});

  const getDashboardLink = () => {
    if (!currentUser) return "/";
    if (currentUser.role === "admin") return "/admin";
    if (currentUser.role === "vendor") return "/vendor";
    if (currentUser.role === "buyer") return "/buyer";
    return "/";
  };

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
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Medical Supplies Kenya</h1>
          <div className="flex items-center gap-4">
            {currentUser && (
              <Button variant="outline" asChild>
                <Link to={getDashboardLink()}>Dashboard</Link>
              </Button>
            )}
            <SignInButton />
          </div>
        </div>
      </header>

      {/* Hero Section - Clean Search */}
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
                className="w-full pl-16 pr-6 py-6 text-lg rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />

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

          {/* Enter as Hospital/Vendor Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
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
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4">
            <a href="/seed-data" className="hover:text-foreground">
              Seed Data
            </a>
            <span>•</span>
            <a href="/make-admin" className="hover:text-foreground">
              Make Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}