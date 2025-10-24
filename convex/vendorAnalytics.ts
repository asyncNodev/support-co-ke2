import { v } from "convex/values";

import { query } from "./_generated/server";

// Get comprehensive vendor performance statistics
export const getVendorPerformance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.role !== "vendor") {
      throw new Error("Not a vendor");
    }

    // Get all quotations submitted by this vendor
    const allQuotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", user._id))
      .collect();

    // Get chosen quotations (won deals)
    const wonQuotations = allQuotations.filter((q) => q.chosen);

    // Get all orders for this vendor
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_vendor", (q) => q.eq("vendorId", user._id))
      .collect();

    // Get ratings
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_vendor", (q) => q.eq("vendorId", user._id))
      .collect();

    // Calculate metrics
    const totalQuotations = allQuotations.length;
    const totalWonQuotations = wonQuotations.length;
    const winRate =
      totalQuotations > 0 ? (totalWonQuotations / totalQuotations) * 100 : 0;

    const totalRevenue = wonQuotations.reduce(
      (sum, q) => sum + q.price * q.quantity,
      0,
    );

    const deliveredOrders = orders.filter(
      (o) => o.status === "delivered",
    ).length;
    const totalOrders = orders.length;
    const deliveryRate =
      totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    const averageDeliveryRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.deliveryRating || 0), 0) /
          ratings.length
        : 0;

    const averageCommunicationRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.communicationRating || 0), 0) /
          ratings.length
        : 0;

    const averageQualityRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + (r.qualityRating || 0), 0) /
          ratings.length
        : 0;

    // Calculate average response time (time from RFQ to quotation)
    const rfqResponseTimes = await Promise.all(
      allQuotations.map(async (q) => {
        const rfq = await ctx.db.get(q.rfqId);
        if (rfq) {
          return q.sentAt - rfq.createdAt;
        }
        return null;
      }),
    );

    const validResponseTimes = rfqResponseTimes.filter(
      (t) => t !== null,
    ) as number[];
    const averageResponseTime =
      validResponseTimes.length > 0
        ? validResponseTimes.reduce((sum, t) => sum + t, 0) /
          validResponseTimes.length
        : 0;

    // Calculate monthly revenue trend (last 6 months)
    const now = Date.now();
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
    const monthlyRevenue: Record<string, number> = {};

    wonQuotations.forEach((q) => {
      if (q.sentAt >= sixMonthsAgo) {
        const date = new Date(q.sentAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const revenue = q.price * q.quantity;
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + revenue;
      }
    });

    const revenueByMonth = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalQuotations,
      totalWonQuotations,
      winRate,
      totalRevenue,
      totalOrders,
      deliveredOrders,
      deliveryRate,
      totalRatings: ratings.length,
      averageRating,
      averageDeliveryRating,
      averageCommunicationRating,
      averageQualityRating,
      averageResponseTime,
      revenueByMonth,
    };
  },
});

// Get market comparison data (how vendor compares to others)
export const getMarketComparison = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.role !== "vendor") {
      throw new Error("Not a vendor");
    }

    // Get all vendors
    const allVendors = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "vendor"))
      .collect();

    // Calculate market averages
    const vendorStats = await Promise.all(
      allVendors.map(async (vendor) => {
        const quotations = await ctx.db
          .query("sentQuotations")
          .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
          .collect();

        const wonQuotations = quotations.filter((q) => q.chosen);
        const winRate =
          quotations.length > 0
            ? (wonQuotations.length / quotations.length) * 100
            : 0;

        const ratings = await ctx.db
          .query("ratings")
          .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
          .collect();

        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;

        return { winRate, avgRating, quotationCount: quotations.length };
      }),
    );

    const activeVendors = vendorStats.filter((s) => s.quotationCount > 0);

    const marketAverageWinRate =
      activeVendors.length > 0
        ? activeVendors.reduce((sum, s) => sum + s.winRate, 0) /
          activeVendors.length
        : 0;

    const marketAverageRating =
      activeVendors.length > 0
        ? activeVendors.reduce((sum, s) => sum + s.avgRating, 0) /
          activeVendors.length
        : 0;

    // Get current vendor's stats
    const myQuotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", user._id))
      .collect();

    const myWonQuotations = myQuotations.filter((q) => q.chosen);
    const myWinRate =
      myQuotations.length > 0
        ? (myWonQuotations.length / myQuotations.length) * 100
        : 0;

    const myRatings = await ctx.db
      .query("ratings")
      .withIndex("by_vendor", (q) => q.eq("vendorId", user._id))
      .collect();

    const myAverageRating =
      myRatings.length > 0
        ? myRatings.reduce((sum, r) => sum + r.rating, 0) / myRatings.length
        : 0;

    return {
      myWinRate,
      marketAverageWinRate,
      myAverageRating,
      marketAverageRating,
      totalActiveVendors: activeVendors.length,
    };
  },
});

// Get recent performance trend (last 30 days)
export const getRecentPerformance = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.role !== "vendor") {
      throw new Error("Not a vendor");
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const recentQuotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", user._id))
      .filter((q) => q.gte(q.field("sentAt"), thirtyDaysAgo))
      .collect();

    const recentWonQuotations = recentQuotations.filter((q) => q.chosen);

    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_vendor", (q) => q.eq("vendorId", user._id))
      .filter((q) => q.gte(q.field("orderDate"), thirtyDaysAgo))
      .collect();

    return {
      quotationsLast30Days: recentQuotations.length,
      wonQuotationsLast30Days: recentWonQuotations.length,
      ordersLast30Days: recentOrders.length,
      revenueLast30Days: recentWonQuotations.reduce(
        (sum, q) => sum + q.price * q.quantity,
        0,
      ),
    };
  },
});
