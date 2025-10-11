import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Get vendor's own quotations
export const getMyQuotations = query({
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

    if (!currentUser || currentUser.role !== "vendor") {
      return [];
    }

    const quotations = await ctx.db
      .query("vendorQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", currentUser._id))
      .collect();

    const quotationsWithProducts = await Promise.all(
      quotations.map(async (quotation) => {
        const product = await ctx.db.get(quotation.productId);
        return {
          ...quotation,
          product,
        };
      })
    );

    return quotationsWithProducts;
  },
});

// Get pending RFQs for vendor's categories
export const getPendingRFQs = query({
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

    if (!currentUser || currentUser.role !== "vendor" || !currentUser.categories) {
      return [];
    }

    // Get vendor's quotation preference
    const preference = currentUser.quotationPreference ?? "all_including_guests";

    const allRFQs = await ctx.db
      .query("rfqs")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const rfqsWithDetails: Array<{
      _id: Id<"rfqs">;
      buyerId?: Id<"users">;
      isGuest?: boolean;
      guestName?: string;
      guestCompanyName?: string;
      guestPhone?: string;
      guestEmail?: string;
      status: string;
      expectedDeliveryTime?: string;
      createdAt: number;
      items: Array<{
        rfqItemId: Id<"rfqItems">;
        productId: Id<"products">;
        quantity: number;
        productName: string;
        categoryId: Id<"categories">;
        alreadyQuoted: boolean;
      }>;
    }> = [];

    for (const rfq of allRFQs) {
      // Filter based on vendor preference
      if (rfq.isGuest && preference === "registered_hospitals_only") {
        continue; // Skip guest RFQs
      }
      if (rfq.isGuest && preference === "registered_all") {
        continue; // Skip guest RFQs
      }
      
      // If RFQ has a buyerId, check if buyer is hospital or not
      if (rfq.buyerId && preference === "registered_hospitals_only") {
        const buyer = await ctx.db.get(rfq.buyerId);
        if (buyer && buyer.role !== "buyer") {
          continue; // Skip non-hospital buyers
        }
      }

      const rfqItems = await ctx.db
        .query("rfqItems")
        .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
        .collect();

      const itemsWithProducts = await Promise.all(
        rfqItems.map(async (item) => {
          const product = await ctx.db.get(item.productId);
          const alreadyQuoted = await ctx.db
            .query("sentQuotations")
            .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
            .filter((q) => 
              q.and(
                q.eq(q.field("vendorId"), currentUser._id),
                q.eq(q.field("productId"), item.productId)
              )
            )
            .first();

          return {
            rfqItemId: item._id,
            productId: item.productId,
            quantity: item.quantity,
            productName: product?.name ?? "Unknown",
            categoryId: product?.categoryId as Id<"categories">,
            alreadyQuoted: !!alreadyQuoted,
          };
        })
      );

      const relevantItems = itemsWithProducts.filter((item) =>
        currentUser.categories?.includes(item.categoryId)
      );

      if (relevantItems.length > 0) {
        rfqsWithDetails.push({
          ...rfq,
          items: relevantItems,
        });
      }
    }

    return rfqsWithDetails;
  },
});

// Create quotation
export const createQuotation = mutation({
  args: {
    productId: v.id("products"),
    rfqId: v.optional(v.id("rfqs")),
    price: v.number(),
    quantity: v.number(),
    paymentTerms: v.union(v.literal("cash"), v.literal("credit")),
    deliveryTime: v.string(),
    warrantyPeriod: v.string(),
    countryOfOrigin: v.optional(v.string()),
    productSpecifications: v.optional(v.string()),
    productPhoto: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    brand: v.optional(v.string()),
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

    if (!currentUser || currentUser.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can create quotations",
        code: "FORBIDDEN",
      });
    }

    const quotationId = await ctx.db.insert("vendorQuotations", {
      vendorId: currentUser._id,
      productId: args.productId,
      rfqId: args.rfqId,
      quotationType: args.rfqId ? "on-demand" : "pre-filled",
      source: "manual",
      price: args.price,
      quantity: args.quantity,
      paymentTerms: args.paymentTerms,
      deliveryTime: args.deliveryTime,
      warrantyPeriod: args.warrantyPeriod,
      countryOfOrigin: args.countryOfOrigin,
      productSpecifications: args.productSpecifications,
      productPhoto: args.productPhoto,
      productDescription: args.productDescription,
      brand: args.brand,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return quotationId;
  },
});

