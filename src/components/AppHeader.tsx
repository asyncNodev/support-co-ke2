import { useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/ui/signin";
import { SignUpButton } from "@/components/ui/signup";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export default function AppHeader() {
  const navigate = useNavigate();
  const { user } = useAuth() as { user: any };
  const siteSettings = useQuery(api.siteSettings.getSiteSettings, {});
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Don't show logo until settings are loaded to prevent flash
  const isLoadingSettings = siteSettings === undefined;

  const logoUrl =
    siteSettings?.logoUrl ||
    "https://cdn.hercules.app/file_bqE3zk4Ry0XmWJeiuCRNP3vv";
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
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {isLoadingSettings ? (
              <Skeleton className={`${logoSize} w-32`} />
            ) : (
              <img
                src={logoUrl}
                alt={siteName}
                className={`${logoSize} w-auto`}
              />
            )}
            <div>
              <h1 className="text-xl font-bold">{siteName}</h1>
              <p className="text-xs text-muted-foreground">{tagline}</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Authenticated>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings/notifications")}
                title="Notification Settings"
              >
                <Bell className="size-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (user?.role === "admin") {
                    navigate("/admin");
                  } else if (user?.role === "vendor") {
                    navigate("/vendor");
                  } else if (user?.role === "buyer") {
                    navigate("/buyer");
                  }
                }}
              >
                <LayoutDashboard className="size-4 mr-2" />
                Dashboard
              </Button>
            </Authenticated>
            <SignUpButton />
            <SignInButton />
          </div>
        </div>
      </div>

      {/* How It Works - Collapsible */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4">
          <button
            onClick={() => setIsHowItWorksOpen(!isHowItWorksOpen)}
            className="w-full py-3 flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
          >
            <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              How It Works
            </span>
            {isHowItWorksOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>

          {isHowItWorksOpen && (
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isHowItWorksOpen
                  ? "max-h-screen opacity-100"
                  : "max-h-0 opacity-0",
              )}
            >
              <div className="pb-6 pt-2">
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
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                        {hospitalSteps[1]}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                        {hospitalSteps[2]}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" />
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
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                        {vendorSteps[1]}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <span className="bg-background px-3 py-2 rounded-lg border font-medium">
                        {vendorSteps[2]}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <span className="bg-primary text-primary-foreground px-3 py-2 rounded-lg font-medium">
                        {vendorSteps[3]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
