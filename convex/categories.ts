import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all categories
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

// Create category (admin only)
export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can create categories",
        code: "FORBIDDEN",
      });
    }

    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      icon: args.icon,
      createdAt: Date.now(),
    });

    return categoryId;
  },
});

// Update category (admin only)
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can update categories",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.categoryId, {
      name: args.name,
      description: args.description,
      icon: args.icon,
    });

    return null;
  },
});

// Delete category (admin only)
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can delete categories",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.categoryId);

    return null;
  },
});
