import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth.ts";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated, signinRedirect } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const products = useQuery(api.products.getProducts, {});
  
  // Get notifications for signed-in users
  const notifications = useQuery(
    api.notifications.getMyNotifications,
    isAuthenticated ? {} : "skip"
  );

  const getDashboardLink = () => {
    if (!currentUser) return "/";
    if (currentUser.role === "admin") return "/admin";
    if (currentUser.role === "vendor") return "/vendor";
    if (currentUser.role === "buyer") return "/buyer";
    return "/";
  };

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleEnterAsHospital = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in first");
      signinRedirect();
      return;
    }
    if (!currentUser) {
      navigate("/register");
      return;
    }
    navigate("/buyer");
  };

  const handleEnterAsVendor = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in first");
      signinRedirect();
      return;
    }
    if (!currentUser) {
      navigate("/register");
      return;
    }
    navigate("/vendor");
  };

  const suggestions = products?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5) || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/product-search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (productName: string) => {
    setSearchQuery(productName);
    setShowSuggestions(false);
    navigate(`/product-search?q=${encodeURIComponent(productName)}`);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            Medical Supplies Kenya
          </Link>
          
          <div className="flex items-center gap-4">
            {isAuthenticated && currentUser && (
              <>
                {/* Notifications Bell */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="size-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        {unreadCount} unread
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {!notifications || notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-4 border-b hover:bg-muted/50 cursor-pointer ${
                              !notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                            }`}
                            onClick={() => navigate(getDashboardLink())}
                          >
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                            </p>
                          </div>
                        ))
                      )}
                      {notifications && notifications.length > 5 && (
                        <div className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(getDashboardLink())}
                          >
                            View all notifications
                          </Button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Dashboard Link */}
                <Button variant="outline" asChild>
                  <Link to={getDashboardLink()}>Dashboard</Link>
                </Button>
              </>
            )}
            <SignInButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Find Medical Equipment & Supplies
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Search and get quotations from verified Kenyan suppliers
          </p>

          <form onSubmit={handleSearch} className="w-full mb-8">
            <div ref={searchRef} className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-6 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
                placeholder="Search for medical supplies (e.g. Hospital Bed, Wheelchair)..."
                className="w-full pl-16 pr-6 py-6 text-lg rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />

              {showSuggestions && suggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-background border-2 border-border rounded-xl shadow-lg max-h-96 overflow-y-auto">
                  {suggestions.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleSuggestionClick(product.name)}
                      className="w-full px-6 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <Search className="size-4 text-muted-foreground" />
                      <span>{product.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Only show entry buttons if NOT signed in */}
          {!isAuthenticated && (
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <Button
                size="lg"
                variant="default"
                onClick={handleEnterAsHospital}
                className="px-8 py-6 text-lg"
              >
                Enter as Hospital
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleEnterAsVendor}
                className="px-8 py-6 text-lg"
              >
                Enter as Vendor
              </Button>
            </div>
          )}
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