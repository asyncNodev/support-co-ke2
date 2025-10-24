import { useEffect } from "react";
import type { User } from "@/contexts/AuthContext";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import NotificationSettings from "@/components/NotificationSettings";

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth() as {
    user: User | null;
    isAuthenticated: boolean;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const getDashboardLink = () => {
    if (!user) return "/";
    if (user.role === "admin") return "/admin";
    if (user.role === "vendor") return "/vendor";
    if (user.role === "buyer") return "/buyer";
    return "/";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(getDashboardLink())}
            className="mr-4"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <span className="text-2xl font-bold">Notification Settings</span>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <NotificationSettings />
      </div>
    </div>
  );
}
