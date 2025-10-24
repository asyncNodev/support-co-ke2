import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

export const createUser = internalMutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    // role: v.union(v.literal("vendor"), v.literal("buyer")),
  },
  handler: async (ctx: any, args) => {
    return await ctx.db.insert("users", {
      ...args,
      authId: "test-authId",
      status: "pending",
      verified: false,
      registeredAt: Date.now(),
    });
  },
});

export const createFullUser = internalMutation({
  args: {
    // authId: v.string(),
    email: v.string(),
    // passwordHash: v.string(),
    name: v.string(),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("vendor"), v.literal("buyer")),
    ),
    passwordHash: v.string(),
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
  handler: async (ctx: any, args) => {
    return await ctx.db.insert("users", {
      ...args,
      authId: "test-authId",
      registeredAt: Date.now(),
    });
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx: any, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .unique();
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const createVerificationCode = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration to 15 minutes from now
    const expiresAt = Date.now() + 15 * 60 * 1000;

    await ctx.db.insert("verificationCodes", {
      userId: args.userId,
      code,
      expiresAt,
      verified: false,
    });

    return code;
  },
});

export const verifyCode = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const verification = await ctx.db
      .query("verificationCodes")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId as Id<"users">))
      .order("desc")
      .first();

    if (!verification) {
      throw new Error("Verification code not found");
    }

    if (verification.expiresAt < Date.now()) {
      throw new Error("Verification code expired");
    }

    if (verification.code !== args.code) {
      throw new Error("Invalid verification code");
    }

    // Mark code as verified
    await ctx.db.patch(verification._id, { verified: true });

    // Update user's verified status
    await ctx.db.patch(args.userId as Id<"users">, { verified: true });

    return true;
  },
});
