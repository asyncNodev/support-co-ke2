import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Track site analytics
export const trackEvent = mutation({
  args: {
    type: v.union(
      v.literal("visitor"),
      v.literal("rfq_sent"),
      v.literal("quotation_sent")
    ),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analytics", {
      type: args.type,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

// Get market intelligence report
export const getMarketIntelligence = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    // Get all RFQs
    const allRFQs = await ctx.db.query("rfqs").collect();
    const recentRFQs = allRFQs.filter((rfq) => rfq.createdAt >= thirtyDaysAgo);

    // Get all quotations
    const allQuotations = await ctx.db.query("vendorQuotations").collect();
    
    // Get all orders
    const allOrders = await ctx.db.query("orders").collect();
    const recentOrders = allOrders.filter((order) => order.orderDate >= thirtyDaysAgo);

    // Get all products with their names
    const products = await ctx.db.query("products").collect();
    const categories = await ctx.db.query("categories").collect();

    // Calculate most requested products
    const rfqItems = await ctx.db.query("rfqItems").collect();
    const productRequestCounts: Record<string, number> = {};
    
    for (const item of rfqItems) {
      const product = products.find((p) => p._id === item.productId);
      if (product) {
        productRequestCounts[product.name] = (productRequestCounts[product.name] || 0) + 1;
      }
    }

    const topProducts = Object.entries(productRequestCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Calculate average prices by product
    const productPrices: Record<string, number[]> = {};
    
    for (const quotation of allQuotations) {
      const product = products.find((p) => p._id === quotation.productId);
      if (product && quotation.active) {
        if (!productPrices[product.name]) {
          productPrices[product.name] = [];
        }
        productPrices[product.name].push(quotation.price);
      }
    }

    const avgPricesByProduct = Object.entries(productPrices)
      .map(([name, prices]) => ({
        name,
        avgPrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        quotationCount: prices.length,
      }))
      .sort((a, b) => b.quotationCount - a.quotationCount)
      .slice(0, 10);

    // Calculate total platform value
    const totalOrderValue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const recentOrderValue = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Get active users count
    const buyers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "buyer"))
      .collect();
    
    const vendors = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "vendor"))
      .collect();

    const activeBuyers = buyers.filter((b) => b.verified).length;
    const activeVendors = vendors.filter((v) => v.verified && v.status === "approved").length;

    // Calculate average delivery times
    const deliveredOrders = allOrders.filter(
      (o) => o.status === "delivered" && o.actualDeliveryDate
    );
    
    const avgDeliveryTime = deliveredOrders.length > 0
      ? Math.round(
          deliveredOrders.reduce((sum, order) => {
            const deliveryTime = order.actualDeliveryDate! - order.orderDate;
            return sum + deliveryTime;
          }, 0) / deliveredOrders.length / (24 * 60 * 60 * 1000)
        )
      : 0;

    // Calculate RFQ trends (monthly for last 6 months)
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
    const recentSixMonthRFQs = allRFQs.filter((rfq) => rfq.createdAt >= sixMonthsAgo);
    
    const monthlyRFQs: Record<string, number> = {};
    for (const rfq of recentSixMonthRFQs) {
      const date = new Date(rfq.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyRFQs[monthKey] = (monthlyRFQs[monthKey] || 0) + 1;
    }

    const rfqTrends = Object.entries(monthlyRFQs)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    return {
      overview: {
        totalRFQs: allRFQs.length,
        recentRFQs: recentRFQs.length,
        totalQuotations: allQuotations.length,
        totalOrders: allOrders.length,
        recentOrders: recentOrders.length,
        totalOrderValue,
        recentOrderValue,
        activeBuyers,
        activeVendors,
        avgDeliveryTime,
        totalProducts: products.length,
        totalCategories: categories.length,
      },
      topProducts,
      avgPricesByProduct,
      rfqTrends,
    };
  },
});

// Get price trends for a specific product
export const getProductPriceTrends = query({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const quotations = await ctx.db
      .query("vendorQuotations")
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .collect();

    const now = Date.now();
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    const recentQuotations = quotations.filter(
      (q) => q.createdAt >= ninetyDaysAgo && q.active
    );

    // Group by month
    const monthlyPrices: Record<string, number[]> = {};
    
    for (const quotation of recentQuotations) {
      const date = new Date(quotation.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlyPrices[monthKey]) {
        monthlyPrices[monthKey] = [];
      }
      monthlyPrices[monthKey].push(quotation.price);
    }

    const trends = Object.entries(monthlyPrices)
      .map(([month, prices]) => ({
        month,
        avgPrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        quotationCount: prices.length,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return trends;
  },
});
