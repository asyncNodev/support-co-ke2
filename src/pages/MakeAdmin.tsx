import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/hooks/use-auth.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";

export default function MakeAdmin() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useUser();
  const currentUser = useQuery(api.users.getCurrentUser);
  const makeAdmin = useMutation(api.users.makeUserAdmin);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleMakeAdmin = async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      await makeAdmin();
      setStatus("success");
      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to upgrade account");
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentUser.role === "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-500" />
              Already Admin
            </CardTitle>
            <CardDescription>You already have admin access</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/admin")} className="w-full">
              Go to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-primary" />
            Upgrade to Admin
          </CardTitle>
          <CardDescription>
            This is a demo utility to upgrade your account to admin role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Role:</span>
              <span className="font-medium capitalize">{currentUser.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{currentUser.email}</span>
            </div>
          </div>

          {status === "success" && (
            <Alert>
              <CheckCircle className="size-4" />
              <AlertDescription>
                Successfully upgraded to admin! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleMakeAdmin}
            disabled={status === "loading" || status === "success"}
            className="w-full"
          >
            {status === "loading" ? "Upgrading..." : "Make Me Admin"}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="w-full"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
