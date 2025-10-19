"use node";

import bcrypt from "bcryptjs";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";

export const createVerifiedBuyer: ReturnType<typeof action> = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: args.email,
    });

    if (existingUser) {
      return { success: false, message: "User already exists with this email" };
    }

    // Hash a default password
    const defaultPassword = "testpassword";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Insert user using an internal mutation
    const userId = await ctx.runMutation(internal.auth.createUser, {
      email: args.email,
      passwordHash,
      name: args.name || "Test Buyer",
      // role: "buyer",
    });

    return {
      success: true,
      message: `Verified buyer created with email ${args.email}`,
      userId,
    };
  },
});
