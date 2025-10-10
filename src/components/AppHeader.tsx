import { Link, useNavigate } from "react-router-dom";
import { BellIcon, LayoutDashboardIcon, ArrowRightIcon } from "lucide-react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

export default function AppHeader() {
  const navigate = useNavigate();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const siteSettings = useQuery(api.siteSettings.getSiteSettings, {});

  const logoUrl = siteSettings?.logoUrl || "https://cdn.hercules.app/file_bqE3zk4Ry0XmWJeiuCRNP3vv";
  const logoSize = siteSettings?.logoSize || "h-28";
  const siteName = siteSettings?.siteName || "Medical Supplies Kenya";
  const tagline = siteSettings?.tagline || "Find Medical Equipment & Supplies";
  const workflowTextSize = siteSettings?.workflowTextSize || "text-sm";
  const workflowBgColor = siteSettings?.workflowBgColor || "bg-blue-50";

  const hospitalSteps = [
    siteSettings?.hospitalStep1 || "Search Products",
    siteSettings?.hospitalStep2 || "Create RFQ",
    siteSettings?.hospitalStep3 || "Receive Quotations",
    siteSettings?.hospitalStep4 || "Choose Best Vendor",
  ];

  const vendorSteps = [
    siteSettings?.vendorStep1 || "Upload Products",
    siteSettings?.vendorStep2 || "Receive RFQ Alerts",
    siteSettings?.vendorStep3 || "Submit Quotations",
    siteSettings?.vendorStep4 || "Win Orders",
  ];

  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Bar */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src={logoUrl} 
              alt={siteName} 
              className={`${logoSize} w-auto`}
            />
            <div>
              <h1 className="text-xl font-bold">{siteName}</h1>
              <p className="text-xs text-muted-foreground">{tagline}</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Authenticated>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (currentUser?.role === "admin") {
                    navigate("/admin");
                  } else if (currentUser?.role === "vendor") {
                    navigate("/vendor");
                  } else if (currentUser?.role === "buyer") {
                    navigate("/buyer");
                  }
                }}
              >
                <LayoutDashboardIcon className="size-4 mr-2" />
                Dashboard
              </Button>
            </Authenticated>
            <SignInButton />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-muted/30">
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
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {hospitalSteps[0]}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {hospitalSteps[1]}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {hospitalSteps[2]}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <span className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium">
                  {hospitalSteps[3]}
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
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {vendorSteps[0]}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {vendorSteps[1]}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                  {vendorSteps[2]}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <span className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium">
                  {vendorSteps[3]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}