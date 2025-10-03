import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

// Submit RFQ with items from cart
export const submitRFQ = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
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
      .first();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    if (user.role !== "buyer") {
      throw new ConvexError({
        message: "Only buyers can submit RFQs",
        code: "FORBIDDEN",
      });
    }

    if (!user.verified) {
      throw new ConvexError({
        message: "Your account must be verified to submit RFQs",
        code: "FORBIDDEN",
      });
    }

    // Create RFQ
    const rfqId = await ctx.db.insert("rfqs", {
      buyerId: user._id,
      status: "pending",
      createdAt: Date.now(),
    });

    // Add RFQ items
    for (const item of args.items) {
      await ctx.db.insert("rfqItems", {
        rfqId,
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    // Auto-match with pre-filled vendor quotations and notify vendors without quotations
    let matchedCount = 0;
    const vendorsToNotify = new Set<Id<"users">>();

    for (const item of args.items) {
      // Find all verified vendors with pre-filled quotations for this product
      const quotations = await ctx.db
        .query("vendorQuotations")
        .withIndex("by_product", (q) => q.eq("productId", item.productId))
        .filter((q) => q.eq(q.field("active"), true))
        .filter((q) => q.eq(q.field("quotationType"), "pre-filled"))
        .collect();

      const product = await ctx.db.get(item.productId);

      // Send pre-filled quotations
      for (const quotation of quotations) {
        const vendor = await ctx.db.get(quotation.vendorId);
        if (vendor && vendor.verified && vendor.role === "vendor") {
          await ctx.db.insert("sentQuotations", {
            rfqId,
            buyerId: user._id,
            vendorId: vendor._id,
            productId: item.productId,
            quotationId: quotation._id,
            quotationType: "pre-filled",
            price: quotation.price,
            quantity: quotation.quantity,
            paymentTerms: quotation.paymentTerms,
            deliveryTime: quotation.deliveryTime,
            warrantyPeriod: quotation.warrantyPeriod,
            productPhoto: quotation.productPhoto,
            productDescription: quotation.productDescription,
            opened: false,
            sentAt: Date.now(),
          });

          // Notify vendor that their quotation was sent
          await ctx.db.insert("notifications", {
            userId: vendor._id,
            type: "quotation_sent",
            title: "Your quotation was sent!",
            message: `Your pre-filled quotation for ${product?.name} was sent to a buyer`,
            read: false,
            relatedId: rfqId,
            createdAt: Date.now(),
          });

          matchedCount++;
        }
      }

      // Find ALL verified vendors (to notify those without quotations)
      const allVerifiedVendors = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => {
          const role = "vendor" as const;
          return q.eq("role", role);
        })
        .filter((q) => q.eq(q.field("verified"), true))
        .collect();

      // Notify vendors who DON'T have a pre-filled quotation for this product
      for (const vendor of allVerifiedVendors) {
        const hasQuotation = quotations.some(
          (q) => q.vendorId === vendor._id
        );
        if (!hasQuotation) {
          vendorsToNotify.add(vendor._id);
        }
      }
    }

    // Send notifications to vendors without pre-filled quotations
    for (const vendorId of vendorsToNotify) {
      await ctx.db.insert("notifications", {
        userId: vendorId,
        type: "rfq_needs_quotation",
        title: "New RFQ needs your quotation",
        message: `A buyer has submitted an RFQ. Review and submit your quotation.`,
        read: false,
        relatedId: rfqId,
        createdAt: Date.now(),
      });
    }

    // Update RFQ status
    if (matchedCount > 0) {
      await ctx.db.patch(rfqId, { status: "quoted" });
    }

    // Track analytics
    await ctx.db.insert("analytics", {
      type: "rfq_sent",
      metadata: JSON.stringify({ rfqId, itemCount: args.items.length }),
      timestamp: Date.now(),
    });

    return {
      rfqId,
      matchedCount,
      vendorsNotified: vendorsToNotify.size,
    };
  },
});

// Get buyer's RFQs
export const getMyRFQs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const buyer = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!buyer || buyer.role !== "buyer") {
      return [];
    }

    const rfqs = await ctx.db
      .query("rfqs")
      .withIndex("by_buyer", (q) => q.eq("buyerId", buyer._id))
      .order("desc")
      .collect();

    return await Promise.all(
      rfqs.map(async (rfq) => {
        const items = await ctx.db
          .query("rfqItems")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
          .collect();

        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await ctx.db.get(item.productId);
            return { ...item, product };
          })
        );

        const quotations = await ctx.db
          .query("sentQuotations")
          .withIndex("by_rfq", (q) => q.eq("rfqId", rfq._id))
          .collect();

        return {
          ...rfq,
          items: itemsWithProducts,
          quotationCount: quotations.length,
        };
      })
    );
  },
});

// Get RFQ details with quotations
export const getRFQDetails = query({
  args: {
    rfqId: v.id("rfqs"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!user) {
      return null;
    }

    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq) {
      return null;
    }

    // Check access
    if (user.role === "buyer" && rfq.buyerId !== user._id) {
      throw new ConvexError({
        message: "Access denied",
        code: "FORBIDDEN",
      });
    }

    const items = await ctx.db
      .query("rfqItems")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .collect();

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return { ...item, product };
      })
    );

    const quotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .collect();

    const quotationsWithVendor = await Promise.all(
      quotations.map(async (quotation) => {
        const vendor = await ctx.db.get(quotation.vendorId);
        const product = await ctx.db.get(quotation.productId);

        // Get vendor rating
        const ratings = await ctx.db
          .query("ratings")
          .withIndex("by_vendor", (q) => q.eq("vendorId", quotation.vendorId))
          .collect();

        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        return {
          ...quotation,
          vendor,
          product,
          vendorRating: avgRating,
          vendorReviewCount: ratings.length,
        };
      })
    );

    return {
      ...rfq,
      items: itemsWithProducts,
      quotations: quotationsWithVendor,
    };
  },
});

// Mark quotation as opened
export const markQuotationOpened = mutation({
  args: {
    quotationId: v.id("sentQuotations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const quotation = await ctx.db.get(args.quotationId);
    if (!quotation) {
      throw new ConvexError({
        message: "Quotation not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.quotationId, { opened: true });

    return null;
  },
});

// Get vendor's sent quotations
export const getMyQuotationsSent = query({
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
      .order("desc")
      .collect();

    return await Promise.all(
      sentQuotations.map(async (quotation) => {
        const product = await ctx.db.get(quotation.productId);
        const buyer = await ctx.db.get(quotation.buyerId);
        const rfq = await ctx.db.get(quotation.rfqId);

        return {
          ...quotation,
          product,
          buyer,
          rfq,
        };
      })
    );
  },
});