import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// Submit vendor rating
export const submitRating = mutation({
  args: {
    vendorId: v.id("users"),
    rfqId: v.id("rfqs"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const buyer = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!buyer || buyer.role !== "buyer") {
      throw new ConvexError({
        message: "Only buyers can rate vendors",
        code: "FORBIDDEN",
      });
    }

    // Validate rating range
    if (args.rating < 1 || args.rating > 5) {
      throw new ConvexError({
        message: "Rating must be between 1 and 5",
        code: "FORBIDDEN",
      });
    }

    // Check if buyer already rated this vendor for this RFQ
    const existingRating = await ctx.db
      .query("ratings")
      .filter((q) =>
        q.and(
          q.eq(q.field("buyerId"), buyer._id),
          q.eq(q.field("vendorId"), args.vendorId),
          q.eq(q.field("rfqId"), args.rfqId)
        )
      )
      .first();

    if (existingRating) {
      throw new ConvexError({
        message: "You have already rated this vendor for this RFQ",
        code: "FORBIDDEN",
      });
    }

    const ratingId = await ctx.db.insert("ratings", {
      buyerId: buyer._id,
      vendorId: args.vendorId,
      rfqId: args.rfqId,
      rating: args.rating,
      review: args.review,
      createdAt: Date.now(),
    });

    return ratingId;
  },
});

// Get vendor ratings
export const getVendorRatings = query({
  args: {
    vendorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .collect();

    const ratingsWithBuyer = await Promise.all(
      ratings.map(async (rating) => {
        const buyer = await ctx.db.get(rating.buyerId);
        return { ...rating, buyer };
      })
    );

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return {
      ratings: ratingsWithBuyer,
      averageRating: avgRating,
      totalRatings: ratings.length,
    };
  },
});

// Get my ratings as a buyer
export const getMyRatings = query({
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

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_buyer", (q) => q.eq("buyerId", buyer._id))
      .collect();

    return await Promise.all(
      ratings.map(async (rating) => {
        const vendor = await ctx.db.get(rating.vendorId);
        return { ...rating, vendor };
      })
    );
  },
});

// Get vendor average rating (helper function)
async function getVendorAverageRating(ctx: QueryCtx | MutationCtx, vendorId: Id<"users">) {
  const ratings = await ctx.db
    .query("ratings")
    .withIndex("by_vendor", (q) => q.eq("vendorId", vendorId))
    .collect();

  if (ratings.length === 0) {
    return { average: 0, count: 0 };
  }

  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return { average, count: ratings.length };
}

// Get buyer average rating (helper function - for future use)
async function getBuyerAverageRating(ctx: QueryCtx | MutationCtx, buyerId: Id<"users">) {
  const ratings = await ctx.db
    .query("ratings")
    .withIndex("by_buyer", (q) => q.eq("buyerId", buyerId))
    .collect();

  if (ratings.length === 0) {
    return { average: 0, count: 0 };
  }

  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  return { average, count: ratings.length };
}

export { getVendorAverageRating, getBuyerAverageRating };