import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get vendor's quotations
export const getMyQuotations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const vendor = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!vendor || vendor.role !== "vendor") {
      return [];
    }

    const quotations = await ctx.db
      .query("vendorQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    return await Promise.all(
      quotations.map(async (quotation) => {
        const product = await ctx.db.get(quotation.productId);
        return { ...quotation, product };
      })
    );
  },
});

// Create or update vendor quotation
export const upsertQuotation = mutation({
  args: {
    productId: v.id("products"),
    price: v.number(),
    quantity: v.number(),
    paymentTerms: v.union(v.literal("cash"), v.literal("credit")),
    deliveryTime: v.string(),
    warrantyPeriod: v.string(),
    productPhoto: v.optional(v.string()),
    productDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const vendor = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!vendor || vendor.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can create quotations",
        code: "FORBIDDEN",
      });
    }

    // Check if quotation already exists
    const existingQuotation = await ctx.db
      .query("vendorQuotations")
      .withIndex("by_vendor_and_product", (q) =>
        q.eq("vendorId", vendor._id).eq("productId", args.productId)
      )
      .first();

    if (existingQuotation) {
      // Update existing quotation
      await ctx.db.patch(existingQuotation._id, {
        price: args.price,
        quantity: args.quantity,
        paymentTerms: args.paymentTerms,
        deliveryTime: args.deliveryTime,
        warrantyPeriod: args.warrantyPeriod,
        productPhoto: args.productPhoto,
        productDescription: args.productDescription,
        updatedAt: Date.now(),
      });
      return existingQuotation._id;
    } else {
      // Create new quotation
      const quotationId = await ctx.db.insert("vendorQuotations", {
        vendorId: vendor._id,
        productId: args.productId,
        price: args.price,
        quantity: args.quantity,
        paymentTerms: args.paymentTerms,
        deliveryTime: args.deliveryTime,
        warrantyPeriod: args.warrantyPeriod,
        productPhoto: args.productPhoto,
        productDescription: args.productDescription,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return quotationId;
    }
  },
});

// Toggle quotation active status
export const toggleQuotationStatus = mutation({
  args: {
    quotationId: v.id("vendorQuotations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const vendor = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!vendor || vendor.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can modify quotations",
        code: "FORBIDDEN",
      });
    }

    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation || quotation.vendorId !== vendor._id) {
      throw new ConvexError({
        message: "Quotation not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.quotationId, {
      active: !quotation.active,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Delete quotation
export const deleteQuotation = mutation({
  args: {
    quotationId: v.id("vendorQuotations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const vendor = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!vendor || vendor.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can delete quotations",
        code: "FORBIDDEN",
      });
    }

    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation || quotation.vendorId !== vendor._id) {
      throw new ConvexError({
        message: "Quotation not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.delete(args.quotationId);

    return null;
  },
});

// Get products vendor hasn't quoted for
export const getProductsWithoutQuotation = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const vendor = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!vendor || vendor.role !== "vendor") {
      return [];
    }

    const allProducts = await ctx.db.query("products").collect();
    const vendorQuotations = await ctx.db
      .query("vendorQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    const quotedProductIds = new Set(
      vendorQuotations.map((q) => q.productId)
    );

    const productsWithoutQuotation = allProducts.filter(
      (product) => !quotedProductIds.has(product._id)
    );

    return await Promise.all(
      productsWithoutQuotation.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        return { ...product, category };
      })
    );
  },
});

// Get quotations sent to buyers
export const getMySentQuotations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const vendor = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!vendor || vendor.role !== "vendor") {
      return [];
    }

    const sentQuotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    return await Promise.all(
      sentQuotations.map(async (sent) => {
        const product = await ctx.db.get(sent.productId);
        const buyer = await ctx.db.get(sent.buyerId);
        return {
          ...sent,
          productName: product?.name ?? "Unknown Product",
          buyerName: buyer?.name ?? "Unknown Buyer",
        };
      })
    );
  },
});