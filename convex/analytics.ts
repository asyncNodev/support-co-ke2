import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Track page visit
export const trackVisit = mutation({
  args: {
    page: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analytics", {
      type: "visitor",
      metadata: args.page ? JSON.stringify({ page: args.page }) : undefined,
      timestamp: Date.now(),
    });

    return null;
  },
});

// Get admin analytics
export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can view analytics",
        code: "FORBIDDEN",
      });
    }

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Get visitor count (last 30 days)
    const visitors = await ctx.db
      .query("analytics")
      .withIndex("by_type", (q) => q.eq("type", "visitor"))
      .collect();

    const recentVisitors = visitors.filter((v) => v.timestamp >= thirtyDaysAgo);

    // Get RFQ stats
    const allRfqs = await ctx.db.query("rfqs").collect();
    const rfqsSent = await ctx.db
      .query("analytics")
      .withIndex("by_type", (q) => q.eq("type", "rfq_sent"))
      .collect();

    const recentRfqs = allRfqs.filter((r) => r.createdAt >= thirtyDaysAgo);

    // Get sent quotation stats
    const sentQuotations = await ctx.db.query("sentQuotations").collect();
    const openedQuotations = sentQuotations.filter((q) => q.opened);

    // Get user counts
    const allUsers = await ctx.db.query("users").collect();
    const vendors = allUsers.filter((u) => u.role === "vendor");
    const buyers = allUsers.filter((u) => u.role === "buyer");
    const verifiedVendors = vendors.filter((v) => v.verified);
    const verifiedBuyers = buyers.filter((b) => b.verified);

    // Get category stats
    const products = await ctx.db.query("products").collect();
    const categories = await ctx.db.query("categories").collect();

    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const categoryProducts = products.filter(
          (p) => p.categoryId === category._id
        );

        // Get RFQ items for this category
        const rfqItems = await ctx.db.query("rfqItems").collect();
        const categoryRfqItems = rfqItems.filter((item) =>
          categoryProducts.some((p) => p._id === item.productId)
        );

        return {
          categoryName: category.name,
          productCount: categoryProducts.length,
          rfqCount: categoryRfqItems.length,
        };
      })
    );

    return {
      visitors: {
        total: recentVisitors.length,
        last30Days: recentVisitors.length,
      },
      rfqs: {
        total: allRfqs.length,
        last30Days: recentRfqs.length,
        pending: allRfqs.filter((r) => r.status === "pending").length,
        quoted: allRfqs.filter((r) => r.status === "quoted").length,
        completed: allRfqs.filter((r) => r.status === "completed").length,
      },
      quotations: {
        total: sentQuotations.length,
        opened: openedQuotations.length,
        openRate:
          sentQuotations.length > 0
            ? (openedQuotations.length / sentQuotations.length) * 100
            : 0,
      },
      users: {
        totalVendors: vendors.length,
        verifiedVendors: verifiedVendors.length,
        totalBuyers: buyers.length,
        verifiedBuyers: verifiedBuyers.length,
      },
      categories: categoryStats,
    };
  },
});

// Get vendor dashboard stats
export const getVendorStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const vendor = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", identity.tokenIdentifier))
      .first();

    if (!vendor || vendor.role !== "vendor") {
      return null;
    }

    const quotations = await ctx.db
      .query("vendorQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    const sentQuotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return {
      totalQuotations: quotations.length,
      activeQuotations: quotations.filter((q) => q.active).length,
      quotationsSent: sentQuotations.length,
      quotationsOpened: sentQuotations.filter((q) => q.opened).length,
      averageRating: avgRating,
      totalRatings: ratings.length,
    };
  },
});
