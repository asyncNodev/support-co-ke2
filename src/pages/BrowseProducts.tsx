import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { ShoppingCart, Zap, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function BrowseProducts() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | null>(null);
  const [rfqCart, setRfqCart] = useState<Array<{ productId: Id<"products">; name: string; quantity: number }>>([]);

  const categories = useQuery(api.categories.getCategories);
  const products = useQuery(api.products.getProducts, selectedCategory ? { categoryId: selectedCategory } : {});

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToRFQCart = (productId: Id<"products">, name: string) => {
    const existing = rfqCart.find((item) => item.productId === productId);
    if (existing) {
      setRfqCart(
        rfqCart.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setRfqCart([...rfqCart, { productId, name, quantity: 1 }]);
    }
  };

  const removeFromRFQCart = (productId: Id<"products">) => {
    setRfqCart(rfqCart.filter((item) => item.productId !== productId));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="size-8 text-primary" />
            <span className="text-2xl font-bold">QuickQuote B2B</span>
          </Link>
          <nav className="flex items-center gap-4">
            <div className="relative">
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="size-4" />
                RFQ Cart {rfqCart.length > 0 && `(${rfqCart.length})`}
              </Button>
            </div>
            <SignInButton />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Products</h1>
          <p className="text-muted-foreground">Select products to add to your RFQ cart</p>
        </div>

        {/* Search and Categories */}
        <div className="grid md:grid-cols-[250px_1fr] gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Search</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Categories</h3>
              <div className="space-y-2">
                <Button
                  variant={selectedCategory === null ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Button>
                {categories === undefined ? (
                  Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                ) : (
                  categories?.map((category) => (
                    <Button
                      key={category._id}
                      variant={selectedCategory === category._id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category._id)}
                    >
                      {category.name}
                    </Button>
                  ))
                )}
              </div>
            </div>

            {/* RFQ Cart */}
            {rfqCart.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">RFQ Cart</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {rfqCart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.name}</p>
                        <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromRFQCart(item.productId)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <Link to="/buyer">
                  <Button className="w-full">Submit RFQ</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Products Grid */}
          <div>
            {products === undefined ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-6 w-3/4 mt-4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : filteredProducts && filteredProducts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product._id}>
                    <CardHeader>
                      {product.image && (
                        <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                      <CardDescription>
                        {product.category?.name && <Badge variant="secondary">{product.category.name}</Badge>}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">{product.description}</p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Link to={`/product/${product._id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button onClick={() => addToRFQCart(product._id, product.name)} className="gap-2">
                        <ShoppingCart className="size-4" />
                        Add
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
