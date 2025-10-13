import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import AppHeader from "@/components/AppHeader";
import RFQChatbot from "@/components/RFQChatbot";

export default function ProductSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const allProducts = useQuery(api.products.getProducts, {});
  const currentUser = useQuery(api.users.getCurrentUser, {});

  const [searchInput, setSearchInput] = useState(query);

  // Filter products by search query
  const products = allProducts?.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase())
  ) || [];

  const getDashboardLink = () => {
    if (!currentUser) return "/";
    if (currentUser.role === "admin") return "/admin";
    if (currentUser.role === "vendor") return "/vendor";
    if (currentUser.role === "buyer") return "/buyer";
    return "/";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/product-search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for medical supplies..."
              className="pl-12 py-6 text-lg"
            />
          </div>
        </form>

        <h2 className="text-2xl font-bold mb-6">
          Search Results for "{query}"
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto size-16 text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No products found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Try searching for different terms
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="group cursor-pointer"
                onClick={() => {
                  const categorySlug = product.categorySlug || "unknown";
                  const productSlug = product.slug || product._id;
                  navigate(`/product/${categorySlug}/${productSlug}`);
                }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="size-20 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {product.categoryName}
                    </p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* RFQ Chatbot */}
      <RFQChatbot />
    </div>
  );
}