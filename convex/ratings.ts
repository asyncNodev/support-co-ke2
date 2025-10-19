import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Submit a rating for a vendor
export const submitRating = mutation({
  args: {
    vendorId: v.id("users"),
    rfqId: v.id("rfqs"),
    rating: v.number(),
    review: v.optional(v.string()),
    deliveryRating: v.optional(v.number()),
    communicationRating: v.optional(v.number()),
    qualityRating: v.optional(v.number()),
    wouldRecommend: v.optional(v.boolean()),
    orderValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not authenticated",
        code: "UNAUTHENTICATED",
      });
    }

    const buyer = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!buyer || buyer.role !== "buyer") {
      throw new ConvexError({
        message: "Only buyers can submit ratings",
        code: "FORBIDDEN",
      });
    }

    // Verify the RFQ belongs to this buyer
    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq || rfq.buyerId !== buyer._id) {
      throw new ConvexError({
        message: "RFQ not found or unauthorized",
        code: "FORBIDDEN",
      });
    }

    // Check if buyer already rated this vendor for this RFQ
    const existingRating = await ctx.db
      .query("ratings")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .filter((q) => q.eq(q.field("vendorId"), args.vendorId))
      .first();

    if (existingRating) {
      throw new ConvexError({
        message: "You have already rated this vendor for this RFQ",
        code: "CONFLICT",
      });
    }

    // Validate rating values
    if (args.rating < 1 || args.rating > 5) {
      throw new ConvexError({
        message: "Rating must be between 1 and 5",
        code: "BAD_REQUEST",
      });
    }

    await ctx.db.insert("ratings", {
      buyerId: buyer._id,
      vendorId: args.vendorId,
      rfqId: args.rfqId,
      rating: args.rating,
      review: args.review,
      deliveryRating: args.deliveryRating,
      communicationRating: args.communicationRating,
      qualityRating: args.qualityRating,
      wouldRecommend: args.wouldRecommend,
      orderValue: args.orderValue,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get all ratings for a vendor
export const getVendorRatings = query({
  args: { vendorId: v.id("users") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .order("desc")
      .collect();

    const ratingsWithBuyers = await Promise.all(
      ratings.map(async (rating) => {
        const buyer = await ctx.db.get(rating.buyerId);
        return {
          ...rating,
          buyerName: buyer?.name || "Anonymous",
          buyerCompanyName: buyer?.companyName,
        };
      })
    );

    return ratingsWithBuyers;
  },
});

// Get vendor statistics
export const getVendorStats = query({
  args: { vendorId: v.id("users") },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .collect();

    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        averageDelivery: 0,
        averageCommunication: 0,
        averageQuality: 0,
        recommendationRate: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;

    const deliveryRatings = ratings.filter((r) => r.deliveryRating !== undefined);
    const averageDelivery = deliveryRatings.length > 0
      ? deliveryRatings.reduce((sum, r) => sum + (r.deliveryRating || 0), 0) / deliveryRatings.length
      : 0;

    const commRatings = ratings.filter((r) => r.communicationRating !== undefined);
    const averageCommunication = commRatings.length > 0
      ? commRatings.reduce((sum, r) => sum + (r.communicationRating || 0), 0) / commRatings.length
      : 0;

    const qualityRatings = ratings.filter((r) => r.qualityRating !== undefined);
    const averageQuality = qualityRatings.length > 0
      ? qualityRatings.reduce((sum, r) => sum + (r.qualityRating || 0), 0) / qualityRatings.length
      : 0;

    const recommendations = ratings.filter((r) => r.wouldRecommend !== undefined);
    const recommendationRate = recommendations.length > 0
      ? (recommendations.filter((r) => r.wouldRecommend === true).length / recommendations.length) * 100
      : 0;

    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      const roundedRating = Math.round(r.rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        distribution[roundedRating]++;
      }
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: ratings.length,
      averageDelivery: Math.round(averageDelivery * 10) / 10,
      averageCommunication: Math.round(averageCommunication * 10) / 10,
      averageQuality: Math.round(averageQuality * 10) / 10,
      recommendationRate: Math.round(recommendationRate),
      ratingDistribution: distribution,
    };
  },
});

// Check if buyer can rate a vendor for an RFQ
export const canRateVendor = query({
  args: { vendorId: v.id("users"), rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { canRate: false, reason: "Not authenticated" };
    }

    const buyer = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .unique();

    if (!buyer || buyer.role !== "buyer") {
      return { canRate: false, reason: "Not a buyer" };
    }

    // Check if RFQ exists and belongs to buyer
    const rfq = await ctx.db.get(args.rfqId);
    if (!rfq || rfq.buyerId !== buyer._id) {
      return { canRate: false, reason: "RFQ not found" };
    }

    // Check if buyer chose a quotation from this vendor
    const chosenQuotation = await ctx.db
      .query("sentQuotations")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .filter((q) =>
        q.and(
          q.eq(q.field("vendorId"), args.vendorId),
          q.eq(q.field("chosen"), true)
        )
      )
      .first();

    if (!chosenQuotation) {
      return { canRate: false, reason: "No chosen quotation from this vendor" };
    }

    // Check if already rated
    const existingRating = await ctx.db
      .query("ratings")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .filter((q) => q.eq(q.field("vendorId"), args.vendorId))
      .first();

    if (existingRating) {
      return { canRate: false, reason: "Already rated" };
    }

    return { canRate: true };
  },
});

// Get rating for a specific RFQ and vendor
export const getRatingForRFQ = query({
  args: { vendorId: v.id("users"), rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    const rating = await ctx.db
      .query("ratings")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .filter((q) => q.eq(q.field("vendorId"), args.vendorId))
      .first();

    return rating;
  },
});
