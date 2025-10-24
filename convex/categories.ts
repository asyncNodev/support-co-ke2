import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

// Helper function to generate URL-friendly slugs
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars except spaces and hyphens
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(args.userId);

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can create categories",
        code: "FORBIDDEN",
      });
    }

    // Generate slug from name
    const slug = generateSlug(args.name);

    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      slug,
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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(args.userId);

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can update categories",
        code: "FORBIDDEN",
      });
    }

    // Generate new slug from updated name
    const slug = generateSlug(args.name);

    await ctx.db.patch(args.categoryId, {
      name: args.name,
      slug,
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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db.get(args.userId);

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
