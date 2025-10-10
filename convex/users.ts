import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Update vendor quotation preference
export const updateQuotationPreference = mutation({
  args: {
    preference: v.union(
      v.literal("registered_hospitals_only"),
      v.literal("registered_hospitals_and_vendors"),
      v.literal("all_registered_and_unregistered")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    if (user.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can update quotation preferences",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(user._id, {
      quotationPreference: args.preference,
    });

    return { success: true };
  },
});

// Get current user profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    return user;
  },
});

// Update current user profile
export const updateCurrentUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) {
      // Create user if doesn't exist
      const userId = await ctx.db.insert("users", {
        authId: identity.tokenIdentifier,
        email: args.email || identity.email || "unknown@example.com",
        name: args.name || identity.name || "Unknown User",
        role: "buyer",
        verified: true,
        registeredAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    } else {
      // Update existing user
      const updates: { name?: string; email?: string } = {};
      if (args.name) updates.name = args.name;
      if (args.email) updates.email = args.email;
      
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);
      }
    }

    return user;
  },
});
