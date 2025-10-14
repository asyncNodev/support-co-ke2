import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { ShoppingCart, Zap, Search, Package, SlidersHorizontal, TrendingUp, Star } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateContent,
} from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { addToRFQCart, getRFQCart } from "@/lib/rfq-cart";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import AppHeader from "@/components/AppHeader";
import RFQChatbot from "@/components/RFQChatbot";

type SortOption = "name-asc" | "name-desc" | "popular" | "newest";

export default function BrowseProducts() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [minQuotations, setMinQuotations] = useState(0);

  const categories = useQuery(api.categories.getCategories);
  const products = useQuery(api.products.getProducts, {
    categoryId: selectedCategory,
  });

  const cart = getRFQCart();

  // Filter and sort products
  let filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  // Apply minimum quotations filter
  if (minQuotations > 0) {
    filteredProducts = filteredProducts.filter((p) => (p.quotationCount || 0) >= minQuotations);
  }

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "popular":
        return (b.quotationCount || 0) - (a.quotationCount || 0);
      case "newest":
        return b._creationTime - a._creationTime;
      default:
        return 0;
    }
  });

  const handleAddToCart = (productId: Id<"products">, productName: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to RFQ");
      return;
    }
    addToRFQCart(productId, productName);
    toast.success(`${productName} added to RFQ cart`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(undefined);
    setSortBy("popular");
    setMinQuotations(0);
  };

  const activeFiltersCount = 
    (searchQuery ? 1 : 0) + 
    (selectedCategory ? 1 : 0) + 
    (minQuotations > 0 ? 1 : 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and filters */}
        <div className="border-b bg-muted/50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="size-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Products</SheetTitle>
                    <SheetDescription>
                      Refine your search with advanced filters
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    {/* Minimum Vendor Quotations */}
                    <div className="space-y-2">
                      <Label>Minimum Available Vendors</Label>
                      <Select 
                        value={minQuotations.toString()} 
                        onValueChange={(v) => setMinQuotations(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any</SelectItem>
                          <SelectItem value="3">At least 3 vendors</SelectItem>
                          <SelectItem value="5">At least 5 vendors</SelectItem>
                          <SelectItem value="10">At least 10 vendors</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        More vendors = better prices
                      </p>
                    </div>

                    {activeFiltersCount > 0 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={clearFilters}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Category filters */}
            <div className="flex gap-2 flex-wrap items-center">
              <Button
                variant={selectedCategory === undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(undefined)}
              >
                All Categories
              </Button>
              {categories && categories.map((category) => (
                <Button
                  key={category._id}
                  variant={selectedCategory === category._id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category._id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="container mx-auto px-4 py-8">
          {!products ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState>
              <EmptyStateIcon>
                <Package />
              </EmptyStateIcon>
              <EmptyStateContent>
                <EmptyStateTitle>No products found</EmptyStateTitle>
                <EmptyStateDescription>
                  Try adjusting your filters or search terms
                </EmptyStateDescription>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </EmptyStateContent>
            </EmptyState>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product._id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative bg-muted">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <Package className="size-16 text-muted-foreground" />
                      </div>
                    )}
                    {/* Popularity badge */}
                    {(product.quotationCount || 0) >= 5 && (
                      <Badge className="absolute top-2 right-2 gap-1">
                        <TrendingUp className="size-3" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <Badge variant="secondary" className="mb-2 w-fit">
                      {product.categoryName}
                    </Badge>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">
                      {product.description}
                    </p>
                    {/* Vendor count */}
                    {(product.quotationCount || 0) > 0 && (
                      <p className="text-xs text-muted-foreground mb-4">
                        {product.quotationCount} vendor{product.quotationCount !== 1 ? 's' : ''} available
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          const categorySlug = product.categorySlug || "unknown";
                          const productSlug = product.slug || product._id;
                          navigate(`/product/${categorySlug}/${productSlug}`);
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        onClick={() => handleAddToCart(product._id, product.name)}
                        className="gap-2"
                      >
                        <ShoppingCart className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* RFQ Chatbot */}
      <RFQChatbot />
    </div>
  );
}