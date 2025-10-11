import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { ShoppingCart, Zap, Search, Package, Camera } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { addToRFQCart, getRFQCart } from "@/lib/rfq-cart";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useRef } from "react";
import AppHeader from "@/components/AppHeader";

export default function BrowseProducts() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useQuery(api.categories.getCategories);
  const products = useQuery(api.products.getProducts, {
    categoryId: selectedCategory,
  });

  const cart = getRFQCart();

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const handleAddToCart = (productId: Id<"products">, productName: string) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to RFQ");
      return;
    }
    addToRFQCart(productId, productName);
    toast.success(`${productName} added to RFQ cart`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    toast.success("Image uploaded! Showing all products for visual comparison");
    navigate(`/product-search?image=true`);
  };

  const handleImageSearchClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and filters */}
        <div className="border-b bg-muted/50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-16"
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
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={handleImageSearchClick}
                >
                  <Camera className="size-5 text-muted-foreground" />
                </Button>
              </div>
              <Button
                variant={selectedCategory === undefined ? "default" : "outline"}
                onClick={() => setSelectedCategory(undefined)}
              >
                All Categories
              </Button>
            </div>

            {/* Category filters */}
            {categories && categories.length > 0 && (
              <div className="flex gap-2 mt-4 flex-wrap">
                {categories.map((category) => (
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
            )}
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
                  {selectedCategory
                    ? "No products in this category"
                    : "No products available"}
                </EmptyStateDescription>
              </EmptyStateContent>
            </EmptyState>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product._id} className="overflow-hidden flex flex-col">
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
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <Badge variant="secondary" className="mb-2 w-fit">
                      {product.categoryName}
                    </Badge>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {product.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/product/${product.categorySlug}/${product.slug}`)}
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
    </div>
  );
}