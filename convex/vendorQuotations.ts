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
    countryOfOrigin: v.string(),
    productSpecifications: v.string(),
    productPhoto: v.optional(v.string()),
    productDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED" as const,
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can manage quotations",
        code: "FORBIDDEN" as const,
      });
    }

    if (!user.verified) {
      throw new ConvexError({
        message: "Vendor must be verified",
        code: "FORBIDDEN" as const,
      });
    }

    const existing = await ctx.db
      .query("vendorQuotations")
      .withIndex("by_vendor_and_product", (q) =>
        q.eq("vendorId", user._id).eq("productId", args.productId),
      )
      .filter((q) => q.eq(q.field("quotationType"), "pre-filled"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        price: args.price,
        quantity: args.quantity,
        paymentTerms: args.paymentTerms,
        deliveryTime: args.deliveryTime,
        warrantyPeriod: args.warrantyPeriod,
        countryOfOrigin: args.countryOfOrigin,
        productSpecifications: args.productSpecifications,
        productPhoto: args.productPhoto,
        productDescription: args.productDescription,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("vendorQuotations", {
        vendorId: user._id,
        productId: args.productId,
        quotationType: "pre-filled" as const,
        source: "manual" as const,
        price: args.price,
        quantity: args.quantity,
        paymentTerms: args.paymentTerms,
        deliveryTime: args.deliveryTime,
        warrantyPeriod: args.warrantyPeriod,
        countryOfOrigin: args.countryOfOrigin,
        productSpecifications: args.productSpecifications,
        productPhoto: args.productPhoto,
        productDescription: args.productDescription,
        active: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Create quotation
export const createQuotation = mutation({
  args: {
    productId: v.id("products"),
    price: v.number(),
    quantity: v.number(),
    paymentTerms: v.union(v.literal("cash"), v.literal("credit")),
    deliveryTime: v.string(),
    warrantyPeriod: v.string(),
    countryOfOrigin: v.string(),
    productSpecifications: v.string(),
    productPhoto: v.optional(v.string()),
    productDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED" as const,
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND" as const,
      });
    }

    if (user.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can create quotations",
        code: "FORBIDDEN" as const,
      });
    }

    if (!user.verified) {
      throw new ConvexError({
        message: "Vendor must be verified to create quotations",
        code: "FORBIDDEN" as const,
      });
    }

    const quotationId = await ctx.db.insert("vendorQuotations", {
      vendorId: user._id,
      productId: args.productId,
      quotationType: "pre-filled" as const,
      source: "manual" as const,
      price: args.price,
      quantity: args.quantity,
      paymentTerms: args.paymentTerms,
      deliveryTime: args.deliveryTime,
      warrantyPeriod: args.warrantyPeriod,
      countryOfOrigin: args.countryOfOrigin,
      productSpecifications: args.productSpecifications,
      productPhoto: args.productPhoto,
      productDescription: args.productDescription,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return quotationId;
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

// Get products that vendor hasn't submitted quotations for yet
export const getProductsWithoutQuotation = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const vendor = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!vendor || vendor.role !== "vendor") return [];

    // Get all products
    const products = await ctx.db.query("products").collect();

    // Get vendor's existing quotations
    const myQuotations = await ctx.db
      .query("vendorQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .filter((q) => q.eq(q.field("quotationType"), "pre-filled"))
      .collect();

    const quotedProductIds = new Set(myQuotations.map((q) => q.productId));

    // Return products without quotations
    const productsWithoutQuotations = products.filter(
      (p) => !quotedProductIds.has(p._id),
    );

    // Add category info
    const result = await Promise.all(
      productsWithoutQuotations.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        return { ...product, categoryName: category?.name };
      }),
    );

    return result;
  },
});

