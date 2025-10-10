import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Default settings
const DEFAULT_SETTINGS = {
  logoUrl: "https://cdn.hercules.app/file_bqE3zk4Ry0XmWJeiuCRNP3vv",
  siteName: "Medical Supplies Kenya",
  tagline: "Connecting Hospitals with Verified Suppliers",
  
  // Hospital workflow
  hospitalStep1: "Search Products",
  hospitalStep2: "Create RFQ",
  hospitalStep3: "Receive Quotations",
  hospitalStep4: "Choose Best Vendor",
  
  // Vendor workflow
  vendorStep1: "Upload Products",
  vendorStep2: "Receive RFQ Alerts",
  vendorStep3: "Submit Quotations",
  vendorStep4: "Win Orders",
  
  // Styling
  workflowTextSize: "sm",
  workflowBgColor: "bg-muted/30",
};

// Get all site settings
export const getSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("siteSettings").collect();
    
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }
    
    return settingsMap;
  },
});

// Update a site setting (admin only)
export const updateSiteSetting = mutation({
  args: {
    key: v.string(),
    value: v.string(),
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

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can update site settings",
        code: "FORBIDDEN",
      });
    }

    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("siteSettings", {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

// Bulk update site settings (admin only)
export const updateSiteSettings = mutation({
  args: {
    settings: v.record(v.string(), v.string()),
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

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError({
        message: "Only admins can update site settings",
        code: "FORBIDDEN",
      });
    }

    for (const [key, value] of Object.entries(args.settings)) {
      const existing = await ctx.db
        .query("siteSettings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          value,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("siteSettings", {
          key,
          value,
          updatedAt: Date.now(),
        });
      }
    }

    return null;
  },
});

// Reset site settings to defaults (admin only)
export const resetSiteSettings = mutation({
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
        message: "Only admins can reset site settings",
        code: "FORBIDDEN",
      });
    }

    const allSettings = await ctx.db.query("siteSettings").collect();
    
    for (const setting of allSettings) {
      await ctx.db.delete(setting._id);
    }

    return null;
  },
});
