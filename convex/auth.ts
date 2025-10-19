import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

export const createUser = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    // role: v.union(v.literal("vendor"), v.literal("buyer")),
  },
  handler: async (ctx: any, args) => {
    return await ctx.db.insert("users", {
      ...args,
      authId: "test-authId",
      status: "pending",
      verified: false,
      registeredAt: Date.now(),
    });
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx: any, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();
  },
});

export const getUserById = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx: any, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const createVerificationCode = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 15 minutes from now
    const expiresAt = Date.now() + 15 * 60 * 1000;

    await ctx.db.insert("verificationCodes", {
      userId: args.userId,
      code,
      expiresAt,
      verified: false,
    });

    return code;
  },
});

export const verifyCode = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query("verificationCodes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId as Id<"users">))
      .order("desc")
      .first();

    if (!verification) {
      throw new Error("Verification code not found");
    }

    if (verification.expiresAt < Date.now()) {
      throw new Error("Verification code expired");
    }

    if (verification.code !== args.code) {
      throw new Error("Invalid verification code");
    }

    // Mark code as verified
    await ctx.db.patch(verification._id, { verified: true });

    // Update user's verified status
    await ctx.db.patch(args.userId as Id<"users">, { verified: true });

    return true;
  },
});
