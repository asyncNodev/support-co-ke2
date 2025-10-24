import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

const DEFAULT_SETTINGS = {
  logoUrl: "https://cdn.hercules.app/file_bqE3zk4Ry0XmWJeiuCRNP3vv",
  logoSize: "h-28",
  siteName: "Medical Supplies Kenya",
  tagline: "Find Medical Equipment & Supplies",
  hospitalStep1: "Search Products",
  hospitalStep2: "Create RFQ",
  hospitalStep3: "Receive Quotations",
  hospitalStep4: "Choose Best Vendor",
  vendorStep1: "Upload Products",
  vendorStep2: "Receive RFQ Alerts",
  vendorStep3: "Submit Quotations",
  vendorStep4: "Win Orders",
  workflowTextSize: "text-sm",
  workflowBgColor: "bg-blue-50",
};

export const getSiteSettings = query({
  args: {},
  handler: async (ctx): Promise<Record<string, string>> => {
    const settings = await ctx.db.query("siteSettings").collect();
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };

    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return settingsMap;
  },
});

export const updateSiteSettings = mutation({
  args: {
    settings: v.record(v.string(), v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can update site settings",
        code: "FORBIDDEN",
      });
    }

    for (const [key, value] of Object.entries(args.settings)) {
      const existing = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { value });
      } else {
        await ctx.db.insert("siteSettings", { key, value });
      }
    }
  },
});
