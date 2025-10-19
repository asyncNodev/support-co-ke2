# Custom Authentication Setup Guide

This guide explains how to replace Hercules Auth with your own authentication system if you download the code and host it elsewhere.

## ⚠️ Important Notice

This guide is **ONLY** applicable if you:
1. Download the complete source code from Hercules (requires Business plan)
2. Host the application on your own infrastructure
3. Are no longer using the Hercules platform

**If you're still hosting on Hercules, you MUST use Hercules Auth - custom authentication is not supported on the platform.**

---

## Overview

The current application uses Hercules Auth (OIDC-based authentication). To implement custom authentication, you'll need to:

1. Remove Hercules Auth dependencies
2. Implement your custom authentication system
3. Update all auth-related components
4. Modify Convex backend authentication

---

## Step 1: Remove Hercules Auth Dependencies

### 1.1 Remove NPM Packages

```bash
pnpm remove oidc-client-ts react-oidc-context
```

### 1.2 Remove Auth Configuration Files

Delete or modify these files:
- `convex/auth.config.js`
- Remove OIDC environment variables from `.env` or your hosting environment

---

## Step 2: Choose Your Authentication Method

### Option A: Email/Password with Custom Backend

Implement traditional email/password authentication using Convex mutations.

### Option B: Third-Party Auth Providers

Use services like:
- **Clerk** (clerk.com) - Easy integration, similar to current flow
- **Auth0** (auth0.com) - Enterprise-grade
- **Supabase Auth** (supabase.com) - Open source
- **Firebase Auth** (firebase.google.com) - Google's solution

### Option C: JWT-Based Custom Auth

Build your own JWT-based authentication system.

---

## Step 3: Implementing Email/Password Authentication

This section shows how to implement a basic email/password system.

### 3.1 Update Convex Schema

Add password field to users table:

```typescript
// convex/schema.ts
users: defineTable({
  email: v.string(),
  passwordHash: v.string(), // Store hashed passwords only!
  name: v.string(),
  role: v.union(v.literal("admin"), v.literal("vendor"), v.literal("buyer")),
  // ... other fields
}).index("by_email", ["email"]),
```

### 3.2 Create Auth Mutations

```typescript
// convex/auth.ts
"use node";

import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import bcrypt from "bcryptjs"; // Add to package.json

// Register new user
export const register = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(v.literal("vendor"), v.literal("buyer")),
  },
  handler: async (ctx, args) => {
    // Hash password
    const passwordHash = await bcrypt.hash(args.password, 10);
    
    // Create user
    await ctx.runMutation(internal.auth.createUser, {
      email: args.email,
      passwordHash,
      name: args.name,
      role: args.role,
    });
    
    return { success: true };
  },
});

// Login
export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: args.email,
    });
    
    if (!user) {
      throw new Error("Invalid credentials");
    }
    
    // Verify password
    const valid = await bcrypt.compare(args.password, user.passwordHash);
    
    if (!valid) {
      throw new Error("Invalid credentials");
    }
    
    // Generate JWT token (you'll need to implement this)
    const token = generateJWT({ userId: user._id, email: user.email });
    
    return { token, user };
  },
});

// Internal mutations
export const createUser = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.union(v.literal("vendor"), v.literal("buyer")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      ...args,
      status: "pending",
      verified: false,
      registeredAt: Date.now(),
    });
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});
```

### 3.3 Install Required Packages

```bash
pnpm add bcryptjs jsonwebtoken
pnpm add -D @types/bcryptjs @types/jsonwebtoken
```

---

## Step 4: Update Frontend Authentication

### 4.1 Create New Auth Context

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
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

  const login = async (email: string, password: string) => {
    const result = await convex.action(api.auth.login, { email, password });
    localStorage.setItem("authToken", result.token);
    setUser(result.user);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
```

### 4.2 Replace AuthProvider in App

```typescript
// src/components/providers/default.tsx
import { AuthProvider } from "@/contexts/AuthContext";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <QueryClientProvider>
          <TooltipProvider>
            <ThemeProvider attribute="class" defaultTheme="system">
              <Toaster />
              {children}
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
```

### 4.3 Create Login Component

```typescript
// src/components/LoginForm.tsx
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success("Logged in successfully");
    } catch (error) {
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
```

### 4.4 Update Sign In Button

```typescript
// src/components/ui/signin.tsx
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, logout } = useAuth();

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
```

---

## Step 5: Update Convex Backend Authentication

### 5.1 Modify Auth Verification

Replace OIDC token verification with JWT verification:

```typescript
// Add to all protected queries/mutations
const token = ctx.auth.getUserIdentity(); // This needs to be replaced

// New approach - pass token in headers and verify
async function verifyAuth(ctx: QueryCtx | MutationCtx) {
  const token = ctx.auth.getUserIdentity(); // You'll need to handle JWT verification
  
  if (!token) {
    throw new ConvexError({
      message: "User not authenticated",
      code: "UNAUTHENTICATED",
    });
  }
  
  return token;
}
```

### 5.2 Update All Protected Endpoints

Search and replace all instances of:
```typescript
const identity = await ctx.auth.getUserIdentity();
```

With your new authentication verification method.

---

## Step 6: Email System Setup

To send login credentials via email, you'll need an email service.

### Option A: Resend (Recommended)

```bash
pnpm add resend
```

```typescript
// convex/emails.ts
"use node";

