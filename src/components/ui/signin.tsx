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

  if (user) {
    return <Button onClick={logout}>Sign Out</Button>;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Sign In</Button>
      </DialogTrigger>
      {/* Accessible description for screen readers */}
      <DialogContent aria-describedby="signin-dialog-desc">
        <p id="signin-dialog-desc" className="sr-only">
          Sign in to access your account and features.
        </p>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
        </DialogHeader>
        <LoginForm />
      </DialogContent>
    </Dialog>
  );
}
