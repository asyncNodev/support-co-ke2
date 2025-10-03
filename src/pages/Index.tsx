import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { SignInButton } from "@/components/ui/signin.tsx";

export default function Index() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/product-search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Medical Supplies Kenya</h1>
          <SignInButton />
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

          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for medical supplies (e.g. Hospital Bed, Wheelchair)..."
                className="w-full pl-16 pr-6 py-6 text-lg rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </form>
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
