import { query, mutation, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";
import { ConvexError, v } from "convex/values";

// Helper function to generate URL-friendly slugs
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

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
          categorySlug: category?.slug ?? "unknown",
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

// Get product by slug with category info
export const getProductBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!product) {
      return null;
    }

    const category = await ctx.db.get(product.categoryId);

    return {
      ...product,
      categoryName: category?.name || "Unknown",
      categorySlug: category?.slug || "unknown",
    };
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

    // Check for duplicate product name (case-insensitive)
    const normalizedName = args.name.trim().toLowerCase();
    const allProducts = await ctx.db.query("products").collect();
    const duplicate = allProducts.find(
      (p) => p.name.trim().toLowerCase() === normalizedName
    );

    if (duplicate) {
      throw new ConvexError({
        message: `Product "${args.name}" already exists. Please use a different name.`,
        code: "CONFLICT",
      });
    }

    // Generate slug from name
    const slug = generateSlug(args.name);

    const productId = await ctx.db.insert("products", {
      name: args.name,
      slug,
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

    // Get all existing products for duplicate checking
    const existingProducts = await ctx.db.query("products").collect();
    const existingNames = new Set(
      existingProducts.map((p) => p.name.trim().toLowerCase())
    );

    const productIds: Array<Id<"products">> = [];
    const skipped: string[] = [];
    const duplicatesInBatch = new Set<string>();
    
    for (const product of args.products) {
      const normalizedName = product.name.trim().toLowerCase();
      
      // Skip if already exists in database or already processed in this batch
      if (existingNames.has(normalizedName) || duplicatesInBatch.has(normalizedName)) {
        skipped.push(product.name);
        continue;
      }
      
      duplicatesInBatch.add(normalizedName);
      
      // Generate slug from name
      const slug = generateSlug(product.name);
      
      const productId = await ctx.db.insert("products", {
        name: product.name,
        slug,
        categoryId: product.categoryId,
        description: product.description,
        image: product.image,
        sku: product.sku,
        specifications: product.specifications,
        createdAt: Date.now(),
      });
      productIds.push(productId);
    }

    return { 
      created: productIds.length, 
      skipped: skipped.length,
      skippedProducts: skipped,
      productIds 
    };
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

    // Generate new slug from updated name
    const slug = generateSlug(args.name);

    await ctx.db.patch(args.productId, {
      name: args.name,
      slug,
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

// Find duplicate products (admin only)
export const findDuplicateProducts = query({
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

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can find duplicates",
        code: "FORBIDDEN",
      });
    }

    const allProducts = await ctx.db.query("products").collect();
    
    // Group products by normalized name
    const productsByName = new Map<string, typeof allProducts>();
    
    for (const product of allProducts) {
      const normalizedName = product.name.trim().toLowerCase();
      if (!productsByName.has(normalizedName)) {
        productsByName.set(normalizedName, []);
      }
      productsByName.get(normalizedName)!.push(product);
    }
    
    // Find groups with more than one product
    const duplicates: Array<{
      name: string;
      count: number;
      products: typeof allProducts;
    }> = [];
    
    for (const [normalizedName, products] of productsByName.entries()) {
      if (products.length > 1) {
        duplicates.push({
          name: products[0].name,
          count: products.length,
          products: products,
        });
      }
    }
    
    return {
      totalDuplicates: duplicates.length,
      duplicates,
    };
  },
});

// Remove duplicate products, keeping the oldest one (admin only)
export const removeDuplicateProducts = mutation({
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

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can remove duplicates",
        code: "FORBIDDEN",
      });
    }

    const allProducts = await ctx.db.query("products").collect();
    
    // Group products by normalized name
    const productsByName = new Map<string, typeof allProducts>();
    
    for (const product of allProducts) {
      const normalizedName = product.name.trim().toLowerCase();
      if (!productsByName.has(normalizedName)) {
        productsByName.set(normalizedName, []);
      }
      productsByName.get(normalizedName)!.push(product);
    }
    
    let removedCount = 0;
    const removedProducts: Array<{ name: string; id: Id<"products"> }> = [];
    
    // For each duplicate group, keep the oldest and delete the rest
    for (const products of productsByName.values()) {
      if (products.length > 1) {
        // Sort by creation time (oldest first)
        products.sort((a, b) => a.createdAt - b.createdAt);
        
        // Keep the first (oldest), delete the rest
        for (let i = 1; i < products.length; i++) {
          await ctx.db.delete(products[i]._id);
          removedProducts.push({
            name: products[i].name,
            id: products[i]._id,
          });
          removedCount++;
        }
      }
    }
    
    return {
      removedCount,
      removedProducts,
    };
  },
});

export const generateAllSlugs = mutation({
  args: {},
  handler: async (ctx) => {
    // Only allow admins
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can generate slugs",
        code: "FORBIDDEN",
      });
    }

    // Generate slugs for all categories
    const categories = await ctx.db.query("categories").collect();
    let categoriesUpdated = 0;
    
    for (const category of categories) {
      if (!category.slug) {
        const slug = generateSlug(category.name);
        await ctx.db.patch(category._id, { slug });
        categoriesUpdated++;
      }
    }

    // Generate slugs for all products
    const products = await ctx.db.query("products").collect();
    let productsUpdated = 0;
    
    for (const product of products) {
      if (!product.slug) {
        const slug = generateSlug(product.name);
        await ctx.db.patch(product._id, { slug });
        productsUpdated++;
      }
    }

    return {
      categoriesUpdated,
      productsUpdated,
      message: `Updated ${categoriesUpdated} categories and ${productsUpdated} products with slugs`,
    };
  },
});