import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createVerifiedBuyer = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      return { success: false, message: "User already exists with this email" };
    }

    // Create verified buyer
    const userId = await ctx.db.insert("users", {
      authId: `test_${Date.now()}`,
      email: args.email,
      name: args.name || "Test Buyer",
      role: "buyer",
      verified: true,
      status: "approved",
      registeredAt: Date.now(),
    });

    return { 
      success: true, 
      message: `Verified buyer created with email ${args.email}`,
      userId 
    };
  },
});