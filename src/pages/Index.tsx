import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const MEDICAL_PRODUCTS = [
  "Blood Pressure Monitor",
  "Pulse Oximeter",
  "Hospital Bed",
  "Wheelchair",
  "Oxygen Concentrator",
  "Microscope",
  "Surgical Gloves",
  "Face Masks",
  "Stethoscope",
  "Thermometer"
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
    const filtered = MEDICAL_PRODUCTS.filter((product) =>
      product.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);
    setSuggestions(filtered);
  }, [query]);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">Medical Supplies Kenya</span>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated && currentUser && (
              <>
                {currentUser.role === "admin" && (
                  <Button variant="ghost" onClick={() => navigate("/admin")}>
                    Admin Dashboard
                  </Button>
                )}
                {currentUser.role === "vendor" && (
                  <Button variant="ghost" onClick={() => navigate("/vendor")}>
                    Vendor Dashboard
                  </Button>
                )}
                {currentUser.role === "buyer" && (
                  <Button variant="ghost" onClick={() => navigate("/buyer")}>
                    My Dashboard
                  </Button>
                )}
              </>
            )}
            <SignInButton />
          </nav>
        </div>
      </header>

      {/* Main Content - Search Only */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Find Medical Supplies
            </h1>
            <p className="text-xl text-muted-foreground">
              Search for medical equipment and get instant quotations from verified suppliers
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full" ref={suggestionsRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for medical supplies (e.g. Hospital Bed)..."
                className="w-full pl-12 pr-4 py-4 text-lg rounded-lg border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-background border-2 border-border rounded-lg shadow-lg overflow-hidden">
                {suggestions.map((product) => (
                  <button
                    key={product}
                    onClick={() => handleSearch(product)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                  >
                    <Search className="size-4 text-muted-foreground" />
                    <span>{product}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Popular searches: Hospital Bed, Blood Pressure Monitor, Wheelchair, Surgical Gloves
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Medical Supplies Kenya. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
