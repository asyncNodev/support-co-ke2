import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Search } from "lucide-react";

export default function ProductSearch() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const products = useQuery(api.products.getProducts, {});

  // Filter products by search query
  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  const isPending = products === undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            Medical Supplies Kenya
          </Link>
          <SignInButton />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Query Display */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            Showing results for: <span className="font-semibold">{query}</span>
          </p>
        </div>

        {/* Results */}
        {isPending ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground text-6xl">🏥</div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  {/* Submit Request Button */}
                  <Link to={`/product/${product._id}`}>
                    <Button className="w-full" size="lg">
                      Submit Your Request for Quotation
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="size-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No results found</h2>
            <p className="text-muted-foreground mb-6">
              Try searching with different terms
            </p>
            <Link to="/">
              <Button>Go Back Home</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
