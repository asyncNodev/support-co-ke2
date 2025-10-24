import { v } from "convex/values";

import { query } from "./_generated/server";

export const getVendorAdvisory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const vendor = await ctx.db.get(args.userId);

    if (!vendor || vendor.role !== "vendor") {
      return { advice: [], insights: {}, bestPractices: [] };
    }

    // Get vendor statistics
    const allQuotations = await ctx.db
      .query("vendorQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    const sentQuotations = await ctx.db
      .query("sentQuotations")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    const wonQuotations = sentQuotations.filter((q) => q.chosen);
    const winRate =
      sentQuotations.length > 0
        ? (wonQuotations.length / sentQuotations.length) * 100
        : 0;

    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_vendor", (q) => q.eq("vendorId", vendor._id))
      .collect();

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Calculate response time (average time from RFQ creation to quotation submission)
    const rfqsWithQuotes = await Promise.all(
      sentQuotations.slice(0, 20).map(async (sq) => {
        const rfq = await ctx.db.get(sq.rfqId);
        if (!rfq) return null;
        return {
          rfqCreated: rfq.createdAt,
          quoteSent: sq.sentAt,
          responseTime: sq.sentAt - rfq.createdAt,
        };
      }),
    );

    const validResponses = rfqsWithQuotes.filter((r) => r !== null);
    const avgResponseTime =
      validResponses.length > 0
        ? validResponses.reduce((sum, r) => sum + (r?.responseTime || 0), 0) /
          validResponses.length
        : 0;
    const avgResponseHours = avgResponseTime / (1000 * 60 * 60);

    // Get market data for comparison
    const allVendors = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "vendor"))
      .collect();

    const allSentQuotes = await ctx.db.query("sentQuotations").collect();
    const allWonQuotes = allSentQuotes.filter((q) => q.chosen);
    const marketWinRate =
      allSentQuotes.length > 0
        ? (allWonQuotes.length / allSentQuotes.length) * 100
        : 25;

    const allRatings = await ctx.db.query("ratings").collect();
    const marketAvgRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
        : 4.0;

    // Generate personalized advice
    const advice = [];

    // URGENT - Critical issues affecting sales
    if (avgRating < 3.5 && ratings.length > 5) {
      advice.push({
        id: "low-ratings-urgent",
        category: "Quality",
        priority: "urgent",
        title: "Low Customer Ratings - Immediate Action Required",
        description: `Your average rating is ${avgRating.toFixed(1)} stars, which is significantly below market average (${marketAvgRating.toFixed(1)} stars). This is seriously hurting your credibility.`,
        impact: "High - Hospitals are less likely to choose your quotations",
        actions: [
          "Contact your recent customers to understand their concerns",
          "Review negative feedback and identify common patterns",
          "Improve your delivery times - this is often the #1 complaint",
          "Ensure product quality matches your descriptions and photos",
          "Consider offering a satisfaction guarantee",
        ],
        expectedResult: "Improving to 4+ stars can increase win rate by 30-50%",
      });
    }

    if (winRate < 15 && sentQuotations.length > 10) {
      advice.push({
        id: "low-win-rate-urgent",
        category: "Pricing",
        priority: "urgent",
        title: "Very Low Win Rate - Pricing Strategy Review Needed",
        description: `Your win rate is ${winRate.toFixed(0)}% vs market average ${marketWinRate.toFixed(0)}%. You're likely pricing too high or not competitive enough.`,
        impact: "Critical - You're losing most opportunities",
        actions: [
          "Review your pricing on top 5 products - compare with competitors",
          "Consider reducing prices by 10-15% temporarily to gain market share",
          "Focus on products where you have cost advantages",
          "Offer bundle deals or volume discounts",
          "Check if your payment terms are too strict (consider offering credit)",
        ],
        expectedResult:
          "Competitive pricing can double or triple your win rate",
      });
    }

    // HIGH PRIORITY - Important improvements
    if (avgResponseHours > 24 && sentQuotations.length > 0) {
      advice.push({
        id: "slow-response",
        category: "Speed",
        priority: "high",
        title: "Slow Response Time Costing You Sales",
        description: `You're taking ${avgResponseHours.toFixed(0)} hours on average to respond to RFQs. Fast responders win 2x more deals.`,
        impact: "High - First responders often win the deal",
        actions: [
          "Enable WhatsApp notifications in Settings to get instant alerts",
          "Check the platform at least 3 times per day (morning, lunch, evening)",
          "Set up your catalog with pre-filled prices for quick submissions",
          "Aim to respond within 6 hours - ideally within 2 hours",
          "Use templates for common products to save time",
        ],
        expectedResult:
          "Responding within 6 hours can increase win rate by 25%",
      });
    }

    if (allQuotations.length < 10) {
      advice.push({
        id: "small-catalog",
        category: "Catalog",
        priority: "high",
        title: "Limited Product Catalog",
        description: `You only have ${allQuotations.length} products in your catalog. More products = more opportunities.`,
        impact: "High - Missing out on many RFQs",
        actions: [
          "Add at least 20-30 products to your catalog across different categories",
          "Use the Catalog Scanner feature to quickly add products",
          "Focus on popular items: Hospital Beds, Wheelchairs, Surgical Equipment",
          "Include detailed specifications and clear photos",
          "Set competitive prices for pre-filled quotations",
        ],
        expectedResult: "Larger catalog can 5x your RFQ opportunities",
      });
    }

    if (winRate >= 15 && winRate < marketWinRate - 5) {
      advice.push({
        id: "below-average-win-rate",
        category: "Strategy",
        priority: "high",
        title: "Win Rate Below Market Average",
        description: `Your win rate (${winRate.toFixed(0)}%) is below market average (${marketWinRate.toFixed(0)}%). Small improvements can make big differences.`,
        impact: "Medium-High - Optimizing could significantly increase revenue",
        actions: [
          "Review your lost quotations - why didn't hospitals choose you?",
          "Compare your prices to competitors - adjust if too high",
          "Improve your quotation presentation - add better photos",
          "Highlight your unique value: warranty, fast delivery, quality",
          "Offer flexible payment terms (cash + credit options)",
        ],
        expectedResult: "Matching market average could increase revenue by 30%",
      });
    }

    // MEDIUM PRIORITY - Optimization opportunities
    if (sentQuotations.length > 0 && sentQuotations.length < 20) {
      advice.push({
        id: "low-activity",
        category: "Activity",
        priority: "medium",
        title: "Increase Your Activity Level",
        description: `You've only submitted ${sentQuotations.length} quotations. More submissions = more wins.`,
        impact: "Medium - More at-bats means more home runs",
        actions: [
          "Check the RFQs tab daily for new opportunities",
          "Submit quotations even if you're unsure - practice makes perfect",
          "Join group buying opportunities for bulk orders",
          "Don't skip RFQs just because there's competition",
          "Set a goal: 5-10 new quotations per week",
        ],
        expectedResult: "2x quotations typically leads to 2x revenue",
      });
    }

    if (ratings.length < 3 && wonQuotations.length > 5) {
      advice.push({
        id: "few-ratings",
        category: "Reputation",
        priority: "medium",
        title: "Build Your Reputation",
        description: `You've won ${wonQuotations.length} deals but only have ${ratings.length} ratings. Ratings build trust.`,
        impact: "Medium - More ratings increase trust and credibility",
        actions: [
          "Follow up with customers after delivery to ensure satisfaction",
          "Politely ask satisfied customers to leave a rating",
          "Excellent service = excellent ratings = more future business",
          "Respond professionally to any negative feedback",
          "Use ratings to identify and fix service issues",
        ],
        expectedResult:
          "10+ ratings with 4+ stars significantly boosts credibility",
      });
    }

    if (winRate > marketWinRate) {
      advice.push({
        id: "increase-prices",
        category: "Pricing",
        priority: "medium",
        title: "You May Be Priced Too Low",
        description: `Your win rate (${winRate.toFixed(0)}%) is above market average (${marketWinRate.toFixed(0)}%). You might be leaving money on the table.`,
        impact: "Medium - Could increase profit margins significantly",
        actions: [
          "Test increasing prices by 5-10% on your next 5 quotations",
          "If win rate stays above 30%, continue with higher prices",
          "Premium pricing with premium service can attract better clients",
          "Don't compete on price alone - emphasize quality and reliability",
          "Monitor impact on win rate - find the sweet spot",
        ],
        expectedResult: "10% price increase = 10% more profit per deal",
      });
    }

    // LOW PRIORITY - Nice to have improvements
    if (avgRating >= 4.5 && ratings.length > 10) {
      advice.push({
        id: "leverage-ratings",
        category: "Marketing",
        priority: "low",
        title: "Leverage Your Excellent Reputation",
        description: `Outstanding! You have ${avgRating.toFixed(1)} stars from ${ratings.length} ratings. Use this to your advantage.`,
        impact: "Low - Optimization opportunity",
        actions: [
          "Highlight your rating in quotations and communications",
          "Ask for testimonials from your happiest customers",
          "Use your reputation to justify premium pricing",
          "Request referrals from satisfied hospitals",
          "Share success stories (with permission) in your profile",
        ],
        expectedResult: "Strong reputation allows 5-10% premium pricing",
      });
    }

    // Market insights
    const insights = {
      yourPerformance: {
        quotationsSubmitted: sentQuotations.length,
        dealsWon: wonQuotations.length,
        winRate: winRate,
        avgRating: avgRating,
        totalRevenue: totalRevenue,
        avgResponseHours: avgResponseHours,
      },
      marketBenchmarks: {
        avgWinRate: marketWinRate,
        avgRating: marketAvgRating,
        topPerformerWinRate: marketWinRate * 1.5,
        activeVendors: allVendors.length,
      },
      opportunities: {
        potentialRevenue:
          sentQuotations.length > 0
            ? Math.round(
                (totalRevenue / wonQuotations.length) *
                  sentQuotations.length *
                  (marketWinRate / 100),
              )
            : 0,
        missedDeals: sentQuotations.length - wonQuotations.length,
      },
    };

    // Best practices from top performers
    const bestPractices = [
      {
        title: "The 6-Hour Rule",
        description:
          "Top vendors respond to RFQs within 6 hours. First responders have 2x higher win rates.",
        difficulty: "Easy",
      },
      {
        title: "Competitive Pricing with Value",
        description:
          "Win rate sweet spot is 25-35%. Lower = priced too high. Higher = priced too low. Find your balance.",
        difficulty: "Medium",
      },
      {
        title: "Professional Quotations",
        description:
          "Include high-quality photos, detailed specifications, clear warranty terms, and flexible payment options.",
        difficulty: "Easy",
      },
      {
        title: "Build Relationships",
        description:
          "Follow up after deliveries, ask for feedback, resolve issues quickly. Repeat customers are gold.",
        difficulty: "Medium",
      },
      {
        title: "Catalog Everything",
        description:
          "Have 50+ products in your catalog with pre-filled prices. More products = more opportunities.",
        difficulty: "Medium",
      },
      {
        title: "Group Buying",
        description:
          "Join group buy opportunities early - they convert to large orders with bulk pricing advantages.",
        difficulty: "Easy",
      },
      {
        title: "Excellence Compounds",
        description:
          "4.5+ star ratings allow premium pricing. Poor ratings require discounting. Quality pays off long-term.",
        difficulty: "Hard",
      },
    ];

    return { advice, insights, bestPractices };
  },
});
