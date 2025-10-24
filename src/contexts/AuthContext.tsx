import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";

import { convex } from "@/lib/convex";

// import { action } from "../../convex/_generated/server";

// Note: Ensure to handle token expiration and refreshing as needed.

interface User {
  _id: string;
  authId: string;
  email: string;
  name: string;
  role: "admin" | "vendor" | "buyer";
  verified: boolean;
  status?: "pending" | "approved" | "rejected";
  avatar?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  cr12Certificate?: string;
  latitude?: number;
  longitude?: number;
  categories?: string[];
  registeredAt: number;
  quotationPreference?:
    | "registered_hospitals_only"
    | "registered_all"
    | "all_including_guests";
  whatsappNotifications?: boolean;
  emailNotifications?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  signinRedirect: () => void; // Add this line
  signup: (email: string, password: string, name: string) => Promise<void>; // Add this line
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and validate
    const token = localStorage.getItem("authToken");
    if (token) {
      // Validate token and fetch user
      validateAndFetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  // useEffect(() => {
  //   // Listen for Convex reconnect events if possible
  //   // Or set up a timer to revalidate every X seconds
  //   const interval = setInterval(() => {
  //     const token = localStorage.getItem("authToken");
  //     if (token) {
  //       validateAndFetchUser(token);
  //     }
  //   }, 10000); // every 10 seconds

  //   return () => clearInterval(interval);
  // }, []);

  const signinRedirect = () => {
    // Redirect to your login page or external auth provider
    window.location.href = "/login";
  };

  const registerRedirect = () => {
    window.location.href = "/register";
  };

  async function validateAndFetchUser(token: string) {
    console.log("Validating token:", token);
    try {
      // Make sure api.auth.validateToken exists and is exported from your Convex backend
      // Make sure validateToken is defined in your api.authActions
      const result = await convex.action(api.authActions.validateToken, {
        token,
      });
      console.log("Validated user:", result);
      setUser(result.user as User);
    } catch {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    try {
      // First register the user
      const registerResult = await convex.action(api.authActions.register, {
        email,
        password,
        name,
      });

      if (!registerResult.success) {
        throw new Error("Registration failed");
      }

      // After successful registration, log the user in
      const loginResult = await convex.action(api.authActions.login, {
        email,
        password,
      });

      // Store the token and user data
      localStorage.setItem("authToken", loginResult.token);
      localStorage.setItem("user", JSON.stringify(loginResult.user));
      setUser(loginResult.user as User);
    } catch (error: any) {
      console.error("Signup error:", error);
      throw new Error(error.message || "Failed to create account");
    }
  };

  const login = async (email: string, password: string) => {
    const result = await convex.action(api.authActions.login, {
      email,
      password,
    });
    localStorage.setItem("authToken", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    setUser(result.user);
    console.log("Logged in user:", result.user);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: Boolean(user && user._id),
        signinRedirect,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Note: Ensure to handle token expiration and refreshing as needed.