import { Resend } from "resend";
import { action } from "./_generated/server";
import { v } from "convex/values";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendLoginCredentials = action({
  args: {
    email: v.string(),
    name: v.string(),
    tempPassword: v.string(),
  },
  handler: async (ctx, args) => {
    await resend.emails.send({
      from: "supply.co.ke <noreply@supply.co.ke>",
      to: args.email,
      subject: "Your supply.co.ke Login Credentials",
      html: `
        <h2>Welcome to supply.co.ke!</h2>
        <p>Hello ${args.name},</p>
        <p>Your account has been approved. Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${args.email}</li>
          <li><strong>Temporary Password:</strong> ${args.tempPassword}</li>
        </ul>
        <p>Please change your password after logging in.</p>
        <p><a href="https://supply.co.ke/login">Login Now</a></p>
      `,
    });
  },
});
```

### Option B: Other Email Services

- **SendGrid**
- **Mailgun**
- **AWS SES**
- **Postmark**

---

## Step 7: Password Reset Flow

### 7.1 Backend Implementation

```typescript
// convex/auth.ts
export const requestPasswordReset = action({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: args.email,
    });
    
    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }
    
    // Generate reset token
    const resetToken = generateResetToken();
    
    // Store token with expiry
    await ctx.runMutation(internal.auth.saveResetToken, {
      userId: user._id,
      token: resetToken,
      expiresAt: Date.now() + 3600000, // 1 hour
    });
    
    // Send email with reset link
    await ctx.runAction(api.emails.sendPasswordReset, {
      email: args.email,
      resetToken,
    });
    
    return { success: true };
  },
});

export const resetPassword = action({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify token and update password
    // Implementation details...
  },
});
```

---

## Step 8: Admin Password Generation

When admin approves a user, generate and email temporary password:

```typescript
// convex/users.ts
export const approveUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const admin = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();
    
    if (!admin || admin.role !== "admin") {
      throw new Error("Not authorized");
    }
    
    // Generate temporary password
    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);
    
    // Update user
    await ctx.db.patch(args.userId, {
      status: "approved",
      passwordHash,
    });
    
    const user = await ctx.db.get(args.userId);
    
    // Send credentials via email
    await ctx.scheduler.runAfter(0, api.emails.sendLoginCredentials, {
      email: user!.email,
      name: user!.name,
      tempPassword,
    });
    
    return { success: true };
  },
});

function generateTemporaryPassword(): string {
  // Generate secure random password
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
```

---

## Step 9: Testing Checklist

After implementing custom authentication, test:

- [ ] User registration works
- [ ] Login with correct credentials works
- [ ] Login with incorrect credentials fails appropriately
- [ ] Logout clears session
- [ ] Protected routes redirect unauthenticated users
- [ ] Admin approval sends email with credentials
- [ ] Password reset flow works
- [ ] JWT tokens expire correctly
- [ ] Password hashing is secure (never store plain text!)
- [ ] Email delivery is reliable

---

## Security Best Practices

### 1. Password Security
```typescript
// Use bcrypt with appropriate rounds
const saltRounds = 10;
const hash = await bcrypt.hash(password, saltRounds);
```

### 2. JWT Token Security
```typescript
// Use strong secret, set appropriate expiry
const token = jwt.sign(
  { userId, email },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
```

### 3. Rate Limiting
Implement rate limiting on login attempts to prevent brute force attacks.

### 4. HTTPS Only
Always use HTTPS in production. Never transmit credentials over HTTP.

### 5. Environment Variables
Store all secrets in environment variables:
```bash
JWT_SECRET=your-super-secret-key
RESEND_API_KEY=re_xxxxx
DATABASE_URL=your-database-url
```

### 6. Password Requirements
Enforce strong password requirements:
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, special characters

---

## Additional Features to Consider

### 1. Two-Factor Authentication (2FA)
Implement TOTP-based 2FA using libraries like `speakeasy`

### 2. Session Management
Track active sessions and allow users to view/revoke them

### 3. Login History
Log all login attempts for security auditing

### 4. Account Lockout
Lock accounts after repeated failed login attempts

### 5. Email Verification
Require email verification before account activation

---

## Migration from Hercules Auth

If you have existing users on Hercules Auth:

1. Export user data from Hercules Database
2. Create migration script to:
   - Generate temporary passwords for all users
   - Email new credentials to all users
   - Mark accounts for password reset on first login
3. Run migration during maintenance window
4. Provide clear communication to users about the change

---

## Support and Resources

### Documentation
- Convex Auth: https://docs.convex.dev/auth
- JWT.io: https://jwt.io/
- OWASP Auth Guide: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

### Libraries
- bcryptjs: https://github.com/dcodeIO/bcrypt.js
- jsonwebtoken: https://github.com/auth0/node-jsonwebtoken
- Resend: https://resend.com/docs

---

## Troubleshooting

### Issue: "Invalid token"
- Check JWT secret is consistent
- Verify token hasn't expired
- Ensure token is being passed correctly in headers

### Issue: Emails not sending
- Verify email service API key
- Check spam folders
- Review email service logs

### Issue: Password hash comparison fails
- Ensure same bcrypt version is used
- Verify salt rounds match
- Check password is being hashed before comparison

---

## Conclusion

Replacing Hercules Auth with custom authentication requires significant work but gives you complete control over the authentication flow. Follow security best practices and test thoroughly before deploying to production.

For simpler integration, consider using a third-party service like Clerk or Auth0 instead of building everything from scratch.

---

**Last Updated:** October 2025  
**Version:** 1.0  
**Author:** supply.co.ke Development Team
