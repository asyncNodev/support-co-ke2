import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowLeft } from "lucide-react";

export default function ProductSearch() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const allProducts = useQuery(api.products.getProducts, {});
  const isPending = allProducts === undefined;

  // Filter products by search query
  const products = allProducts?.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.description?.toLowerCase().includes(query.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
            <span>Back to Search</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            Showing results for "{query}"
          </p>
        </div>

        {isPending ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No products found for "{query}"</p>
            <Link to="/">
              <Button className="mt-4">Try Another Search</Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product._id} className="border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="aspect-square bg-muted flex items-center justify-center p-8">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <p className="font-semibold text-lg">{product.name}</p>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    SKU: {product.sku || "N/A"}
                  </p>

                  {/* Submit Request Button */}
                  <Link to={`/request-quotation/${product._id}`}>
                    <Button className="w-full" size="lg">
                      Submit Request for Quotation
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}