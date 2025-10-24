"use node";

import bcrypt from "bcryptjs";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";

export const createVerifiedBuyer: ReturnType<typeof action> = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: args.email,
    });

    if (existingUser) {
      return { success: false, message: "User already exists with this email" };
    }

    // Hash a default password
    const defaultPassword = "testpassword";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Insert user using an internal mutation
    const userId = await ctx.runMutation(internal.auth.createUser, {
      email: args.email,
      passwordHash,
      name: args.name || "Test Buyer",
      // role: "buyer",
    });

    return {
      success: true,
      message: `Verified buyer created with email ${args.email}`,
      userId,
    };
  },
});

/**
 * 
 * {
  address: "Temple apartments nakuru",
  authId:
    "https://hercules.app|r2X1QseifVGXvQcC5DZMMyr8YeR8xO2f",
  companyName: "Nakuru nursing home hospital",
  email: "meg.doctor@gmail.com",
  name: "",
  phone: "+254780908833",
  registeredAt: 1759511079987,
  role: "admin",
  verified: true,
}
  {
  authId: "admin-demo-001",
  companyName: "QuickQuote B2B",
  email: "admin@quickquote.com",
  name: "Admin User",
  registeredAt: 1759510790594,
  role: "admin",
  verified: true,
}
  {
  address: "Temple apartments nakuru",
  authId:
    "https://hercules.app|LWqGmI3a6NrpZ88v3S0nOenIfQ2otx3R",
  availableRewardBalance: 0,
  companyName: "Nakuru nursing home hospital",
  email: "mostafa.nabawy@gmail.com",
  name: "Mostafa Nabawy",
  phone: "+254780908833",
  referralCode: "MOSTHTSIZH",
  registeredAt: 1759270532926,
  role: "admin",
  successfulReferrals: 0,
  totalReferrals: 0,
  totalRewardsEarned: 0,
  verified: true,
}
  {
  authId: "admin-demo-001",
  companyName: "QuickQuote B2B",
  email: "admin@quickquote.com",
  name: "Admin User",
  registeredAt: 1759269399211,
  role: "admin",
  verified: true,
}
 */
export const createVerifiedAdmin: ReturnType<typeof action> = action({
  args: {
    // authId: v.string(),
    email: v.string(),
    // passwordHash: v.string(),
    name: v.string(),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("vendor"), v.literal("buyer")),
    ),
    verified: v.boolean(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
    ),
    // Referral system fields
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    totalReferrals: v.optional(v.number()),
    successfulReferrals: v.optional(v.number()),
    totalRewardsEarned: v.optional(v.number()),
    availableRewardBalance: v.optional(v.number()),
    // New verification fields
    verificationLevel: v.optional(
      v.union(
        v.literal("none"), // Not verified
        v.literal("email"), // Email verified only
        v.literal("business"), // Business documents verified
        v.literal("full"), // Full verification including background check
      ),
    ),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.id("users")),
    businessLicense: v.optional(v.string()),
    taxId: v.optional(v.string()),
    physicalAddress: v.optional(v.string()),
    phoneVerified: v.optional(v.boolean()),
    // Trust score fields
    trustScore: v.optional(v.number()), // 0-100
    responseRate: v.optional(v.number()), // 0-100 percentage
    averageResponseTime: v.optional(v.number()), // in hours
    deliveryRate: v.optional(v.number()), // 0-100 percentage
    cancellationRate: v.optional(v.number()), // 0-100 percentage
    disputeCount: v.optional(v.number()),
    successfulDeals: v.optional(v.number()),
    avatar: v.optional(v.string()),
    companyName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    cr12Certificate: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    categories: v.optional(v.array(v.id("categories"))),
    quotationPreference: v.optional(
      v.union(
        v.literal("registered_hospitals_only"),
        v.literal("registered_all"),
        v.literal("all_including_guests"),
      ),
    ),
    whatsappNotifications: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
    // Approval workflow settings
    organizationRole: v.optional(
      v.union(
        v.literal("procurement_officer"),
        v.literal("department_head"),
        v.literal("finance_director"),
        v.literal("ceo"),
        v.literal("none"),
      ),
    ),
    approvalLevel: v.optional(v.number()),
    canApproveUpTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.runQuery(internal.auth.getUserByEmail, {
      email: args.email,
    });

    if (existingUser) {
      return { success: false, message: "User already exists with this email" };
    }

    // Hash a default password
    const defaultPassword = "testpassword";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Insert user using an internal mutation
    const userId = await ctx.runMutation(internal.auth.createFullUser, {
      email: args.email,
      passwordHash,
      name: args.name || "Test Admin",
      role: "admin",
      status: "approved",
      verified: true,
    });

    return {
      success: true,
      message: `Verified buyer created with email ${args.email}`,
      userId,
    };
  },
});
