import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { SignInButton } from "@/components/ui/signin.tsx";

export default function ProductSearch() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const allProducts = useQuery(api.products.getProducts, {});
  const currentUser = useQuery(api.users.getCurrentUser, {});

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold hover:text-primary">
            Medical Supplies Kenya
          </Link>
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

      {/* Results */}
      <div className="container mx-auto px-4 py-12">
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
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="group"
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