// Update quotation
export const updateQuotation = mutation({
  args: {
    quotationId: v.id("vendorQuotations"),
    price: v.number(),
    quantity: v.number(),
    paymentTerms: v.union(v.literal("cash"), v.literal("credit")),
    deliveryTime: v.string(),
    warrantyPeriod: v.string(),
    countryOfOrigin: v.optional(v.string()),
    productSpecifications: v.optional(v.string()),
    productPhoto: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    brand: v.optional(v.string()),
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

    if (!currentUser || currentUser.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can update quotations",
        code: "FORBIDDEN",
      });
    }

    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation || quotation.vendorId !== currentUser._id) {
      throw new ConvexError({
        message: "Quotation not found or unauthorized",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.quotationId, {
      price: args.price,
      quantity: args.quantity,
      paymentTerms: args.paymentTerms,
      deliveryTime: args.deliveryTime,
      warrantyPeriod: args.warrantyPeriod,
      countryOfOrigin: args.countryOfOrigin,
      productSpecifications: args.productSpecifications,
      productPhoto: args.productPhoto,
      productDescription: args.productDescription,
      brand: args.brand,
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

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can delete quotations",
        code: "FORBIDDEN",
      });
    }

    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation || quotation.vendorId !== currentUser._id) {
      throw new ConvexError({
        message: "Quotation not found or unauthorized",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.delete(args.quotationId);

    return null;
  },
});

// Generate upload URL for quotation photos
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

    if (!currentUser || currentUser.role !== "vendor") {
      throw new ConvexError({
        message: "Only vendors can upload photos",
        code: "FORBIDDEN",
      });
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Internal mutation for creating quotations (used by browse.ai integration)
export const createQuotationInternal = mutation({
  args: {
    vendorId: v.id("users"),
    productId: v.id("products"),
    rfqId: v.optional(v.id("rfqs")),
    quotationType: v.union(v.literal("pre-filled"), v.literal("on-demand")),
    source: v.union(v.literal("manual"), v.literal("auto-scraped")),
    price: v.number(),
    quantity: v.number(),
    paymentTerms: v.union(v.literal("cash"), v.literal("credit")),
    deliveryTime: v.string(),
    warrantyPeriod: v.string(),
    countryOfOrigin: v.optional(v.string()),
    productSpecifications: v.optional(v.string()),
    productPhoto: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    brand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const quotationId = await ctx.db.insert("vendorQuotations", {
      vendorId: args.vendorId,
      productId: args.productId,
      rfqId: args.rfqId,
      quotationType: args.quotationType,
      source: args.source,
      price: args.price,
      quantity: args.quantity,
      paymentTerms: args.paymentTerms,
      deliveryTime: args.deliveryTime,
      warrantyPeriod: args.warrantyPeriod,
      countryOfOrigin: args.countryOfOrigin,
      productSpecifications: args.productSpecifications,
      productPhoto: args.productPhoto,
      productDescription: args.productDescription,
      brand: args.brand,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return quotationId;
  },
});

// Get all quotations for admin
export const getAllQuotationsForAdmin = query({
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
        message: "Only admins can view all quotations",
        code: "FORBIDDEN",
      });
    }

    // Get all vendor quotations
    const allQuotations = await ctx.db
      .query("vendorQuotations")
      .order("desc")
      .collect();

    // Enrich with vendor, product, and RFQ details
    const quotationsWithDetails = await Promise.all(
      allQuotations.map(async (quotation) => {
        const vendor = await ctx.db.get(quotation.vendorId);
        const product = await ctx.db.get(quotation.productId);
        
        let rfq = null;
        let rfqDetails = null;
        if (quotation.rfqId) {
          rfq = await ctx.db.get(quotation.rfqId);
          if (rfq) {
            let buyer = null;
            if (rfq.buyerId) {
              buyer = await ctx.db.get(rfq.buyerId);
            }
            rfqDetails = {
              ...rfq,
              buyerName: rfq.isGuest ? rfq.guestName : buyer?.name,
              buyerCompany: rfq.isGuest ? rfq.guestCompanyName : buyer?.companyName,
            };
          }
        }

        return {
          ...quotation,
          vendorName: vendor?.name,
          vendorCompany: vendor?.companyName,
          vendorEmail: vendor?.email,
          productName: product?.name,
          productImage: product?.image,
          rfqDetails,
        };
      })
    );

    return quotationsWithDetails;
  },
});