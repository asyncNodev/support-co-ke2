"use node";

import bcrypt from "bcryptjs";
import { v } from "convex/values";
import jwt from "jsonwebtoken";

import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import type { ActionCtx, MutationCtx } from "./_generated/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JWTPayload {
  userId: Id<"users">;
  email: string;
}

function generateJWT({ userId, email }: JWTPayload): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
}

interface RegisterResponse {
  userId: Id<"users">;
  success: boolean;
}

export const register = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx: ActionCtx, args): Promise<RegisterResponse> => {
    // Check if email already exists
    const existingUser = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: args.email,
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(args.password, 10);

    // Create user with verified: false
    const userId = (await ctx.runMutation(internal.auth.createUser, {
      email: args.email,
      passwordHash,
      name: args.name,
      // verified: false,
    })) as Id<"users">;

    // Generate verification code
    const code = await ctx.runMutation(internal.auth.createVerificationCode, {
      userId,
    });

    // Send verification email
    await ctx.runAction(api.emailActions.sendVerificationEmail, {
      email: args.email,
      code,
    });

    return { userId, success: true };
  },
});

interface LoginResponse {
  token: string;
  user: any; // Consider creating a proper User interface
}

export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
    isGoogle: v.boolean(),
  },
  handler: async (ctx: ActionCtx, args): Promise<LoginResponse> => {
    console.log("IsGoogle:", args.isGoogle);
    const user = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: args.email,
    });
    if (!user) throw new Error("Incorrect email");
    let valid = await bcrypt.compare(args.password, user.passwordHash);
    if (args.isGoogle) valid = true;
    if (!valid) throw new Error("Incorrect password");
    const token = generateJWT({ userId: user._id, email: user.email });
    const { passwordHash, ...userWithoutPassword } = user as any;
    return { token, user: userWithoutPassword };
  },
});

interface ValidateTokenResponse {
  user: Omit<any, "passwordHash">; // Replace 'any' with your User interface
}

export const validateToken = action({
  args: { token: v.string() },
  handler: async (
    ctx: ActionCtx,
    { token },
  ): Promise<ValidateTokenResponse> => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      // Fetch user from DB
      const user = await ctx.runQuery(internal.auth.getUserById, {
        userId: decoded.userId,
      });
      if (!user) throw new Error("User not found");
      // Do not return sensitive fields like passwordHash
      const { passwordHash, ...safeUser } = user as any;
      return { user: safeUser };
    } catch (err) {
      throw new Error("Invalid token");
    }
  },
});

// Make sure to run `npx convex dev` or `npx convex deploy` after adding or updating actions.
