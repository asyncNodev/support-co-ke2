import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useUser } from "@/hooks/use-auth.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const analytics = useQuery(api.analytics.getAnalytics);

  if (authLoading || currentUser === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please Sign In</h1>
          <p className="text-muted-foreground">You need to sign in to access the admin dashboard</p>
          <SignInButton />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    navigate("/register");
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Complete Registration</h1>
          <p className="text-muted-foreground">Redirecting to registration...</p>
        </div>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">This page is only accessible to administrators</p>
          <Link to="/">
            <Button>Go Home</Button>
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
          <nav className="flex items-center gap-4">
            <Link to="/browse">
              <Button variant="ghost">Browse Products</Button>
            </Link>
            <SignInButton />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage products, users, and view platform analytics</p>
        </div>

        {/* Analytics Stats */}
        {analytics ? (
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{analytics.visitors.total}</CardTitle>
                <CardDescription>Total Visitors (7 days)</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{analytics.rfqs.total}</CardTitle>
                <CardDescription>RFQs Sent</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{analytics.quotations.total}</CardTitle>
                <CardDescription>Quotations Sent</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{analytics.quotations.opened}</CardTitle>
                <CardDescription>Quotations Opened</CardDescription>
              </CardHeader>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        )}

        {/* Top Categories */}
        {analytics && analytics.categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
              <CardDescription>Most requested product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.categories.map((cat: { categoryName: string; productCount: number; rfqCount: number }, index: number) => (
                  <div key={cat.categoryName} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{cat.categoryName}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{cat.rfqCount} requests</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Products & Categories</CardTitle>
              <CardDescription>Manage the product catalog</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Manage Products
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>User Verification</CardTitle>
              <CardDescription>Approve vendors and buyers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Manage Users
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}