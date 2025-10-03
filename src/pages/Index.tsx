import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingCart, Users, Zap, Shield, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const PRODUCTS = [
  "Blood Pressure Monitor",
  "Pulse Oximeter",
  "Hospital Bed",
  "Wheelchair",
  "Oxygen Concentrator",
  "Microscope",
  "Centrifuge",
  "Examination Gloves",
  "Surgical Masks",
  "Medical Examination Table"
];

export default function Index() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<string>>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim() === "") {
      setSuggestions([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = PRODUCTS.filter((product) =>
      product.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
    setSuggestions(filtered);
  }, [query]);

  // Close suggestions when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (searchTerm: string) => {
    navigate(`/browse?search=${encodeURIComponent(searchTerm)}`);
    setQuery("");
    setSuggestions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      handleSearch(query);
    }
  };

  // Navigation links per role
  const navLinks = [
    { name: "Browse Products", to: "/browse" },
  ];

  if (isAuthenticated && currentUser) {
    if (currentUser.role === "admin") {
      navLinks.push({ name: "Admin Dashboard", to: "/admin" });
    }
    if (currentUser.role === "vendor") {
      navLinks.push({ name: "Vendor Dashboard", to: "/vendor" });
    }
    if (currentUser.role === "buyer") {
      navLinks.push({ name: "Buyer Dashboard", to: "/buyer" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-8 text-primary" />
            <span className="text-2xl font-bold">QuickQuote B2B</span>
          </div>
          <nav className="flex items-center gap-4">
            {navLinks.map(({ name, to }) => (
              <Link key={to} to={to}>
                <Button variant="ghost">{name}</Button>
              </Link>
            ))}
            {!isAuthenticated && <SignInButton />}
          </nav>
        </div>
      </header>

      {/* Search Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-balance">
            Find Products Instantly
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Search our extensive catalog and get instant quotation matches.
          </p>
          <div className="relative" ref={suggestionsRef}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full rounded border border-border bg-background px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Search products"
              onKeyPress={handleKeyPress}
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-background border border-border rounded-b shadow-md mt-1 max-h-60 overflow-auto">
                {suggestions.map((product) => (
                  <li key={product}>
                    <Link
                      to={`/browse?search=${encodeURIComponent(product)}`}
                      className="block px-4 py-2 hover:bg-primary/20"
                      onClick={() => {
                        handleSearch(product);
                      }}
                    >
                      {product}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg space-y-4">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="size-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Browse & Add to RFQ</h3>
            <p className="text-muted-foreground">
              Browse admin-managed product catalog. Add items to your RFQ cart and submit your request.
            </p>
          </div>
          <div className="p-6 border rounded-lg space-y-4">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="size-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Instant Auto-Match</h3>
            <p className="text-muted-foreground">
              System automatically matches your RFQ with pre-submitted vendor quotations in real-time.
            </p>
          </div>
          <div className="p-6 border rounded-lg space-y-4">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="size-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">View & Compare</h3>
            <p className="text-muted-foreground">
              Receive quotations instantly on your dashboard. Compare prices, terms, and vendor ratings.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <Shield className="size-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Verified Vendors Only</h3>
                <p className="text-muted-foreground">All vendors are admin-verified before quotations are sent</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Users className="size-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Vendor Ratings</h3>
                <p className="text-muted-foreground">Rate and review vendors after purchase</p>
              </div>
            </div>
            <div className="flex gap-4">
              <TrendingUp className="size-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Admin Analytics</h3>
                <p className="text-muted-foreground">Track visitors, RFQs, quotations, and top categories</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Zap className="size-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Pre-Set Quotations</h3>
                <p className="text-muted-foreground">Vendors pre-fill quotations for instant buyer matching</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Join our B2B marketplace and experience instant quotations
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/browse">
            <Button size="lg">Browse Products</Button>
          </Link>
          {!isAuthenticated && <SignInButton size="lg" variant="outline" />}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} QuickQuote B2B. All rights reserved.</p>
          <div className="flex gap-4 justify-center mt-2">
            <Link to="/seed-data" className="text-primary hover:underline">
              🔧 Seed Demo Data
            </Link>
            <Link to="/make-admin" className="text-primary hover:underline">
              🛡️ Make Me Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}