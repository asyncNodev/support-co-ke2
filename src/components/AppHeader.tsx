import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Bell, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function AppHeader() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const siteSettings = useQuery(api.siteSettings.getSiteSettings, {});
  
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

  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src={siteSettings?.logoUrl || "https://cdn.hercules.app/file_bqE3zk4Ry0XmWJeiuCRNP3vv"} 
              alt={siteSettings?.siteName || "Medical Supplies Kenya"} 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold">{siteSettings?.siteName || "Medical Supplies Kenya"}</h1>
              <p className="text-xs text-muted-foreground">{siteSettings?.tagline || "Connecting Hospitals with Verified Suppliers"}</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            {isAuthenticated && currentUser && (
              <>
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

                <Button variant="outline" asChild>
                  <Link to={getDashboardLink()}>Dashboard</Link>
                </Button>
              </>
            )}
            <SignInButton />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className={siteSettings?.workflowBgColor || "bg-muted/30"}>
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-center font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Hospitals */}
            <div>
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center text-xs">
                  1
                </span>
                For Hospitals
              </h3>
              <div className={`flex flex-wrap items-center gap-2 text-${siteSettings?.workflowTextSize || "sm"}`}>
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {siteSettings?.hospitalStep1 || "Search Products"}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {siteSettings?.hospitalStep2 || "Create RFQ"}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {siteSettings?.hospitalStep3 || "Receive Quotations"}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium">
                  {siteSettings?.hospitalStep4 || "Choose Best Vendor"}
                </span>
              </div>
            </div>

            {/* For Vendors */}
            <div>
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center text-xs">
                  2
                </span>
                For Vendors
              </h3>
              <div className={`flex flex-wrap items-center gap-2 text-${siteSettings?.workflowTextSize || "sm"}`}>
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {siteSettings?.vendorStep1 || "Upload Products"}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {siteSettings?.vendorStep2 || "Receive RFQ Alerts"}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {siteSettings?.vendorStep3 || "Submit Quotations"}
                </span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium">
                  {siteSettings?.vendorStep4 || "Win Orders"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}