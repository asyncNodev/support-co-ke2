import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, ArrowRight } from "lucide-react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useNavigate } from "react-router-dom";

export default function AppHeader() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const siteSettings = useQuery(api.siteSettings.getSiteSettings, {});
  
  const unreadNotifications = useQuery(
    api.notifications.getMyNotifications,
    isAuthenticated ? {} : "skip"
  );

  const unreadCount = unreadNotifications?.filter((n) => !n.read).length || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        {/* Main Row: Logo and Workflows on Same Line */}
        <div className="flex items-center justify-between gap-8 flex-wrap">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src={siteSettings?.logoUrl || "https://cdn.hercules.app/file_bqE3zk4Ry0XmWJeiuCRNP3vv"}
              alt={siteSettings?.siteName || "Medical Supplies Kenya"}
              className="h-28 w-auto"
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold">{siteSettings?.siteName || "Medical Supplies Kenya"}</h1>
              <p className="text-xs text-muted-foreground">{siteSettings?.tagline || "Your trusted medical equipment marketplace"}</p>
            </div>
          </Link>

          {/* Workflows Section - On Same Line */}
          <div className="flex items-center gap-6 flex-1 justify-center flex-wrap">
            {/* Hospital Workflow */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold text-${siteSettings?.workflowTextSize || "sm"} whitespace-nowrap`}>For Hospitals:</span>
              <span className={`text-${siteSettings?.workflowTextSize || "sm"}`}>
                {siteSettings?.hospitalStep1 || "Search Products"}
              </span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className={`text-${siteSettings?.workflowTextSize || "sm"}`}>
                {siteSettings?.hospitalStep2 || "Create RFQ"}
              </span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className={`text-${siteSettings?.workflowTextSize || "sm"}`}>
                {siteSettings?.hospitalStep3 || "Receive Quotations"}
              </span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className={`text-${siteSettings?.workflowTextSize || "sm"} font-bold text-primary`}>
                {siteSettings?.hospitalStep4 || "Choose Best Vendor"}
              </span>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-border" />

            {/* Vendor Workflow */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold text-${siteSettings?.workflowTextSize || "sm"} whitespace-nowrap`}>For Vendors:</span>
              <span className={`text-${siteSettings?.workflowTextSize || "sm"}`}>
                {siteSettings?.vendorStep1 || "Upload Products"}
              </span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className={`text-${siteSettings?.workflowTextSize || "sm"}`}>
                {siteSettings?.vendorStep2 || "Receive RFQ Alerts"}
              </span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className={`text-${siteSettings?.workflowTextSize || "sm"}`}>
                {siteSettings?.vendorStep3 || "Submit Quotations"}
              </span>
              <ArrowRight className="h-3 w-3 text-primary" />
              <span className={`text-${siteSettings?.workflowTextSize || "sm"} font-bold text-primary`}>
                {siteSettings?.vendorStep4 || "Win Orders"}
              </span>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4">
            <Unauthenticated>
              <SignInButton />
            </Unauthenticated>
            <Authenticated>
              {currentUser && (
                <>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (currentUser.role === "admin") navigate("/admin");
                      else if (currentUser.role === "vendor") navigate("/vendor");
                      else if (currentUser.role === "buyer") navigate("/buyer");
                    }}
                  >
                    Dashboard
                  </Button>
                </>
              )}
            </Authenticated>
          </div>
        </div>
      </div>
    </header>
  );
}