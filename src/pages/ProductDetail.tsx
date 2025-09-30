import { Link, useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { ArrowLeft, ShoppingCart, Zap } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = useQuery(api.products.getProduct, id ? { productId: id as Id<"products"> } : "skip");

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Zap className="size-8 text-primary" />
              <span className="text-2xl font-bold">QuickQuote B2B</span>
            </Link>
            <SignInButton />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <Link to="/browse">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Zap className="size-8 text-primary" />
            <span className="text-2xl font-bold">QuickQuote B2B</span>
          </Link>
          <SignInButton />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Link to="/browse">
          <Button variant="ghost" className="gap-2 mb-6">
            <ArrowLeft className="size-4" />
            Back to Products
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              {product.category && (
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {product.category.name}
                </Badge>
              )}
            </div>

            {product.sku && (
              <div>
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {product.specifications && (
              <div>
                <h3 className="font-semibold mb-2">Specifications</h3>
                <p className="text-muted-foreground whitespace-pre-line">{product.specifications}</p>
              </div>
            )}

            <Link to="/browse">
              <Button size="lg" className="w-full gap-2">
                <ShoppingCart className="size-5" />
                Add to RFQ Cart
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
