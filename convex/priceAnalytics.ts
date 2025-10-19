import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";

// Get price analytics for an RFQ
export const getRFQPriceAnalytics = query({
  args: { rfqId: v.id("rfqs") },
  handler: async (ctx, args) => {
    // Get all quotations for this RFQ
    const quotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_rfq", (q) => q.eq("rfqId", args.rfqId))
      .collect();

    if (quotations.length === 0) {
      return null;
    }

    // Group by product
    const byProduct: Record<
      string,
      Array<{
        _id: Id<"sentQuotations">;
        vendorId: Id<"users">;
        vendorName: string;
        price: number;
        quantity: number;
        deliveryTime: string;
        warrantyPeriod: string;
        paymentTerms: string;
        chosen: boolean;
      }>
    > = {};

    for (const quot of quotations) {
      const vendor = await ctx.db.get(quot.vendorId);
      if (!vendor) continue;

      const key = quot.productId;
      if (!byProduct[key]) {
        byProduct[key] = [];
      }

      byProduct[key].push({
        _id: quot._id,
        vendorId: quot.vendorId,
        vendorName: vendor.name,
        price: quot.price,
        quantity: quot.quantity,
        deliveryTime: quot.deliveryTime,
        warrantyPeriod: quot.warrantyPeriod,
        paymentTerms: quot.paymentTerms,
        chosen: quot.chosen,
      });
    }

    // Calculate analytics for each product
    const analytics: Record<
      string,
      {
        productId: string;
        productName: string;
        quotes: typeof byProduct[string];
        lowestPrice: number;
        highestPrice: number;
        averagePrice: number;
        medianPrice: number;
        bestQuoteId: Id<"sentQuotations">;
        potentialSavings: number;
        priceRange: number;
        savingsPercentage: number;
      }
    > = {};

    for (const [productId, quotes] of Object.entries(byProduct)) {
      const product = await ctx.db.get(productId as Id<"products">);
      if (!product) continue;

      const prices = quotes.map((q) => q.price).sort((a, b) => a - b);
      const lowestPrice = prices[0];
      const highestPrice = prices[prices.length - 1];
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const medianPrice =
        prices.length % 2 === 0
          ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
          : prices[Math.floor(prices.length / 2)];

      const bestQuote = quotes.find((q) => q.price === lowestPrice)!;
      const potentialSavings = highestPrice - lowestPrice;
      const priceRange = highestPrice - lowestPrice;
      const savingsPercentage = ((highestPrice - lowestPrice) / highestPrice) * 100;

      analytics[productId] = {
        productId,
        productName: product.name,
        quotes: quotes.map((q) => ({
          ...q,
          savingsVsBest: q.price - lowestPrice,
          savingsPercentage: q.price === lowestPrice ? 0 : ((q.price - lowestPrice) / q.price) * 100,
          isLowest: q.price === lowestPrice,
          isHighest: q.price === highestPrice,
          vsAverage: q.price - averagePrice,
        })),
        lowestPrice,
        highestPrice,
        averagePrice,
        medianPrice,
        bestQuoteId: bestQuote._id,
        potentialSavings,
        priceRange,
        savingsPercentage,
      };
    }

    // Calculate total savings
    const totalPotentialSavings = Object.values(analytics).reduce(
      (sum, a) => sum + a.potentialSavings,
      0
    );

    const totalLowestCost = Object.values(analytics).reduce(
      (sum, a) => sum + a.lowestPrice,
      0
    );

    const totalHighestCost = Object.values(analytics).reduce(
      (sum, a) => sum + a.highestPrice,
      0
    );

    const totalAverageCost = Object.values(analytics).reduce(
      (sum, a) => sum + a.averagePrice,
      0
    );

    return {
      byProduct: analytics,
      totals: {
        potentialSavings: totalPotentialSavings,
        lowestCost: totalLowestCost,
        highestCost: totalHighestCost,
        averageCost: totalAverageCost,
        savingsPercentage: ((totalHighestCost - totalLowestCost) / totalHighestCost) * 100,
      },
      quoteCount: quotations.length,
      productCount: Object.keys(analytics).length,
    };
  },
});

// Get market price intelligence for a product
export const getProductMarketPrice = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    // Get all quotations for this product (last 90 days)
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const recentQuotations = await ctx.db
      .query("sentQuotations")
      .filter((q) =>
        q.and(
          q.eq(q.field("productId"), args.productId),
          q.gte(q.field("sentAt"), ninetyDaysAgo)
        )
      )
      .collect();

    if (recentQuotations.length === 0) {
      return null;
    }

    const prices = recentQuotations.map((q) => q.price).sort((a, b) => a - b);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    const median =
      prices.length % 2 === 0
        ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
        : prices[Math.floor(prices.length / 2)];

    return {
      averagePrice: average,
      medianPrice: median,
      lowestPrice: prices[0],
      highestPrice: prices[prices.length - 1],
      sampleSize: prices.length,
      lastUpdated: Date.now(),
    };
  },
});

// Get vendor pricing history
export const getVendorPricingHistory = query({
  args: { vendorId: v.id("users"), productId: v.id("products") },
  handler: async (ctx, args) => {
    const quotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.vendorId))
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .order("desc")
      .take(10);

    return quotations.map((q) => ({
      price: q.price,
      date: new Date(q.sentAt).toLocaleDateString(),
      rfqId: q.rfqId,
    }));
  },
});