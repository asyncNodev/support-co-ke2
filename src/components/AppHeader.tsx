import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { SignInButton } from "@/components/ui/signin";
import { Authenticated, Unauthenticated } from "convex/react";

export default function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/supply-co-ke-logo.png"
              alt="supply.co.ke"
              className="h-10 w-auto"
            />
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm">
            <Link to="/browse" className="text-foreground hover:text-primary whitespace-nowrap">
              Browse
            </Link>
            <Link to="/vendors" className="text-foreground hover:text-primary whitespace-nowrap">
              Vendors
            </Link>
            <a href="#how-it-works" className="text-foreground hover:text-primary whitespace-nowrap">
              How It Works
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Authenticated>
              <SignInButton />
            </Authenticated>
            <Unauthenticated>
              <SignInButton />
            </Unauthenticated>
          </div>
        </div>
      </div>
    </header>
  );
}