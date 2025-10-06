import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

export const getProducts = query({
  args: {
    categoryId: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    let products;
    
    if (args.categoryId !== undefined) {
      const categoryId: Id<"categories"> = args.categoryId;
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
        .collect();
    } else {
      products = await ctx.db.query("products").collect();
    }
    
    // Get category names
    const productsWithCategory = await Promise.all(
      products.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        return {
          ...product,
          categoryName: category?.name ?? "Unknown",
        };
      })
    );
    
    return productsWithCategory;
  },
});

// Get single product
export const getProduct = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) {
      return null;
    }

    const category = await ctx.db.get(product.categoryId);
    return { ...product, category };
  },
});

// Create product (admin only)
export const createProduct = mutation({
  args: {
    name: v.string(),
    categoryId: v.id("categories"),
    description: v.string(),
    image: v.optional(v.string()),
    sku: v.optional(v.string()),
    specifications: v.optional(v.string()),
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
        message: "Only admins can create products",
        code: "FORBIDDEN",
      });
    }

    const productId = await ctx.db.insert("products", {
      name: args.name,
      categoryId: args.categoryId,
      description: args.description,
      image: args.image,
      sku: args.sku,
      specifications: args.specifications,
      createdAt: Date.now(),
    });

    return productId;
  },
});

// Bulk create products from CSV (admin only)
export const bulkCreateProducts = mutation({
  args: {
    products: v.array(
      v.object({
        name: v.string(),
        categoryId: v.id("categories"),
        description: v.string(),
        image: v.optional(v.string()),
        sku: v.optional(v.string()),
        specifications: v.optional(v.string()),
      })
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

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can bulk create products",
        code: "FORBIDDEN",
      });
    }

    const productIds: Array<Id<"products">> = [];
    
    for (const product of args.products) {
      const productId = await ctx.db.insert("products", {
        name: product.name,
        categoryId: product.categoryId,
        description: product.description,
        image: product.image,
        sku: product.sku,
        specifications: product.specifications,
        createdAt: Date.now(),
      });
      productIds.push(productId);
    }

    return { count: productIds.length, productIds };
  },
});

// Update product (admin only)
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    categoryId: v.id("categories"),
    description: v.string(),
    image: v.optional(v.string()),
    sku: v.optional(v.string()),
    specifications: v.optional(v.string()),
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
        message: "Only admins can update products",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.productId, {
      name: args.name,
      categoryId: args.categoryId,
      description: args.description,
      image: args.image,
      sku: args.sku,
      specifications: args.specifications,
    });

    return null;
  },
});

// Delete product (admin only)
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
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
        message: "Only admins can delete products",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.productId);

    return null;
  },
});

// Generate upload URL for product photos
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
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

    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "vendor")) {
      throw new ConvexError({
        message: "Only admins and vendors can upload photos",
        code: "FORBIDDEN",
      });
    }

    return await ctx.storage.generateUploadUrl();
  },
});