// Get pending RFQs that need vendor quotations
export const getPendingRFQs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const vendor = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!vendor || vendor.role !== "vendor") return [];

    // Get all RFQs
    const rfqs = await ctx.db
      .query("rfqs")
      .filter((q) => q.neq(q.field("status"), "completed"))
      .collect();

    const result = [];

    for (const rfq of rfqs) {
      // Get RFQ items
      const items = await ctx.db
        .query("rfqItems")
        .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
        .collect();

      // Check if vendor has already submitted quotation for any of these products
      const vendorSubmittedQuotations = await ctx.db
        .query("sentQuotations")
        .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
        .filter((q) => q.eq(q.field("vendorId"), vendor._id))
        .collect();

      const quotedProductIds = new Set(
        vendorSubmittedQuotations.map((q) => q.productId),
      );

      // Get items vendor hasn't quoted yet
      const itemsWithoutQuotations = [];
      for (const item of items) {
        if (!quotedProductIds.has(item.productId)) {
          const product = await ctx.db.get(item.productId);
          if (product) {
            itemsWithoutQuotations.push({
              ...item,
              productName: product.name,
              productDescription: product.description,
            });
          }
        }
      }

      if (itemsWithoutQuotations.length > 0) {
        const buyer = await ctx.db.get(rfq.buyerId);
        result.push({
          ...rfq,
          buyer: {
            name: buyer?.name,
            companyName: buyer?.companyName,
          },
          items: itemsWithoutQuotations,
        });
      }
    }

    return result;
  },
});

// Submit on-demand quotation for a specific RFQ
export const submitOnDemandQuotation = mutation({
  args: {
    rfqId: v.id("rfqs"),
    productId: v.id("products"),
    price: v.number(),
    quantity: v.number(),
    paymentTerms: v.union(v.literal("cash"), v.literal("credit")),
    deliveryTime: v.string(),
    warrantyPeriod: v.string(),
    countryOfOrigin: v.string(),
    productSpecifications: v.string(),
    productPhoto: v.optional(v.string()),
    productDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED" as const,
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can submit quotations",
        code: "FORBIDDEN" as const,
      });
    }

    if (!user.verified) {
      throw new ConvexError({
        message: "Vendor must be verified",
        code: "FORBIDDEN" as const,
      });
    }

    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq) {
      throw new ConvexError({
        message: "RFQ not found",
        code: "NOT_FOUND" as const,
      });
    }

    // Check if vendor already submitted quotation for this RFQ+product
    const existing = await ctx.db
      .query("vendorQuotations")
      .withIndex("by_vendor_and_product", (q) =>
        q.eq("vendorId", user._id).eq("productId", args.productId),
      )
      .filter((q) => q.eq(q.field("rfqId"), args.rfqId))
      .first();

    if (existing) {
      throw new ConvexError({
        message: "You already submitted a quotation for this RFQ",
        code: "FORBIDDEN" as const,
      });
    }

    // Create on-demand quotation
    const quotationId = await ctx.db.insert("vendorQuotations", {
      vendorId: user._id,
      productId: args.productId,
      rfqId: args.rfqId,
      quotationType: "on-demand" as const,
      source: "manual" as const,
      price: args.price,
      quantity: args.quantity,
      paymentTerms: args.paymentTerms,
      deliveryTime: args.deliveryTime,
      warrantyPeriod: args.warrantyPeriod,
      countryOfOrigin: args.countryOfOrigin,
      productSpecifications: args.productSpecifications,
      productPhoto: args.productPhoto,
      productDescription: args.productDescription,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Send quotation to buyer
    await ctx.db.insert("sentQuotations", {
      rfqId: args.rfqId,
      buyerId: rfq.buyerId,
      vendorId: user._id,
      productId: args.productId,
      quotationId,
      quotationType: "on-demand" as const,
      price: args.price,
      quantity: args.quantity,
      paymentTerms: args.paymentTerms,
      deliveryTime: args.deliveryTime,
      warrantyPeriod: args.warrantyPeriod,
      countryOfOrigin: args.countryOfOrigin,
      productSpecifications: args.productSpecifications,
      productPhoto: args.productPhoto,
      productDescription: args.productDescription,
      opened: false,
      chosen: false,
      sentAt: Date.now(),
    });

    // Notify buyer
    await ctx.db.insert("notifications", {
      userId: rfq.buyerId,
      type: "quotation_sent" as const,
      title: "New Quotation Received",
      message: `You received an on-demand quotation for your RFQ`,
      read: false,
      relatedId: args.rfqId,
      createdAt: Date.now(),
    });

    return { success: true, quotationId };
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