import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/LoginForm";

export function SignInButton() {
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    // window.alert("Auth state changed");
    console.log("Auth state changed:", { user, isAuthenticated });
  }, [user, isAuthenticated]);

  // if (isLoading) {
  //   return null;ß
  // }

  if (user) {
    return <Button onClick={logout}>Sign Out</Button>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
        </DialogHeader>
        <LoginForm />
      </DialogContent>
    </Dialog>
  );
}
